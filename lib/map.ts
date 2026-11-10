import { MAP_PROJECTION } from "@/lib/map-data";

/** Projects a latitude/longitude onto the story map's SVG viewBox. */
export function projectToMap(lat: number, lon: number): { x: number; y: number } {
  const { minLon, maxLat, cosLat, scale } = MAP_PROJECTION;
  return { x: (lon - minLon) * cosLat * scale, y: (maxLat - lat) * scale };
}

/** Minna, the state capital, shown on the map for orientation (Wikipedia). */
export const MINNA = { lat: 9.6139, lon: 6.5569 } as const;
