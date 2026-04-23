"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, ScrollText, BarChart2, Settings, X, Menu } from "lucide-react";

export type NavTab = "map" | "leaderboard" | "quests" | "stats" | "settings";

interface NavNode {
  id: NavTab;
  label: string;
  icon: React.ElementType;
}

const NAV_NODES: NavNode[] = [
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "quests", label: "Quests", icon: ScrollText },
  { id: "stats", label: "Stats", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

// All nodes expand upward from the center button
const BOX_POSITIONS = [
  { x: -75, y: -150 }, // upper-left
  { x: 75, y: -150 },  // upper-right
  { x: -75, y: -75 },  // lower-left
  { x: 75, y: -75 },   // lower-right
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
    return BOX_POSITIONS[index] ?? { x: 0, y: 0 };
  };

  return (
    <>
      {/* Blur backdrop — sits below the nav nodes but above the map */}
      <div
        className="pointer-events-auto fixed inset-0 z-40 transition-all duration-300"
        style={{
          backdropFilter: expanded ? "blur(6px)" : "blur(0px)",
          WebkitBackdropFilter: expanded ? "blur(6px)" : "blur(0px)",
          background: expanded ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)",
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
          transitionProperty: "opacity, backdrop-filter, -webkit-backdrop-filter",
        }}
        onClick={() => setExpanded(false)}
      />

    <div
      ref={containerRef}
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      style={{ width: 260, height: 260, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 0 }}
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
            <button
              type="button"
              onClick={() => handleNodeClick(node.id)}
              className={[
                "relative grid h-14 w-14 place-items-center rounded-2xl backdrop-blur transition-all duration-200",
                "shadow-[0_12px_40px_rgba(0,0,0,0.55)] active:scale-[0.98]",
                isActive
                  ? "border border-[#38bdf8]/50 bg-[#1d6fb0]/80"
                  : "border border-[#656A73]/40 bg-[#0F172A]/60 hover:bg-[#0F172A]/75",
              ].join(" ")}
            >
              <Icon
                size={20}
                className={isActive ? "text-[#E6EDF7]" : "text-[#BFC8D9]"}
              />
            </button>

            {/* Label — above for bottom nodes, below for top nodes */}
            <div
              className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap text-center text-[10px] font-semibold tracking-wider"
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
        className="pointer-events-auto relative z-20 flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300"
        style={{
          background: "#0F172A",
          boxShadow: expanded
            ? "0 0 0 2px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.5)"
            : "inset 0 3px 10px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.04), 0 4px 12px rgba(0,0,0,0.4)",
          transform: `scale(${mounted ? 1 : 0}) rotate(${expanded ? 45 : 0}deg)`,
        }}
        aria-label={expanded ? "Close navigation" : "Open navigation"}
      >
        {expanded ? (
          <X size={14} className="text-[#E6EDF7]/80" />
        ) : (
          <Menu size={14} className="text-[#E6EDF7]/80" />
        )}
      </button>
    </div>
    </>
  );
}
