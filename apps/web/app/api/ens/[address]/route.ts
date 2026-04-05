import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { CONTRACTS, ContributorRegistryABI } from '@/lib/contracts';

const mainnetClient = createPublicClient({
  chain:     mainnet,
  transport: http('https://cloudflare-eth.com'),
});

const sepoliaClient = createPublicClient({
  chain:     sepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.sepolia.org'),
});

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || !address.startsWith('0x')) {
    return NextResponse.json({ ens: null });
  }

  // 1. Try Sepolia ENS reverse lookup (primary — app runs on Sepolia)
  try {
    const ensName = await sepoliaClient.getEnsName({ address: address as `0x${string}` });
    if (ensName) {
      return NextResponse.json({ ens: ensName });
    }
  } catch {
    // sepolia ENS lookup failed, fall through
  }

  // 2. Try mainnet ENS reverse lookup
  try {
    const ensName = await mainnetClient.getEnsName({ address: address as `0x${string}` });
    if (ensName) {
      return NextResponse.json({ ens: ensName });
    }
  } catch {
    // mainnet lookup failed, fall through
  }

  // 3. Fall back to ContributorRegistry subname (roamswarm contributors only)
  try {
    const subname = await sepoliaClient.readContract({
      address:      CONTRACTS.contributorRegistry,
      abi:          ContributorRegistryABI,
      functionName: 'ensName',
      args:         [address as `0x${string}`],
    });

    const ens = subname && subname !== '' ? `${subname}.contributors.roam.eth` : null;
    return NextResponse.json({ ens });
  } catch {
    return NextResponse.json({ ens: null });
  }
}
