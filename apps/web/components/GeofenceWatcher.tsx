'use client';

import { useEffect, useRef } from 'react';
import type { POI } from '@/lib/geofence';
import { watchGeofence } from '@/lib/geofence';

export interface GeofenceWatcherProps {
  pois: POI[];
  onEnter: (poiId: string) => void;
  onExit?: (poiId: string) => void;
}

export function GeofenceWatcher({ pois, onEnter, onExit }: GeofenceWatcherProps) {
  const onEnterRef = useRef(onEnter);
  const onExitRef = useRef(onExit);
  onEnterRef.current = onEnter;
  onExitRef.current = onExit;

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const stop = watchGeofence(
      pois,
      (poiId) => onEnterRef.current(poiId),
      (poiId) => onExitRef.current?.(poiId),
    );
    return stop;
  }, [pois]);

  return null;
}
