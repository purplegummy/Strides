"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/mapbox";

type LngLat = { lng: number; lat: number };

export function CompassButton({
  mapRef,
  displayPosition,
  requestOnce,
  onCentered,
}: {
  mapRef: React.RefObject<MapRef | null>;
  displayPosition: LngLat | null;
  requestOnce: (callbacks: { onPosition?: (pt: LngLat) => void }) => void;
  onCentered?: () => void;
}) {
  const [bearing, setBearing] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const updateBearing = () => {
      rafRef.current = null;
      setBearing(map.getBearing());
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(updateBearing);
    };

    // Bearing only changes on rotate; using move causes unnecessary updates.
    map.on("rotate", schedule);
    // Initialize bearing once the map is available.
    schedule();

    return () => {
      map.off("rotate", schedule);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mapRef]);

  const isOrientedNorth = useMemo(() => Math.abs(bearing) < 0.5, [bearing]);

  const handleClick = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const go = (pt: LngLat) => {
      map.easeTo({
        center: [pt.lng, pt.lat],
        zoom: 17,
        bearing: 0,
        pitch: 0,
        duration: 650,
        essential: true,
      });
      onCentered?.();
    };

    if (displayPosition) {
      go(displayPosition);
      return;
    }

    requestOnce({
      onPosition: (pt) => {
        map.flyTo({ center: [pt.lng, pt.lat], zoom: 17, essential: true });
        onCentered?.();
      },
    });
  }, [displayPosition, mapRef, onCentered, requestOnce]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "absolute bottom-20 right-3 z-30",
        "grid h-14 w-14 place-items-center rounded-2xl",
        "border border-[#656A73]/40 bg-[#0F172A]/60 text-[#E6EDF7] backdrop-blur",
        "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
        "hover:bg-[#0F172A]/75",
        "active:scale-[0.98]",
        !isOrientedNorth && "ring-1 ring-[#22D3EE]/60",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Center on your location and orient north"
      title={`Center & orient north (bearing: ${Math.round(bearing)}°)`}
    >
      <div
        className="grid h-full w-full place-items-center"
        style={{
          transform: `rotate(${-bearing}deg)`,
          transition: "transform 0.35s cubic-bezier(0.2, 0, 0, 1)",
          willChange: "transform",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 512 512"
          fill="none"
          className="drop-shadow-[0_12px_26px_rgba(0,0,0,0.7)]"
        >
          <path
            d="M256,43.5C138.64,43.5,43.5,138.64,43.5,256c0,117.36,95.14,212.5,212.5,212.5S468.5,373.36,468.5,256 C468.5,138.64,373.36,43.5,256,43.5z M357.13,167.18l-58.16,127.2c-0.93,2.03-2.56,3.66-4.59,4.59l-127.2,58.16 c-7.83,3.58-15.89-4.49-12.32-12.32l58.16-127.2c0.93-2.03,2.56-3.66,4.59-4.59l127.2-58.16 C352.64,151.29,360.71,159.36,357.13,167.18z"
            fill="#BFC8D9"
          />
          <circle cx="256" cy="256" r="22" fill="#092ACD" />
        </svg>
      </div>
    </button>
  );
}

