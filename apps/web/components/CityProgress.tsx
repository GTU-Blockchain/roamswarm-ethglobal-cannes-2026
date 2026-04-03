'use client';

// TODO: City completion progress ring (generate via 21st.dev Magic MCP)
// /ui Build a city completion progress ring: X/12 POIs with animated SVG fill.
//     City name and percentage shown in center.
// Props: unlocked (number), total (number), cityName (string)

export interface CityProgressProps {
  unlocked: number;
  total: number;
  cityName: string;
}

export function CityProgress({ unlocked, total, cityName }: CityProgressProps) {
  return <></>;
}
