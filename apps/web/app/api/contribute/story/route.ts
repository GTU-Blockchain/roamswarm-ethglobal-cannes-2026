import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// ─── In-memory cache (primary, fast reads by Lore) ───────────────────────────
export interface ContributorStory {
  address:  string;
  ensName?: string;
  poiId:    string;
  poiName:  string;
  story:    string;
  tip?:     string;
  savedAt:  number;
}

declare global { var __poiStories: ContributorStory[] | undefined; }
globalThis.__poiStories ??= [];
const cache = globalThis.__poiStories;

// ─── ENSSubnameRegistry ABI (minimal) ────────────────────────────────────────
const ENS_ABI = [
  {
    name: 'addressToNode',
    type: 'function',
    stateMutability: 'view',
    inputs:  [{ name: 'contributor', type: 'address' }],
    outputs: [{ name: '',            type: 'bytes32'  }],
  },
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node',  type: 'bytes32' },
      { name: 'key',   type: 'string'  },
      { name: 'value', type: 'string'  },
    ],
    outputs: [],
  },
] as const;

const RPC_URL      = process.env.NEXT_PUBLIC_RPC_URL ?? 'https://rpc.sepolia.org';
const ENS_REGISTRY = process.env.ENS_SUBNAME_REGISTRY_CONTRACT as `0x${string}` | undefined;
const PRIVATE_KEY  = process.env.PRIVATE_KEY as `0x${string}` | undefined;

// ─── POST /api/contribute/story ───────────────────────────────────────────────
// Body: { address, ensName?, poiId, poiName, story, tip? }
export async function POST(req: Request) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { address, ensName, poiId, poiName, story, tip } = body;
  if (!address || !poiId || !poiName || !story) {
    return NextResponse.json({ error: 'address, poiId, poiName and story are required' }, { status: 400 });
  }

  // 1. Update in-memory cache
  const idx = cache.findIndex(
    (s) => s.address.toLowerCase() === address.toLowerCase() && s.poiId === poiId
  );
  const entry: ContributorStory = { address, ensName, poiId, poiName, story, tip, savedAt: Date.now() };
  if (idx >= 0) cache[idx] = entry; else cache.push(entry);

  // 2. Push updated stories to Lore agent → uploads to 0G Storage (fire-and-forget)
  const LORE_URL = process.env.LORE_URL || 'http://localhost:3002';
  const storiesForPoi = cache.filter((s) => s.poiId === poiId);
  fetch(`${LORE_URL}/store-context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poiId, stories: storiesForPoi }),
  }).catch((err: unknown) => console.warn('[contribute/story] Lore store-context failed:', err instanceof Error ? err.message : err));

  return NextResponse.json({ ok: true });
}

// ─── GET /api/contribute/story?poiId=cannes-01 ───────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const poiId = searchParams.get('poiId');
  const stories = poiId ? cache.filter((s) => s.poiId === poiId) : cache;
  return NextResponse.json({ stories });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeENSTextRecord(
  registryAddr: `0x${string}`,
  privateKey:   `0x${string}`,
  contributor:  `0x${string}`,
  poiId:        string,
  value:        object
) {
  const transport = http(RPC_URL);
  const publicClient = createPublicClient({ chain: sepolia, transport });

  // Get contributor's ENS node
  const node = await publicClient.readContract({
    address:      registryAddr,
    abi:          ENS_ABI,
    functionName: 'addressToNode',
    args:         [contributor],
  });

  if (node === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error(`Contributor ${contributor} has no ENS node`);
  }

  const account      = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({ account, chain: sepolia, transport });

  // key = "poi:cannes-01", value = JSON
  const key     = `poi:${poiId}`;
  const jsonVal = JSON.stringify(value);

  await walletClient.writeContract({
    address:      registryAddr,
    abi:          ENS_ABI,
    functionName: 'setText',
    args:         [node, key, jsonVal],
  });

  console.log(`[contribute/story] ENS text record written: ${contributor} → ${key}`);
}
