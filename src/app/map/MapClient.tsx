"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import { env } from "~/env";
import { PinMarker, type PinData } from "~/app/_components/pin/PinMarker";
import { PinSheet } from "~/app/_components/pin/PinSheet";
import { CreatePinSheet } from "~/app/_components/pin/CreatePinSheet";
import { useGeolocation } from "./useGeolocation";
import { useExploredPoints } from "./useExploredPoints";
import { useMapPins } from "./useMapPins";
import { useFogLayer } from "./useFogLayer";

type MapUser = {
  id: string;
  name?: string;
  imageUrl?: string;
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
  const [bearing, setBearing] = useState(0);

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
          if (!hasCentered) {
            const map = mapRef.current?.getMap();
            map?.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
            setHasCentered(true);
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

  // Track map bearing changes
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const handleMove = () => {
      setBearing(map.getBearing());
    };

    map.on("move", handleMove);
    return () => {
      map.off("move", handleMove);
    };
  }, []);

  /** Center on user and reset bearing to north. */
  const centerAndOrient = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (explored.displayPosition) {
      // Reset bearing to north
      map.easeTo({
        center: [explored.displayPosition.lng, explored.displayPosition.lat],
        zoom: 17,
        bearing: 0,
        pitch: 0,
        duration: 300,
        essential: true,
      });
      setHasCentered(true);
      return;
    }
    geo.requestOnce({
      onPosition: (pt) => {
        map.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
        setHasCentered(true);
      },
    });
  }, [explored.displayPosition, geo]);

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
      <div className="relative h-[calc(100dvh-112px)] w-full overflow-hidden border border-white/10 sm:h-[calc(100dvh-128px)] sm:rounded-2xl">

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
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-md" />
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/70 ring-2 ring-sky-300/70 shadow-[0_0_0_10px_rgba(56,189,248,0.18)]">
                  {user.imageUrl ? (
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

          {(pins.pinsQuery.data ?? []).map((pin: PinData) => (
            <Marker key={pin.id} longitude={pin.lng} latitude={pin.lat} anchor="bottom">
              <PinMarker pin={pin} onClick={pins.setSelectedPin} />
            </Marker>
          ))}
        </Map>

        <button
          type="button"
          onClick={centerAndOrient}
          className={[
            "absolute right-3 top-1/2 z-30 -translate-y-1/2",
            "grid h-11 w-11 place-items-center rounded-2xl",
            "border border-white/10 bg-[#0b1020]/75 text-white backdrop-blur",
            "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
            "hover:bg-[#0b1020]/90",
            "active:scale-[0.98]",
            bearing !== 0 && "ring-1 ring-sky-400",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Center on your location and orient north"
          title={`Center & orient north (bearing: ${Math.round(bearing)}°)`}
        >
          <div
            className="relative h-full w-full grid place-items-center"
            style={{
              transform: `rotate(${bearing}deg)`,
              transition: bearing === 0 ? "transform 0.3s ease-out" : "none",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              {/* Compass arrow pointing up (north) */}
              <path d="M12 2L14 8H10L12 2Z" fill="currentColor" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
              {/* Cardinal point N */}
              <text
                x="12"
                y="6"
                textAnchor="middle"
                className="text-[8px] fill-current font-bold"
                dominantBaseline="middle"
              >
                N
              </text>
            </svg>
          </div>
        </button>

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
