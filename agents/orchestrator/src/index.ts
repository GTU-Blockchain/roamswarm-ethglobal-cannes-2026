// Orchestrator Agent — orchestrator.roamswarm.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// Coordinates Lore + Scout + Guide agents, streams progress via SSE

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load apps/web/.env first (has PRIVATE_KEY for escrow owner), then fall back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../../apps/web/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(express.json());

const IDENTITY = {
  name: 'Orchestrator Agent',
  ens: 'orchestrator.roamswarm.eth',
  role: 'Coordinates Lore, Scout and Guide agents in parallel for POI experiences',
  version: '0.1.0',
};

const LORE_URL  = process.env.LORE_URL  || 'http://localhost:3002';
const SCOUT_URL = process.env.SCOUT_URL || 'http://localhost:3003';
const GUIDE_URL = process.env.GUIDE_URL || 'http://localhost:3004';

// ─── Escrow release (called after agent delivers audioUrl) ────────────────────

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT;
const PRIVATE_KEY    = process.env.PRIVATE_KEY;
const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL || process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

const ESCROW_ABI = [
  'function release(bytes32 poiId, address payer, string calldata audioUrl) external',
];

async function releaseEscrow(poiSlug: string, payer: string, audioUrl: string): Promise<void> {
  if (!PRIVATE_KEY || !ESCROW_ADDRESS || !audioUrl || !payer) return;
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const escrow   = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const poiId    = ethers.keccak256(ethers.toUtf8Bytes(poiSlug));
    const tx       = await (escrow.release as (poiId: string, payer: string, audioUrl: string) => Promise<ethers.TransactionResponse>)(poiId, payer, audioUrl);
    console.log(`[Orchestrator] Escrow released for ${poiSlug} (payer: ${payer}): ${tx.hash}`);
  } catch (err: unknown) {
    // Non-fatal: escrow may not have a payment locked (dev mode)
    console.warn('[Orchestrator] Escrow release skipped:', err instanceof Error ? err.message : err);
  }
}

async function callLore(poiId: string, lang: string): Promise<string> {
  const res = await fetch(`${LORE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poiId, lang }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Lore agent error: ${res.status}`);
  const data = await res.json() as { story: string };
  return data.story;
}

interface VenueResult { name: string; isOpen: boolean | null; note: string; lat: number; lng: number }

function placeToVenue(p: { name: string; isOpen: boolean | null; rating: number | null; lat: number; lng: number; types: string[] }): VenueResult {
  const ratingNote = p.rating ? ` · ${p.rating}⭐` : '';
  const typeLabel  = p.types?.[0]?.replace(/_/g, ' ') ?? 'venue';
  return { name: p.name, isOpen: p.isOpen, note: `Nearby ${typeLabel}${ratingNote}`, lat: p.lat, lng: p.lng };
}

async function callScout(poiId: string): Promise<{ venue: VenueResult; venues: VenueResult[] }> {
  const res = await fetch(`${SCOUT_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poiId }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Scout agent error: ${res.status}`);
  const data = await res.json() as {
    places: { name: string; isOpen: boolean | null; rating: number | null; lat: number; lng: number; types: string[] }[];
  };
  if (!data.places?.length) throw new Error('Scout returned no places');
  // Sort by rating desc, pick highest as top venue
  const sorted = [...data.places].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const venues = sorted.map(placeToVenue);
  return { venue: venues[0], venues };
}

async function callGuide(story: string, lang: string, poiId: string): Promise<string> {
  const res = await fetch(`${GUIDE_URL}/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ story, lang, poiId }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Guide agent error: ${res.status}`);
  const data = await res.json() as { audioUrl: string };
  return data.audioUrl;
}

// POST /orchestrate — JSON response (for direct API calls)
app.post('/orchestrate', async (req, res) => {
  const { poiId, userId = 'anonymous', lang = 'en', userAddress = '' } = req.body;

  if (!poiId) {
    res.status(400).json({ error: 'poiId is required' });
    return;
  }

  console.log(`[Orchestrator] Starting experience for ${poiId} (user: ${userId}, lang: ${lang})`);
  const startTime = Date.now();

  try {
    // Lore first (story needed for Guide)
    const story = await callLore(poiId, lang);

    // Scout + Guide in parallel
    const [scoutResult, audioUrl] = await Promise.all([
      callScout(poiId).catch((err: Error) => {
        console.warn('[Orchestrator] Scout failed:', err.message);
        const fallback = { name: 'Nearby venue', isOpen: null, note: 'Venue data unavailable', lat: 0, lng: 0 };
        return { venue: fallback, venues: [fallback] };
      }),
      callGuide(story, lang, poiId).catch((err: Error) => {
        console.warn('[Orchestrator] Guide failed:', err.message);
        return '';
      }),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[Orchestrator] Done in ${elapsed}ms`);
    res.json({ poiId, story, venue: scoutResult.venue, venues: scoutResult.venues, audioUrl, elapsed });

    // Fire-and-forget: release escrow payment after delivering audioUrl
    releaseEscrow(poiId, userAddress, audioUrl).catch(() => {});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Orchestrator] Error:', message);
    res.status(500).json({ error: message });
  }
});

// GET /orchestrate/stream — SSE streaming (step-by-step progress for frontend)
app.get('/orchestrate/stream', async (req: Request, res: Response) => {
  const { poiId, lang = 'en', userAddress = '' } = req.query as Record<string, string>;

  if (!poiId) {
    res.status(400).json({ error: 'poiId is required' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const startTime = Date.now();
  console.log(`[Orchestrator/SSE] Starting ${poiId}`);

  try {
    // Step 1: Scout (fast, start immediately)
    send('status', { step: 'scout', message: 'Finding nearby venues...' });
    const scoutPromise = callScout(poiId).catch((err: Error) => {
      console.warn('[Orchestrator/SSE] Scout failed:', err.message);
      const fallback = { name: 'Nearby venue', isOpen: null, note: 'Venue data unavailable', lat: 0, lng: 0 };
      return { venue: fallback, venues: [fallback] };
    });

    // Step 2: Lore (slow LLM)
    send('status', { step: 'lore', message: 'Generating historical story via 0G Compute...' });
    const story = await callLore(poiId, lang);
    send('story', { story });

    // Step 3: Venue result (should be done by now)
    const scoutResult = await scoutPromise;
    send('venue', { venue: scoutResult.venue, venues: scoutResult.venues });

    // Step 4: Guide (TTS + 0G Storage)
    send('status', { step: 'guide', message: 'Synthesizing audio narration...' });
    const audioUrl = await callGuide(story, lang, poiId).catch((err: Error) => {
      console.warn('[Orchestrator/SSE] Guide failed:', err.message);
      return '';
    });
    send('audio', { audioUrl });

    const elapsed = Date.now() - startTime;
    send('done', { poiId, story, venue: scoutResult.venue, venues: scoutResult.venues, audioUrl, elapsed });
    console.log(`[Orchestrator/SSE] Done in ${elapsed}ms`);

    // Fire-and-forget: release escrow after SSE delivery
    releaseEscrow(poiId, userAddress, audioUrl).catch(() => {});
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Orchestrator/SSE] Error:', message);
    send('error', { error: message });
  } finally {
    res.end();
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

const PORT = process.env.ORCHESTRATOR_PORT || 3001;
app.listen(PORT, () => console.log(`Orchestrator (${IDENTITY.ens}) running on :${PORT}`));
