'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UnlockModal } from '@/components/UnlockModal';
import poisData from '../../../../data/cannes-pois.json';
import type { POI } from '@/lib/geofence';

// No SSR — Leaflet uses window
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-roam-dark">
      <div className="flex flex-col items-center gap-3 text-white/40">
        <div className="w-8 h-8 border-2 border-roam-gold/40 border-t-roam-gold rounded-full animate-spin" />
        <span className="text-sm">Loading map…</span>
      </div>
    </div>
  ),
});

const pois = poisData as POI[];

const MOCK_POINTS = 120n;
const IS_DEV = process.env.NODE_ENV === 'development';

export default function MapPage() {
  const router = useRouter();
  const [activePoi, setActivePoi] = useState<POI | null>(null);
  const [ownedPoiIds, setOwnedPoiIds] = useState<string[]>([]);
  const [devPoiIndex, setDevPoiIndex] = useState(0);

  // Sayfa unmount olunca body overflow'u temizle
  useEffect(() => {
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  function handlePoiTrigger(poiId: string) {
    const poi = pois.find((p) => p.id === poiId);
    if (poi && !ownedPoiIds.includes(poiId)) setActivePoi(poi);
  }

  // Dev: simulate unlocking current POI — bypass payment, go straight to experience
  function devSimulateUnlock() {
    const poi = pois[devPoiIndex % pois.length];
    setDevPoiIndex((i) => i + 1);
    router.push(`/experience/${poi.id}?unlocked=1`);
  }

  function devMarkOwned(poiId: string) {
    setOwnedPoiIds((prev) => [...prev, poiId]);
    setActivePoi(null);
    setDevPoiIndex((i) => i + 1);
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh' }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center justify-between px-4 pt-safe-top py-3 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto glass rounded-xl p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="pointer-events-auto glass rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-white/50">Cannes</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-roam-gold font-semibold">{pois.length} POIs</span>
        </div>

        <Link
          href="/profile"
          className="pointer-events-auto glass rounded-xl px-3 py-2 min-h-[44px] flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          <span className="text-roam-gold font-bold">{MOCK_POINTS.toString()}</span>
          <span className="text-white/40">pts</span>
        </Link>
      </div>

      {/* Map — full screen */}
      <MapView
        pois={pois}
        ownedPoiIds={ownedPoiIds}
        onPoiTrigger={handlePoiTrigger}
      />

      {/* Dev mode — test butonu */}
      {IS_DEV && (
        <div className="absolute bottom-20 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={devSimulateUnlock}
            className="glass rounded-xl px-3 py-2 text-xs text-roam-gold font-semibold min-h-[44px] hover:bg-white/10 transition-colors"
          >
            🧪 Unlock POI {devPoiIndex + 1}/{pois.length}
          </button>
        </div>
      )}

      {/* Unlock Modal */}
      {activePoi && (
        <UnlockModal
          poi={activePoi}
          pointsBalance={MOCK_POINTS}
          onPayUSDC={() => {
            devMarkOwned(activePoi.id);
          }}
          onRedeemPoints={() => {
            devMarkOwned(activePoi.id);
          }}
          onClose={() => setActivePoi(null)}
        />
      )}
    </div>
  );
}
