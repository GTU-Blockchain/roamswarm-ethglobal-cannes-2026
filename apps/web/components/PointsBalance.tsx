"use client";

import * as React from "react";
import { Coins, Sparkles } from "lucide-react";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PointsBalanceProps {
  balance: bigint;
  dailyRate: number;
  canRedeem: boolean;
}

function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        <filter
          id="points-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur
            in="turbulence"
            stdDeviation="2"
            result="blurredNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="120"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur
            in="displaced"
            stdDeviation="4"
            result="finalBlur"
          />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

export function PointsBalance({
  balance,
  dailyRate,
  canRedeem,
}: PointsBalanceProps) {
  const balanceRef = React.useRef<HTMLHeadingElement>(null);
  const balanceNumber = Number(balance);

  React.useEffect(() => {
    const node = balanceRef.current;
    if (!node) return;

    const controls = animate(0, balanceNumber, {
      duration: 2,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = Math.floor(value).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [balanceNumber]);

  return (
    <div className="w-full min-w-[375px]">
      <div
        style={{ backdropFilter: 'url("#points-glass") blur(16px)' }}
        className={cn(
          "relative w-full rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] backdrop-blur-xl overflow-hidden transition-all"
        )}
      >
        {/* Decorative background glows */}
        <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500/10 to-transparent blur-2xl" />

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30">
            <Coins className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-400">ROAM Points</h3>
            <p className="text-xs text-slate-500">Your Balance</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <h2
              ref={balanceRef}
              className="text-6xl font-bold tracking-tighter text-white"
              aria-live="polite"
              aria-atomic="true"
            >
              0
            </h2>
            <span className="text-3xl font-semibold text-slate-400">pts</span>
          </div>
        </div>

        {/* Daily Rate */}
        <div className="mb-6 flex items-center gap-2 text-emerald-400">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <p className="text-sm font-medium">+{dailyRate} pts/day</p>
        </div>

        {/* Free Unlock Available Banner */}
        {canRedeem && (
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/60 to-amber-900/60 p-4 shadow-lg shadow-amber-500/20",
              "animate-in fade-in slide-in-from-bottom-4 duration-500"
            )}
          >
            {/* Glow overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 blur-xl" />

            {/* Animated border pulse */}
            <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl border-2 border-amber-400/30" />

            {/* Content */}
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full bg-amber-500/20">
                <Sparkles
                  className="h-5 w-5 animate-pulse text-amber-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-base font-bold text-amber-300">
                  Free Unlock Available!
                </p>
                <p className="text-xs text-amber-400/80">
                  You have enough points to redeem
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <GlassFilter />
    </div>
  );
}
