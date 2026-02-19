/** A single GPS sample used for tracking explored territory and user position. */
export type ExploredPoint = {
  lat: number;
  lng: number;
  /** GPS accuracy in meters. `null` when the server stores it as nullable. */
  accuracyM?: number | null;
  createdAt?: Date;
};

/**
 * Returns the great-circle distance in **meters** between two lat/lng points
 * using the Haversine formula. Used for deciding whether a new GPS sample is
 * far enough from the last one to be worth recording.
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

/**
 * Returns how many real-world meters a single CSS pixel represents at a given
 * Mapbox zoom level and latitude. Used by the fog layer to convert the reveal
 * radius from meters into pixel units for canvas drawing.
 */
export function metersPerPixelAtLat(zoom: number, lat: number) {
  const earthCircumference = 40075016.68557849;
  const latRad = (lat * Math.PI) / 180;
  return (Math.cos(latRad) * earthCircumference) / (512 * Math.pow(2, zoom));
}
