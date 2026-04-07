"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { metersPerPixelAtLat, type ExploredPoint } from "./map-utils";

const BOUNDARY = {
  minLat: 33.7865,
  maxLat: 33.8005,
  minLng: -84.3310,
  maxLng: -84.3180,
};

/** How far (meters) around each explored point to "reveal" through the fog. */
const REVEAL_RADIUS_M = 25;

/** Size of the tileable cloud texture (px). Larger = bigger cloud shapes. */
const CLOUD_TEXTURE_SIZE = 512;

/** Drift speed in pixels per millisecond. */
const CLOUD_SPEED_X = 0.03;
const CLOUD_SPEED_Y = 0.012;

/**
 * Builds a tileable cloud-wisp texture on an offscreen canvas.
 * Uses a fixed-seed PRNG so the shape is always the same.
 */
function buildCloudTexture(): HTMLCanvasElement {
  const size = CLOUD_TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  let s = 0x9e3779b9;
  const rand = () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < 48; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 35 + rand() * 110;
    const scaleY = 0.3 + rand() * 0.65;
    const alpha = 0.10 + rand() * 0.18;
    const angle = rand() * Math.PI;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = x + dx * size;
        const cy = y + dy * size;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.scale(1, scaleY);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, `rgba(140, 160, 220, ${alpha})`);
        g.addColorStop(0.55, `rgba(140, 160, 220, ${alpha * 0.35})`);
        g.addColorStop(1, "rgba(140, 160, 220, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  return canvas;
}

const FOG_OPACITY = { light: 0.52, medium: 0.78, heavy: 0.93 } as const;

