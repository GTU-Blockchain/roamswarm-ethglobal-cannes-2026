'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { fetchWithPayment } from '@/lib/x402';

export interface PaymentGateProps {
  poiId: string;
  onSuccess: () => void;
}

type TxStatus = 'idle' | 'pending' | 'success' | 'error';

const ESCROW_CONTRACT = '0x0000000000000000000000000000000000000000'; // TODO: replace with real escrow

export function PaymentGate({ poiId, onSuccess }: PaymentGateProps) {
  const [status, setStatus] = useState<TxStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handlePay() {
    setStatus('pending');
    setErrorMsg('');
    try {
      const res = await fetchWithPayment(`/api/experience/${poiId}`, {
        amount: '0.5',
        token: 'USDC',
        network: 'eip155:11155111',
        recipient: ESCROW_CONTRACT,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setStatus('success');
      // short delay so user sees the success state
      setTimeout(onSuccess, 900);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message ?? 'Payment failed. Please try again.');
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.button
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            onClick={handlePay}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-roam-gold text-roam-dark font-bold text-sm min-h-[44px] active:scale-[0.98] transition-transform"
          >
            <CreditCard size={16} />
            Pay 0.5 USDC via x402
          </motion.button>
        )}

        {status === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white/70 text-sm min-h-[44px]"
          >
            <Loader2 size={16} className="animate-spin text-roam-gold" />
            Processing payment…
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold min-h-[44px]"
          >
            <CheckCircle2 size={16} />
            Payment confirmed — unlocking…
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 text-sm min-h-[44px]">
              <XCircle size={16} />
              {errorMsg || 'Payment failed'}
            </div>
            <button
              onClick={handlePay}
              className="w-full py-2.5 rounded-xl border border-white/20 text-white/70 text-sm min-h-[44px] active:scale-[0.98] transition-transform"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
