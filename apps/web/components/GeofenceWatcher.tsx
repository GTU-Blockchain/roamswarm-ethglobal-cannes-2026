'use client';

// TODO: Geofence side-effect watcher (renders nothing)
// - Uses navigator.geolocation.watchPosition
// - Calls onTrigger(poiId) when user enters 50m radius of a POI
// - Uses haversineDistance from lib/geofence.ts
// - Returns null (no UI)

import type { POI } from '@/lib/geofence';

export interface GeofenceWatcherProps {
  pois: POI[];
  onTrigger: (poiId: string) => void;
}

export function GeofenceWatcher({ pois, onTrigger }: GeofenceWatcherProps) {
  return null;
}
