"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
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

type MapUser = {
  id: string;
};

/**
 * Top-level map component that composes the domain hooks (geolocation,
 * explored points, pins, fog) and renders the Mapbox GL map with the
 * user marker, pin markers, and action buttons. Meant to stay mounted
 * for the lifetime of the app shell so map state is never lost.
 */
export function MapClient({
  user,
}: {
  user: MapUser;
}) {
  const fogEnabled = false;
  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const geo = useGeolocation();
  const explored = useExploredPoints(geo.position, geo.lastKnownPosition);
  const pins = useMapPins(geo.position, geo.lastKnownPosition);

  useFogLayer(
    mapRef,
    fogCanvasRef,
    mapReady,
    explored.exploredPoints,
    explored.displayPosition,
    fogEnabled,
  );

  // Start GPS watch on mount. Re-runs when watchNonce changes (e.g. "Retry GPS").
  // Each position update samples a point for exploration tracking and auto-centers
  // the map on the first fix.
  useEffect(() => {
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
  }, [geo.watchNonce]);

  // Center on saved/fallback position when map loads (before GPS arrives)
  useEffect(() => {
    if (!mapReady || hasCentered || geo.position) return;
    const last = explored.displayPosition;
    if (!last) return;
    const map = mapRef.current?.getMap();
    map?.flyTo({ center: [last.lng, last.lat], zoom: 16, essential: true });
    setHasCentered(true);
  }, [explored.displayPosition, hasCentered, mapReady, geo.position]);

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
              <UserPositionMarker />
            </Marker>
          ) : null}

          {(pins.pinsQuery.data ?? []).map((pin: PinData) => (
            <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom">
              <PinMarker pin={pin} onClick={pins.setSelectedPin} />
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
            "flex items-center gap-2 rounded-2xl px-4 py-3",
            "border border-white/10 bg-[#0b1020]/80 text-white backdrop-blur",
            "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
            "font-semibold text-sm",
            "hover:bg-[#0b1020]/95 active:scale-[0.98]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          ].join(" ")}
          aria-label="Drop a pin at your location"
          title={hasLocation ? "Drop a pin here" : "Waiting for GPS…"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Drop Pin
        </button>

        {fogEnabled ? (
          <canvas
            ref={fogCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        ) : null}
      </div>

      {/* ── Pin sheets ── */}
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
