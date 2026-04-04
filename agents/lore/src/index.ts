// Lore Agent — lore.roamswarm.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// Runs LLM inference on 0G Compute to generate a POI history story

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import express from 'express';
import { ethers } from 'ethers';

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

async function generateStory(poiName: string, lang: string): Promise<string> {
  const providerAddress = process.env.OG_PROVIDER_ADDRESS;
  if (!providerAddress) throw new Error('OG_PROVIDER_ADDRESS not set');

  const b = await getBroker();
  const { endpoint, model } = await b.inference.getServiceMetadata(providerAddress);

  const prompt = `You are a passionate local historian and storyteller. In 3-4 sentences, tell the fascinating history and cultural significance of "${poiName}" in Cannes, France. Make it vivid and engaging for a tourist standing right there. Respond in ${lang === 'fr' ? 'French' : 'English'}.`;

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

  try {
    const story = await generateStory(poi.name, lang);
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
