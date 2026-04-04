// RoamPoints + PointsRedeemer contract interaction hooks
// Uses wagmi v2 — call these inside React components

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import {
  CONTRACTS,
  RoamPointsABI,
  PointsRedeemerABI,
  poiIdFromSlug,
} from './contracts';

export const UNLOCK_THRESHOLD    = 500n * 10n ** 18n; // 500 ROAM
export const POINTS_PER_POI_PER_DAY = 10n * 10n ** 18n; // 10 ROAM

// ─── Read: ROAM balance ───────────────────────────────────────────────────────

export function useRoamBalance() {
  const { address } = useAccount();
  return useReadContract({
    address:      CONTRACTS.roamPoints,
    abi:          RoamPointsABI,
    functionName: 'balanceOf',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Read: can user redeem? ───────────────────────────────────────────────────

export function useCanRedeem() {
  const { address } = useAccount();
  return useReadContract({
    address:      CONTRACTS.pointsRedeemer,
    abi:          PointsRedeemerABI,
    functionName: 'canRedeem',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Read: last claimed timestamp ────────────────────────────────────────────

export function useLastClaimed() {
  const { address } = useAccount();
  return useReadContract({
    address:      CONTRACTS.roamPoints,
    abi:          RoamPointsABI,
    functionName: 'lastClaimed',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Read: claim interval (seconds) ─────────────────────────────────────────

export function useClaimInterval() {
  return useReadContract({
    address:      CONTRACTS.roamPoints,
    abi:          RoamPointsABI,
    functionName: 'CLAIM_INTERVAL',
  });
}

// ─── Write: claimDailyPoints ──────────────────────────────────────────────────

export function useClaimDailyPoints() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claimDailyPoints() {
    writeContract({
      address:      CONTRACTS.roamPoints,
      abi:          RoamPointsABI,
      functionName: 'claimDailyPoints',
    });
  }

  return { claimDailyPoints, isPending, isConfirming, isSuccess, error };
}

// ─── Write: redeemForUnlock ───────────────────────────────────────────────────

export function useRedeemForUnlock() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function redeemForUnlock(poiSlug: string) {
    writeContract({
      address:      CONTRACTS.pointsRedeemer,
      abi:          PointsRedeemerABI,
      functionName: 'redeemForUnlock',
      args:         [poiIdFromSlug(poiSlug)],
    });
  }

  return { redeemForUnlock, isPending, isConfirming, isSuccess, error };
}

// ─── Pure helper ─────────────────────────────────────────────────────────────

export function canRedeem(balance: bigint): boolean {
  return balance >= UNLOCK_THRESHOLD;
}

/** Format ROAM balance from wei to human-readable integer */
export function formatRoam(raw: bigint): number {
  return Number(raw / 10n ** 18n);
}
