"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { metersPerPixelAtLat, type ExploredPoint } from "./map-utils";

/** How far (meters) around each explored point to "reveal" through the fog. */
const REVEAL_RADIUS_M = 25;

/** Size of the tileable cloud texture (px). Larger = bigger cloud shapes. */
const CLOUD_TEXTURE_SIZE = 512;

/** Drift speed in pixels per millisecond. Very slow so it's subtle. */
const CLOUD_SPEED_X = 0.014;
const CLOUD_SPEED_Y = 0.006;

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
  const cloudOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const needsRedrawRef = useRef(true);
  const drawFogRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!fogEnabled) return;
    cloudTextureRef.current = buildCloudTexture();
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
    needsRedrawRef.current = true;
  }, [fogCanvasRef]);

  const drawFog = useCallback(() => {
    if (!fogEnabled) return;
    const map = mapRef.current?.getMap();
    const canvas = fogCanvasRef.current;
    if (!map || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;
    if (cssWidth <= 0 || cssHeight <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const zoom = map.getZoom();
    const isGlobe = zoom < 4;

    const leftEdge = map.project([-180, 0]);
    const rightEdge = map.project([180, 0]);
    const worldWidthPx = Math.max(rightEdge.x - leftEdge.x, 1);
    const numCopies = Math.min(Math.ceil(cssWidth / worldWidthPx) + 1, 4);

    ctx.save();
    ctx.beginPath();

    if (isGlobe) {
      // Get the globe center from the map center point
      const mapCenter = map.getCenter();
      const centerPt = map.project([mapCenter.lng, mapCenter.lat]);
      const globeCenterX = centerPt.x;
      const globeCenterY = centerPt.y;

      // Get radius by projecting a point 90 degrees away on the equator
      // and measuring horizontal distance. Multiply by 1.03 to fully cover edge.
      const eastLimb = map.project([mapCenter.lng + 90, 0]);
      const westLimb = map.project([mapCenter.lng - 90, 0]);
      const globeRadius = Math.max((eastLimb.x - westLimb.x) / 2, 0) * 1.03;

      ctx.arc(globeCenterX, globeCenterY, globeRadius, 0, Math.PI * 2);
      ctx.closePath();
    } else {
      // Mercator zoomed in — fog should cover the full canvas, no clipping needed
      ctx.rect(0, 0, cssWidth, cssHeight);
    }

    ctx.clip();

    // 1. Base dark fog fill
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(10, 12, 20, ${FOG_OPACITY[fogIntensity]})`;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // 2. Animated cloud texture anchored to a geographic point so it
    // moves with the map when panning
    const cloud = cloudTextureRef.current;
    if (cloud) {
      ctx.globalCompositeOperation = "source-over";
      const anchor = map.project([0, 0]);
      const { x: ox, y: oy } = cloudOffsetRef.current;
      const tw = CLOUD_TEXTURE_SIZE;
      const th = CLOUD_TEXTURE_SIZE;
      const startX = (((anchor.x + ox) % tw) + tw) % tw - tw;
      const startY = (((anchor.y + oy) % th) + th) % th - th;
      for (let tx = startX; tx < cssWidth + tw; tx += tw) {
        for (let ty = startY; ty < cssHeight + th; ty += th) {
          ctx.drawImage(cloud, tx, ty);
        }
      }
    }

    // 3. Punch holes for explored areas
    ctx.globalCompositeOperation = "destination-out";
    const pointsToReveal = displayPosition
      ? [...exploredPoints, displayPosition]
      : exploredPoints;

    for (const p of pointsToReveal) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const mPerPx = metersPerPixelAtLat(zoom, p.lat);
      const radiusPx = REVEAL_RADIUS_M / Math.max(mPerPx, 0.000001);
      for (let copy = -numCopies; copy <= numCopies; copy++) {
        const projected = map.project([p.lng + copy * 360, p.lat]);
        if (
          projected.x < -radiusPx * 2 ||
          projected.x > cssWidth + radiusPx * 2 ||
          projected.y < -radiusPx * 2 ||
          projected.y > cssHeight + radiusPx * 2
        ) continue;
        const g = ctx.createRadialGradient(
          projected.x, projected.y, radiusPx * 0.2,
          projected.x, projected.y, radiusPx,
        );
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(0.45, "rgba(0,0,0,0.95)");
        g.addColorStop(0.75, "rgba(0,0,0,0.45)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [displayPosition, exploredPoints, fogEnabled, fogIntensity, mapRef, fogCanvasRef]);

  // Always keep the ref pointing at the latest drawFog so the animation loop
  // never needs drawFog in its dependency array
  useEffect(() => {
    drawFogRef.current = drawFog;
  }, [drawFog]);

  // Single animation loop — starts once, never restarts.
  // Calls drawFog via ref so it always uses the latest version without
  // needing drawFog in the dependency array (which caused seizures on re-render).
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;

    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime > 0) {
        const dt = time - lastTime;
        const dx = CLOUD_SPEED_X * dt;
        const dy = CLOUD_SPEED_Y * dt;
        cloudOffsetRef.current.x =
          (cloudOffsetRef.current.x + dx) % CLOUD_TEXTURE_SIZE;
        cloudOffsetRef.current.y =
          (cloudOffsetRef.current.y + dy) % CLOUD_TEXTURE_SIZE;
        if (dx > 0.5 || dy > 0.5) {
          needsRedrawRef.current = true;
        }
      }
      if (needsRedrawRef.current) {
        drawFogRef.current();
        needsRedrawRef.current = false;
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

  // Resize on mount and on container resize only — never inside draw loop
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    resizeCanvas();
    map.on("resize", resizeCanvas);
    return () => { map.off("resize", resizeCanvas); };
  }, [fogEnabled, mapReady, mapRef, resizeCanvas]);

  // Map events only set the dirty flag — the animation loop does the actual draw
  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const handler = () => { needsRedrawRef.current = true; };
    needsRedrawRef.current = true;
    map.on("move", handler);
    map.on("zoom", handler);
    map.on("rotate", handler);
    map.on("pitch", handler);
    return () => {
      map.off("move", handler);
      map.off("zoom", handler);
      map.off("rotate", handler);
      map.off("pitch", handler);
    };
  }, [drawFog, fogEnabled, mapReady, mapRef]);

  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    needsRedrawRef.current = true;
  }, [drawFog, fogEnabled, mapReady]);
}