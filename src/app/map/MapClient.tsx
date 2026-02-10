"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";

import { env } from "~/env";
import { api } from "~/trpc/react";

type ExploredPoint = {
  lat: number;
  lng: number;
  accuracyM?: number;
  createdAt?: Date;
};

type MapUser = {
  id: string;
  name?: string;
  imageUrl?: string;
};

type MapClientMode = "full" | "minimal";

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000; // meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function metersPerPixelAtLat(zoom: number, lat: number) {
  // Mapbox GL world size is 512 * 2^zoom pixels.
  const earthCircumference = 40075016.68557849; // meters (WGS84)
  const latRad = (lat * Math.PI) / 180;
  return (Math.cos(latRad) * earthCircumference) / (512 * Math.pow(2, zoom));
}

export function MapClient({
  user,
  mode = "full",
}: {
  user: MapUser;
  mode?: MapClientMode;
}) {
  // Temporarily disable fog-of-war overlay.
  const fogEnabled = false;

  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const didFallbackRef = useRef(false);

  const [debugOpen, setDebugOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "requesting" | "available" | "denied" | "unavailable" | "timeout"
  >("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPermission, setGeoPermission] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");
  const [watchNonce, setWatchNonce] = useState(0);
  const [position, setPosition] = useState<ExploredPoint | null>(null);
  const [lastKnownPosition, setLastKnownPosition] =
    useState<ExploredPoint | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [clientInfo, setClientInfo] = useState<{
    origin: string;
    hostname: string;
    isSecureContext: boolean;
    userAgent: string;
  } | null>(null);

  const exploredQuery = api.map.getRecentExploredPoints.useQuery(
    { limit: 5000 },
    { staleTime: 10_000, refetchOnWindowFocus: false },
  );

  const addPoints = api.map.addExploredPoints.useMutation();

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
    const last = pts[pts.length - 1];
    return last ?? null;
  }, [exploredQuery.data]);

  const displayPosition = position ?? lastKnownPosition ?? fallbackFromSavedPoints;

  const revealRadiusM = 25;
  const sampleMinDistanceM = 10;

  useEffect(() => {
    setClientInfo({
      origin: window.location.origin,
      hostname: window.location.hostname,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
    });
  }, []);

  // Restore last known location immediately on refresh (so marker doesn't disappear while GPS reacquires)
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("strides.map.debugOpen");
      if (saved === "1") setDebugOpen(true);
      if (saved === "0") setDebugOpen(false);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("strides.map.debugOpen", debugOpen ? "1" : "0");
    } catch {
      // ignore
    }
  }, [debugOpen]);

  useEffect(() => {
    let cancelled = false;
    const permissionsApi = navigator.permissions;
    if (!permissionsApi?.query) return;

    // Permissions API support varies (esp. Safari).
    // If it fails, keep "unknown".
    void permissionsApi
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setGeoPermission(status.state);
        status.onchange = () => setGeoPermission(status.state);
      })
      .catch((err) => {
        // Safari and some embedded browsers can throw here.
        console.debug("Geolocation permissions query failed", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

    // draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Fog fill
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(10, 12, 20, 0.88)";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Punch holes where explored
    ctx.globalCompositeOperation = "destination-out";

    const zoom = map.getZoom();
    const pointsToReveal = displayPosition
      ? [...exploredPoints, displayPosition]
      : exploredPoints;

    for (const p of pointsToReveal) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const projected = map.project([p.lng, p.lat]);
      const mPerPx = metersPerPixelAtLat(zoom, p.lat);
      const radiusPx = revealRadiusM / Math.max(mPerPx, 0.000001);

      const g = ctx.createRadialGradient(
        projected.x,
        projected.y,
        radiusPx * 0.2,
        projected.x,
        projected.y,
        radiusPx,
      );
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.65, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [displayPosition, exploredPoints, fogEnabled]);

  // Keep fog in sync with map interactions
  useEffect(() => {
    if (!fogEnabled) return;
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handler = () => {
      // render can fire frequently; batch draws
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
  }, [drawFog, fogEnabled, mapReady]);

  // Redraw when points/position change
  useEffect(() => {
    if (!fogEnabled) return;
    if (!mapReady) return;
    drawFog();
  }, [drawFog, fogEnabled, mapReady]);

  // Flush queued points periodically
  const flush = useCallback(() => {
    if (addPoints.isPending) return;
    if (pendingQueueRef.current.length === 0) return;

    const batch = pendingQueueRef.current.splice(0, 200);
    addPoints.mutate(
      { points: batch },
      {
        onError: () => {
          // best-effort: put back in front
          pendingQueueRef.current.unshift(...batch);
        },
      },
    );
  }, [addPoints]);

  useEffect(() => {
    const id = window.setInterval(flush, 5000);
    return () => window.clearInterval(id);
  }, [flush]);

  // If GPS isn't available, at least center to the latest saved point.
  useEffect(() => {
    if (!mapReady) return;
    if (hasCentered) return;
    if (position) return;
    const last = displayPosition;
    if (!last) return;
    const map = mapRef.current?.getMap();
    map?.flyTo({ center: [last.lng, last.lat], zoom: 16, essential: true });
    setHasCentered(true);
  }, [displayPosition, hasCentered, mapReady, position]);

  const startWatch = useCallback(
    (options: PositionOptions) => {
      if (!("geolocation" in navigator)) {
        setGeoStatus("unavailable");
        setGeoError("Geolocation API not available in this browser.");
        return;
      }

      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      setGeoStatus("requesting");
      setGeoError(null);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGeoStatus("available");
          setGeoError(null);
          const pt: ExploredPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: Number.isFinite(pos.coords.accuracy)
              ? pos.coords.accuracy
              : undefined,
            createdAt: new Date(pos.timestamp),
          };

          setPosition(pt);
          setLastKnownPosition(pt);
          try {
            localStorage.setItem(
              "strides.map.lastPosition",
              JSON.stringify({
                lat: pt.lat,
                lng: pt.lng,
                accuracyM: pt.accuracyM,
                timestamp: pos.timestamp,
              }),
            );
          } catch {
            // ignore
          }

          // sample the trail (avoid spam)
          const last = lastSampledRef.current;
          const shouldSample =
            !last ||
            haversineMeters({ lat: last.lat, lng: last.lng }, pt) >=
              sampleMinDistanceM;

          if (shouldSample) {
            lastSampledRef.current = pt;
            setLocalPoints((prev) => [...prev, pt]);
            pendingQueueRef.current.push(pt);
          }

          // center once when we first get a fix
          if (!hasCentered) {
            const map = mapRef.current?.getMap();
            map?.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
            setHasCentered(true);
          }
        },
        (err) => {
          setGeoError(`${err.code}: ${err.message}`);
          if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
          else if (err.code === err.TIMEOUT) setGeoStatus("timeout");
          else setGeoStatus("unavailable");

          // Fallback: some devices fail with high accuracy but can succeed with
          // coarse network-based location.
          if (
            !didFallbackRef.current &&
            options.enableHighAccuracy === true &&
            (err.code === err.POSITION_UNAVAILABLE || err.code === err.TIMEOUT)
          ) {
            didFallbackRef.current = true;
            startWatch({
              enableHighAccuracy: false,
              maximumAge: 30_000,
              timeout: 60_000,
            });
          }
        },
        options,
      );
    },
    [hasCentered],
  );

  const requestOnce = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoStatus("unavailable");
      setGeoError("Geolocation API not available in this browser.");
      return;
    }
    setGeoStatus("requesting");
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
        try {
          localStorage.setItem(
            "strides.map.lastPosition",
            JSON.stringify({
              lat: pt.lat,
              lng: pt.lng,
              accuracyM: pt.accuracyM,
              timestamp: pos.timestamp,
            }),
          );
        } catch {
          // ignore
        }
        const map = mapRef.current?.getMap();
        map?.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
        setHasCentered(true);
      },
      (err) => {
        setGeoError(`${err.code}: ${err.message}`);
        if (err.code === err.PERMISSION_DENIED) setGeoStatus("denied");
        else if (err.code === err.TIMEOUT) setGeoStatus("timeout");
        else setGeoStatus("unavailable");
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 30_000 },
    );
  }, []);

  const centerOnUser = useCallback(() => {
    if (displayPosition) {
      const map = mapRef.current?.getMap();
      map?.flyTo({
        center: [displayPosition.lng, displayPosition.lat],
        zoom: 17,
        essential: true,
      });
      setHasCentered(true);
      return;
    }

    // No current fix yet — try a one-shot locate (this will also center if it succeeds)
    requestOnce();
  }, [displayPosition, requestOnce]);

  // Geolocation watch
  useEffect(() => {
    didFallbackRef.current = false;
    startWatch({
      enableHighAccuracy: true,
      maximumAge: 2_000,
      timeout: 60_000,
    });

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [startWatch, watchNonce]);

  const token = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
        Missing <code className="text-white">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>.
        Add it to your <code className="text-white">.env</code> and restart the dev server.
      </div>
    );
  }

  const showChrome = mode === "full";

  return (
    <div className={showChrome ? "flex flex-col gap-3 px-4 py-5 pb-28 sm:py-6" : "p-0"}>
      {debugOpen &&
      clientInfo &&
      !clientInfo.isSecureContext &&
      !["localhost", "127.0.0.1"].includes(clientInfo.hostname) ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          Geolocation requires a secure context (HTTPS) on most devices. You’re
          currently on{" "}
          <code className="text-amber-50">{clientInfo.origin}</code>. For local
          dev, use <code className="text-amber-50">http://localhost:3000</code>
          , or run behind an HTTPS tunnel (e.g. ngrok) and update{" "}
          <code className="text-amber-50">BETTER_AUTH_URL</code> accordingly.
        </div>
      ) : null}

      {showChrome ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          <div>
            <span className="text-white/50">GPS:</span>{" "}
            <span className="text-white">
              {geoStatus === "available"
                ? "active"
                : geoStatus === "requesting"
                  ? "requesting…"
                  : geoStatus === "denied"
                    ? "denied"
                    : geoStatus === "timeout"
                      ? "timed out"
                    : geoStatus === "unavailable"
                      ? "unavailable"
                      : "idle"}
            </span>
          </div>
          <div>
            <span className="text-white/50">Permission:</span>{" "}
            <span className="text-white">{geoPermission}</span>
          </div>
          {!debugOpen && geoError ? (
            <div className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100">
              GPS error
            </div>
          ) : null}
          {displayPosition ? (
            <div>
              <span className="text-white/50">Position:</span>{" "}
              <span className="text-white">
                {displayPosition.lat.toFixed(6)}, {displayPosition.lng.toFixed(6)}
              </span>
            </div>
          ) : null}
          <div>
            <span className="text-white/50">Saved points:</span>{" "}
            <span className="text-white">
              {(exploredQuery.data?.length ?? 0) + localPoints.length}
            </span>
          </div>
          <button
            className="rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white transition hover:bg-white/20"
            type="button"
            onClick={requestOnce}
          >
            Locate me
          </button>
          <button
            className="rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white transition hover:bg-white/20"
            type="button"
            onClick={() => setWatchNonce((n) => n + 1)}
          >
            Retry GPS
          </button>
          <button
            className="rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white transition hover:bg-white/20"
            type="button"
            onClick={() => setDebugOpen((v) => !v)}
            aria-expanded={debugOpen}
            aria-controls="map-debug"
          >
            {debugOpen ? "Hide debug" : "Debug"}
          </button>
          {exploredQuery.isFetching ? <div>Syncing…</div> : null}
          {addPoints.isPending ? <div>Saving…</div> : null}
        </div>
      ) : null}

      {showChrome && debugOpen ? (
        <div id="map-debug" className="flex flex-col gap-3">
          {geoError ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <div className="font-semibold text-white">Location error</div>
              <div className="mt-1 break-words">
                <code className="text-white/80">{geoError}</code>
              </div>
              <div className="mt-2 text-white/60">
                If you’re on a phone and visiting this dev server via a LAN URL
                (like <code className="text-white/70">http://192.168…</code>),
                GPS will usually fail unless the site is HTTPS.
              </div>
              <div className="mt-2 text-white/60">
                On macOS: System Settings → Privacy &amp; Security → Location
                Services → enable Location Services and allow it for your
                browser.
              </div>
            </div>
          ) : null}

          {clientInfo ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
              <div className="font-semibold text-white">Debug</div>
              <div className="mt-1 grid gap-1">
                <div>
                  <span className="text-white/50">Origin:</span>{" "}
                  <code className="text-white/80">{clientInfo.origin}</code>
                </div>
                <div>
                  <span className="text-white/50">Secure context:</span>{" "}
                  <code className="text-white/80">
                    {String(clientInfo.isSecureContext)}
                  </code>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={
          showChrome
            ? "relative h-[72dvh] w-full overflow-hidden border border-white/10 sm:h-[70vh] sm:rounded-2xl"
            : // Fullscreen-ish map on mobile with a small gap above the fixed bottom nav.
              "relative h-[calc(100dvh-112px)] w-full overflow-hidden border border-white/10 sm:h-[calc(100dvh-128px)] sm:rounded-2xl"
        }
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          initialViewState={{ latitude: 0, longitude: 0, zoom: 2 }}
          onLoad={() => setMapReady(true)}
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="top-right" />

          {displayPosition ? (
            <Marker
              longitude={displayPosition.lng}
              latitude={displayPosition.lat}
              anchor="center"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-md" />
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/70 ring-2 ring-sky-300/70 shadow-[0_0_0_10px_rgba(56,189,248,0.18)]">
                  {user.imageUrl ? (
                    // Using <img> to avoid Next/Image remote config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={user.name ? `${user.name}'s avatar` : "Your avatar"}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-sky-300" />
                  )}
                </div>
              </div>
            </Marker>
          ) : null}
        </Map>

        {/* Center-on-me control (always visible) */}
        <button
          type="button"
          onClick={centerOnUser}
          className={[
            "absolute right-3 top-1/2 z-30 -translate-y-1/2",
            "grid h-11 w-11 place-items-center rounded-2xl",
            "border border-white/10 bg-[#0b1020]/75 text-white backdrop-blur",
            "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
            "hover:bg-[#0b1020]/90",
            "active:scale-[0.98]",
          ].join(" ")}
          aria-label="Center on your location"
          title="Center on your location"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 2v3M12 19v3M2 12h3M19 12h3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {fogEnabled ? (
          <canvas
            ref={fogCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        ) : null}
      </div>
    </div>
  );
}

