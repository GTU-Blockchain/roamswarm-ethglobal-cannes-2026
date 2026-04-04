import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { CONTRACTS, ContributorRegistryABI } from '@/lib/contracts';

const client = createPublicClient({
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

  try {
    const subname = await client.readContract({
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
