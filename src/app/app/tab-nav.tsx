"use client";

import type React from "react";

export type AppTab = "map" | "profile";

type TabItem = {
  id: AppTab;
  label: string;
  icon: React.ReactNode;
};

function TabIcon({
  children,
  active,
}: {
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <span
      className={[
        "grid h-8 w-8 place-items-center rounded-xl transition",
        active ? "bg-white/10 text-white" : "text-white/70",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function AppTabNav({
  tab,
  onChange,
}: {
  tab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  const items: TabItem[] = [
    {
      id: "map",
      label: "Map",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 21 4 18V5l6 3 8-4 2 1v13l-2-1-8 4Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 8v13M18 4v13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 21a8 8 0 1 0-16 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className={[
        "fixed inset-x-0 bottom-0 z-50",
        "border-t border-[rgba(120,200,255,0.12)] bg-[rgba(6,8,18,0.88)] backdrop-blur-[18px] saturate-[1.4]",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      ].join(" ")}
      aria-label="App tabs"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-4 pt-1.5">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={[
                "flex w-20 flex-col items-center gap-0.5 rounded-2xl px-2 py-1",
                "transition",
                active ? "text-white" : "text-white/70 hover:text-white",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <TabIcon active={active}>{item.icon}</TabIcon>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

