"use client";

import React, { useEffect, useState } from "react";

export interface CityProgressProps {
  unlocked: number;
  total: number;
  cityName: string;
}

export function CityProgress({ unlocked, total, cityName }: CityProgressProps) {
  const [mounted, setMounted] = useState(false);

  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes cityProgressFill {
          from {
            stroke-dashoffset: ${circumference};
          }
          to {
            stroke-dashoffset: ${strokeDashoffset};
          }
        }
        .city-progress-ring {
          animation: cityProgressFill 1.5s ease-out forwards;
        }
        @keyframes cityProgressFadeIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .city-progress-card {
          animation: cityProgressFadeIn 0.6s ease-out forwards;
        }
      `}</style>

      <div className="flex items-center justify-center w-full p-4">
        {/* Glassmorphism card */}
        <div
          className="city-progress-card relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl p-8 w-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
            minWidth: "0",
            maxWidth: "320px",
          }}
        >
          {/* Ambient glow blobs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* SVG ring */}
            <div className="relative mb-6">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
                aria-label={`${cityName} progress: ${percentage}%`}
              >
                <defs>
                  <linearGradient
                    id="cityProgressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>

                {/* Track ring */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />

                {/* Progress arc — only rendered after mount so animation triggers */}
                {mounted && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="url(#cityProgressGradient)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    className="city-progress-ring"
                    style={{
                      filter: "drop-shadow(0 0 8px rgba(168, 85, 247, 0.45))",
                    }}
                  />
                )}
              </svg>

              {/* Center text (sits over the ring, reads upright) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-1 text-center px-2 truncate max-w-[160px]">
                  {cityName}
                </h2>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                  {percentage}%
                </p>
              </div>
            </div>

            {/* Fraction row */}
            <div className="w-full pt-4 border-t border-white/10">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {unlocked}
                </span>
                <span className="text-lg text-zinc-400 font-medium">/</span>
                <span className="text-2xl sm:text-3xl font-bold text-zinc-400">
                  {total}
                </span>
                <span className="text-sm text-zinc-500 uppercase tracking-wider font-medium ml-1">
                  POIs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CityProgress;
