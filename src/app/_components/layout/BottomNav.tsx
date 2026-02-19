"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function NavIcon({
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

export function BottomNav() {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/map",
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
      href: "/profile",
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
        "border-t border-white/10 bg-[#0b1020]/80 backdrop-blur",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      ].join(" ")}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-4 pt-2">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex w-20 flex-col items-center gap-1 rounded-2xl px-2 py-1.5",
                "transition",
                active ? "text-white" : "text-white/70 hover:text-white",
              ].join(" ")}
            >
              <NavIcon active={active}>{item.icon}</NavIcon>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
