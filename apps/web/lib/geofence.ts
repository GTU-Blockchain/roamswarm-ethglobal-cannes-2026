export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  image?: string;
}

export const GEOFENCE_RADIUS_METERS = 50;

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function watchGeofence(pois: POI[], onTrigger: (poiId: string) => void): () => void {
  const watchId = navigator.geolocation.watchPosition((pos) => {
    for (const poi of pois) {
      const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, poi.lat, poi.lng);
      if (dist < GEOFENCE_RADIUS_METERS) {
        onTrigger(poi.id);
      }
    }
  });
  return () => navigator.geolocation.clearWatch(watchId);
}
