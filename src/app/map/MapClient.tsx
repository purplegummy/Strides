"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, { Marker, type MapRef } from "react-map-gl/mapbox";
type ClusterFeature = {
  type: "Feature";
  id?: number;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: (PinData & { cluster?: false }) | { cluster: true; cluster_id: number; point_count: number };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SuperclusterCtor = (require("supercluster") as { default: new (opts: object) => { load: (f: object[]) => void; getClusters: (bbox: number[], zoom: number) => ClusterFeature[]; getClusterExpansionZoom: (id: number) => number } }).default;
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
import { haversineMeters } from "./map-utils";
import { QUEST_DEFINITIONS } from "~/app/_components/quests/questData";
import { api } from "~/trpc/react";

const locationQuests = QUEST_DEFINITIONS.filter((q) => q.location);

 
type MapUser = {
  id: string;
};
 

type FogIntensity = "medium" | "light" | "heavy";

type MapClientProps = {
  user: MapUser;
  fogIntensity: FogIntensity;
  hideControls?: boolean;
};
 
export function MapClient({ user, fogIntensity, hideControls }: MapClientProps) {
  const fogEnabled = true;
  const mapRef = useRef<MapRef | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(2);
  const questMarkerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const selectedPinRef = useRef<PinData | null>(null);
 
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const geo = useGeolocation();
  const explored = useExploredPoints(geo.position, geo.lastKnownPosition);
  const pins = useMapPins(geo.position, geo.lastKnownPosition);
  const completedQuestsQuery = api.quest.getCompletedQuests.useQuery();
  const completedQuestIds = new Set(completedQuestsQuery.data?.map((c) => c.questId) ?? []);
 
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
    fogIntensity,
  );
 
  // ── Quest location markers — direct DOM update, no React re-renders ────────
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !mapReady) return;
    const update = () => {
      for (const q of locationQuests) {
        const el = questMarkerRefs.current[q.id];
        if (!el) continue;
        const pt = map.project([q.location!.lng, q.location!.lat]);
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
        el.style.visibility = "visible";
      }
    };
    update();
    map.on("move", update);
    return () => { map.off("move", update); };
  }, [mapReady]);

  // ── Handle pin click: select + center ─────────────────────────────────────
  const handlePinClick = useCallback((pin: PinData) => {
    pins.setSelectedPin(pin);
  }, [pins]);
 
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
 
  // Only show pins that are within 25m of an explored point (fog reveal radius)
  const visiblePins = useMemo(() => {
    const allPins = pins.pinsQuery.data ?? [];
    const ep = explored.exploredPoints;
    if (ep.length === 0) return [];
    return allPins.filter((pin) =>
      ep.some((pt) => haversineMeters(pt, pin) <= 25)
    );
  }, [pins.pinsQuery.data, explored.exploredPoints]);

  // Spread pins that share the exact same coordinate so they never overlap
  const spreadPins = useMemo(() => {
    const SPREAD_M = 8; // meters between stacked pins
    const DEG_PER_M_LAT = 1 / 111_000;
    const groups = new Map<string, PinData[]>();
    for (const pin of visiblePins) {
      const key = `${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(pin);
    }
    return visiblePins.map((pin) => {
      const key = `${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
      const group = groups.get(key)!;
      if (group.length === 1) return pin;
      const idx = group.indexOf(pin);
      const angle = (2 * Math.PI * idx) / group.length;
      const dLat = Math.cos(angle) * SPREAD_M * DEG_PER_M_LAT;
      const dLng = Math.sin(angle) * SPREAD_M * DEG_PER_M_LAT / Math.cos((pin.lat * Math.PI) / 180);
      return { ...pin, lat: pin.lat + dLat, lng: pin.lng + dLng };
    });
  }, [visiblePins]);

  // Cluster nearby pins using supercluster
  const { clusters, supercluster: sc } = useMemo(() => {
    const supercluster = new SuperclusterCtor({ radius: 20, maxZoom: 17 });
    supercluster.load(
      spreadPins.map((pin) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [pin.lng, pin.lat] },
        properties: pin,
      }))
    );
    const clusters = supercluster.getClusters([-180, -85, 180, 85], Math.round(zoom));
    return { clusters, supercluster };
  }, [spreadPins, zoom]);

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
        <MapGL
          ref={mapRef}
          mapboxAccessToken={token}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          initialViewState={{ latitude: 0, longitude: 0, zoom: 2 }}
          onLoad={() => setMapReady(true)}
          onZoom={(e) => setZoom(e.viewState.zoom)}
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
 
          {clusters.map((feature) => {
            const [lng, lat] = feature.geometry.coordinates;
            const props = feature.properties;

            if ('cluster' in props && props.cluster) {
              const count = (props as { point_count: number }).point_count;
              return (
                <Marker key={`cluster-${feature.id}`} longitude={lng} latitude={lat} anchor="bottom">
                  <button
                    type="button"
                    onClick={() => {
                      const expansionZoom = Math.min(sc.getClusterExpansionZoom(feature.id!), 20);
                      mapRef.current?.getMap()?.easeTo({ center: [lng, lat], zoom: expansionZoom, duration: 400 });
                    }}
                    style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
                  >
                    {/* Glow ring */}
                    <span style={{ position: "absolute", inset: "-6px 50% -6px 50%", width: 40, transform: "translateX(-50%)", borderRadius: "50%", background: "rgba(56,189,248,0.25)", filter: "blur(6px)" }} />
                    {/* Dot with count */}
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 34, height: 34, borderRadius: "50%",
                      background: "rgba(15,23,42,0.9)",
                      border: "2px solid rgba(100,160,255,0.6)",
                      color: "#93c5fd", fontSize: 13, fontWeight: 700,
                      boxShadow: "0 0 10px rgba(56,189,248,0.4), 0 4px 12px rgba(0,0,0,0.5)",
                      position: "relative", zIndex: 1,
                    }}>
                      {count}
                    </span>
                    {/* Needle */}
                    <span style={{
                      width: 0, height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "8px solid rgba(100,160,255,0.6)",
                    }} />
                  </button>
                </Marker>
              );
            }

            const pin = props as PinData;
            return (
              <Marker key={pin.id} longitude={lng} latitude={lat} anchor="bottom">
                <PinMarker pin={pin} onClick={handlePinClick} />
              </Marker>
            );
          })}
        </MapGL>
 
        {!hideControls && (
          <>
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
          </>
        )}
 
        {fogEnabled ? (
          <canvas
            ref={fogCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        ) : null}

        {/* Quest location markers — above the fog so players can see where to go */}
        <div className="pointer-events-none absolute inset-0">
          {locationQuests.map((q) => {
            const done = completedQuestIds.has(q.id);
            const borderColor = done ? "rgba(120,120,130,0.6)" : "rgba(251,191,36,0.75)";
            const glowColor = done ? "rgba(120,120,130,0.2)" : "rgba(251,191,36,0.35)";
            const tooltipBorder = done ? "1px solid rgba(120,120,130,0.4)" : "1px solid rgba(251,191,36,0.45)";
            const tooltipColor = done ? "#9ca3af" : "#fde68a";
            const needleColor = done ? "rgba(120,120,130,0.6)" : "rgba(251,191,36,0.75)";
            return (
              <div
                key={q.id}
                ref={(el) => { questMarkerRefs.current[q.id] = el; }}
                className="group pointer-events-auto"
                style={{
                  position: "absolute",
                  visibility: "hidden",
                  transform: "translate(-50%, -100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "default",
                  opacity: done ? 0.55 : 1,
                }}
              >
                {/* Pin body — tooltip anchors to this */}
                <div style={{ position: "relative" }}>
                  {/* Tooltip */}
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{
                      background: "rgba(15,23,42,0.92)",
                      border: tooltipBorder,
                      color: tooltipColor,
                    }}
                  >
                    {q.location!.name ?? q.title}
                  </div>
                  {/* Circle */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "rgba(15,23,42,0.88)",
                      border: `2px solid ${borderColor}`,
                      boxShadow: `0 0 10px ${glowColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    {q.icon}
                  </div>
                </div>
                {/* Needle */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `8px solid ${needleColor}`,
                  }}
                />
              </div>
            );
          })}
        </div>
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
 