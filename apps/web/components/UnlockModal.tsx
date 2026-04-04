'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Zap, Loader2 } from 'lucide-react';
import type { POI } from '@/lib/geofence';

export interface UnlockModalProps {
  poi: POI;
  pointsBalance: bigint;
  onPayUSDC: () => void;
  onRedeemPoints: () => void;
  onClose: () => void;
  isPending?: boolean;
}

const UNLOCK_THRESHOLD = 500n;
const DAILY_RATE = 10n;
const USDC_PRICE = '0.5';

export function UnlockModal({ poi, pointsBalance, onPayUSDC, onRedeemPoints, onClose, isPending = false }: UnlockModalProps) {
  const canRedeem = pointsBalance >= UNLOCK_THRESHOLD;
  const pointsNeeded = canRedeem ? 0n : UNLOCK_THRESHOLD - pointsBalance;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full sm:max-w-md"
        >
          <div
            className="relative overflow-hidden rounded-t-3xl sm:rounded-3xl"
            style={{
              background: 'rgba(18,18,26,0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button — sadece fotoğraf yoksa göster */}
            {!poi.image && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-all min-h-[44px] min-w-[44px]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* POI image */}
            {poi.image && (
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={poi.image}
                  alt={poi.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#12121A]" />
                {/* Close button on image */}
                <button
                  onClick={onClose}
                  className="absolute right-3 top-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {isPending && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-t-3xl sm:rounded-3xl"
                style={{ background: 'rgba(18,18,26,0.97)' }}>
                <Loader2 className="w-10 h-10 text-roam-gold animate-spin" />
                <div className="text-center">
                  <p className="text-white font-semibold text-base">Confirming transaction…</p>
                  <p className="text-white/40 text-sm mt-1">Waiting for blockchain confirmation</p>
                </div>
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* POI name */}
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Point of Interest</p>
                <h2 className="text-xl font-bold text-white leading-tight">{poi.name}</h2>
              </div>

              {/* Free unlock banner */}
              {canRedeem && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.35)' }}
                >
                  <Zap className="w-4 h-4 text-roam-gold shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-roam-gold">Free Unlock Available!</p>
                    <p className="text-xs text-white/50">You have enough ROAM points</p>
                  </div>
                </motion.div>
              )}

              {/* Points balance */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 text-white/70">
                  <Coins className="w-4 h-4 text-roam-gold" />
                  <span className="text-sm">ROAM Balance</span>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-white">{pointsBalance.toString()}</p>
                  <p className="text-xs text-white/40">+{DAILY_RATE.toString()} pts/day per POI</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 pt-1">
                {/* Pay USDC */}
                <button
                  onClick={onPayUSDC}
                  className="w-full min-h-[52px] rounded-xl font-bold text-sm text-[#0A0A0F] active:scale-[0.98] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #F5A623 0%, #ffd700 100%)',
                    boxShadow: '0 4px 20px rgba(245,166,35,0.35)',
                  }}
                >
                  Pay {USDC_PRICE} USDC
                </button>

                {/* Redeem Points */}
                <button
                  onClick={onRedeemPoints}
                  disabled={!canRedeem}
                  className="w-full min-h-[52px] rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={{
                    background: canRedeem ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${canRedeem ? 'rgba(245,166,35,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: canRedeem ? '#F5A623' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {canRedeem
                    ? `Redeem ${UNLOCK_THRESHOLD.toString()} Points`
                    : `Need ${pointsNeeded.toString()} more points`}
                </button>
              </div>

              {/* Footer note */}
              <p className="text-center text-xs text-white/25 pb-1">
                Payment secured via x402 · Ethereum Sepolia
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
