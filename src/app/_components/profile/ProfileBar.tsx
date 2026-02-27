"use client";
import { useEffect, useRef, useState } from "react";

type ProfileUser = {
  id: string;
  name?: string;
  imageUrl?: string;
};

type XpProgress = {
  current: number;
  next: number;
};

const SIZE = 74;
const TRACK_WIDTH = 7;
const GAP = 3;
const AVATAR_SIZE = SIZE - (TRACK_WIDTH + GAP) * 2;
const R = (SIZE - TRACK_WIDTH) / 2;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;

export function ProfileBar({
  user,
  level = 1,
  xpProgress,
  onPress,
}: {
  user: ProfileUser;
  level?: number;
  xpProgress: XpProgress;
  onPress?: () => void;
}) {
  const safeNext = Math.max(1, xpProgress.next);
  const clampedCurrent = Math.max(0, Math.min(xpProgress.current, safeNext));
  const pct = clampedCurrent / safeNext;
  const offset = C * (1 - pct);
  const initials = (user.name?.trim().charAt(0) ?? "P").toUpperCase();

  const prevRef = useRef(pct);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (pct > prevRef.current) {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 900);
      prevRef.current = pct;
      return () => clearTimeout(t);
    }
    prevRef.current = pct;
  }, [pct]);

  return (
    <button
      type="button"
      onClick={onPress}
      className="group relative transition active:scale-[0.97]"
      aria-label="Open profile"
      style={{ width: SIZE, height: SIZE }}
    >
      {/* Single relative container: avatar + progress ring */}
      <div className="relative h-full w-full">
        <svg
          width={SIZE}
          height={SIZE}
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <defs>
            <linearGradient id="xpArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="arcGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track: unfilled part of the ring — more visible */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke="rgba(120,180,255,0.55)"
            strokeWidth={TRACK_WIDTH}
          />

          {/* XP fill arc — with persistent glow, stronger on progress */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={R}
            fill="none"
            stroke="url(#xpArc)"
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-600 ease-out"
            filter={glow ? "url(#arcGlowStrong)" : "url(#arcGlow)"}
          />
        </svg>

        <div
          className="absolute inset-0 m-auto grid place-items-center overflow-hidden rounded-full bg-[#0b1020]"
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            boxShadow:
              "inset 0 3px 10px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <span className="text-xl font-bold text-white/80">{initials}</span>
          )}
        </div>

        {/* Level badge: small circle, bottom-right of avatar, overlapping edge */}
        <div
          className="absolute bottom-0 right-0 z-20 grid place-items-center rounded-full bg-[#1f2937] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          style={{
            width: 22,
            height: 22,
            transform: "translate(25%, 25%)",
            border: "2.5px solid #0b1020",
            fontSize: "11px",
            lineHeight: 1,
          }}
        >
          {level}
        </div>
      </div>

      <span className="sr-only">
        Level {level}. XP {clampedCurrent} of {safeNext}.
      </span>
    </button>
  );
}
