"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExplorationBarProps {
  /** 0–100 */
  percentage: number;
  /** Total tiles the user has discovered */
  tilesDiscovered: number;
  /** Total tiles in the world grid */
  totalTiles: number;
  /** Optional: current streak in days */
  streakDays?: number;
  /** Optional: fires when the bar is tapped/clicked (e.g. open full stats) */
  onPress?: () => void;
}

// ─── Milestone definitions ────────────────────────────────────────────────────
const MILESTONES = [
  { pct: 5,   label: "Scout",      icon: "🌱" },
  { pct: 15,  label: "Wanderer",   icon: "🥾" },
  { pct: 30,  label: "Explorer",   icon: "🧭" },
  { pct: 50,  label: "Pathfinder", icon: "🗺️" },
  { pct: 75,  label: "Trailblazer",icon: "⚡" },
  { pct: 100, label: "Legend",     icon: "🏆" },
];

function getCurrentMilestone(pct: number) {
  const achieved = MILESTONES.filter((m) => pct >= m.pct);
  return achieved[achieved.length - 1] ?? { pct: 0, label: "Newcomer", icon: "👣" };
}

function getNextMilestone(pct: number) {
  return MILESTONES.find((m) => pct < m.pct) ?? null;
}

// ─── Sparkle particle (CSS-only, no canvas) ───────────────────────────────────
function Sparkle({ style }: { style: React.CSSProperties }) {
  return <span className="sparkle" style={style} aria-hidden />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExplorationBar({
  percentage,
  tilesDiscovered,
  totalTiles,
  streakDays = 0,
  onPress,
}: ExplorationBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const current = getCurrentMilestone(clamped);
  const next = getNextMilestone(clamped);
  const toNext = next ? next.pct - clamped : 0;

  // Animate fill on mount / change
  const [displayPct, setDisplayPct] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number }[]>([]);
  const sparkleId = useRef(0);
  const prevPct = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayPct(clamped), 120);
    return () => clearTimeout(timeout);
  }, [clamped]);

  // Emit sparkles when progress increases
  useEffect(() => {
    if (clamped > prevPct.current) {
      const newSparkles = Array.from({ length: 4 }, () => ({
        id: sparkleId.current++,
        x: clamped,
      }));
      setSparkles((s) => [...s, ...newSparkles]);
      const t = setTimeout(
        () => setSparkles((s) => s.filter((sp) => !newSparkles.find((ns) => ns.id === sp.id))),
        900
      );
      prevPct.current = clamped;
      return () => clearTimeout(t);
    }
    prevPct.current = clamped;
  }, [clamped]);

  return (
    <>
      {/* ── Inline styles (no Tailwind needed beyond utilities) ── */}
      <style>{css}</style>

      <button
        className="exp-bar-root"
        onClick={onPress}
        aria-label={`Exploration progress: ${clamped}%`}
        type="button"
      >
        {/* ── Top row ─────────────────────────────────────────── */}
        <div className="exp-top-row">
          <div className="exp-icon-badge">
            <span className="exp-milestone-icon">{current.icon}</span>
          </div>

          <div className="exp-info">
            <div className="exp-title-row">
              <span className="exp-rank">{current.label}</span>
              {streakDays > 0 && (
                <span className="exp-streak">
                  🔥 {streakDays}d streak
                </span>
              )}
            </div>
            <div className="exp-subtitle">
              {tilesDiscovered.toLocaleString()} /{" "}
              {totalTiles.toLocaleString()} tiles explored
            </div>
          </div>

          <div className="exp-pct-badge">
            <span className="exp-pct-number">{clamped}</span>
            <span className="exp-pct-symbol">%</span>
          </div>
        </div>

        {/* ── Progress track ───────────────────────────────────── */}
        <div className="exp-track-wrap" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
          <div className="exp-track">
            {/* Fog texture overlay on unfilled area */}
            <div className="exp-fog" />

            {/* Fill */}
            <div
              className="exp-fill"
              style={{ width: `${displayPct}%` }}
            >
              {/* Shimmer sweep */}
              <div className="exp-shimmer" />
              {/* Glow leading edge */}
              <div className="exp-edge-glow" />
            </div>

            {/* Milestone tick marks */}
            {MILESTONES.map((m) => (
              <div
                key={m.pct}
                className={`exp-tick ${clamped >= m.pct ? "exp-tick--reached" : ""}`}
                style={{ left: `${m.pct}%` }}
                title={m.label}
              >
                <span className="exp-tick-icon">{m.icon}</span>
              </div>
            ))}

            {/* Sparkles at leading edge */}
            {sparkles.map((sp) => (
              <Sparkle
                key={sp.id}
                style={{
                  left: `calc(${sp.x}% - ${Math.random() * 8 - 4}px)`,
                  animationDelay: `${Math.random() * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Bottom row ───────────────────────────────────────── */}
        <div className="exp-bottom-row">
          {next ? (
            <span className="exp-next-hint">
              <span className="exp-next-icon">{next.icon}</span>
              <span>
                <strong>{toNext.toFixed(1)}%</strong> to{" "}
                <strong>{next.label}</strong>
              </span>
            </span>
          ) : (
            <span className="exp-next-hint exp-next-hint--maxed">
              ✨ Map fully explored — Legend status achieved!
            </span>
          )}

          <span className="exp-tap-hint">tap for stats →</span>
        </div>
      </button>
    </>
  );
}

// ─── Demo wrapper (delete this and just export the component above) ───────────
export function ExplorationBarDemo() {
  const [pct, setPct] = useState(32);

  return (
    <div className="demo-root">
      <div className="demo-app-frame">
        {/* Fake map background */}
        <div className="demo-map" aria-hidden>
          <div className="demo-fog-layer" />
          <div className="demo-fog-layer demo-fog-layer--2" />
          <div className="demo-grid" />
        </div>

        {/* The actual bar, pinned to the bottom like in-app */}
        <div className="demo-bar-container">
          <ExplorationBar
            percentage={pct}
            tilesDiscovered={Math.round((pct / 100) * 4096)}
            totalTiles={4096}
            streakDays={7}
            onPress={() => alert("Open full stats screen")}
          />
        </div>

        {/* Demo scrubber — remove in production */}
        <div className="demo-controls">
          <label className="demo-label">
            Simulate exploration
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="demo-slider"
            />
          </label>
          <span className="demo-value">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

  /* ── Root button ── */
  .exp-bar-root {
    all: unset;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
    padding: 14px 16px 12px;
    background: rgba(6, 8, 18, 0.88);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    border-top: 1px solid rgba(120, 200, 255, 0.12);
    border-radius: 20px 20px 0 0;
    cursor: pointer;
    font-family: 'Syne', sans-serif;
    color: #e8f4ff;
    position: relative;
    overflow: hidden;
  }
  .exp-bar-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(80,170,255,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .exp-bar-root:active {
    background: rgba(6, 8, 18, 0.94);
  }

  /* ── Top row ── */
  .exp-top-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .exp-icon-badge {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(50,120,220,0.3), rgba(30,200,180,0.2));
    border: 1px solid rgba(80,170,255,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 12px rgba(60,150,255,0.2);
  }
  .exp-milestone-icon {
    font-size: 22px;
    line-height: 1;
  }

  .exp-info {
    flex: 1;
    min-width: 0;
  }
  .exp-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }
  .exp-rank {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.01em;
    color: #b8e0ff;
  }
  .exp-streak {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #ffb347;
    background: rgba(255,179,71,0.12);
    border: 1px solid rgba(255,179,71,0.25);
    border-radius: 20px;
    padding: 2px 7px;
  }
  .exp-subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: rgba(180,210,255,0.55);
    letter-spacing: 0.02em;
  }

  .exp-pct-badge {
    display: flex;
    align-items: baseline;
    gap: 1px;
    flex-shrink: 0;
  }
  .exp-pct-number {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 28px;
    line-height: 1;
    color: #6ee2ff;
    text-shadow: 0 0 16px rgba(80,210,255,0.5);
  }
  .exp-pct-symbol {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: rgba(110,226,255,0.6);
    margin-bottom: 3px;
  }

  /* ── Track ── */
  .exp-track-wrap {
    width: 100%;
  }
  .exp-track {
    position: relative;
    width: 100%;
    height: 10px;
    background: rgba(30,50,80,0.6);
    border-radius: 99px;
    overflow: visible;
    border: 1px solid rgba(80,140,200,0.15);
  }

  /* Fog — subtle noise over the unfilled area */
  .exp-fog {
    position: absolute;
    inset: 0;
    border-radius: 99px;
    background-image:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E");
    background-size: 200px 10px;
    pointer-events: none;
    opacity: 0.5;
  }

  /* Fill */
  .exp-fill {
    position: absolute;
    top: 0; left: 0; bottom: 0;
    background: linear-gradient(90deg,
      #1a6fb0 0%,
      #1e9be0 40%,
      #38d4ff 80%,
      #7eeeff 100%
    );
    border-radius: 99px;
    transition: width 0.9s cubic-bezier(0.34, 1.36, 0.64, 1);
    overflow: hidden;
    min-width: 2px;
  }

  /* Shimmer sweep */
  .exp-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 30%,
      rgba(255,255,255,0.25) 50%,
      transparent 70%
    );
    background-size: 200% 100%;
    animation: shimmer 2.4s ease-in-out infinite;
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Leading edge glow */
  .exp-edge-glow {
    position: absolute;
    right: 0; top: -4px; bottom: -4px;
    width: 16px;
    background: radial-gradient(ellipse at right, rgba(100,230,255,0.9), transparent 70%);
    border-radius: 99px;
    animation: pulse-glow 1.6s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.7; transform: scaleX(1); }
    50%       { opacity: 1;   transform: scaleX(1.4); }
  }

  /* Milestone ticks */
  .exp-tick {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: opacity 0.3s;
  }
  .exp-tick-icon {
    font-size: 11px;
    filter: grayscale(1) opacity(0.3);
    transform: translateY(-13px);
    transition: filter 0.4s, transform 0.4s;
    pointer-events: none;
    user-select: none;
  }
  .exp-tick--reached .exp-tick-icon {
    filter: grayscale(0) opacity(1) drop-shadow(0 0 4px rgba(110,226,255,0.8));
    transform: translateY(-14px) scale(1.15);
  }
  .exp-tick::after {
    content: '';
    display: block;
    width: 2px;
    height: 10px;
    background: rgba(255,255,255,0.15);
    border-radius: 1px;
    margin-top: -10px;
  }
  .exp-tick--reached::after {
    background: rgba(110,226,255,0.5);
    box-shadow: 0 0 6px rgba(110,226,255,0.6);
  }

  /* Sparkles */
  .sparkle {
    position: absolute;
    top: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #a0f0ff;
    pointer-events: none;
    animation: sparkle-pop 0.8s ease-out forwards;
    box-shadow: 0 0 6px #6ee2ff;
  }
  @keyframes sparkle-pop {
    0%   { transform: translateY(-50%) scale(0); opacity: 1; }
    50%  { transform: translateY(calc(-50% - 10px)) scale(1.5); opacity: 1; }
    100% { transform: translateY(calc(-50% - 18px)) scale(0); opacity: 0; }
  }

  /* ── Bottom row ── */
  .exp-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .exp-next-hint {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: rgba(180,210,255,0.6);
  }
  .exp-next-hint strong {
    color: #6ee2ff;
  }
  .exp-next-icon {
    font-size: 12px;
  }
  .exp-next-hint--maxed {
    color: #ffd700;
    text-shadow: 0 0 8px rgba(255,215,0,0.4);
  }
  .exp-tap-hint {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: rgba(120,180,255,0.35);
    letter-spacing: 0.04em;
  }
`;