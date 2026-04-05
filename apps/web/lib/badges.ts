// City badge interactions — CityBadgeNFT + CityRegistry contracts
// React hooks for client components, plain functions for server-side use

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount } from 'wagmi';
import {
  CONTRACTS,
  CityBadgeNFTABI,
  CityRegistryABI,
  cityIdFromSlug,
} from './contracts';

export interface CityBadge {
  cityId: string;
  cityName: string;
  completedAt: string;
  poiCount: number;
  imageUri: string;
  tokenId?: number;
}

// ─── Read: does user have badge for a city? ───────────────────────────────────

export function useHasBadge(citySlug: string) {
  const { address } = useAccount();
  return useReadContract({
    address:      CONTRACTS.cityBadgeNFT,
    abi:          CityBadgeNFTABI,
    functionName: 'hasBadge',
    args:         address ? [address, cityIdFromSlug(citySlug)] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Read: city metadata from CityRegistry ───────────────────────────────────

export function useCityInfo(citySlug: string) {
  return useReadContract({
    address:      CONTRACTS.cityRegistry,
    abi:          CityRegistryABI,
    functionName: 'cities',
    args:         [cityIdFromSlug(citySlug)],
  });
}

// ─── Read: total POI count for a city ────────────────────────────────────────

export function useCityPOICount(citySlug: string) {
  return useReadContract({
    address:      CONTRACTS.cityRegistry,
    abi:          CityRegistryABI,
    functionName: 'getCityPOICount',
    args:         [cityIdFromSlug(citySlug)],
  });
}

// ─── Write: checkAndMint (call after every POI unlock) ───────────────────────

export function useCheckAndMint() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function checkAndMint(userAddress: `0x${string}`, citySlug: string) {
    writeContract({
      address:      CONTRACTS.cityBadgeNFT,
      abi:          CityBadgeNFTABI,
      functionName: 'checkAndMint',
      args:         [userAddress, cityIdFromSlug(citySlug)],
    });
  }

  return { checkAndMint, isPending, isConfirming, isSuccess, error };
}

// ─── Server-side stub (profile page still uses async pattern for badges) ─────
// CityBadgeNFT doesn't expose a token list per user — we only know hasBadge(user, cityId).
// We check all known cities and return those where hasBadge == true.

const KNOWN_CITIES = ['cannes'] as const;

export async function getUserBadges(_userAddress: string): Promise<CityBadge[]> {
  // Badges are now fetched via useHasBadge() hooks in components.
  // This function returns an empty array as a safe fallback;
  // the profile page will show mock data until wagmi reads land.
  return [];
}

export async function checkAndMintBadge(_userAddress: string, _cityId: string): Promise<boolean> {
  // Use useCheckAndMint() hook from client components instead.
  return false;
}
