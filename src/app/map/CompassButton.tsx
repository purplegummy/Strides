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
        "absolute right-3.5 top-[calc(env(safe-area-inset-top)+120px)] z-30",
        "grid h-14 w-14 place-items-center rounded-2xl",
        "border border-white/10 bg-[#0b1020]/75 text-white backdrop-blur",
        "shadow-[0_12px_40px_rgba(0,0,0,0.55)] transition",
        "hover:bg-[#0b1020]/90",
        "active:scale-[0.98]",
        !isOrientedNorth && "ring-1 ring-red-400/60",
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
          viewBox="0 0 24 24"
          fill="none"
          className="drop-shadow-[0_12px_26px_rgba(0,0,0,0.7)]"
        >
          {/* Palette */}
          {/* silver */} {/* #cbd5e1 */}
          {/* dark */} {/* #374151 */}
          {/* light */} {/* #9ca3af */}
          {/* red */} {/* #ef4444 */}

          {/* Outer ring */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#cbd5e1"
            strokeWidth="1.7"
            opacity="0.95"
          />

          {/* Inner ring */}
          <circle cx="12" cy="12" r="7.7" stroke="#374151" strokeWidth="1.2" opacity="0.9" />

          {/* Ticks (major = red, minor = light gray) */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = i * 15;
            const isMajor = angle % 90 === 0;
            return (
              <line
                key={angle}
                x1="12"
                y1={isMajor ? "2.9" : "3.3"}
                x2="12"
                y2={isMajor ? "5.1" : "4.5"}
                stroke={isMajor ? "#ef4444" : "#9ca3af"}
                strokeWidth={isMajor ? "1.6" : "1.2"}
                strokeLinecap="round"
                opacity={isMajor ? "0.95" : "0.85"}
                transform={`rotate(${angle} 12 12)`}
              />
            );
          })}

          {/* Needle */}
          <path d="M12 5.2l2.2 6.1L12 10.4l-2.2.9L12 5.2Z" fill="#ef4444" />
          <path
            d="M12 18.8l-2.2-6.1L12 13.6l2.2-.9L12 18.8Z"
            fill="#9ca3af"
            opacity="0.55"
          />

          {/* Center pivot */}
          <circle cx="12" cy="12" r="1.25" fill="#374151" opacity="0.95" />

          {/* N label */}
          <path
            d="M10.9 7.25V4.95h.8l1.6 1.55V4.95h.8v2.3h-.78l-1.62-1.56v1.56h-.8Z"
            fill="#374151"
            opacity="0.95"
          />
        </svg>
      </div>
    </button>
  );
}

