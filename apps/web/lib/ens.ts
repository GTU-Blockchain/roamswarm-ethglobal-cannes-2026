// ENS subname resolution — reads from ContributorRegistry on Sepolia
// wagmi hooks for client components; async helper for server pages

import { useReadContract, useAccount } from 'wagmi';
import { CONTRACTS, ContributorRegistryABI } from './contracts';

export const AGENT_ENS_NAMES = {
  orchestrator: 'orchestrator.roamswarm.eth',
  history:      'lore.roamswarm.eth',
  food:         'scout.roamswarm.eth',
  voice:        'guide.roamswarm.eth',
} as const;

// ─── Hook: get contributor ENS subname (client components) ───────────────────

export function useContributorENS(): string | null {
  const { address } = useAccount();
  const { data } = useReadContract({
    address:      CONTRACTS.contributorRegistry,
    abi:          ContributorRegistryABI,
    functionName: 'ensName',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
  if (!data || data === '') return null;
  return `${data}.contributors.roam.eth`;
}

// ─── Hook: is contributor verified? ─────────────────────────────────────────

export function useIsContributorVerified() {
  const { address } = useAccount();
  return useReadContract({
    address:      CONTRACTS.contributorRegistry,
    abi:          ContributorRegistryABI,
    functionName: 'isVerified',
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Server-side helper (profile/page.tsx uses this) ─────────────────────────
// Reads via fetch → /api/ens/[address] to avoid importing viem in client bundles

export async function getContributorENS(address: string): Promise<string | null> {
  if (!address || !address.startsWith('0x')) return null;
  try {
    const res = await fetch(`/api/ens/${address}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as { ens: string | null };
    return data.ens;
  } catch {
    return null;
  }
}
