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
  atlanta: {
    id: "atlanta",
    name: "Atlanta",
    bounds: {
      minLat: 33.65,
      maxLat: 33.89,
      minLng: -84.45,
      maxLng: -84.29,
    },
    gridResolutionM: 100,
  },
};

export function getCity(id: string): CityConfig | undefined {
  return CITIES[id];
}
