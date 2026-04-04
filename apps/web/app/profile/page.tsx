'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Trophy, Wallet, TrendingUp, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCard } from '@/components/BadgeCard';
import { getPointsBalance } from '@/lib/points';
import { getUserBadges, CityBadge } from '@/lib/badges';
import { getContributorENS } from '@/lib/ens';

/* ─── Static ambient background (matches landing page) ─── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(245,166,35,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

/* ─── Per-city gradient ─── */
const CITY_GRADIENTS: Record<string, string> = {
  cannes: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  paris:  'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  nice:   'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#a855f7 0%,#3b82f6 100%)';

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

/* ─── Small badge card (grid) ─── */
function CityBadgeCard({ badge, delay, onClick }: { badge: CityBadge; delay: number; onClick: () => void }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const gradient = CITY_GRADIENTS[badge.cityId] ?? DEFAULT_GRADIENT;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group active:scale-95 transition-transform w-[180px] flex-shrink-0"
      style={{ background: 'rgba(18,18,32,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Rainbow shimmer */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 0.6 : 0,
          background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,0,255,0.4) 0%, rgba(0,255,255,0.3) 20%, rgba(255,255,0,0.3) 40%, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
      {/* Rainbow border */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `conic-gradient(from ${mouse.x * 3.6}deg at ${mouse.x}% ${mouse.y}%, #ff0080,#ff8c00,#ffff00,#00ff00,#00ffff,#0080ff,#8000ff,#ff0080)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '2px',
        }}
      />

      <div className="relative z-10 p-3">
        {/* Square artwork */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-lg">
          <div className="absolute inset-0" style={{ background: gradient }} />
          {badge.imageUri && (
            <img src={badge.imageUri} alt={badge.cityName}
              className="relative z-10 w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>

        {/* Info */}
        <h3 className="text-sm font-bold text-white truncate">{badge.cityName}</h3>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3" /><span>Completed</span>
          </div>
          {badge.tokenId !== undefined && (
            <span className="font-mono text-[10px] text-white px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(30,30,40,0.9)' }}>
              #{badge.tokenId}
            </span>
          )}
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: gradient }} />
    </motion.div>
  );
}

/* ─── Mock data ─── */
interface OwnedPOI { id: string; name: string; discovered: string; }
const MOCK_POIS: OwnedPOI[] = [
  { id: '1', name: 'Palais des Festivals', discovered: '2 days ago' },
  { id: '2', name: 'La Croisette',         discovered: '5 days ago' },
  { id: '3', name: 'Marché Forville',      discovered: '1 week ago' },
  { id: '4', name: 'Villa Rothschild',     discovered: '2 weeks ago' },
];

interface CityProgressData { id: string; name: string; unlocked: number; total: number; color: string; }
const MOCK_CITIES: CityProgressData[] = [
  { id: 'cannes', name: 'Cannes', unlocked: 4, total: 12, color: '#f093fb' },
  { id: 'paris',  name: 'Paris',  unlocked: 8, total: 15, color: '#667eea' },
  { id: 'nice',   name: 'Nice',   unlocked: 2, total: 10, color: '#4facfe' },
];

/* ─── Main page ─── */
export default function ProfilePage() {
  const router = useRouter();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  const [balance, setBalance]         = useState<bigint>(0n);
  const [badges, setBadges]           = useState<CityBadge[]>([]);
  const [ensName, setEnsName]         = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [progress, setProgress]       = useState(0);
  const [cityIndex, setCityIndex]     = useState(0);
  const [selectedBadge, setSelected]  = useState<CityBadge | null>(null);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [bal, userBadges, ens] = await Promise.all([
        getPointsBalance(address), getUserBadges(address), getContributorENS(address),
      ]);
      setBalance(bal); setBadges(userBadges); setEnsName(ens);
      setLoading(false);
    })();
  }, [address]);

  const activeCity = MOCK_CITIES[cityIndex];

  useEffect(() => {
    setProgress(0);
    const t = setTimeout(() => setProgress(Math.round((activeCity.unlocked / activeCity.total) * 100)), 100);
    return () => clearTimeout(t);
  }, [cityIndex, activeCity.unlocked, activeCity.total]);

  const balNum    = Number(balance / 10n ** 18n);
  const truncAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x000...0000';

  const displayBadges: CityBadge[] = badges.length > 0 ? badges : [
    { cityId: 'cannes', cityName: 'Cannes', completedAt: '2026-04-01T00:00:00Z', poiCount: 12, imageUri: 'https://images.unsplash.com/photo-1533856493584-0c6ca8ca9ce3?w=400&h=400&fit=crop', tokenId: 7640 },
    { cityId: 'paris',  cityName: 'Paris',  completedAt: '2026-03-15T00:00:00Z', poiCount: 8,  imageUri: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop', tokenId: 9466 },
  ];

  const ringR = 56;
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
                      { label: 'POIs',   value: MOCK_POIS.length,                        amber: false, border: true },
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCityIndex(i => (i - 1 + MOCK_CITIES.length) % MOCK_CITIES.length)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 active:bg-white/20"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setCityIndex(i => (i + 1) % MOCK_CITIES.length)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 active:bg-white/20"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Ring */}
                  <AnimatePresence mode="wait">
                    <motion.div key={cityIndex}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center flex-1 justify-center"
                    >
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                          <circle cx="64" cy="64" r={ringR} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                          <circle cx="64" cy="64" r={ringR}
                            stroke={activeCity.color} strokeWidth="8" fill="none"
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

                      <p className="mt-3 text-base font-bold text-white">{activeCity.name}</p>
                      <p className="text-sm text-gray-400">
                        <span className="text-white font-semibold">{activeCity.unlocked}</span> / {activeCity.total} POIs
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-1.5">
                    {MOCK_CITIES.map((c, i) => (
                      <button key={c.id} onClick={() => setCityIndex(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: i === cityIndex ? activeCity.color : 'rgba(255,255,255,0.2)',
                                 transform: i === cityIndex ? 'scale(1.4)' : 'scale(1)' }}
                      />
                    ))}
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
                  <div className="flex-1 space-y-2">
                    {MOCK_POIS.map((poi, i) => (
                      <motion.a key={poi.id} href={`/experience/${poi.id}`}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.4 + i * 0.08 }}
                        className="group flex items-center gap-3 p-3 rounded-2xl min-h-[60px] transition-all duration-200 hover:scale-[1.01]"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {/* Number badge */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.6), rgba(255, 0, 255, 0.6))' }}>
                          {String(i + 1).padStart(2, '0')}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate group-hover:text-[#F5A623] transition-colors">
                            {poi.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{poi.discovered}</div>
                        </div>

                        {/* Arrow */}
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
                  <div className="flex flex-wrap gap-3">
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
