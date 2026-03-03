"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Map, ScrollText, BarChart2, Settings, X, Menu } from "lucide-react";

export type NavTab = "map" | "quests" | "stats" | "settings";

interface NavNode {
  id: NavTab;
  label: string;
  icon: React.ElementType;
}

const NAV_NODES: NavNode[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "quests", label: "Quests", icon: ScrollText },
  { id: "stats", label: "Stats", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

// Fan arc: spread 4 items from -150° to -30° (upward semicircle)
const ARC_ANGLES = [-150, -110, -70, -30];
const RADIUS = 90;

interface RadialNavButtonProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function RadialNavButton({
  activeTab,
  onTabChange,
}: RadialNavButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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

  const getNodePosition = (index: number) => {
    const angleDeg = ARC_ANGLES[index] ?? 0;
    const radian = (angleDeg * Math.PI) / 180;
    const x = RADIUS * Math.cos(radian);
    const y = RADIUS * Math.sin(radian);
    return { x, y };
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-2 left-1/2 z-50 -translate-x-1/2"
      style={{ width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
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
                ? `translate(${pos.x}px, ${pos.y}px) scale(1)`
                : "translate(0px, 0px) scale(0)",
              opacity: expanded ? 1 : 0,
              zIndex: 10,
              transitionDuration: expanded ? "350ms" : "200ms",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              transitionDelay: expanded ? `${index * 50}ms` : "0ms",
            }}
          >
            {/* Glow ring for active */}
            {isActive && (
              <div className="absolute -inset-1 animate-pulse rounded-full bg-white/20" />
            )}

            <button
              type="button"
              onClick={() => handleNodeClick(node.id)}
              className="relative flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 transition-all duration-200"
              style={{
                background: isActive
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(11,16,32,0.85)",
                borderColor: isActive
                  ? "rgba(255,255,255,1)"
                  : "rgba(255,255,255,0.25)",
                boxShadow: isActive
                  ? "0 0 16px rgba(255,255,255,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <Icon
                size={18}
                className={isActive ? "text-black" : "text-white/80"}
              />
            </button>

            {/* Label */}
            <div
              className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-semibold tracking-wider"
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