export function useFogLayer(
  mapRef: RefObject<MapRef | null>,
  fogCanvasRef: RefObject<HTMLCanvasElement | null>,
  mapReady: boolean,
  exploredPoints: ExploredPoint[],
  displayPosition: ExploredPoint | null,
  fogEnabled: boolean,
  fogIntensity: 'light' | 'medium' | 'heavy' = 'medium',
) {
  const cloudTextureRef = useRef<HTMLCanvasElement | null>(null);
  // Accumulated screen-space pan offset — updated each frame by how many pixels
  // the previous map center has shifted on screen. Zero delta on pure zoom.
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const prevCenterRef = useRef<{ lng: number; lat: number } | null>(null);
  /** Slow time-based drift so clouds visibly float. */
  const cloudOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  // Offscreen canvas used as a back-buffer so we blit atomically to the
  // visible canvas, eliminating the clearRect flash during zoom.
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  // Cached 2D contexts — getContext is not free; cache them after first access.
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  // Gradient cache keyed by rounded radiusPx — gradients are drawn at origin
  // and positioned via ctx.translate, so they're reusable across points.
  const gradientCacheRef = useRef<Map<number, CanvasGradient>>(new Map());
  const lastZoomRef = useRef<number | null>(null);
  const drawFogRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!fogEnabled) return;
    cloudTextureRef.current = buildCloudTexture();
    const offscreen = document.createElement("canvas");
    offscreenRef.current = offscreen;
    offscreenCtxRef.current = offscreen.getContext("2d");
  }, [fogEnabled]);

  const resizeCanvas = useCallback(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    // Cache the visible canvas context after first resize.
    visCtxRef.current ??= canvas.getContext("2d");
    if (offscreenRef.current) {
      offscreenRef.current.width = w;
      offscreenRef.current.height = h;
    }
    // Resizing invalidates gradient objects tied to the old context state.
    gradientCacheRef.current.clear();
  }, [fogCanvasRef]);

  const drawFog = useCallback(() => {
    if (!fogEnabled) return;
    const map = mapRef.current?.getMap();
    const canvas = fogCanvasRef.current;
    const offscreen = offscreenRef.current;
    if (!map || !canvas || !offscreen) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    if (cssWidth <= 0 || cssHeight <= 0) return;

    // Draw everything onto the offscreen back-buffer first.
    const ctx = offscreenCtxRef.current;
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const zoom = map.getZoom();
    const isGlobe = zoom < 4;

    // Gradient radius changes with zoom — clear stale cache entries when zoom changes.
    const roundedZoom = Math.round(zoom * 4); // quarter-zoom resolution
    if (lastZoomRef.current !== roundedZoom) {
      gradientCacheRef.current.clear();
      lastZoomRef.current = roundedZoom;
    }

    const leftEdge = map.project([-180, 0]);
    const rightEdge = map.project([180, 0]);
    const worldWidthPx = Math.max(rightEdge.x - leftEdge.x, 1);
    const numCopies = Math.min(Math.ceil(cssWidth / worldWidthPx) + 1, 4);

    ctx.save();
    ctx.beginPath();

    if (isGlobe) {
      const mapCenter = map.getCenter();
      const centerPt = map.project([mapCenter.lng, mapCenter.lat]);
      const eastLimb = map.project([mapCenter.lng + 90, 0]);
      const westLimb = map.project([mapCenter.lng - 90, 0]);
      const globeRadius = Math.max((eastLimb.x - westLimb.x) / 2, 0) * 1.03;
      ctx.arc(centerPt.x, centerPt.y, globeRadius, 0, Math.PI * 2);
      ctx.closePath();
    } else {
      ctx.rect(0, 0, cssWidth, cssHeight);
    }

    ctx.clip();

    // 1. Base dark fog fill
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(10, 12, 20, ${FOG_OPACITY[fogIntensity]})`;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // 2. Animated cloud texture that moves with map panning but is stable on
    // zoom. Each frame we measure how far the previous map center has shifted
    // on screen (screen-pixel delta). Panning produces a non-zero delta; a
    // pure zoom keeps the center at the screen midpoint, so delta = 0.
    const center = map.getCenter();
    if (prevCenterRef.current) {
      const prevPx = map.project([prevCenterRef.current.lng, prevCenterRef.current.lat]);
      panOffsetRef.current.x += prevPx.x - cssWidth / 2;
      panOffsetRef.current.y += prevPx.y - cssHeight / 2;
      // Normalize to [0, CLOUD_TEXTURE_SIZE) to prevent float precision loss
      // over long sessions without changing the visual result.
      panOffsetRef.current.x = ((panOffsetRef.current.x % CLOUD_TEXTURE_SIZE) + CLOUD_TEXTURE_SIZE) % CLOUD_TEXTURE_SIZE;
      panOffsetRef.current.y = ((panOffsetRef.current.y % CLOUD_TEXTURE_SIZE) + CLOUD_TEXTURE_SIZE) % CLOUD_TEXTURE_SIZE;
    }
    prevCenterRef.current = { lng: center.lng, lat: center.lat };

    const cloud = cloudTextureRef.current;
    if (cloud) {
      ctx.globalCompositeOperation = "source-over";
      const { x: drift_x, y: drift_y } = cloudOffsetRef.current;
      const tw = CLOUD_TEXTURE_SIZE;
      const th = CLOUD_TEXTURE_SIZE;
      const ox = panOffsetRef.current.x + drift_x;
      const oy = panOffsetRef.current.y + drift_y;
      const startX = ((ox % tw) + tw) % tw - tw;
      const startY = ((oy % th) + th) % th - th;
      for (let tx = startX; tx < cssWidth + tw; tx += tw) {
        for (let ty = startY; ty < cssHeight + th; ty += th) {
          ctx.drawImage(cloud, tx, ty);
        }
      }
    }

    // 3. Punch holes for explored areas.
    // Gradients are created at the origin and positioned via translate so they
    // can be cached by radius — avoiding per-point-per-frame allocations.
    ctx.globalCompositeOperation = "destination-out";
    const gradientCache = gradientCacheRef.current;

    const drawPoint = (p: ExploredPoint) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
      if (
        p.lat < BOUNDARY.minLat || p.lat > BOUNDARY.maxLat ||
        p.lng < BOUNDARY.minLng || p.lng > BOUNDARY.maxLng
      ) return;
      const mPerPx = metersPerPixelAtLat(zoom, p.lat);
      const radiusPx = REVEAL_RADIUS_M / Math.max(mPerPx, 0.000001);
      const cacheKey = Math.round(radiusPx * 4); // quarter-pixel resolution
      let g = gradientCache.get(cacheKey);
      if (!g) {
        g = ctx.createRadialGradient(0, 0, radiusPx * 0.2, 0, 0, radiusPx);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.45, "rgba(0,0,0,0.95)");
        g.addColorStop(0.75, "rgba(0,0,0,0.45)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        gradientCache.set(cacheKey, g);
      }
      ctx.fillStyle = g;
      for (let copy = -numCopies; copy <= numCopies; copy++) {
        const projected = map.project([p.lng + copy * 360, p.lat]);
        if (
          projected.x < -radiusPx * 2 ||
          projected.x > cssWidth + radiusPx * 2 ||
          projected.y < -radiusPx * 2 ||
          projected.y > cssHeight + radiusPx * 2
        ) continue;
        ctx.save();
        ctx.translate(projected.x, projected.y);
        ctx.beginPath();
        ctx.arc(0, 0, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    for (const p of exploredPoints) drawPoint(p);
    if (displayPosition) drawPoint(displayPosition);

    // 4. Boundary outline — soft glow matching the fog cloud palette
    ctx.globalCompositeOperation = "source-over";
    const corners = [
      [BOUNDARY.minLng, BOUNDARY.minLat],
      [BOUNDARY.maxLng, BOUNDARY.minLat],
      [BOUNDARY.maxLng, BOUNDARY.maxLat],
      [BOUNDARY.minLng, BOUNDARY.maxLat],
    ].map(([lng, lat]) => map.project([lng!, lat!]));
    ctx.beginPath();
    ctx.moveTo(corners[0]!.x, corners[0]!.y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i]!.x, corners[i]!.y);
    ctx.closePath();
    // Outer glow — wide, very faint
    ctx.strokeStyle = "rgba(180, 200, 235, 0.12)";
    ctx.lineWidth = 6;
    ctx.stroke();
    // Inner line — thin, muted cool-white matching the cloud texture tone
    ctx.strokeStyle = "rgba(190, 210, 240, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Label at top-right corner
    const labelPt = corners[2]!; // maxLng, maxLat
    ctx.font = "500 10px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "rgba(190, 210, 240, 0.45)";
    ctx.fillText("Emory Campus", labelPt.x - 6, labelPt.y - 6);

    ctx.restore();

    // Atomic blit from back-buffer to visible canvas — no clearRect flash.
    const visCtx = visCtxRef.current;
    if (visCtx) {
      visCtx.setTransform(1, 0, 0, 1, 0, 0);
      visCtx.clearRect(0, 0, canvas.width, canvas.height);
      visCtx.drawImage(offscreen, 0, 0);
    }
  }, [displayPosition, exploredPoints, fogEnabled, fogIntensity, mapRef, fogCanvasRef]);

  // Keep ref pointing at latest drawFog closure.
  useEffect(() => {
    drawFogRef.current = drawFog;
  }, [drawFog]);

  // RAF loop: accumulate cloud drift and call triggerRepaint() so the map
  // fires render events even when idle, keeping clouds visibly moving.
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;

    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime > 0) {
        const dt = time - lastTime;
        cloudOffsetRef.current.x =
          (cloudOffsetRef.current.x + CLOUD_SPEED_X * dt) % CLOUD_TEXTURE_SIZE;
        cloudOffsetRef.current.y =
          (cloudOffsetRef.current.y + CLOUD_SPEED_Y * dt) % CLOUD_TEXTURE_SIZE;
        // Keep the map rendering so our render-event handler fires every frame.
        mapRef.current?.getMap()?.triggerRepaint();
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fogEnabled, mapReady]);

  // Redraw fog in sync with each map GL frame to avoid zoom jitter.
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const onRender = () => drawFogRef.current();
    map.on("render", onRender);
    return () => { map.off("render", onRender); };
  }, [fogEnabled, mapReady, mapRef]);

  // Resize on mount and container resize.
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    resizeCanvas();
    map.on("resize", resizeCanvas);
    return () => { map.off("resize", resizeCanvas); };
  }, [fogEnabled, mapReady, mapRef, resizeCanvas]);
}
