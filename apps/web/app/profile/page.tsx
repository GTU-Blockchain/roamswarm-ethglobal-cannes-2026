'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Trophy, Wallet, TrendingUp, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useReadContracts } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCard } from '@/components/BadgeCard';
import { useRoamBalance } from '@/lib/points';
import { useHasBadge, CityBadge } from '@/lib/badges';
import { getContributorENS } from '@/lib/ens';
import { CONTRACTS, UserPOIRegistryABI, RoamEscrowABI, poiIdFromSlug } from '@/lib/contracts';
import poisData from '@/data/cannes-pois.json';

/* ─── Static ambient background (matches landing page) ─── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(245,166,35,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

/* ─── Badge Detail Modal ─── */
function BadgeModal({ badge, onClose }: { badge: CityBadge; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm"
      >
        {/* Close button — half in half out of top-right corner */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:scale-110 active:scale-95"
          style={{ background: 'rgba(30,30,40,0.95)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <BadgeCard badge={badge} />
      </motion.div>
    </motion.div>
  );
}


/* ─── Small badge card ─── */
const CITY_GRADIENTS: Record<string, string> = {
  cannes: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  paris:  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  nice:   'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#a855f7 0%,#3b82f6 100%)';

function CityBadgeCard({ badge, delay, onClick }: { badge: CityBadge; delay: number; onClick: () => void }) {
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const gradient = CITY_GRADIENTS[badge.cityId] ?? DEFAULT_GRADIENT;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer active:scale-95 transition-transform p-1"
    >
      {/* Rainbow border — outside card */}
      <div className="absolute inset-1 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `conic-gradient(from ${mouse.x * 3.6}deg at ${mouse.x}% ${mouse.y}%, #ff0080,#ff8c00,#ffff00,#00ff00,#00ffff,#0080ff,#8000ff,#ff0080)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '2px',
        }}
      />

      <div className="relative overflow-hidden rounded-2xl"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
      >
        {/* Iridescent glow */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 0.55 : 0,
            background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(200,100,255,0.5) 0%, rgba(80,220,255,0.35) 30%, rgba(255,100,200,0.2) 55%, transparent 75%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Shimmer sweep */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: hovered ? 0.12 : 0,
            background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.9) 50%, transparent 80%)',
            backgroundSize: '200% 100%',
            animation: hovered ? 'badgeShimmer 2s infinite' : 'none',
          }}
        />

        <div className="relative z-10 p-3">
          {/* Artwork */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2.5 shadow-lg">
            <div className="absolute inset-0" style={{ background: gradient }} />
            {badge.imageUri && (
              <img src={badge.imageUri} alt={badge.cityName}
                className="relative z-10 w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          <h3 className="text-sm font-bold text-white truncate">{badge.cityName}</h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" /><span>Completed</span>
            </div>
            {badge.tokenId !== undefined && (
              <span className="font-mono text-[10px] text-white/60 px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                #{badge.tokenId}
              </span>
            )}
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70" style={{ background: gradient }} />
      </div>
    </motion.div>
  );
}

const ALL_POIS = poisData as { id: string; name: string }[];
const TOTAL_CANNES_POIS = ALL_POIS.length; // 12

/* ─── Main page ─── */
export default function ProfilePage() {
  const router = useRouter();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [ensName, setEnsName]        = useState<string | null>(null);
  const [progress, setProgress]      = useState(0);
  const [selectedBadge, setSelected] = useState<CityBadge | null>(null);

  // On-chain: ROAM balance
  const { data: balanceRaw, isLoading: balanceLoading } = useRoamBalance();
  const balance = balanceRaw ?? 0n;

  // On-chain: badge for Cannes
  const { data: hasCannesBadge } = useHasBadge('cannes');

  // On-chain: batch-check all POIs (registry unlock + escrow locked payment)
  const poiBytes32s = ALL_POIS.map((p) => poiIdFromSlug(p.id));
  const escrowKeys = address
    ? poiBytes32s.map((b) => keccak256(encodePacked(['bytes32', 'address'], [b, address as `0x${string}`])))
    : [];

  const { data: poiResults, isLoading: poisLoading } = useReadContracts({
    contracts: [
      ...ALL_POIS.map((p) => ({
        address:      CONTRACTS.userPOIRegistry,
        abi:          UserPOIRegistryABI,
        functionName: 'unlockedPOIs' as const,
        args:         [address as `0x${string}`, poiIdFromSlug(p.id)],
      })),
      ...escrowKeys.map((k) => ({
        address:      CONTRACTS.roamEscrow,
        abi:          RoamEscrowABI,
        functionName: 'payments' as const,
        args:         [k],
      })),
    ],
    query: { enabled: !!address },
  });

  const n = ALL_POIS.length;
  const ownedPOIs = poiResults
    ? ALL_POIS.filter((_, i) => {
        const isUnlocked = poiResults[i]?.result === true;
        const pay = poiResults[n + i]?.result as [string, string, bigint, boolean, boolean] | undefined;
        return isUnlocked || (pay ? pay[0] !== '0x0000000000000000000000000000000000000000' && !pay[3] && !pay[4] : false);
      })
    : [];

  const cannesUnlocked = ownedPOIs.length;
  const cannesProgress = Math.round((cannesUnlocked / TOTAL_CANNES_POIS) * 100);

  const displayBadges: CityBadge[] = hasCannesBadge
    ? [{ cityId: 'cannes', cityName: 'Cannes', completedAt: '', poiCount: TOTAL_CANNES_POIS, imageUri: 'https://images.unsplash.com/photo-1533856493584-0c6ca8ca9ce3?w=400&h=400&fit=crop' }]
    : [];

  // ENS name
  useEffect(() => {
    if (!address) return;
    getContributorENS(address).then(setEnsName);
  }, [address]);

  // Animate progress ring
  useEffect(() => {
    setProgress(0);
    const t = setTimeout(() => setProgress(cannesProgress), 100);
    return () => clearTimeout(t);
  }, [cannesProgress]);

  const loading    = balanceLoading || poisLoading;
  const balNum     = Number(balance / 10n ** 18n);
  const truncAddr  = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x000...0000';

  const ringR    = 56;
  const ringCirc = 2 * Math.PI * ringR;

  if (!isConnected) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <AmbientBackground />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5A623] to-[#ffd700] flex items-center justify-center text-3xl mb-6 shadow-2xl shadow-[#F5A623]/30">🧭</div>
          <h2 className="text-2xl font-bold text-white mb-2">Roam Explorer</h2>
          <p className="text-gray-400 text-sm mb-8">Connect your wallet to view your profile</p>
          <button onClick={() => open()}
            className="bg-gradient-to-r from-[#F5A623] to-[#ffd700] hover:brightness-110 active:scale-95 transition-all text-white font-semibold px-8 py-4 rounded-2xl min-h-[52px] shadow-lg shadow-[#F5A623]/30">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen w-full overflow-hidden">
        <AmbientBackground />

        {/* Back button */}
        <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-6 lg:max-w-7xl lg:px-8">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors mb-4 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-6 lg:max-w-7xl lg:px-8">
          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-4 lg:space-y-0">

            {/* ── HERO ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.01 }}
              className="lg:col-span-12">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_48px_rgba(0,0,0,0.6)] transition-shadow duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#F5A623] to-[#ffd700] flex items-center justify-center text-2xl font-bold text-[#0A0A0F] border-2 border-[#F5A623]/50 shadow-[0_0_20px_rgba(245,166,35,0.4)]">
                        W3
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl font-bold text-white truncate">{ensName ?? 'explorer.eth'}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <Wallet className="w-4 h-4 text-[#F5A623]" />
                        <p className="text-xs text-gray-400 truncate font-mono">{truncAddr}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                    {[
                      { label: 'Points', value: loading ? '…' : balNum.toLocaleString(), amber: true,  border: false },
                      { label: 'POIs',   value: loading ? '…' : cannesUnlocked,          amber: false, border: true },
                      { label: 'Badges', value: loading ? '…' : displayBadges.length,   amber: false, border: false },
                    ].map(({ label, value, amber, border }) => (
                      <div key={label} className={`text-center ${border ? 'border-x border-white/10' : ''}`}>
                        <div className={`text-2xl font-bold ${amber ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#ffd700]' : 'text-white'}`}>{value}</div>
                        <div className="text-xs text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── POINTS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="lg:col-span-4">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:shadow-[0_0_50px_rgba(245,166,35,0.3)] transition-shadow duration-300 relative h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/5 to-transparent pointer-events-none" />
                <CardContent className="p-6 space-y-6 relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-400">Total Points</h2>
                    <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" /><span>+2.0%</span>
                    </div>
                  </div>
                  <div className="space-y-1 flex-1 flex flex-col justify-center">
                    <div className="text-5xl font-black text-white tracking-tight">
                      {loading ? '—' : balNum.toLocaleString()}
                    </div>
                    <p className="text-sm text-gray-500">Secured on blockchain</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">This Week</div>
                      <div className="text-lg font-bold text-green-400">+250</div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">Rank</div>
                      <div className="text-lg font-bold text-[#F5A623]">#127</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── PROGRESS RING ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="lg:col-span-4">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:shadow-[0_0_50px_rgba(245,166,35,0.3)] transition-shadow duration-300 h-full">
                <CardContent className="p-5 h-full flex flex-col gap-4">
                  {/* Header with city nav */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F5A623]" />City Progress
                    </h2>
                    <div className="flex items-center gap-1" />
                  </div>

                  {/* Ring */}
                  <div className="flex flex-col items-center flex-1 justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r={ringR} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                        <circle cx="64" cy="64" r={ringR}
                          stroke="#f093fb" strokeWidth="8" fill="none"
                          strokeDasharray={ringCirc}
                          strokeDashoffset={ringCirc * (1 - progress / 100)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-white">{progress}%</div>
                        <div className="text-xs text-gray-400 mt-1">Complete</div>
                      </div>
                    </div>
                    <p className="mt-3 text-base font-bold text-white">Cannes</p>
                    <p className="text-sm text-gray-400">
                      <span className="text-white font-semibold">{cannesUnlocked}</span> / {TOTAL_CANNES_POIS} POIs
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── LOCATIONS ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="lg:col-span-4">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:shadow-[0_0_50px_rgba(245,166,35,0.3)] transition-shadow duration-300 h-full">
                <CardContent className="p-5 space-y-3 h-full flex flex-col">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F5A623]" />Unlocked Locations
                  </h2>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {loading && (
                      <p className="text-xs text-white/40 text-center py-4">Loading…</p>
                    )}
                    {!loading && ownedPOIs.length === 0 && (
                      <p className="text-xs text-white/40 text-center py-4">No locations unlocked yet</p>
                    )}
                    {ownedPOIs.map((poi, i) => (
                      <motion.a key={poi.id} href={`/experience/${poi.id}?unlocked=1`}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.4 + i * 0.08 }}
                        className="group flex items-center gap-3 p-3 rounded-2xl min-h-[60px] transition-all duration-200 hover:scale-[1.01]"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.6), rgba(255, 0, 255, 0.6))' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate group-hover:text-[#F5A623] transition-colors">
                            {poi.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">Cannes</div>
                        </div>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(245,166,35,0.15)' }}>
                          <svg className="w-3 h-3 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── BADGES ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.005 }}
              className="lg:col-span-12">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(245,166,35,0.15)] hover:shadow-[0_0_50px_rgba(245,166,35,0.3)] transition-shadow duration-300">
                <CardContent className="p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />City Badges
                    <span className="text-gray-600 text-xs font-normal ml-1">tap to expand</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {displayBadges.map((badge, i) => (
                      <CityBadgeCard
                        key={badge.cityId}
                        badge={badge}
                        delay={0.5 + i * 0.1}
                        onClick={() => setSelected(badge)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Badge Modal ── */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeModal badge={selectedBadge} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
