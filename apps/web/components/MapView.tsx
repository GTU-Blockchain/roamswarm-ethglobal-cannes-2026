'use client';

// TODO: Leaflet map view (must be dynamically imported — no SSR)
// - Center: Cannes [43.5503, 7.0174], zoom 14
// - Dark tile layer (Carto dark_all)
// - POI markers with 3 states:
//     locked    → grey pin
//     available → gold pin (within 50m geofence)
//     owned     → colored/purple pin
// - Click marker → open UnlockModal
// - Embeds <GeofenceWatcher> for location triggers
// Props: pois (POI[])

import type { POI } from '@/lib/geofence';

export interface MapViewProps {
  pois: POI[];
}

export default function MapView({ pois }: MapViewProps) {
  return <></>;
}
