"use client";

import React, { useMemo } from "react";

type LevelBadgeProps = {
  /** 0–100 (map explored %) */
  exploredPct: number;
  /** px size of badge */
  size?: number;
  className?: string;
};

const clamp01to100 = (n: number) => Math.max(0, Math.min(100, n));

function octagonPoints(cx: number, cy: number, r: number, rotateDeg = -90) {
  const pts: string[] = [];
  const rot = (rotateDeg * Math.PI) / 180;
  for (let i = 0; i < 8; i++) {
    const a = rot + i * (Math.PI / 4);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function LevelBadge({
  exploredPct,
  size = 110,
  className,
}: LevelBadgeProps) {
  const pct = clamp01to100(exploredPct);
  const pctText = useMemo(() => pct.toFixed(pct < 10 ? 1 : 0), [pct]);

  // SVG layout
  const vb = 300;
  const cx = vb / 2;
  const cy = vb / 2;

  // Geometry
  const rOuter = 138; // outer octagon
  const rOuterInset = 128; // inner border octagon (depth lip)
  const circleFillR = 96; // blue inner circle radius
  const ringR = 106; // progress ring radius
  const ringW = 14; // ring width

  const outerPts = useMemo(() => octagonPoints(cx, cy, rOuter), []);
  const outerInsetPts = useMemo(() => octagonPoints(cx, cy, rOuterInset), []);

  // Circle progress math
  const C = 2 * Math.PI * ringR;
  const dash = (pct / 100) * C;
  const gap = Math.max(0, C - dash);

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={`${pctText}% explored`}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
      >
        <defs>
          {/* OUTER STEEL: light top → dark bottom (your spec) */}
          <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D7E3F4" />
            <stop offset="100%" stopColor="#7D848E" />
          </linearGradient>

          {/* INNER BLUE CIRCLE (your spec) */}
          <linearGradient id="innerBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#004CFF" />
          </linearGradient>

          {/* Dark “lip” between steel and circle (your spec) */}
          <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="65%" stopColor="#748CAC" />
            <stop offset="100%" stopColor="#2F3946" />
          </linearGradient>

          {/* Soft vignette/shine over the blue circle */}
          <radialGradient id="circleShine" cx="40%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </radialGradient>

          {/* Soft badge shadow */}
          <filter id="badgeShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="9"
              floodColor="#000000"
              floodOpacity="0.18"
            />
          </filter>

          {/* Text shadow (subtle) */}
          <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        <g filter="url(#badgeShadow)">
          {/* Outer steel shield */}
          <polygon points={outerPts} fill="url(#steel)" />

          {/* Outer highlight + low shadow for crisp steel */}
          <polygon
            points={outerPts}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth={6}
          />
          <polygon
            points={outerPts}
            fill="none"
            stroke="#000000"
            strokeOpacity="0.10"
            strokeWidth={6}
            transform={`translate(0,1)`}
          />

          {/* Inner lip (depth layer) */}
          <polygon points={outerInsetPts} fill="url(#lip)" opacity={0.95} />

          {/* INNER BLUE CIRCLE (this is the main fix) */}
          <circle cx={cx} cy={cy} r={circleFillR} fill="url(#innerBlue)" />
          <circle cx={cx} cy={cy} r={circleFillR} fill="url(#circleShine)" />

          {/* Ring base */}
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="#0B1633"
            strokeOpacity="0.28"
            strokeWidth={ringW}
          />

          {/* Ring progress */}
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="#1CE9FD"
            strokeWidth={ringW}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={C * 0.25} // start at top
            opacity={0.95}
          />

          {/* Subtle inner rim (polish) */}
          <circle
            cx={cx}
            cy={cy}
            r={ringR - ringW / 2 - 8}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.08"
            strokeWidth={2}
          />
        </g>

        {/* TEXT + DIVIDER LINE */}
        <g
          fontFamily={`"SF Pro Display","SF Compact Display","SF Compact","Inter","system-ui",sans-serif`}
          textAnchor="middle"
          fill="#E6EDF7"
        >
          {/* % NUMBER (smaller so it fits like your reference) */}
          <text
            x={cx}
            y={cy - 8}
            fontSize="44"
            fontWeight={800}
            filter="url(#textShadow)"
          >
            {pctText}%
          </text>

          {/* Divider line between % and EXPLORED */}
          <line
            x1={cx - 84}
            x2={cx + 84}
            y1={cy + 18}
            y2={cy + 18}
            stroke="#E6EDF7"
            strokeOpacity="0.35"
            strokeWidth={8}
            strokeLinecap="round"
          />

          {/* EXPLORED */}
          <text
            x={cx}
            y={cy + 58}
            fontSize="22"
            fontWeight={800}
            letterSpacing="1.5"
            filter="url(#textShadow)"
          >
            EXPLORED
          </text>
        </g>
      </svg>
    </div>
  );
}
