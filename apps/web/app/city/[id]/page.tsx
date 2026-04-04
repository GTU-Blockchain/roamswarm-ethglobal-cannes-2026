'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Lock, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Card, CardContent } from '@/components/ui/card';
import { CityProgress } from '@/components/CityProgress';
import { checkAndMintBadge } from '@/lib/badges';
import type { CityBadge } from '@/lib/badges';

/* ─── Types ─── */
interface POI {
  id: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
}

interface CityData {
  id: string;
  name: string;
  description: string;
  pois: POI[];
  badge?: CityBadge;
}

/* ─── Mock city data (replace with contract calls when contracts are deployed) ─── */
const MOCK_CITIES: Record<string, CityData> = {
  cannes: {
    id: 'cannes',
    name: 'Cannes',
    description: 'The city of cinema, glamour, and the legendary Croisette.',
    pois: [
      { id: 'c1', name: 'Palais des Festivals', description: 'Home of the Cannes Film Festival since 1983.', category: 'Landmark', unlocked: true },
      { id: 'c2', name: 'La Croisette', description: 'The iconic 2km promenade along the Mediterranean.', category: 'Promenade', unlocked: true },
      { id: 'c3', name: 'Marché Forville', description: 'Bustling morning market with local produce & flowers.', category: 'Market', unlocked: true },
      { id: 'c4', name: 'Villa Rothschild', description: 'A stunning Belle Époque villa with panoramic gardens.', category: 'Heritage', unlocked: true },
      { id: 'c5', name: 'Îles de Lérins', description: 'Two islands — one with a legendary masked prisoner.', category: 'Island', unlocked: false },
      { id: 'c6', name: 'Rue Meynadier', description: 'The pedestrian street for local shopping & cuisine.', category: 'Street', unlocked: false },
      { id: 'c7', name: 'Cannes Old Town (Le Suquet)', description: 'Medieval hilltop quarter with spectacular sea views.', category: 'District', unlocked: false },
      { id: 'c8', name: 'Casino Barrière', description: 'The legendary casino steps from the Croisette.', category: 'Entertainment', unlocked: false },
      { id: 'c9', name: 'Plage de la Bocca', description: 'Wide sandy beach west of the city, less touristy.', category: 'Beach', unlocked: false },
      { id: 'c10', name: 'Musée de la Castre', description: 'World art & antiquities in a 12th-century castle.', category: 'Museum', unlocked: false },
      { id: 'c11', name: 'Port Pierre Canto', description: 'The eastern yacht harbour with luxury vessels.', category: 'Port', unlocked: false },
      { id: 'c12', name: 'Allée de la Liberté', description: 'The outdoor flower market & morning gathering spot.', category: 'Square', unlocked: false },
    ],
  },
  paris: {
    id: 'paris',
    name: 'Paris',
    description: 'The City of Light — art, history, and endless discovery.',
    pois: [
      { id: 'p1', name: 'Eiffel Tower', description: 'The iron lady, symbol of Paris since 1889.', category: 'Landmark', unlocked: true },
      { id: 'p2', name: 'Le Marais', description: 'Historic district blending medieval and modern.', category: 'District', unlocked: true },
      { id: 'p3', name: 'Montmartre', description: 'Artists\' hill with the sacred heart basilica.', category: 'District', unlocked: false },
      { id: 'p4', name: 'Musée du Louvre', description: 'The world\'s largest art museum.', category: 'Museum', unlocked: false },
      { id: 'p5', name: 'Sainte-Chapelle', description: 'Gothic masterpiece with 15 stained glass windows.', category: 'Heritage', unlocked: false },
    ],
  },
  nice: {
    id: 'nice',
    name: 'Nice',
    description: 'Azure coast, Baroque architecture, and the Niçoise joie de vivre.',
    pois: [
      { id: 'n1', name: 'Promenade des Anglais', description: 'The legendary seaside boulevard of Nice.', category: 'Promenade', unlocked: true },
      { id: 'n2', name: 'Vieux-Nice', description: 'Baroque old town with colourful facades.', category: 'District', unlocked: true },
      { id: 'n3', name: 'Colline du Château', description: 'Castle hill with panoramic views of the bay.', category: 'Landmark', unlocked: false },
      { id: 'n4', name: 'Cours Saleya', description: 'The flower, fruit, and antique market.', category: 'Market', unlocked: false },
    ],
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Landmark: '#F5A623',
  Promenade: '#4facfe',
  Market: '#7ed56f',
  Heritage: '#f093fb',
  Island: '#00f2fe',
  Street: '#a855f7',
  District: '#667eea',
  Entertainment: '#f5576c',
  Beach: '#4facfe',
  Museum: '#ffd700',
  Port: '#3b82f6',
  Square: '#f093fb',
};

/* ─── Ambient background ─── */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px]" style={{ animation: 'pulse 4s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-[120px]" style={{ animation: 'pulse 4s ease-in-out infinite', animationDelay: '2s' }} />
    </div>
  );
}

