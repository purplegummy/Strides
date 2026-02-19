"use client";

import { useState, useEffect, useRef } from "react";
import "./exploration-bar.css";
import { MILESTONES, getCurrentMilestone, getNextMilestone } from "./exploration-milestones";

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

function Sparkle({ style }: { style: React.CSSProperties }) {
  return <span className="sparkle" style={style} aria-hidden />;
}

export default function ExplorationBar({
  percentage,
  tilesDiscovered,
  totalTiles,
  streakDays = 0,
  onPress,
}: ExplorationBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const displayPctFormatted = clamped.toFixed(2);
  const current = getCurrentMilestone(clamped);
  const next = getNextMilestone(clamped);
  const toNext = next ? next.pct - clamped : 0;

  const [displayPct, setDisplayPct] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number }[]>([]);
  const sparkleId = useRef(0);
  const prevPct = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDisplayPct(clamped), 120);
    return () => clearTimeout(timeout);
  }, [clamped]);

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
    <button
      className="exp-bar-root"
      onClick={onPress}
      aria-label={`Exploration progress: ${displayPctFormatted}%`}
      type="button"
    >
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
          <span className="exp-pct-number">{displayPctFormatted}</span>
          <span className="exp-pct-symbol">%</span>
        </div>
      </div>

      <div className="exp-track-wrap" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className="exp-track">
          <div className="exp-fog" />

          <div
            className="exp-fill"
            style={{ width: `${displayPct}%` }}
          >
            <div className="exp-shimmer" />
            <div className="exp-edge-glow" />
          </div>

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
  );
}
