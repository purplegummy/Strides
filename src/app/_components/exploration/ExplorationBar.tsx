"use client";

import { useEffect, useRef, useState } from "react";
import LevelBadge from "~/components/LevelBadge";
import "./exploration-bar.css";

interface ExplorationBarProps {
  percentage: number;
  tilesDiscovered: number;
  totalTiles: number;
  streakDays?: number;
  level?: number;
  onPress?: () => void;
}

function octagonPoints(cx: number, cy: number, r: number, rotateDeg = -90) {
  const pts: string[] = [];
  const rot = (rotateDeg * Math.PI) / 180;
  for (let i = 0; i < 8; i++) {
    const a = rot + i * (Math.PI / 4);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function ExplorationBar({
  percentage,
  tilesDiscovered,
  totalTiles,
  streakDays = 0,
  level = 1,
  onPress,
}: ExplorationBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const [showBar, setShowBar] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(500);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale = Math.min(1, (windowWidth - 16) / 500);
  const badgeSize = Math.round(160 * scale);

  const clamped = Math.max(0, Math.min(100, percentage));
  const ringR = 106;
  const C = 2 * Math.PI * ringR;
  const dash = (clamped / 100) * C;

  useEffect(() => {
    const t = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${clamped}%`;
    }, 780);
    return () => clearTimeout(t);
  }, [clamped]);

  useEffect(() => {
    if (ringRef.current) {
      ringRef.current.setAttribute("stroke-dasharray", `${dash} ${C - dash}`);
      ringRef.current.setAttribute("stroke-dashoffset", String(C * 0.25));
    }
  }, [dash, C]);

  return (
  <div style={{ ...styles.scene, height: badgeSize }}>
    {/* Glass pill — slides out from behind badge */}
    {showBar && (
      <div
        style={{
          ...styles.glassPill,
          left: Math.round(76 * scale),
          animation: isClosing
            ? "hudPullIn 0.35s ease forwards"
            : "hudPullOut 0.38s cubic-bezier(0.34,1.15,0.64,1) both",
        }}
        onAnimationEnd={() => {
          if (isClosing) {
            setShowBar(false);
            setIsClosing(false);
          }
        }}
      >
        <div
          style={{
            ...styles.pillContent,
            paddingLeft: Math.round(84 * scale) + 12,
            paddingTop: Math.round(10 * scale),
            paddingBottom: Math.round(10 * scale),
            paddingRight: Math.round(14 * scale),
            gap: Math.round(6 * scale),
            animation: isClosing
              ? "hudFadeDown 0.18s ease forwards"
              : "hudFadeUp 0.22s ease 0.18s both",
          }}
        >
          <div style={styles.cardTop}>
            <span style={{ ...styles.expTitle, fontSize: Math.round(13 * scale) }}>Exploration Progress</span>
            <div style={styles.topRight}>
              {streakDays > 0 && (
                <div style={{ ...styles.streakBadge, fontSize: Math.round(11 * scale) }}>🔥 {streakDays}</div>
              )}
            </div>
          </div>

          <div style={styles.progressSection}>
            <div style={{ ...styles.progressTrack, height: Math.round(34 * scale) }}>
              <div ref={fillRef} style={styles.progressFill}>
                <div style={styles.glowEdge} />
              </div>
              <div style={{ ...styles.pctLabel, fontSize: Math.round(16 * scale) }}>{clamped.toFixed(1)}%</div>
            </div>
          </div>

          <div style={styles.bottomRow}>
            <span style={{ ...styles.tilesText, fontSize: Math.round(12 * scale) }}>
              <strong style={styles.tilesStrong}>
                {tilesDiscovered.toLocaleString()}
              </strong>{" "}
              / {totalTiles.toLocaleString()} Tiles
            </span>
            <button type="button" onClick={onPress} style={{ ...styles.lvlPill, padding: `${Math.round(5 * scale)}px ${Math.round(10 * scale)}px` }}>
              <span style={{ ...styles.lvlTxt, fontSize: Math.round(12 * scale) }}>LVL {level}</span>
              <span style={{ ...styles.lvlArrow, fontSize: Math.round(13 * scale) }}>›</span>
            </button>
          </div>
        </div>
     </div>
)}
      {/* Badge sits on top */}
<div
  style={{ ...styles.badgeWrap, cursor: "pointer" }}
  onClick={() => {
    if (showBar && !isClosing) {
      setIsClosing(true);
    } else if (!showBar) {
      setShowBar(true);
      setIsClosing(false);
    }
  }}
>
  <LevelBadge exploredPct={clamped} size={badgeSize} />
</div>

        <svg
          viewBox="0 0 300 300"
          width={badgeSize}
          height={badgeSize}
          shapeRendering="geometricPrecision"
        >
          <defs>
            <linearGradient id="hud-st" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D7E3F4" />
              <stop offset="100%" stopColor="#7D848E" />
            </linearGradient>
            <linearGradient id="hud-ib" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#004CFF" />
            </linearGradient>
            <linearGradient id="hud-lp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="65%" stopColor="#748CAC" />
              <stop offset="100%" stopColor="#2F3946" />
            </linearGradient>
            <radialGradient id="hud-sh" cx="40%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </radialGradient>
            <filter id="hud-bs">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.32" />
            </filter>
            <filter id="hud-ts">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          <g filter="url(#hud-bs)">
            <polygon points={octagonPoints(150, 150, 138)} fill="url(#hud-st)" />
            <polygon points={octagonPoints(150, 150, 138)} fill="none" stroke="#FFF" strokeOpacity="0.38" strokeWidth="5" />
            <polygon points={octagonPoints(150, 150, 128)} fill="url(#hud-lp)" opacity={0.95} />
            <circle cx={150} cy={150} r={96} fill="url(#hud-ib)" />
            <circle cx={150} cy={150} r={96} fill="url(#hud-sh)" />
            <circle cx={150} cy={150} r={106} fill="none" stroke="#0B1633" strokeOpacity="0.28" strokeWidth={14} />
            <circle
              ref={ringRef}
              cx={150} cy={150} r={106}
              fill="none"
              stroke="#1CE9FD"
              strokeWidth={14}
              strokeLinecap="round"
              opacity={0.95}
            />
            <circle cx={150} cy={150} r={90} fill="none" stroke="#FFF" strokeOpacity="0.07" strokeWidth={2} />
          </g>

          <g fontFamily="'Syne', sans-serif" textAnchor="middle" fill="#E6EDF7">
            <text x={150} y={140} fontSize={40} fontWeight={800} fontStyle="italic" filter="url(#hud-ts)">
              {clamped.toFixed(1)}%
            </text>
            <line x1={66} x2={234} y1={163} y2={163} stroke="#E6EDF7" strokeOpacity="0.33" strokeWidth={7} strokeLinecap="round" />
            <text x={150} y={200} fontSize={20} fontWeight={800} fontStyle="italic" letterSpacing={2} filter="url(#hud-ts)">
              EXPLORED
            </text>
          </g>
        </svg>
      </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  scene: {
    position: "relative",
    width: "min(500px, calc(100vw - 16px))",
    height: 160,
    display: "flex",
    alignItems: "center",
  },
  badgeWrap: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 50,
    cursor: "pointer",
    filter: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  glassPill: {
    position: "absolute",
    left: 76,
    top: "50%",
    transform: "translateY(-50%)",
    right: 0,
    background: "linear-gradient(160deg, rgba(12,24,68,0.88) 0%, rgba(5,12,40,0.95) 100%)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(80,150,255,0.22)",
    borderRadius: 18,
    boxShadow: "0 8px 36px rgba(0,25,90,0.55), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.22)",
  },
  pillContent: {
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expTitle: {
    fontSize: 13,
    fontWeight: 800,
    fontStyle: "italic",
    color: "#bcd6ff",
    letterSpacing: "0.02em",
    fontFamily: "'Syne', sans-serif",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  streakBadge: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    background: "rgba(255,140,30,0.14)",
    border: "1px solid rgba(255,140,30,0.28)",
    borderRadius: 20,
    padding: "3px 9px",
    fontSize: 12,
    fontWeight: 700,
    fontStyle: "italic",
    color: "#ffb347",
    fontFamily: "'Space Mono', monospace",
  },

  progressSection: {
    display: "flex",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: 36,
    background: "rgba(5,14,48,0.9)",
    borderRadius: 99,
    border: "1px solid rgba(40,110,255,0.2)",
    overflow: "hidden",
    position: "relative",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.55)",
  },
  progressFill: {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, #0830b0 0%, #1248d8 25%, #1a70ff 55%, #30b0ff 82%, #58e0ff 100%)",
    borderRadius: 99,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 22px rgba(25,120,255,0.7), inset 0 1px 0 rgba(255,255,255,0.2)",
    transition: "width 1s cubic-bezier(0.34,1.1,0.64,1)",
  },
  glowEdge: {
    position: "absolute",
    right: -1,
    top: -5,
    bottom: -5,
    width: 22,
    background: "radial-gradient(ellipse at right, rgba(140,240,255,0.95), transparent 70%)",
    animation: "hudGlowPulse 1.6s ease-in-out infinite",
  },
  pctLabel: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
    fontStyle: "italic",
    color: "#fff",
    textShadow: "0 0 16px rgba(80,200,255,0.95), 0 1px 4px rgba(0,0,0,0.8)",
    zIndex: 2,
    pointerEvents: "none",
    fontFamily: "'Syne', sans-serif",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tilesText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: 700,
    color: "rgba(170,210,255,0.7)",
  },
  tilesStrong: {
    color: "#c0dcff",
    fontWeight: 700,
  },
  lvlPill: {
    all: "unset",
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: "linear-gradient(135deg, #091a88 0%, #1030c0 20%, #1848e0 45%, #2268ff 70%, #3898ff 90%, #50c0ff 100%)",
    border: "1.5px solid rgba(100,170,255,0.45)",
    borderRadius: 99,
    padding: "6px 12px 6px 14px",
    cursor: "pointer",
    boxShadow: "0 0 0 1px rgba(50,160,255,0.18), 0 4px 20px rgba(18,72,224,0.65), 0 0 32px rgba(34,104,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,20,0.25)",
  },
  lvlTxt: {
    fontSize: 13,
    fontWeight: 800,
    fontStyle: "italic",
    color: "#e4f2ff",
    letterSpacing: "0.05em",
    fontFamily: "'Syne', sans-serif",
  },
  lvlArrow: {
    color: "#a0d4ff",
    fontSize: 15,
    fontWeight: 700,
  },
};