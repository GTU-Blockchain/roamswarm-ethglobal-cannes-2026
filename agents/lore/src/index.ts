// Lore Agent — lore.roamswarm.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// Runs LLM inference on 0G Compute to generate a POI history story

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import express from 'express';
import { ethers } from 'ethers';
import { MemData, Indexer } from '@0gfoundation/0g-ts-sdk';

// Memory Caches for Hackathon
const contributorCache = new Map<string, string>(); // poiId -> 0G Storage rootHash
const storyCache = new Map<string, string>(); // Cache Key -> Generated Story

const require = createRequire(import.meta.url);
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');

// Load root .env (two levels up from agents/lore/src/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Load POI data
const pois: { id: string; name: string; lat: number; lng: number }[] = require(
  path.resolve(__dirname, '../../../data/cannes-pois.json')
);

const app = express();
app.use(express.json());

// ERC-8004 identity metadata
const IDENTITY = {
  name: 'Lore Agent',
  ens: 'lore.roamswarm.eth',
  role: 'Generates hyper-local POI history stories via 0G Compute LLM inference',
  version: '0.1.0',
};

// 0G broker (lazy init)
let broker: Awaited<ReturnType<typeof createZGComputeNetworkBroker>> | null = null;

async function getBroker() {
  if (broker) return broker;
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  if (!privateKey) throw new Error('PRIVATE_KEY not set in environment');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  broker = await createZGComputeNetworkBroker(wallet);
  return broker;
}

interface ContributorStory {
  address: string;
  ensName?: string;
  story: string;
  tip?: string;
}

async function fetchContributorStories(poiId: string): Promise<ContributorStory[]> {
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${webUrl}/api/contribute?poiId=${poiId}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { stories: ContributorStory[] };
    return data.stories ?? [];
  } catch {
    return [];
  }
}

async function generateStory(poiName: string, lang: string, contributions: ContributorStory[]): Promise<string> {
  const providerAddress = process.env.OG_PROVIDER_ADDRESS;
  if (!providerAddress) throw new Error('OG_PROVIDER_ADDRESS not set');

  const b = await getBroker();
  const { endpoint, model } = await b.inference.getServiceMetadata(providerAddress);

  const contributionSection = contributions.length > 0
    ? `\n\nLocal community insights from verified contributors:\n${contributions.map((c, i) =>
        `- ${c.ensName ?? c.address.slice(0, 8) + '…'}: "${c.story}"${c.tip ? ` Tip: "${c.tip}"` : ''}`
      ).join('\n')}\n\nWeave these real local perspectives naturally into your story.`
    : '';

  const prompt = `You are a passionate local historian and storyteller. In 3-4 sentences, tell the fascinating history and cultural significance of "${poiName}" in Cannes, France. Make it vivid and engaging for a tourist standing right there. Respond in ${lang === 'fr' ? 'French' : 'English'}.${contributionSection}`;

  const headers = await b.inference.getRequestHeaders(providerAddress, prompt);

  const chatUrl = endpoint.endsWith('/chat/completions')
    ? endpoint
    : `${endpoint}/chat/completions`;

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`0G Compute error: ${response.status} — ${err}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

async function uploadTo0GStorage(dataBuffer: Buffer): Promise<string> {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const indexerUrl = process.env.OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';

  if (!privateKey) throw new Error('PRIVATE_KEY not set');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerUrl);

  const memData = new MemData(dataBuffer);

  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);

  const rootHash = tree!.rootHash();
  const [, uploadErr] = await indexer.upload(memData, rpcUrl, wallet);
  if (uploadErr !== null) throw new Error(`0G upload error: ${uploadErr}`);

  return `${indexerUrl}/file?root=${rootHash}`;
}

// POST /store-context (Contributor Data to 0G Storage)
app.post('/store-context', async (req, res) => {
  const { poiId, stories } = req.body;

  if (!poiId || !stories) {
    res.status(400).json({ error: 'poiId and stories are required' });
    return;
  }

  try {
    const dataBuffer = Buffer.from(JSON.stringify(stories), 'utf-8');
    console.log(`[Lore] Uploading contributor context for ${poiId} to 0G...`);
    const fileUrl = await uploadTo0GStorage(dataBuffer);
    
    // Extract root hash from URL or fallback to string
    const hash = fileUrl.split('?root=')[1] || fileUrl;
    contributorCache.set(poiId, hash);
    console.log(`[Lore] Contributor Context stored on 0G. Hash: ${hash} (Cached in Memory)`);

    res.json({ success: true, poiId, hash });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Lore] store-context error:', message);
    res.status(500).json({ error: message });
  }
});

// POST /generate
app.post('/generate', async (req, res) => {
  const { poiId, lang = 'en' } = req.body;

  if (!poiId) {
    res.status(400).json({ error: 'poiId is required' });
    return;
  }

  const poi = pois.find((p) => p.id === poiId);
  if (!poi) {
    res.status(404).json({ error: `POI not found: ${poiId}` });
    return;
  }

  // Fetch contributions first so we can include them in the cache key to auto-invalidate!
  const contributions = await fetchContributorStories(poiId);
  const cacheKey = `${poiId}-${lang}-${contributions.length}`;

  if (storyCache.has(cacheKey)) {
    console.log(`[Lore] Serving generated story from memory cache for ${cacheKey}`);
    res.json({ poiId, poiName: poi.name, lang, story: storyCache.get(cacheKey) });
    return;
  }


  try {
    console.log(`[Lore] Generating new story for ${poiId} (Contributors: ${contributions.length})`);
    const story = await generateStory(poi.name, lang, contributions);
    storyCache.set(cacheKey, story);
    res.json({ poiId, poiName: poi.name, lang, story });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Lore] Error:', message);
    res.status(500).json({ error: message });
  }
});

// GET /identity — ERC-8004
app.get('/identity', (_req, res) => {
  res.json(IDENTITY);
});

// GET /health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: IDENTITY.ens });
});

const PORT = process.env.LORE_PORT || 3002;
app.listen(PORT, () => console.log(`Lore Agent (${IDENTITY.ens}) running on :${PORT}`));
