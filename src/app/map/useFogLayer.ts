"use client";

import { useCallback, useEffect, type RefObject } from "react";
import type { MapRef } from "react-map-gl/mapbox";
import { metersPerPixelAtLat, type ExploredPoint } from "./map-utils";

/** How far (meters) around each explored point to "reveal" through the fog. */
const REVEAL_RADIUS_M = 25;

/**
 * Renders a semi-transparent fog overlay on a canvas that sits on top of the
 * Mapbox map. Explored points and the user's current position punch circular
 * holes through the fog using `destination-out` compositing with soft radial
 * gradients so the revealed area fades at the edges.
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
    // Fill the entire canvas with dark fog, then punch holes for explored areas
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(10, 12, 20, 0.78)";
    ctx.fillRect(0, 0, rect.width, rect.height);
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
