'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { POI } from '@/lib/geofence';

interface LocationPickerMapProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
  onPoiSelect?: (lat: string, lng: string, name: string) => void;
  pois?: POI[];
}

const DEFAULT_LAT = 43.5503;
const DEFAULT_LNG = 7.0174;

function makePoiPinSvg(selected = false): string {
  const fill = selected ? '#F5A623' : '#4b5563';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 24 30">
    <circle cx="12" cy="10" r="8" fill="${fill}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3" fill="white" opacity="0.8"/>
    <polygon points="12,30 7,20 17,20" fill="${fill}"/>
  </svg>`;
}

function makeContribPinSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
    <circle cx="16" cy="14" r="13" fill="#a855f7" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
    <circle cx="16" cy="14" r="5" fill="white" opacity="0.95"/>
    <polygon points="16,40 9,26 23,26" fill="#a855f7"/>
  </svg>`;
}

export default function LocationPickerMap({ lat, lng, onChange, onPoiSelect, pois = [] }: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const onPoiSelectRef = useRef(onPoiSelect);
  useEffect(() => { onChangeRef.current = onChange; onPoiSelectRef.current = onPoiSelect; });

  const parsedLat = parseFloat(lat) || DEFAULT_LAT;
  const parsedLng = parseFloat(lng) || DEFAULT_LNG;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const container = mapRef.current! as any;
      if (container._leaflet_id) container._leaflet_id = null;

      const map = L.map(container, {
        center: [parsedLat, parsedLng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      // Same dark tiles as main map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Render existing POIs as small clickable pins
      const poiMarkers: Record<string, any> = {};

      pois.forEach((poi) => {
        const icon = L.divIcon({
          html: makePoiPinSvg(false),
          iconSize: [24, 30],
          iconAnchor: [12, 30],
          className: '',
        });

        const poiMarker = L.marker([poi.lat, poi.lng], { icon, zIndexOffset: 0 }).addTo(map);

        poiMarker.on('click', (e: any) => {
          // Stop propagation so map click doesn't also fire
          e.originalEvent.stopPropagation();

          // Reset all POI pins to grey
          Object.entries(poiMarkers).forEach(([id, m]) => {
            m.setIcon(L.divIcon({
              html: makePoiPinSvg(false),
              iconSize: [24, 30],
              iconAnchor: [12, 30],
              className: '',
            }));
          });

          // Highlight selected POI pin
          poiMarker.setIcon(L.divIcon({
            html: makePoiPinSvg(true),
            iconSize: [24, 30],
            iconAnchor: [12, 30],
            className: '',
          }));

          // Move purple contrib pin to this POI
          const ll = poiMarker.getLatLng();
          markerRef.current?.setLatLng(ll);
          onChangeRef.current(ll.lat.toFixed(6), ll.lng.toFixed(6));
          onPoiSelectRef.current?.(ll.lat.toFixed(6), ll.lng.toFixed(6), poi.name);
        });

        poiMarkers[poi.id] = poiMarker;
      });

      // Contribution pin (purple, draggable)
      const contribIcon = L.divIcon({
        html: makeContribPinSvg(),
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        className: '',
      });

      const marker = L.marker([parsedLat, parsedLng], {
        icon: contribIcon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync purple pin when lat/lng props change (e.g. "Use my location")
  useEffect(() => {
    if (!markerRef.current || !mapInstanceRef.current) return;
    const newLat = parseFloat(lat);
    const newLng = parseFloat(lng);
    if (isNaN(newLat) || isNaN(newLng)) return;
    markerRef.current.setLatLng([newLat, newLng]);
    mapInstanceRef.current.setView([newLat, newLng], 15, { animate: true });
  }, [lat, lng]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      onChangeRef.current(
        pos.coords.latitude.toFixed(6),
        pos.coords.longitude.toFixed(6),
      );
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">
          Location <span className="text-purple-400">*</span>
        </label>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 min-h-[44px] px-2"
        >
          <MapPin className="w-3 h-3" />
          Use my location
        </button>
      </div>

      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ height: 220, border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Legend */}
        <div className="absolute bottom-2 left-2 pointer-events-none flex items-center gap-3 z-[1000]">
          <span className="flex items-center gap-1 text-[10px] text-white/50 bg-black/60 rounded-full px-2 py-0.5">
            <span className="w-2 h-2 rounded-full bg-[#4b5563] inline-block" />
            Existing POIs
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/50 bg-black/60 rounded-full px-2 py-0.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Your contribution
          </span>
        </div>

        <div className="absolute top-2 right-2 pointer-events-none z-[1000]">
          <span className="text-[10px] text-white/40 bg-black/50 rounded-full px-2 py-0.5">
            Tap map to place pin
          </span>
        </div>
      </div>
    </div>
  );
}
