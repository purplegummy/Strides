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
 
type MapUser = {
  id: string;
};
 
// ── Pin bubble geometry ────────────────────────────────────────────────────────
// The bubble floats above the marker. We want the tip of the pointer triangle
// (bottom of the bubble) to sit exactly over the pin's map coordinate.
// Bubble height ≈ 420px, pointer triangle ≈ 32px, rarity tag ≈ 28px,
// plus 120px bottom offset from the sheet. Total upward offset ≈ 600px.
// We place the pin tip at 75% down the screen so the bubble has room above.
const PIN_TIP_TARGET_Y_RATIO = 0.25; // 0 = top, 1 = bottom
const PIN_BUBBLE_HEIGHT_PX = 580;    // full height from tip to top of bubble

type FogIntensity = "medium" | "light" | "heavy";

type MapClientProps = {
  user: MapUser;
  fogIntensity: FogIntensity; // Add this
};
 
export function MapClient({ user, fogIntensity }: MapClientProps) {
  const fogEnabled = true;
  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const selectedPinRef = useRef<PinData | null>(null);
 
  // ── Center so the pin's pointer TIP lands at PIN_TIP_TARGET_Y_RATIO ────────
  const centerOnPin = useCallback((pin: { lat: number; lng: number }) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
 
    const canvas = map.getCanvas();
    const screenH = canvas.clientHeight;
 
    // Where we want the tip to appear on screen
    const targetTipY = screenH * PIN_TIP_TARGET_Y_RATIO;
 
    // Current screen position of the pin coordinate
    const pinScreenPos = map.project([pin.lng, pin.lat]);
 
    // Shift the map so pinScreenPos.y moves to targetTipY
    const dy = pinScreenPos.y - targetTipY;
    const newCenter = map.unproject([pinScreenPos.x, pinScreenPos.y - dy]);
 
    map.easeTo({
      center: [newCenter.lng, newCenter.lat],
      duration: 500,
      easing: (t) => t * (2 - t),
    });
  }, []);
 
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const geo = useGeolocation();
  const explored = useExploredPoints(geo.position, geo.lastKnownPosition);
  const pins = useMapPins(geo.position, geo.lastKnownPosition, centerOnPin);
 
  // Keep a ref in sync so the GPS handler can read it without stale closure
  useEffect(() => {
    selectedPinRef.current = pins.selectedPin;
  }, [pins.selectedPin]);
 
  useFogLayer(
    mapRef,
    fogCanvasRef,
    mapReady,
    explored.exploredPoints,
    explored.displayPosition,
    fogEnabled,
  );
 
  // ── Handle pin click: select + center ─────────────────────────────────────
  const handlePinClick = useCallback((pin: PinData) => {
    pins.setSelectedPin(pin);
    centerOnPin(pin);
  }, [pins, centerOnPin]);
 
  // ── GPS watch — freeze map movement while a pin popup is open ─────────────
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
            return;
          }
 
          // Don't pan the map while a pin popup is open — it would
          // move the map out from under the bubble
          if (selectedPinRef.current) return;
 
          map?.easeTo({ center: [pt.lng, pt.lat], duration: 500 });
        },
      },
    );
    return () => geo.clearWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.watchNonce]);
 
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
 