/* ─── POI row ─── */
function POIRow({ poi, index }: { poi: POI; index: number }) {
  const color = CATEGORY_COLORS[poi.category] ?? '#a855f7';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index }}
    >
      <a
        href={poi.unlocked ? `/experience/${poi.id}` : undefined}
        className={`flex items-center gap-3 p-3 rounded-2xl min-h-[64px] transition-all duration-200 ${
          poi.unlocked ? 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer' : 'opacity-60 cursor-default'
        }`}
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: poi.unlocked ? `${color}22` : 'rgba(255,255,255,0.06)' }}
        >
          {poi.unlocked
            ? <CheckCircle2 className="w-5 h-5" style={{ color }} />
            : <Lock className="w-4 h-4 text-gray-500" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${poi.unlocked ? 'text-white' : 'text-gray-500'}`}>
            {poi.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: poi.unlocked ? `${color}22` : 'rgba(255,255,255,0.06)',
                color: poi.unlocked ? color : '#6b7280',
              }}
            >
              {poi.category}
            </span>
            {poi.unlocked && (
              <span className="text-xs text-gray-500 truncate hidden sm:block">{poi.description}</span>
            )}
          </div>
        </div>

        {/* Arrow for unlocked */}
        {poi.unlocked && (
          <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
        )}
      </a>
    </motion.div>
  );
}

/* ─── Badge CTA ─── */
function BadgeCTA({
  cityId,
  cityName,
  address,
  allUnlocked,
  existingBadge,
}: {
  cityId: string;
  cityName: string;
  address: string | undefined;
  allUnlocked: boolean;
  existingBadge?: CityBadge;
}) {
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    if (!address || !allUnlocked) return;
    setMinting(true);
    setError(null);
    try {
      const success = await checkAndMintBadge(address, cityId);
      if (success) setMinted(true);
      else setError('Mint failed — try again.');
    } catch {
      setError('Transaction failed.');
    } finally {
      setMinting(false);
    }
  };

  if (existingBadge || minted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.15) 100%)', border: '1px solid rgba(168,85,247,0.3)' }}
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{ background: 'linear-gradient(135deg, #a855f7, #3b82f6)' }}>
            🏆
          </div>
          <div>
            <div className="text-sm font-bold text-white">{cityName} Badge Earned!</div>
            <div className="text-xs text-gray-400 mt-0.5">Your CityBadgeNFT is in your wallet</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{
        background: allUnlocked
          ? 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(255,215,0,0.1) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: allUnlocked ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              background: allUnlocked
                ? 'linear-gradient(135deg, #F5A623, #ffd700)'
                : 'rgba(255,255,255,0.06)',
            }}
          >
            {allUnlocked ? '🏅' : '🔒'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white">Earn the {cityName} City Badge</div>
            <div className="text-xs text-gray-400 mt-1">
              {allUnlocked
                ? 'You\'ve unlocked every POI! Mint your CityBadgeNFT now.'
                : 'Unlock all POIs to earn your exclusive CityBadgeNFT (ERC-721) + 100 bonus ROAM points.'}
            </div>
          </div>
        </div>

        {allUnlocked && (
          <>
            {error && (
              <p className="text-xs text-red-400 mb-3 text-center">{error}</p>
            )}
            <button
              onClick={handleMint}
              disabled={minting}
              className="w-full min-h-[48px] rounded-2xl font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F5A623, #ffd700)',
                color: '#0A0A0F',
              }}
            >
              {minting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Minting…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mint City Badge + 100 ROAM
                </>
              )}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main page ─── */
export default function CityPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const cityId = typeof params.id === 'string' ? params.id : 'cannes';

  const city = MOCK_CITIES[cityId] ?? MOCK_CITIES.cannes;
  const unlockedCount = city.pois.filter(p => p.unlocked).length;
  const totalCount = city.pois.length;
  const allUnlocked = unlockedCount === totalCount;

  const [filterUnlocked, setFilterUnlocked] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filteredPOIs = city.pois.filter(poi => {
    if (filterUnlocked === 'unlocked') return poi.unlocked;
    if (filterUnlocked === 'locked') return !poi.unlocked;
    return true;
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-6 pb-10 lg:max-w-2xl">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors mb-5 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.07)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-black text-white tracking-tight">{city.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{city.description}</p>
        </motion.div>

        {/* Progress ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <CityProgress
            unlocked={unlockedCount}
            total={totalCount}
            cityName={city.name}
          />
        </motion.div>

        {/* Badge CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <BadgeCTA
            cityId={city.id}
            cityName={city.name}
            address={address}
            allUnlocked={allUnlocked}
            existingBadge={city.badge}
          />
        </motion.div>

        {/* POI list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            <CardContent className="p-5 space-y-4">
              {/* Section header + filter */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#F5A623]" />
                  Points of Interest
                </h2>
                {/* Filter pills */}
                <div className="flex items-center gap-1.5">
                  {(['all', 'unlocked', 'locked'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterUnlocked(f)}
                      className="text-xs px-3 py-2.5 rounded-full font-medium transition-all duration-200 min-h-[44px] capitalize"
                      style={{
                        background: filterUnlocked === f ? 'rgba(245,166,35,0.2)' : 'rgba(255,255,255,0.06)',
                        color: filterUnlocked === f ? '#F5A623' : '#6b7280',
                        border: filterUnlocked === f ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat row */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-semibold">{unlockedCount}</span> unlocked
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-gray-400 font-semibold">{totalCount - unlockedCount}</span> remaining
                </span>
              </div>

              {/* List */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredPOIs.map((poi, i) => (
                    <POIRow key={poi.id} poi={poi} index={i} />
                  ))}
                </AnimatePresence>

                {filteredPOIs.length === 0 && (
                  <p className="text-center text-sm text-gray-600 py-8">No POIs match this filter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigate to map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4"
        >
          <button
            onClick={() => router.push('/map')}
            className="w-full min-h-[48px] rounded-2xl font-semibold text-sm text-white transition-all duration-200 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <MapPin className="w-4 h-4" />
            Open Map
          </button>
        </motion.div>

      </div>
    </div>
  );
}
