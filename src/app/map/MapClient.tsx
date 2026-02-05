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

export function MapClient({ user }: { user: MapUser }) {
  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const didFallbackRef = useRef(false);

  const [geoStatus, setGeoStatus] = useState<
    "idle" | "requesting" | "available" | "denied" | "unavailable" | "timeout"
  >("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoPermission, setGeoPermission] = useState<
    "unknown" | "granted" | "denied" | "prompt"
  >("unknown");
  const [watchNonce, setWatchNonce] = useState(0);
  const [position, setPosition] = useState<ExploredPoint | null>(null);
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
    const pointsToReveal = position
      ? [...exploredPoints, position]
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
  }, [exploredPoints, position]);

  // Keep fog in sync with map interactions
  useEffect(() => {
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
  }, [drawFog, mapReady]);

  // Redraw when points/position change
  useEffect(() => {
    if (!mapReady) return;
    drawFog();
  }, [drawFog, mapReady]);

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
    const pts = exploredQuery.data ?? [];
    if (pts.length === 0) return;

    const last = pts[pts.length - 1];
    if (!last) return;
    const map = mapRef.current?.getMap();
    map?.flyTo({ center: [last.lng, last.lat], zoom: 15, essential: true });
    setHasCentered(true);
  }, [exploredQuery.data, hasCentered, mapReady, position]);

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
            map?.flyTo({ center: [pt.lng, pt.lat], zoom: 16, essential: true });
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
        const map = mapRef.current?.getMap();
        map?.flyTo({ center: [pt.lng, pt.lat], zoom: 16, essential: true });
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

  return (
    <div className="flex flex-col gap-3">
      {clientInfo &&
      !clientInfo.isSecureContext &&
      !["localhost", "127.0.0.1"].includes(clientInfo.hostname) ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          Geolocation requires a secure context (HTTPS) on most devices. You’re
          currently on{" "}
          <code className="text-amber-50">{clientInfo.origin}</code>. For
          local dev, use{" "}
          <code className="text-amber-50">http://localhost:3000</code>, or run
          behind an HTTPS tunnel (e.g. ngrok) and update{" "}
          <code className="text-amber-50">BETTER_AUTH_URL</code> accordingly.
        </div>
      ) : null}

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
        {position ? (
          <div>
            <span className="text-white/50">Position:</span>{" "}
            <span className="text-white">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
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
        {exploredQuery.isFetching ? <div>Syncing…</div> : null}
        {addPoints.isPending ? <div>Saving…</div> : null}
      </div>

      {geoError ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
          <div className="font-semibold text-white">Location error</div>
          <div className="mt-1 break-words">
            <code className="text-white/80">{geoError}</code>
          </div>
          <div className="mt-2 text-white/60">
            If you’re on a phone and visiting this dev server via a LAN URL
            (like <code className="text-white/70">http://192.168…</code>), GPS
            will usually fail unless the site is HTTPS.
          </div>
          <div className="mt-2 text-white/60">
            On macOS: System Settings → Privacy &amp; Security → Location
            Services → enable Location Services and allow it for your browser.
          </div>
        </div>
      ) : null}

      <div className="relative h-[70vh] w-full overflow-hidden rounded-2xl border border-white/10">
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

          {position ? (
            <Marker longitude={position.lng} latitude={position.lat} anchor="center">
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

        <canvas
          ref={fogCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}

