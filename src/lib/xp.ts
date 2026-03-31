const XP_PER_LEVEL = 100;

export function xpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number): { current: number; next: number } {
  return {
    current: xp % XP_PER_LEVEL,
    next: XP_PER_LEVEL,
  };
}
