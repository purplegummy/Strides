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

  // Simple, deterministic xorshift PRNG
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

    // Draw each blob at all 9 tile offsets so the texture wraps seamlessly
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

/**
 * Renders a semi-transparent fog overlay on a canvas that sits on top of the
 * Mapbox map. Explored points and the user's current position punch circular
 * holes through the fog using `destination-out` compositing with soft radial
 * gradients so the revealed area fades at the edges.
 *
 * A slowly drifting cloud-wisp texture is composited over the base fog fill
 * (but beneath the reveal holes) for visual depth.
 *
 * Redraws on every map move / zoom / resize / rotate / pitch event.
 * The hook is a no-op when `fogEnabled` is false.
 */
export function useFogLayer(
  mapRef: RefObject<MapRef | null>,
  fogCanvasRef: RefObject<HTMLCanvasElement | null>,
  mapReady: boolean,
  exploredPoints: ExploredPoint[],
  displayPosition: ExploredPoint | null,
  fogEnabled: boolean,
) {
  const cloudTextureRef = useRef<HTMLCanvasElement | null>(null);
  const cloudOffsetRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Build the cloud texture once when fog is enabled
  useEffect(() => {
    if (!fogEnabled) return;
    cloudTextureRef.current = buildCloudTexture();
  }, [fogEnabled]);

  const drawFog = useCallback(() => {
    if (!fogEnabled) return;
    const map = mapRef.current?.getMap();
    const canvas = fogCanvasRef.current;
    if (!map || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 1. Fill with base dark fog
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(10, 12, 20, 0.78)";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 2. Tile the animated cloud texture over the fog
    const cloud = cloudTextureRef.current;
    if (cloud) {
      ctx.globalCompositeOperation = "source-over";
      const { x: ox, y: oy } = cloudOffsetRef.current;
      const tw = CLOUD_TEXTURE_SIZE;
      const th = CLOUD_TEXTURE_SIZE;
      const startX = (ox % tw) - tw;
      const startY = (oy % th) - th;
      for (let tx = startX; tx < rect.width + tw; tx += tw) {
        for (let ty = startY; ty < rect.height + th; ty += th) {
          ctx.drawImage(cloud, tx, ty);
        }
      }
    }

    // 3. Punch holes for explored areas (removes both fog + cloud wisps)
    ctx.globalCompositeOperation = "destination-out";
    const zoom = map.getZoom();
    const pointsToReveal = displayPosition
      ? [...exploredPoints, displayPosition]
      : exploredPoints;
    for (const p of pointsToReveal) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const projected = map.project([p.lng, p.lat]);
      const mPerPx = metersPerPixelAtLat(zoom, p.lat);
      const radiusPx = REVEAL_RADIUS_M / Math.max(mPerPx, 0.000001);
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
  }, [displayPosition, exploredPoints, fogEnabled, mapRef, fogCanvasRef]);

  // Cloud drift animation loop — runs independently of map events
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
        drawFog();
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current != null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [fogEnabled, mapReady, drawFog]);

  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const handler = () => {
      requestAnimationFrame(drawFog);
    };
    handler();
    map.on("move", handler);
    map.on("zoom", handler);
    map.on("resize", handler);
    map.on("rotate", handler);
    map.on("pitch", handler);
    return () => {
      map.off("move", handler);
      map.off("zoom", handler);
      map.off("resize", handler);
      map.off("rotate", handler);
      map.off("pitch", handler);
    };
  }, [drawFog, fogEnabled, mapReady, mapRef]);

  useEffect(() => {
    if (!fogEnabled || !mapReady) return;
    drawFog();
  }, [drawFog, fogEnabled, mapReady]);
}
