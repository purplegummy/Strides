import React, { useMemo } from "react";

type LevelBadgeProps = {
  exploredPct: number;
  size?: number;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Minimal octagon badge:
 * - Outer steel plate (gradient stroke)
 * - Outer progress ring (cyan)
 * - Inner XP ring (deep blue)
 * - Inner plate with gradient fill
 * - Big % text + "EXPLORED" + small LV text
 */
export default function LevelBadge({
  exploredPct,
  size = 124,
  className,
}: LevelBadgeProps)
{
  const pct = clamp(exploredPct, 0, 100);

  // ViewBox is 500x500 to match your Figma scale, then scaled down with width/height.
  const vb = 500;
  const cx = vb / 2;
  const cy = vb / 2;

  // Octagon helper
  const octagonPoints = (r: number) => {
    const pts: Array<[number, number]> = [];
    // Start at top (-90deg), 8 sides => 45deg step
    for (let i = 0; i < 8; i++) {
      const a = ((-90 + i * 45) * Math.PI) / 180;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      pts.push([x, y]);
    }
    return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  };

  // Path for a regular octagon (for stroke-dasharray progress)
  const octagonPathD = (r: number) => {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 8; i++) {
      const a = ((-90 + i * 45) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const [x0, y0] = pts[0];
    let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} `;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    d += "Z";
    return d;
  };

  // Radii tuned to look like your Figma layers
  const rOuterSteel = 220; // outer plate outline
  const rOuterRing = 205; // cyan progress ring
  const rInnerRing = 188; // XP ring (deep blue)
  const rPlate = 168; // inner filled octagon

  const outerSteelPts = useMemo(() => octagonPoints(rOuterSteel), []);
  const platePts = useMemo(() => octagonPoints(rPlate), []);
  const outerRingPath = useMemo(() => octagonPathD(rOuterRing), []);
  const innerRingPts = useMemo(() => octagonPoints(rInnerRing), []);

  // Dash math for the progress ring:
  // We approximate path length by using SVG getTotalLength via a ref is possible,
  // but we can hardcode a pretty good approximation using geometry:
  // Perimeter ≈ 8 * sideLength; sideLength of regular octagon = r * sqrt(2 - sqrt(2)) * 2
  const approxOctagonPerimeter = (r: number) => {
    const side = 2 * r * Math.sin(Math.PI / 8);
    return 8 * side;
  };
  const pathLen = approxOctagonPerimeter(rOuterRing);
  const dashOffset = ((100 - pct) / 100) * pathLen;

  const fontStack =
    'ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif';

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      role="img"
      aria-label={`${pct.toFixed(1)}% explored`}    >
      <defs>
        {/* Inner plate gradient (your spec) */}
        <linearGradient id="plateGrad" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="25%" stopColor="#0F172A" />
          <stop offset="75%" stopColor="#004CFF" />
        </linearGradient>

        {/* Steel gradient (your spec) */}
        <linearGradient id="steelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BFC8D9" />
          <stop offset="100%" stopColor="#656A73" />
        </linearGradient>

        {/* Glow for progress ring */}
        <filter id="progressGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shadow like your "duplicate text" trick */}
        <filter id="textShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1.2"
            floodColor="#000"
            floodOpacity="0.55"
          />
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="2.2"
            floodColor="#000"
            floodOpacity="0.45"
          />
        </filter>

        {/* Very soft badge shadow (optional, helps it pop) */}
        <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor="#000"
            floodOpacity="0.18"
          />
        </filter>
      </defs>

      <g filter="url(#badgeShadow)">
        {/* Outer steel plate (stroke + slight inner stroke) */}
        <polygon
          points={outerSteelPts}
          fill="transparent"
          stroke="url(#steelGrad)"
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <polygon
          points={outerSteelPts}
          fill="transparent"
          stroke="url(#steelGrad)"
          strokeWidth="6"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* XP ring (deep blue) */}
        <polygon
          points={innerRingPts}
          fill="none"
          stroke="#092ACD"
          strokeWidth="12"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Progress ring background track (subtle steel) */}
        <path
          d={outerRingPath}
          fill="none"
          stroke="url(#steelGrad)"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Progress ring foreground (cyan) */}
        <path
          d={outerRingPath}
          fill="none"
          stroke="#22D3EE"
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={pathLen}
          strokeDashoffset={dashOffset}
          filter="url(#progressGlow)"
          style={{
            transition: "stroke-dashoffset 500ms ease",
          }}
        />

        {/* Inner plate */}
        <polygon
          points={platePts}
          fill="url(#plateGrad)"
          stroke="url(#steelGrad)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>

      {/* TEXT */}
      <g
        style={{ fontFamily: fontStack }}
        textAnchor="middle"
        dominantBaseline="middle"
        filter="url(#textShadow)"
      >
        {/* Big percent */}
        <text
          x={cx}
          y={cy - 22}
          fill="#E6EDF7"
          fontSize="85"
          fontWeight={800}
          letterSpacing="-1"
        >
          {pct.toFixed(1)}%
        </text>

        {/* EXPLORED */}
        <text
          x={cx}
          y={cy + 55}
          fill="#E6EDF7"
          fontSize="45"
          fontWeight={900}
          letterSpacing="2"
        >
          EXPLORED
        </text>
      </g>
    </svg>
  );
}
