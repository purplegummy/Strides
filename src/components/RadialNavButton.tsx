"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Map, ScrollText, BarChart2, Settings, X, Menu } from "lucide-react";

export type NavTab = "map" | "quests" | "stats" | "settings";

interface NavNode {
  id: NavTab;
  label: string;
  icon: React.ElementType;
  color: string;
}

const NAV_NODES: NavNode[] = [
  { id: "map", label: "Map", icon: Map, color: "from-blue-500 to-cyan-400" },
  {
    id: "quests",
    label: "Quests",
    icon: ScrollText,
    color: "from-amber-500 to-orange-400",
  },
  {
    id: "stats",
    label: "Stats",
    icon: BarChart2,
    color: "from-emerald-500 to-teal-400",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color: "from-purple-500 to-violet-400",
  },
];

interface RadialNavButtonProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function RadialNavButton({
  activeTab,
  onTabChange,
}: RadialNavButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Slow auto-rotation when expanded
  useEffect(() => {
    if (!expanded) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    const tick = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        setRotationAngle((prev) => (prev + delta * 0.02) % 360);
      }
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [expanded]);

  // Close on outside click
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (
        expanded &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false);
      }
    },
    [expanded],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [handleOutsideClick]);

  const handleNodeClick = (tab: NavTab) => {
    onTabChange(tab);
    setExpanded(false);
  };

  // Calculate node positions around the center
  const getNodePosition = (index: number) => {
    const total = NAV_NODES.length;
    const baseAngle = (index / total) * 360;
    const angle = (baseAngle + rotationAngle) % 360;
    const radius = 80;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    // Depth effect
    const depth = Math.sin(radian);
    const scale = 0.85 + 0.15 * ((1 + depth) / 2);
    const opacity = 0.6 + 0.4 * ((1 + depth) / 2);

    return { x, y, scale, opacity, zIndex: Math.round(10 + 10 * depth) };
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2"
      style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {/* Orbit ring - visible when expanded */}
      <div
        className="absolute rounded-full border border-white/10 transition-all duration-500"
        style={{
          width: expanded ? 180 : 0,
          height: expanded ? 180 : 0,
          opacity: expanded ? 1 : 0,
        }}
      />

      {/* Nav nodes */}
      {NAV_NODES.map((node, index) => {
        const pos = getNodePosition(index);
        const isActive = activeTab === node.id;
        const Icon = node.icon;

        return (
          <div
            key={node.id}
            className="pointer-events-auto absolute transition-all"
            style={{
              transform: expanded
                ? `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`
                : "translate(0px, 0px) scale(0)",
              opacity: expanded ? pos.opacity : 0,
              zIndex: pos.zIndex,
              transitionDuration: expanded ? "400ms" : "250ms",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              transitionDelay: expanded ? `${index * 40}ms` : "0ms",
            }}
          >
            {/* Glow ring for active */}
            {isActive && (
              <div className="absolute -inset-1 animate-pulse rounded-full bg-white/20" />
            )}

            <button
              type="button"
              onClick={() => handleNodeClick(node.id)}
              className="group relative flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 transition-all duration-200"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(11,16,32,0.85)",
                borderColor: isActive
                  ? "rgba(255,255,255,1)"
                  : "rgba(255,255,255,0.25)",
                boxShadow: isActive
                  ? "0 0 16px rgba(255,255,255,0.3)"
                  : "none",
              }}
            >
              <Icon
                size={18}
                className={isActive ? "text-black" : "text-white/80"}
              />
            </button>

            {/* Label */}
            <div
              className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-semibold tracking-wider transition-all duration-200"
              style={{
                color: isActive ? "white" : "rgba(255,255,255,0.55)",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}

      {/* Center button */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="pointer-events-auto relative z-20 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.9) 0%, rgba(59,130,246,0.9) 50%, rgba(20,184,166,0.9) 100%)",
          boxShadow: expanded
            ? "0 0 0 2px rgba(255,255,255,0.2), 0 0 32px rgba(139,92,246,0.5)"
            : "0 0 0 1px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.4)",
          transform: `scale(${mounted ? 1 : 0}) rotate(${expanded ? 45 : 0}deg)`,
        }}
        aria-label={expanded ? "Close navigation" : "Open navigation"}
      >
        {/* Ping rings */}
        {!expanded && (
          <>
            <span className="absolute h-full w-full animate-ping rounded-full bg-white/10" />
            <span
              className="absolute h-full w-full animate-ping rounded-full bg-white/5"
              style={{ animationDelay: "0.4s" }}
            />
          </>
        )}

        {/* Inner white dot */}
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300">
          {expanded ? (
            <X size={16} className="text-white" />
          ) : (
            <Menu size={16} className="text-white" />
          )}
        </div>
      </button>
    </div>
  );
}
