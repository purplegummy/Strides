"use client";
 
import { getRarity, RARITY_CONFIG } from "./pin-rarity";
 
export type PinData = {
  id: string;
  title: string;
  description?: string | null;
  lat: number;
  lng: number;
  upvotes: number;
  myUpvotes: number; // 0, 1, or 2
  createdById: string;
  creatorName?: string | null;
  createdAt?: Date | string | null; // ← added
};
 
interface PinMarkerProps {
  pin: PinData;
  onClick: (pin: PinData) => void;
}
 
export function PinMarker({ pin, onClick }: PinMarkerProps) {
  const rarity = getRarity(pin.upvotes);
  const cfg = RARITY_CONFIG[rarity];
 
  return (
    <button
      type="button"
      onClick={() => onClick(pin)}
      aria-label={`Pin: ${pin.title}`}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Outer glow ring */}
      <span
        style={{
          position: "absolute",
          inset: "-6px",
          borderRadius: "50%",
          background: cfg.glow,
          filter: "blur(6px)",
          animation: rarity === "legendary" ? "pin-pulse 1.8s ease-in-out infinite" : undefined,
        }}
      />
 
      {/* Pin dot */}
      <span
        style={{
          display: "block",
          width: pinSize(rarity),
          height: pinSize(rarity),
          borderRadius: "50%",
          background: cfg.color,
          border: `2px solid rgba(255,255,255,0.25)`,
          boxShadow: `0 0 0 2px ${cfg.ring}55, 0 4px 12px ${cfg.glow}`,
          position: "relative",
          zIndex: 1,
          transition: "transform 0.15s",
        }}
        className="pin-dot"
      />
 
      {/* Needle */}
      <span
        style={{
          position: "absolute",
          bottom: "-7px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderTop: `7px solid ${cfg.color}`,
          zIndex: 0,
        }}
      />
 
      <style>{`
        .pin-dot:hover { transform: scale(1.2); }
        @keyframes pin-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </button>
  );
}
 
function pinSize(rarity: string): string {
  return { common: "20px", notable: "23px", popular: "26px", rare: "29px", legendary: "34px" }[rarity] ?? "20px";
}