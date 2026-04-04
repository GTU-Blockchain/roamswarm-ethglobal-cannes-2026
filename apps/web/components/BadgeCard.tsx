'use client';

import React, { useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CityBadge } from '@/lib/badges';

const CITY_GRADIENTS: Record<string, string> = {
  cannes: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  paris:  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  nice:   'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
};
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)';

export function BadgeCard({ badge }: { badge: CityBadge }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const gradient = CITY_GRADIENTS[badge.cityId] ?? DEFAULT_GRADIENT;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const formattedDate = new Date(badge.completedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="relative w-full max-w-sm mx-auto p-4">
      <style>{`
        @keyframes badgeShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <Card
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
      >
        {/* Holographic rainbow shimmer */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%,
              rgba(255,0,255,0.4) 0%, rgba(0,255,255,0.3) 20%,
              rgba(255,255,0,0.3) 40%, rgba(255,0,0,0.2) 60%, transparent 80%)`,
            mixBlendMode: 'screen',
          }}
        />

        {/* Rainbow border */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `conic-gradient(from ${mousePosition.x * 3.6}deg at ${mousePosition.x}% ${mousePosition.y}%,
              #ff0080, #ff8c00, #ffff00, #00ff00, #00ffff, #0080ff, #8000ff, #ff0080)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '2px',
          }}
        />

        <div className="relative z-10 p-6">
          {/* Token ID */}
          {badge.tokenId !== undefined && (
            <div className="absolute top-4 right-4 z-30">
              <Badge variant="secondary"
                className="bg-black/80 backdrop-blur-sm text-white border-white/20 font-mono text-xs shadow-lg">
                #{badge.tokenId}
              </Badge>
            </div>
          )}

          {/* Artwork */}
          <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden">
            <div className="absolute inset-0 animate-pulse" style={{ background: gradient }} />
            {badge.imageUri && (
              <img src={badge.imageUri} alt={badge.cityName}
                className="relative z-10 w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovered ? 0.3 : 0,
                background: `linear-gradient(${mousePosition.x * 3.6}deg,
                  rgba(255,0,255,0.3), rgba(0,255,255,0.3), rgba(255,255,0,0.3))`,
                mixBlendMode: 'overlay',
              }}
            />
          </div>

          {/* City name */}
          <h3 className="text-2xl font-bold text-white mb-3 tracking-tight drop-shadow-lg">
            {badge.cityName}
          </h3>

          {/* Completion date */}
          <div className="flex items-center gap-2 text-sm text-white/90 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="drop-shadow-md">Completed {formattedDate}</span>
          </div>

          {/* POI count */}
          <div className="flex items-center gap-2 text-white/95">
            <MapPin className="w-4 h-4 text-white drop-shadow-md" />
            <span className="text-sm font-medium drop-shadow-md">
              {badge.poiCount} {badge.poiCount === 1 ? 'Location' : 'Locations'} Visited
            </span>
          </div>

          {/* Bottom gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 opacity-70" style={{ background: gradient }} />
        </div>

        {/* Shimmer sweep */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.15 : 0,
            background: 'linear-gradient(110deg, transparent 0%, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: isHovered ? 'badgeShimmer 2s infinite' : 'none',
          }}
        />
      </Card>
    </div>
  );
}
