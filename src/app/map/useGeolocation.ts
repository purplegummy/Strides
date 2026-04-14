"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExploredPoint } from "./map-utils";

export type GeoStatus =
  | "idle"
  | "requesting"
  | "available"
  | "denied"
  | "unavailable"
  | "timeout";

export type GeoPermission = "unknown" | "granted" | "denied" | "prompt";

/**
 * Manages all browser Geolocation API interactions.
 *
 * Responsibilities:
 * - Continuous GPS watch with automatic fallback from high-accuracy to
 *   low-accuracy when the device times out or reports unavailable.
 * - One-shot position requests via `requestOnce`.
 * - Persists the last known position to localStorage so the map can center
 *   immediately on reload before GPS locks in.
 * - Tracks the current permission state ("granted" / "denied" / "prompt")
 *   reactively via the Permissions API.
 */
export function useGeolocation() {
  const watchIdRef = useRef<number | null>(null);
  /** Guards against retrying the low-accuracy fallback more than once. */
  const didFallbackRef = useRef(false);

  const [position, setPosition] = useState<ExploredPoint | null>(null);
  const [lastKnownPosition, setLastKnownPosition] = useState<ExploredPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPermission, setGeoPermission] = useState<GeoPermission>("unknown");
  const [watchNonce, setWatchNonce] = useState(0);

  // Restore last known position from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("strides.map.lastPosition");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        lat: number;
        lng: number;
        accuracyM?: number;
        timestamp?: number;
      };
      if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return;
      setLastKnownPosition({
        lat: parsed.lat,
        lng: parsed.lng,
        accuracyM: parsed.accuracyM,
        createdAt: parsed.timestamp ? new Date(parsed.timestamp) : undefined,
      });
    } catch {
      // ignore
    }
  }, []);

  // Track geolocation permission state
  useEffect(() => {
    let cancelled = false;
    const permissionsApi = navigator.permissions;
    if (!permissionsApi?.query) return;
    void permissionsApi
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setGeoPermission(status.state);
        status.onchange = () => setGeoPermission(status.state);
      })
      .catch((err) => {
        console.debug("Geolocation permissions query failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Save position to localStorage so we can restore it on next page load. */
  const persistPosition = useCallback((pt: ExploredPoint, timestamp: number) => {
    try {
      localStorage.setItem(
        "strides.map.lastPosition",
        JSON.stringify({
          lat: pt.lat,
          lng: pt.lng,
          accuracyM: pt.accuracyM,
          timestamp,
        }),
      );
    } catch {
      // ignore
    }
  }, []);

  const handlePositionSuccess = useCallback(
    (pos: GeolocationPosition): ExploredPoint => {
      const pt: ExploredPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracyM: Number.isFinite(pos.coords.accuracy)
          ? pos.coords.accuracy
          : undefined,
        createdAt: new Date(pos.timestamp),
      };
      setGeoStatus("available");
      setGeoError(null);
      setPosition(pt);
      setLastKnownPosition(pt);
      persistPosition(pt, pos.timestamp);
      return pt;
    },
    [persistPosition],
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    setGeoError(`${err.code}: ${err.message}`);
    if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
    else if (err.code === err.TIMEOUT) setGeoStatus("timeout");
    else setGeoStatus("unavailable");
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  /**
   * Begin a continuous GPS watch. If high-accuracy is requested and the device
   * fails with TIMEOUT or POSITION_UNAVAILABLE, automatically retries once
   * with low-accuracy settings as a fallback.
   */
  const startWatch = useCallback(
    (
      options: PositionOptions,
      callbacks?: {
        onPosition?: (pt: ExploredPoint) => void;
        onError?: (err: GeolocationPositionError, options: PositionOptions) => void;
      },
    ) => {
      if (!("geolocation" in navigator)) {
        setGeoStatus("unavailable");
        setGeoError("Geolocation API not available in this browser.");
        return;
      }
      clearWatch();
      setGeoStatus("requesting");
      setGeoError(null);
      didFallbackRef.current = false;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const pt = handlePositionSuccess(pos);
          callbacks?.onPosition?.(pt);
        },
        (err) => {
          handlePositionError(err);
          if (
            !didFallbackRef.current &&
            options.enableHighAccuracy === true &&
            (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT)
          ) {
            didFallbackRef.current = true;
            startWatch(
              { enableHighAccuracy: false, maximumAge: 30_000, timeout: 60_000 },
              callbacks,
            );
          }
          callbacks?.onError?.(err, options);
        },
        options,
      );
    },
    [clearWatch, handlePositionSuccess, handlePositionError],
  );

  /** Fire a single getCurrentPosition request (low-accuracy, 30s timeout). */
  const requestOnce = useCallback(
    (callbacks?: {
      onPosition?: (pt: ExploredPoint) => void;
      onError?: (err: GeolocationPositionError) => void;
    }) => {
      if (!("geolocation" in navigator)) {
        setGeoStatus("unavailable");
        setGeoError("Geolocation API not available in this browser.");
        return;
      }
      setGeoStatus("requesting");
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const pt = handlePositionSuccess(pos);
          callbacks?.onPosition?.(pt);
        },
        (err) => {
          handlePositionError(err);
          callbacks?.onError?.(err);
        },
        { enableHighAccuracy: false, maximumAge: 30_000, timeout: 30_000 },
      );
    },
    [handlePositionSuccess, handlePositionError],
  );

  return {
    position,
    lastKnownPosition,
    geoStatus,
    geoError,
    geoPermission,
    watchNonce,
    setWatchNonce,
    startWatch,
    requestOnce,
    clearWatch,
  };
}
