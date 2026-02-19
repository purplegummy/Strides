"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { haversineMeters, type ExploredPoint } from "./map-utils";

/** Minimum distance (meters) between recorded samples to avoid flooding the DB. */
const SAMPLE_MIN_DISTANCE_M = 10;

/**
 * Manages the "explored territory" data layer.
 *
 * - Fetches previously explored points from the server.
 * - Accepts new GPS positions via `samplePoint` and records them locally
 *   only when the user has moved at least `SAMPLE_MIN_DISTANCE_M` from
 *   the last recorded sample.
 * - Batches pending points and flushes them to the server every 5 seconds.
 * - Derives `displayPosition` (best available location for the user marker):
 *   live GPS > last known GPS > most recent server point.
 */
export function useExploredPoints(
  position: ExploredPoint | null,
  lastKnownPosition: ExploredPoint | null,
) {
  const exploredQuery = api.map.getRecentExploredPoints.useQuery(
    { limit: 5000 },
    { staleTime: 10_000, refetchOnWindowFocus: false },
  );
  const addPoints = api.map.addExploredPoints.useMutation();
  const utils = api.useUtils();

  const [localPoints, setLocalPoints] = useState<ExploredPoint[]>([]);
  const lastSampledRef = useRef<ExploredPoint | null>(null);
  const pendingQueueRef = useRef<ExploredPoint[]>([]);

  const exploredPoints = useMemo(() => {
    const server = exploredQuery.data ?? [];
    return [...server, ...localPoints];
  }, [exploredQuery.data, localPoints]);

  const fallbackFromSavedPoints = useMemo(() => {
    const pts = exploredQuery.data ?? [];
    if (pts.length === 0) return null;
    return pts[pts.length - 1] ?? null;
  }, [exploredQuery.data]);

  const displayPosition = position ?? lastKnownPosition ?? fallbackFromSavedPoints;

  /** Record a point if it's far enough from the last sample. */
  const samplePoint = useCallback((pt: ExploredPoint) => {
    const last = lastSampledRef.current;
    const shouldSample =
      !last ||
      haversineMeters({ lat: last.lat, lng: last.lng }, pt) >= SAMPLE_MIN_DISTANCE_M;
    if (shouldSample) {
      lastSampledRef.current = pt;
      setLocalPoints((prev) => [...prev, pt]);
      pendingQueueRef.current.push(pt);
    }
  }, []);

  /** Send up to 200 pending points to the server. Re-queues on failure. */
  const flush = useCallback(() => {
    if (addPoints.isPending) return;
    if (pendingQueueRef.current.length === 0) return;
    const batch = pendingQueueRef.current.splice(0, 200);
    const sanitized = batch.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      accuracyM: p.accuracyM ?? undefined,
      createdAt: p.createdAt,
    }));
    addPoints.mutate(
      { points: sanitized },
      {
        onSuccess: () => {
          void utils.map.getExplorationStats.invalidate();
        },
        onError: () => {
          pendingQueueRef.current.unshift(...batch);
        },
      },
    );
  }, [addPoints, utils]);

  useEffect(() => {
    const id = window.setInterval(flush, 5000);
    return () => window.clearInterval(id);
  }, [flush]);

  return {
    exploredPoints,
    displayPosition,
    localPoints,
    exploredQuery,
    addPointsPending: addPoints.isPending,
    samplePoint,
    flush,
  };
}
