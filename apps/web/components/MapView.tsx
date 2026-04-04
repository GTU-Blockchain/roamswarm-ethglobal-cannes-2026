'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { POI } from '@/lib/geofence';
import { GeofenceWatcher } from './GeofenceWatcher';

export interface MapViewProps {
  pois: POI[];
  ownedPoiIds?: string[];
  onPoiTrigger?: (poiId: string) => void;
}

type PoiState = 'locked' | 'available' | 'owned';

const PIN_COLORS: Record<PoiState, string> = {
  locked: '#4b5563',
  available: '#F5A623',
  owned: '#7C3AED',
};

function getPoiState(poiId: string, ownedIds: string[], nearbyIds: string[]): PoiState {
  if (ownedIds.includes(poiId)) return 'owned';
  if (nearbyIds.includes(poiId)) return 'available';
  return 'locked';
}

function makePinSvg(color: string, pulse: boolean): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    ${pulse ? `<circle cx="18" cy="18" r="16" fill="${color}" opacity="0.25"><animate attributeName="r" values="12;20;12" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.3;0;0.3" dur="1.8s" repeatCount="indefinite"/></circle>` : ''}
    <circle cx="18" cy="18" r="12" fill="${color}" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
    <circle cx="18" cy="18" r="5" fill="white" opacity="0.95"/>
    <polygon points="18,44 11,28 25,28" fill="${color}"/>
  </svg>`;
}

export default function MapView({ pois, ownedPoiIds = [], onPoiTrigger }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [nearbyPoiIds, setNearbyPoiIds] = useState<string[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      // Fix missing icon paths in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      // Strict Mode / hot-reload guard — remove stale Leaflet instance on container
      const container = mapRef.current! as any;
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const map = L.map(container, {
        center: [43.5503, 7.0174],
        zoom: 15,
        zoomControl: false,
      });

      // Dark tile — Carto dark_all
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" style="color:rgba(255,255,255,0.3)">OSM</a> &copy; <a href="https://carto.com/" style="color:rgba(255,255,255,0.3)">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      pois.forEach((poi) => {
        const state = getPoiState(poi.id, ownedPoiIds, nearbyPoiIds);
        const icon = L.divIcon({
          html: makePinSvg(PIN_COLORS[state], state === 'available'),
          iconSize: [36, 44],
          iconAnchor: [18, 44],
          popupAnchor: [0, -46],
          className: '',
        });

        const contributeUrl = `/contribute?lat=${poi.lat}&lng=${poi.lng}&name=${encodeURIComponent(poi.name)}`;
        const popupContent = `
          <div style="background:#12121A;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:14px;min-width:170px;color:white;font-family:inherit;box-shadow:0 8px 32px rgba(0,0,0,0.6)">
            <p style="font-weight:700;font-size:13px;margin:0 0 3px">${poi.name}</p>
            <p style="font-size:11px;color:rgba(255,255,255,0.45);margin:0 0 12px">
              ${state === 'owned' ? '✅ Owned' : state === 'available' ? '⚡ In range — unlock now' : '🔒 Walk closer to unlock'}
            </p>
            ${state !== 'owned'
              ? `<button onclick="window.__roam_poi_trigger('${poi.id}')" style="width:100%;padding:9px;border-radius:9px;background:#F5A623;color:#0A0A0F;font-weight:700;font-size:12px;border:none;cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=0.85" onmouseout="this.style.opacity=1">
                  Unlock · 0.5 USDC
                </button>`
              : ''
            }
            <button onclick="window.location.href='${contributeUrl}'" style="width:100%;margin-top:8px;padding:8px;border-radius:9px;background:rgba(168,85,247,0.15);color:rgba(168,85,247,1);font-weight:600;font-size:11px;border:1px solid rgba(168,85,247,0.35);cursor:pointer;transition:opacity 0.15s" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">
              ✏️ Suggest edit / contribute
            </button>
          </div>`;

        const marker = L.marker([poi.lat, poi.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent, {
            className: 'roam-popup',
            closeButton: false,
            maxWidth: 220,
          });

        marker.on('click', () => {
          if (state !== 'owned') onPoiTrigger?.(poi.id);
        });

        markersRef.current[poi.id] = { marker, poi };
      });

      mapInstanceRef.current = map;
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render marker icons when state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      Object.values(markersRef.current).forEach(({ marker, poi }: any) => {
        const state = getPoiState(poi.id, ownedPoiIds, nearbyPoiIds);
        marker.setIcon(
          L.divIcon({
            html: makePinSvg(PIN_COLORS[state], state === 'available'),
            iconSize: [36, 44],
            iconAnchor: [18, 44],
            popupAnchor: [0, -46],
            className: '',
          })
        );
      });
    });
  }, [ownedPoiIds, nearbyPoiIds]);

  // Global handler for popup button clicks
  useEffect(() => {
    (window as any).__roam_poi_trigger = (poiId: string) => onPoiTrigger?.(poiId);
    return () => { delete (window as any).__roam_poi_trigger; };
  }, [onPoiTrigger]);

  function handleGeofenceTrigger(poiId: string) {
    setNearbyPoiIds((prev) => prev.includes(poiId) ? prev : [...prev, poiId]);
    onPoiTrigger?.(poiId);
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100dvh' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '100dvh' }} />
      <GeofenceWatcher pois={pois} onTrigger={handleGeofenceTrigger} />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] glass rounded-xl px-3 py-2 flex items-center gap-3 text-xs text-white/60">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4b5563]" />Locked</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-roam-gold" />In range</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-roam-accent" />Owned</span>
      </div>
    </div>
  );
}
