'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, BookOpen, Utensils, Clock, Radio } from 'lucide-react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useReadContracts } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { AudioPlayer } from '@/components/AudioPlayer';
import { PaymentGate } from '@/components/PaymentGate';
import { SwarmStatus } from '@/components/SwarmStatus';
import { streamExperience, type ExperienceResult, type SSEProgress } from '@/lib/agents';
import { CONTRACTS, UserPOIRegistryABI, RoamEscrowABI, poiIdFromSlug } from '@/lib/contracts';

type PageState = 'gate' | 'loading' | 'ready' | 'error';

const STEP_LABELS: Record<string, string> = {
  scout: '🔍 Scout finding nearby venues…',
  lore:  '📜 Lore generating historical story via 0G Compute…',
  guide: '🎙 Guide synthesizing audio narration…',
};

export default function ExperiencePage() {
  const params         = useParams();
  const router         = useRouter();
  const { address }    = useAppKitAccount();
  const poiId          = params.id as string;

  const [pageState, setPageState]   = useState<PageState>('gate');
  const [experience, setExperience] = useState<ExperienceResult | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
  const [stepMsg, setStepMsg]       = useState('Connecting to agent swarm…');
  const [partialStory, setPartial]  = useState<string | null>(null);
  const cancelRef                   = useRef<(() => void) | null>(null);
  const autoStarted                 = useRef(false);

  // On-chain access check: registry unlock OR escrow locked payment
  const poiBytes32 = poiIdFromSlug(poiId);
  const escrowKey  = address
    ? keccak256(encodePacked(['bytes32', 'address'], [poiBytes32, address as `0x${string}`]))
    : undefined;

  const { data: accessData } = useReadContracts({
    contracts: [
      {
        address:      CONTRACTS.userPOIRegistry,
        abi:          UserPOIRegistryABI,
        functionName: 'unlockedPOIs' as const,
        args:         [address as `0x${string}`, poiBytes32],
      },
      {
        address:      CONTRACTS.roamEscrow,
        abi:          RoamEscrowABI,
        functionName: 'payments' as const,
        args:         [escrowKey as `0x${string}`],
      },
    ],
    query: { enabled: !!address && !!escrowKey },
  });

  const isUnlocked = accessData?.[0]?.result === true;
  const payment    = accessData?.[1]?.result as [string, string, bigint, boolean, boolean] | undefined;
  const hasLockedPayment = payment
    ? payment[0] !== '0x0000000000000000000000000000000000000000' && !payment[3] && !payment[4]
    : false;
  const hasAccess = isUnlocked || hasLockedPayment;

  // Auto-start: ?unlocked=1 OR chain confirms access
  useEffect(() => {
    if (autoStarted.current) return;
    const fromUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('unlocked') === '1';
    if (fromUrl || hasAccess) {
      autoStarted.current = true;
      startStream();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  // Cleanup stream on unmount
  useEffect(() => () => { cancelRef.current?.(); }, []);

  function startStream() {
    setPageState('loading');
    setStepMsg('Connecting to agent swarm…');
    setPartial(null);

    const cancel = streamExperience(
      poiId,
      (progress: SSEProgress) => {
        if (progress.message)  setStepMsg(STEP_LABELS[progress.step] ?? progress.message);
        if (progress.story)    setPartial(progress.story);
        if (progress.audioUrl !== undefined) setStepMsg('🎧 Audio ready — loading result…');
      },
      (result: ExperienceResult) => {
        setExperience(result);
        setPageState('ready');
      },
      (msg: string) => {
        setErrorMsg(msg);
        setPageState('error');
      },
      'en',
      address ?? undefined
    );

    cancelRef.current = cancel;
  }

  return (
    <div className="relative min-h-screen text-white flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F] via-[#1a1a2e] to-[#0A0A0F]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623] rounded-full opacity-10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-safe-top pt-4 pb-3 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full glass active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={15} className="text-roam-gold shrink-0" />
          <span className="text-sm font-semibold truncate capitalize">
            {poiId.replace(/-/g, ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* Payment Gate */}
          {pageState === 'gate' && (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="glass rounded-2xl p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-roam-gold/15 flex items-center justify-center mx-auto">
                  <MapPin size={26} className="text-roam-gold" />
                </div>
                <h1 className="text-xl font-bold">Unlock this Experience</h1>
                <p className="text-sm text-white/55 leading-relaxed">
                  Get an AI-generated audio guide, local history, and a venue recommendation for this spot.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-white/40 pt-1">
                  <span>🎧 Audio narration</span>
                  <span>📖 Local story</span>
                  <span>🍽 Venue tip</span>
                </div>
              </div>
              <PaymentGate poiId={poiId} onSuccess={startStream} />
              <SwarmStatus />
            </motion.div>
          )}

          {/* Loading — SSE step progress */}
          {pageState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 pt-4"
            >
              {/* Live step indicator */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}
              >
                <Radio size={16} className="text-roam-gold animate-pulse shrink-0" />
                <p className="text-sm text-white/70 leading-snug">{stepMsg}</p>
              </div>

              {/* Agent swarm steps */}
              <div className="space-y-2">
                {[
                  { key: 'scout', label: 'Scout',         icon: '🔍', desc: 'Finding nearby venues via Chainlink CRE' },
                  { key: 'lore',  label: 'Lore',          icon: '📜', desc: 'Generating story via 0G Compute' },
                  { key: 'guide', label: 'Guide',         icon: '🎙', desc: 'Creating audio via ElevenLabs + 0G Storage' },
                ].map(({ key, label, icon, desc }) => {
                  const isActive = stepMsg.toLowerCase().includes(label.toLowerCase());
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      <span className="text-lg w-6 text-center shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80">{label}</p>
                        <p className="text-xs text-white/40 truncate">{desc}</p>
                      </div>
                      {isActive && (
                        <div className="w-4 h-4 border-2 border-roam-gold/40 border-t-roam-gold rounded-full animate-spin shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Partial story preview */}
              {partialStory && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 text-roam-gold mb-2">
                    <BookOpen size={13} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Story Preview</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-4">{partialStory}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-6 text-center space-y-3"
            >
              <p className="text-red-400 text-sm">{errorMsg}</p>
              <button
                onClick={() => setPageState('gate')}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-sm text-white/70 min-h-[44px]"
              >
                Go back
              </button>
            </motion.div>
          )}

          {/* Experience ready */}
          {pageState === 'ready' && experience && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Audio Player */}
              <AudioPlayer
                audioUrl={experience.audioUrl}
                poiName={poiId.replace(/-/g, ' ')}
              />

              {/* Story card */}
              <div className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-roam-gold">
                  <BookOpen size={15} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Local Story</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{experience.story}</p>
              </div>

              {/* Venue card */}
              {experience.venue && (
                <div className="glass rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-roam-gold">
                    <Utensils size={15} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Nearby Venue</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{experience.venue.name}</p>
                      <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{experience.venue.note}</p>
                    </div>
                    <span
                      className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        experience.venue.isOpen
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      <Clock size={11} />
                      {experience.venue.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {experience.venue.suggestedBy && experience.venue.suggestedBy.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/20">
                      <div className="flex -space-x-2">
                        {experience.venue.suggestedBy.slice(0, 3).map((person, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-roam-accent/80 border-2 border-roam-dark flex items-center justify-center text-[9px] font-bold text-white uppercase"
                            title={person.name}
                          >
                            {person.name.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-white/45 leading-tight">
                        Suggested by{' '}
                        <span className="text-white/70 font-medium">{experience.venue.suggestedBy[0].name}</span>
                        {experience.venue.suggestedBy.length > 1 && (
                          <> + {experience.venue.suggestedBy.length - 1} more</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <p className="text-center text-[11px] text-white/25 pb-2">
                Powered by 0G Compute · Chainlink CRE · ElevenLabs
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
