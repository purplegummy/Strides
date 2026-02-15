import type { CityConfig } from "~/server/config/cities";

const METERS_PER_DEG_LAT = 111_000;

/** Approximate meters per degree longitude at given latitude */
function metersPerDegLng(latDeg: number): number {
  const latRad = (latDeg * Math.PI) / 180;
  return METERS_PER_DEG_LAT * Math.cos(latRad);
}

/** Get cell size in degrees for a city's grid */
function getCellSizeDeg(city: CityConfig): { lat: number; lng: number } {
  const centerLat = (city.bounds.minLat + city.bounds.maxLat) / 2;
  const cellSizeLatDeg = city.gridResolutionM / METERS_PER_DEG_LAT;
  const cellSizeLngDeg = city.gridResolutionM / metersPerDegLng(centerLat);
  return { lat: cellSizeLatDeg, lng: cellSizeLngDeg };
}

/** Convert lat/lng to tile key for a given city's grid */
export function pointToTileKey(
  lat: number,
  lng: number,
  city: CityConfig
): string {
  const { lat: cellLat, lng: cellLng } = getCellSizeDeg(city);
  const cellY = Math.floor(lat / cellLat);
  const cellX = Math.floor(lng / cellLng);
  return `${cellY}_${cellX}`;
}

/** Get all tile keys within radius of a point. Uses 3x3 neighborhood for 25m radius at 100m cells. */
export function getTilesInRadius(
  lat: number,
  lng: number,
  radiusM: number,
  city: CityConfig
): Set<string> {
  const { lat: cellLat, lng: cellLng } = getCellSizeDeg(city);
  const centerY = Math.floor(lat / cellLat);
  const centerX = Math.floor(lng / cellLng);

  // At 100m cells, 25m radius hits 1-4 cells. Use 3x3 neighborhood for alignment with map reveal.
  const keys = new Set<string>();
  const radiusCells = Math.ceil(radiusM / city.gridResolutionM) || 1;
  for (let dy = -radiusCells; dy <= radiusCells; dy++) {
    for (let dx = -radiusCells; dx <= radiusCells; dx++) {
      keys.add(`${centerY + dy}_${centerX + dx}`);
    }
  }
  return keys;
}

/** Check if point is inside city bounds */
export function isPointInCity(
  lat: number,
  lng: number,
  city: CityConfig
): boolean {
  const { minLat, maxLat, minLng, maxLng } = city.bounds;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/** Check if a tile (by key) has its center within city bounds */
export function isTileInCity(
  tileKey: string,
  city: CityConfig
): boolean {
  const parts = tileKey.split("_").map(Number);
  const cellY = parts[0];
  const cellX = parts[1];
  if (
    cellY === undefined ||
    cellX === undefined ||
    Number.isNaN(cellY) ||
    Number.isNaN(cellX)
  )
    return false;
  const { lat: cellLat, lng: cellLng } = getCellSizeDeg(city);
  const centerLat = (cellY + 0.5) * cellLat;
  const centerLng = (cellX + 0.5) * cellLng;
  return isPointInCity(centerLat, centerLng, city);
}

const totalTilesCache = new Map<string, number>();

/** Precompute total tiles for a city. Cached per city. */
export function getTotalTilesForCity(city: CityConfig): number {
  const cached = totalTilesCache.get(city.id);
  if (cached !== undefined) return cached;

  const { lat: cellLat, lng: cellLng } = getCellSizeDeg(city);
  const { minLat, maxLat, minLng, maxLng } = city.bounds;

  let count = 0;
  for (let lat = minLat; lat < maxLat; lat += cellLat) {
    for (let lng = minLng; lng < maxLng; lng += cellLng) {
      count++;
    }
  }

  totalTilesCache.set(city.id, count);
  return count;
}

/** Compute streak: consecutive days with at least one point, counting backward from most recent. */
export function computeStreakDays(
  points: { createdAt: Date }[]
): number {
  if (points.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const uniqueDates = [
    ...new Set(
      points.map((p) => {
        const d = new Date(p.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    ),
  ].sort((a, b) => b - a);

  if (uniqueDates.length === 0) return 0;

  const mostRecent = uniqueDates[0]!;

  // Streak requires activity today or yesterday (still "active")
  if (mostRecent < todayTime - dayMs) return 0;

  let streak = 0;
  let expected = mostRecent;

  for (const t of uniqueDates) {
    if (t === expected) {
      streak++;
      expected -= dayMs;
    } else if (t < expected) {
      break;
    }
  }

  return streak;
}
