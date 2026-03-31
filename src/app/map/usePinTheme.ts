"use client";
 
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { PinTheme } from "~/app/pins/types";
 
/**
 * Returns the correct pin theme based on the current color scheme.
 * - Light mode → green
 * - Dark mode  → blue
 *
 * Uses a mounted check to avoid SSR hydration mismatch.
 */
export function usePinTheme(): PinTheme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
 
  useEffect(() => setMounted(true), []);
 
  if (!mounted) return "blue"; // safe default before hydration
  return resolvedTheme === "dark" ? "blue" : "green";
}
