// Orchestrator Agent — orchestrator.roam.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// Triggered by geofence event; coordinates Lore + Scout + Guide agents in parallel

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(express.json());

const IDENTITY = {
  name: 'Orchestrator Agent',
  ens: 'orchestrator.roam.eth',
  role: 'Coordinates Lore, Scout and Guide agents in parallel for POI experiences',
  version: '0.1.0',
};

const LORE_URL  = process.env.LORE_URL  || 'http://localhost:3002';
const SCOUT_URL = process.env.SCOUT_URL || 'http://localhost:3003';
const GUIDE_URL = process.env.GUIDE_URL || 'http://localhost:3004';

async function callLore(poiId: string, lang: string): Promise<string> {
  const res = await fetch(`${LORE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poiId, lang }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Lore agent error: ${res.status}`);
  const data = await res.json() as { story: string };
  return data.story;
}

async function callScout(poiId: string): Promise<{ name: string; isOpen: boolean | null; note: string }> {
  const res = await fetch(`${SCOUT_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poiId }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Scout agent error: ${res.status}`);
  const data = await res.json() as { name: string; isOpen: boolean | null; note: string };
  return { name: data.name, isOpen: data.isOpen, note: data.note };
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

// POST /orchestrate — main endpoint
app.post('/orchestrate', async (req, res) => {
  const { poiId, userId = 'anonymous', lang = 'en' } = req.body;

  if (!poiId) {
    res.status(400).json({ error: 'poiId is required' });
    return;
  }

  console.log(`[Orchestrator] Starting experience for ${poiId} (user: ${userId}, lang: ${lang})`);
  const startTime = Date.now();

  try {
    // Step 1: Generate story (Lore) — needed before Guide can synthesize
    console.log('[Orchestrator] Calling Lore agent...');
    const story = await callLore(poiId, lang);
    console.log('[Orchestrator] Lore done.');

    // Step 2: Scout + Guide in parallel (Guide needs story, Scout is independent)
    console.log('[Orchestrator] Calling Scout + Guide in parallel...');
    const [venue, audioUrl] = await Promise.all([
      callScout(poiId).catch((err) => {
        console.warn('[Orchestrator] Scout failed, using fallback:', err.message);
        return { name: 'Nearby venue', isOpen: null, note: 'Venue data unavailable' };
      }),
      callGuide(story, lang, poiId).catch((err) => {
        console.warn('[Orchestrator] Guide failed, using fallback:', err.message);
        return '';
      }),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[Orchestrator] Done in ${elapsed}ms`);

    res.json({ poiId, story, venue, audioUrl, elapsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Orchestrator] Error:', message);
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

const PORT = process.env.ORCHESTRATOR_PORT || 3001;
app.listen(PORT, () => console.log(`Orchestrator (${IDENTITY.ens}) running on :${PORT}`));
