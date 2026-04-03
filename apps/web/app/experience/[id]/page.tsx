'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, BookOpen, Utensils, Clock } from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { PaymentGate } from '@/components/PaymentGate';
import { triggerExperience, type ExperienceResult } from '@/lib/agents';

type PageState = 'gate' | 'loading' | 'ready' | 'error';

export default function ExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const poiId = params.id as string;

  const [pageState, setPageState] = useState<PageState>('gate');
  const [experience, setExperience] = useState<ExperienceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-load if already unlocked (e.g. came via ROAM points)
  // For now, always show gate first unless ?unlocked=1 in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('unlocked') === '1') {
        handlePaymentSuccess();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePaymentSuccess() {
    setPageState('loading');
    try {
      const result = await triggerExperience(poiId);
      setExperience(result);
      setPageState('ready');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to load experience');
      setPageState('error');
    }
  }

  return (
    <div className="min-h-screen bg-roam-dark text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-4 pb-3 border-b border-white/10">
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">
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
              <PaymentGate poiId={poiId} onSuccess={handlePaymentSuccess} />
            </motion.div>
          )}

          {/* Loading */}
          {pageState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 pt-4"
            >
              {/* Skeleton cards */}
              {[120, 180, 80].map((h, i) => (
                <div
                  key={i}
                  className="glass rounded-2xl overflow-hidden"
                  style={{ height: h }}
                >
                  <motion.div
                    className="w-full h-full bg-gradient-to-r from-white/5 via-white/10 to-white/5"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                    style={{ backgroundSize: '200% 100%' }}
                  />
                </div>
              ))}
              <p className="text-center text-sm text-white/40">
                Agent swarm generating your experience…
              </p>
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

                  {/* Community contributors */}
                  {experience.venue.suggestedBy && experience.venue.suggestedBy.length > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/20">
                      {/* Avatar stack */}
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
                        <span className="text-white/70 font-medium">
                          {experience.venue.suggestedBy[0].name}
                        </span>
                        {experience.venue.suggestedBy.length > 1 && (
                          <> + {experience.venue.suggestedBy.length - 1} more</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer credit */}
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
