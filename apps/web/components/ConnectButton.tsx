'use client';

import { useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';

interface ConnectButtonProps {
  variant?: 'outline' | 'gold';
  className?: string;
}

export function ConnectButton({ variant = 'outline', className }: ConnectButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const label = mounted && isConnected
    ? `${address?.slice(0, 6)}…${address?.slice(-4)}`
    : 'Connect Wallet';

  const base =
    'min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all duration-200 w-full sm:w-auto';

  const styles = {
    outline: `${base} border border-white/15 text-white/80 hover:bg-white/5 hover:border-white/30`,
    gold: `${base} bg-gradient-to-r from-[#F5A623] to-[#ffd700] text-[#0A0A0F] shadow-lg shadow-[#F5A623]/30 hover:shadow-[#F5A623]/50 hover:scale-105`,
  };

  return (
    <button onClick={() => open()} className={className ?? styles[variant]}>
      {mounted && isConnected ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
