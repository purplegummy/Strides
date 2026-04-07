"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import { env } from "~/env";
import { PinMarker, type PinData } from "~/app/_components/pin/PinMarker";
import { PinSheet } from "~/app/_components/pin/PinSheet";
import { CreatePinSheet } from "~/app/_components/pin/CreatePinSheet";
import { CompassButton } from "./CompassButton";
import { UserPositionMarker } from "./UserPositionMarker";
import { useGeolocation } from "./useGeolocation";
import { useExploredPoints } from "./useExploredPoints";
import { useMapPins } from "./useMapPins";
import { useFogLayer } from "./useFogLayer";
import { useDeviceHeading } from "./useDeviceHeading";

type MapUser = {
  id: string;
};

export function MapClient({ user, fogIntensity = 'medium' }: { user: MapUser; fogIntensity?: 'light' | 'medium' | 'heavy' }) {
  const fogEnabled = true;
  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Center map so pin appears near bottom-middle of screen ─────────────────
  const centerOnPin = useCallback((pin: { lat: number; lng: number }) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const canvas = map.getCanvas();
    const screenH = canvas.clientHeight;
    const pinScreenPos = map.project([pin.lng, pin.lat]);
    const targetY = screenH * 0.7;
    const offsetY = pinScreenPos.y - targetY;
    const newCenter = map.unproject([pinScreenPos.x, pinScreenPos.y - offsetY]);
    map.easeTo({
      center: [newCenter.lng, newCenter.lat],
      duration: 500,
      easing: (t) => t * (2 - t),
    });
  }, []);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const deviceHeading = useDeviceHeading();
  const geo = useGeolocation();
  const explored = useExploredPoints(geo.position, geo.lastKnownPosition);
  const pins = useMapPins(geo.position, geo.lastKnownPosition, centerOnPin);

  useFogLayer(
    mapRef,
    fogCanvasRef,
    mapReady,
    explored.exploredPoints,
    explored.displayPosition,
    fogEnabled,
    fogIntensity,
  );

  // ── Location permission modal ──────────────────────────────────────────────
  type LocationModalState = "pre-prompt" | "requesting" | "denied" | "hidden";
  const [locationModal, setLocationModal] = useState<LocationModalState>("hidden");
  const [watchEnabled, setWatchEnabled] = useState(false);

  // ── Handle pin click: select + center ─────────────────────────────────────
  const handlePinClick = useCallback((pin: PinData) => {
    pins.setSelectedPin(pin);
    centerOnPin(pin);
  }, [pins, centerOnPin]);

  // ── GPS watch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!watchEnabled) return;
    geo.startWatch(
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 60_000 },
      {
        onPosition: (pt) => {
          explored.samplePoint(pt);
          const map = mapRef.current?.getMap();
          if (!hasCentered) {
            map?.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
            setHasCentered(true);
          } else {
            map?.easeTo({ center: [pt.lng, pt.lat], duration: 500 });
          }
        },
      },
    );
    return () => geo.clearWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.watchNonce, watchEnabled]);

  useEffect(() => {
    if (!mapReady || hasCentered || geo.position) return;
    const last = explored.displayPosition;
    if (!last) return;
    const map = mapRef.current?.getMap();
    map?.flyTo({ center: [last.lng, last.lat], zoom: 16, essential: true });
    setHasCentered(true);
  }, [explored.displayPosition, hasCentered, mapReady, geo.position]);

  // Once the Permissions API resolves, set the appropriate modal state
  useEffect(() => {
    if (geo.geoPermission === "granted") {
      setLocationModal("hidden");
      setWatchEnabled(true);
    } else if (geo.geoPermission === "denied") {
      setLocationModal("denied");
    } else if (geo.geoPermission === "prompt") {
      setLocationModal("pre-prompt");
    }
  }, [geo.geoPermission]);

  // Fallback: if Permissions API isn't supported, show modal after a tick
  useEffect(() => {
    if (!navigator.permissions?.query) {
      setLocationModal("pre-prompt");
    }
  }, []);

  const handleLocationAllow = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationModal("denied");
      return;
    }
    setLocationModal("requesting");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationModal("hidden");
        setWatchEnabled(true);
      },
      () => {
        setLocationModal("denied");
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 30_000 },
    );
  }, []);

  const handleLocationNotNow = useCallback(() => {
    setLocationModal("hidden");
  }, []);

  const token = env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
        Missing <code className="text-white">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>.
        Add it to your <code className="text-white">.env</code> and restart the dev server.
      </div>
    );
  }

  const hasLocation = !!(geo.position ?? geo.lastKnownPosition);

  return (
    <div className="p-0">
      <div className="relative h-[100dvh] w-full overflow-hidden [&_.mapboxgl-ctrl-logo]:!hidden [&_.mapboxgl-ctrl-attrib]:!hidden">
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          initialViewState={{ latitude: 0, longitude: 0, zoom: 2 }}
          onLoad={() => setMapReady(true)}
          attributionControl={false}
          reuseMaps
        >
          {explored.displayPosition ? (
            <Marker
              longitude={explored.displayPosition.lng}
              latitude={explored.displayPosition.lat}
              anchor="center"
            >
              <UserPositionMarker heading={deviceHeading} />
            </Marker>
          ) : null}

          {(pins.pinsQuery.data ?? []).map((pin: PinData) => (
            <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom">
              <PinMarker pin={pin} onClick={handlePinClick} />
            </Marker>
          ))}
        </Map>

        <CompassButton
          mapRef={mapRef}
          displayPosition={explored.displayPosition}
          requestOnce={geo.requestOnce}
          onCentered={() => setHasCentered(true)}
        />

        <button
          type="button"
          onClick={pins.handleDropPin}
          disabled={!hasLocation}
          className={[
            "absolute bottom-4 right-3 z-30",
            "grid h-14 w-14 place-items-center rounded-2xl",
            "border border-[#656A73]/40 bg-[#0F172A]/60 text-[#E6EDF7] backdrop-blur",
            "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
            "hover:bg-[#0F172A]/75 active:scale-[0.98]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          ].join(" ")}
          aria-label="Drop a pin at your location"
          title={hasLocation ? "Drop a pin here" : "Waiting for GPS…"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BFC8D9" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" fill="#38bdf8" fillOpacity="0.3" />
          </svg>
        </button>

        {locationModal !== "hidden" ? (
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/15 bg-slate-950/95 p-5 text-sm text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-sky-500/20 text-sky-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {locationModal === "denied" ? "Location access blocked" : "Allow location access"}
                  </div>
                  <p className="mt-1 text-slate-300 leading-relaxed">
                    {locationModal === "denied"
                      ? "Your browser has blocked location access for this site. To fix this, open your browser\u2019s site settings, allow location, then reload."
                      : "Strides needs your location to track movement, calculate progress, and reveal the map as you explore."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {locationModal === "denied" ? (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98]"
                  >
                    Reload page
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleLocationNotNow}
                      className="rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Not now
                    </button>
                    <button
                      type="button"
                      onClick={handleLocationAllow}
                      disabled={locationModal === "requesting"}
                      className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locationModal === "requesting" ? "Requesting…" : "Allow location"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {fogEnabled ? (
          <canvas
            ref={fogCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        ) : null}
      </div>

      <PinSheet
        pin={pins.selectedPin}
        currentUserId={user.id}
        onClose={() => pins.setSelectedPin(null)}
        onUpvote={(pinId) => pins.upvotePin.mutate({ pinId })}
        onUndoUpvote={(pinId) => pins.undoUpvote.mutate({ pinId })}
        onEdit={pins.handleEditPin}
        onDelete={(pinId) => pins.deletePin.mutate({ id: pinId })}
        isUpvoting={pins.upvotePin.isPending || pins.undoUpvote.isPending}
        isDeleting={pins.deletePin.isPending}
      />

      <CreatePinSheet
        open={pins.createSheetOpen}
        editingPin={pins.editingPin}
        onClose={pins.closeCreateSheet}
        onSubmit={pins.handleCreateSubmit}
        isSubmitting={pins.createPin.isPending || pins.updatePin.isPending}
      />
    </div>
  );
}