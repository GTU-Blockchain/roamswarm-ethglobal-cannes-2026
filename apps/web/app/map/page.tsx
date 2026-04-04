'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { UnlockModal } from '@/components/UnlockModal';
import poisData from '@/data/cannes-pois.json';
import type { POI } from '@/lib/geofence';
import { useRoamBalance, useRedeemForUnlock } from '@/lib/points';
import { CONTRACTS, UserPOIRegistryABI, RoamEscrowABI, poiIdFromSlug } from '@/lib/contracts';

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
const IS_DEV = process.env.NODE_ENV === 'development';

// Fallback contributor address — override per-POI once contributor API is wired
const FALLBACK_CONTRIBUTOR = (process.env.NEXT_PUBLIC_DEMO_WALLET ?? '0x0000000000000000000000000000000000000001') as `0x${string}`;
// 0.001 ETH unlock price (adjust to match your deployed escrow expectation)
const UNLOCK_PRICE_ETH = parseEther('0.0002');

export default function MapPage() {
  const router = useRouter();
  const { address } = useAppKitAccount();
  const [activePoi, setActivePoi] = useState<POI | null>(null);
  const [ownedPoiIds, setOwnedPoiIds] = useState<string[]>([]);
  const [devPoiIndex, setDevPoiIndex] = useState(0);

  // On-chain: ROAM balance
  const { data: balanceRaw } = useRoamBalance();
  const pointsBalance = balanceRaw ?? 0n;

  // On-chain: is active POI already unlocked?
  const activePoiId = activePoi ? poiIdFromSlug(activePoi.id) : undefined;
  const { data: isAlreadyUnlocked } = useReadContract({
    address:      CONTRACTS.userPOIRegistry,
    abi:          UserPOIRegistryABI,
    functionName: 'unlockedPOIs',
    args:         address && activePoiId ? [address as `0x${string}`, activePoiId] : undefined,
    query:        { enabled: !!address && !!activePoiId },
  });

  // On-chain: escrow lockPayment (ETH path)
  const { writeContract: writeLock, data: lockHash, isPending: isLocking } = useWriteContract();
  const { isSuccess: lockSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: lockHash });

  // On-chain: redeemForUnlock (ROAM path)
  const { redeemForUnlock, isPending: isRedeeming, isSuccess: redeemSuccess } = useRedeemForUnlock();

  // After either payment succeeds → mark owned + navigate
  useEffect(() => {
    if ((lockSuccess || redeemSuccess) && activePoi && address) {
      setOwnedPoiIds((prev) => [...prev, activePoi.id]);
      setActivePoi(null);
      router.push(`/experience/${activePoi.id}?unlocked=1`);
    }
  }, [lockSuccess, redeemSuccess, activePoi, address, router]);

  // Auto-skip modal if POI already unlocked on-chain
  useEffect(() => {
    if (isAlreadyUnlocked && activePoi) {
      setOwnedPoiIds((prev) => [...prev, activePoi.id]);
      setActivePoi(null);
      router.push(`/experience/${activePoi.id}?unlocked=1`);
    }
  }, [isAlreadyUnlocked, activePoi, router]);

  // Sayfa unmount olunca body overflow'u temizle
  useEffect(() => {
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handlePoiTrigger = useCallback((poiId: string) => {
    const poi = pois.find((p) => p.id === poiId);
    if (poi && !ownedPoiIds.includes(poiId)) setActivePoi(poi);
  }, [ownedPoiIds]);

  function handlePayETH() {
    if (!activePoi) return;
    writeLock({
      address:      CONTRACTS.roamEscrow,
      abi:          RoamEscrowABI,
      functionName: 'lockPayment',
      args:         [poiIdFromSlug(activePoi.id), FALLBACK_CONTRIBUTOR],
      value:        UNLOCK_PRICE_ETH,
      gas:          300_000n,
    });
  }

  function handleRedeemPoints() {
    if (!activePoi) return;
    redeemForUnlock(activePoi.id);
  }

  // Dev: simulate unlocking current POI — bypass payment, go straight to experience
  function devSimulateUnlock() {
    const poi = pois[devPoiIndex % pois.length];
    setDevPoiIndex((i) => i + 1);
    router.push(`/experience/${poi.id}?unlocked=1`);
  }

  const balNum = Number(pointsBalance / 10n ** 18n);

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
          <span className="text-roam-gold font-bold">{balNum}</span>
          <span className="text-white/40">pts</span>
        </Link>
      </div>

      {/* Map — full screen */}
      <MapView
        pois={pois}
        ownedPoiIds={ownedPoiIds}
        onPoiTrigger={handlePoiTrigger}
      />

      {/* Bottom-right action column: dev tool (if any) + center button */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
        {IS_DEV && (
          <button
            onClick={devSimulateUnlock}
            className="glass rounded-xl px-3 py-2 text-xs text-roam-gold font-semibold min-h-[44px] hover:bg-white/10 transition-colors"
          >
            🧪 Unlock POI {devPoiIndex + 1}/{pois.length}
          </button>
        )}
        <button
          onClick={() => (window as any).__roam_center_user?.()}
          className="glass rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          title="Center on my location"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <circle cx="12" cy="12" r="8" strokeOpacity="0.3"/>
          </svg>
        </button>
      </div>

      {/* Unlock Modal */}
      {activePoi && (
        <UnlockModal
          poi={activePoi}
          pointsBalance={pointsBalance}
          onPayUSDC={handlePayETH}
          onRedeemPoints={handleRedeemPoints}
          onClose={() => setActivePoi(null)}
          isPending={isConfirming || isRedeeming}
        />
      )}

      {/* Tx pending overlay */}
      {(isLocking || isRedeeming) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl px-6 py-5 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-roam-gold/40 border-t-roam-gold rounded-full animate-spin" />
            <p className="text-sm text-white/80">Confirming on Sepolia…</p>
          </div>
        </div>
      )}
    </div>
  );
}
