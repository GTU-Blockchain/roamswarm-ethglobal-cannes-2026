'use client';

// TODO: City completion badge card (generate via 21st.dev Magic MCP)
// /ui Design a city badge collectible card — badge artwork, city name,
//     completion date, POI count. Subtle holographic shimmer effect.
// Props: badge (CityBadge)

export interface CityBadge {
  cityId: string;
  cityName: string;
  completedAt: string;
  poiCount: number;
  imageUri: string;
  tokenId?: number;
}

export function BadgeCard({ badge }: { badge: CityBadge }) {
  return <></>;
}
