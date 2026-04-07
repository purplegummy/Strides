export type CityConfig = {
  id: string;
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  /** Grid cell size in meters (~100 = finer, ~500 = coarser) */
  gridResolutionM: number;
};

export const CITIES: Record<string, CityConfig> = {
  emory: {
    id: "emory",
    name: "Emory Campus",
    bounds: {
      minLat: 33.7865,
      maxLat: 33.8005,
      minLng: -84.3310,
      maxLng: -84.3180,
    },
    gridResolutionM: 100,
  },
};

export function getCity(id: string): CityConfig | undefined {
  return CITIES[id];
}
