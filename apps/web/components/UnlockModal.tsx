'use client';

// TODO: POI unlock modal — two payment options
// - "Pay 0.5 USDC" button → triggers PaymentGate / x402 flow
// - "Use 500 Points" button → disabled if balance < 500, calls PointsRedeemer
// - Shows current points balance + daily earning rate
// - "Free Unlock Available!" gold highlight when balance >= 500
// - Close on backdrop click or Escape key
// - Dark glassmorphism style
// Props: poi, pointsBalance (bigint), onPayUSDC, onRedeemPoints, onClose

import type { POI } from '@/lib/geofence';

export interface UnlockModalProps {
  poi: POI;
  pointsBalance: bigint;
  onPayUSDC: () => void;
  onRedeemPoints: () => void;
  onClose: () => void;
}

export function UnlockModal({ poi, pointsBalance, onPayUSDC, onRedeemPoints, onClose }: UnlockModalProps) {
  return <></>;
}
