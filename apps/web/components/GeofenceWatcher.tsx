'use client';

import { useEffect, useRef } from 'react';
import type { POI } from '@/lib/geofence';
import { watchGeofence } from '@/lib/geofence';

export interface GeofenceWatcherProps {
  pois: POI[];
  onTrigger: (poiId: string) => void;
}

export function GeofenceWatcher({ pois, onTrigger }: GeofenceWatcherProps) {
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const stop = watchGeofence(pois, (poiId) => onTriggerRef.current(poiId));
    return stop;
  }, [pois]);

  return null;
}
