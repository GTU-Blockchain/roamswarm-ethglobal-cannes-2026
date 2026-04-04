// Guide Agent — guide.roamswarm.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// TTS via ElevenLabs → upload to 0G Storage → return stream URL

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { ethers } from 'ethers';
import { MemData, Indexer } from '@0gfoundation/0g-ts-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(express.json());

// Memory Cache for Hackathon
const audioCache = new Map<string, { audioUrl: string, storage: string, size: number }>();

const IDENTITY = {
  name: 'Guide Agent',
  ens: 'guide.roamswarm.eth',
  role: 'Text-to-speech narration via ElevenLabs TTS, stored on 0G Storage',
  version: '0.1.0',
};

const ELEVENLABS_MODEL = 'eleven_multilingual_v2';

// Fetch first available voice for this account (free tier compatible)
async function getVoiceId(apiKey: string): Promise<string> {
  if (process.env.ELEVENLABS_VOICE_ID) return process.env.ELEVENLABS_VOICE_ID;
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices error: ${res.status}`);
  const data = await res.json() as { voices: { voice_id: string; name: string }[] };
  if (!data.voices?.length) throw new Error('No voices available on this ElevenLabs account');
  console.log('[Guide] Using voice:', data.voices[0].name, data.voices[0].voice_id);
  return data.voices[0].voice_id;
}

async function textToSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const voiceId = await getVoiceId(apiKey);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} — ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadTo0GStorage(audioBuffer: Buffer, _poiId: string): Promise<string> {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
  const indexerUrl = process.env.OG_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai';

  if (!privateKey) throw new Error('PRIVATE_KEY not set');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const indexer = new Indexer(indexerUrl);

  const memData = new MemData(audioBuffer);

  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);

  const rootHash = tree!.rootHash();
  const audioUrl = `${indexerUrl}/file?root=${rootHash}`;
  console.log('[Guide] 0G root hash:', rootHash);

  // Start upload but don't wait for finalization — return URL immediately
  // 0G finalization can take minutes; file is accessible once segments are uploaded
  indexer.upload(memData, rpcUrl, wallet).then(([, err]) => {
    if (err) console.warn('[Guide] 0G upload background error:', err);
    else console.log('[Guide] 0G upload finalized:', audioUrl);
  }).catch((e: unknown) => console.warn('[Guide] 0G upload exception:', e));

  console.log('[Guide] Returning URL immediately (upload in background):', audioUrl);
  return audioUrl;
}

// POST /synthesize — main endpoint
app.post('/synthesize', async (req, res) => {
  const { story, lang = 'en', poiId = 'unknown' } = req.body;

  if (!story) {
    res.status(400).json({ error: 'story is required' });
    return;
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY not set' });
    return;
  }

  const cacheKey = `${poiId}-${lang}`;
  if (audioCache.has(cacheKey)) {
    console.log(`[Guide] Serving generated audio from memory cache for ${cacheKey}`);
    const cachedData = audioCache.get(cacheKey);
    res.json({ ...cachedData, poiId, lang });
    return;
  }

  try {
    // Step 1: TTS
    console.log('[Guide] Generating TTS for:', poiId);
    const audioBuffer = await textToSpeech(story);
    console.log('[Guide] TTS complete, size:', audioBuffer.length, 'bytes');

    // Step 2: Upload to 0G Storage
    let audioUrl: string;
    let storage: string;

    try {
      audioUrl = await uploadTo0GStorage(audioBuffer, poiId);
      storage = '0g-storage';
    } catch (storageErr) {
      // Fallback: return audio as base64 if 0G Storage fails
      const errMsg = storageErr instanceof Error ? storageErr.message : String(storageErr);
      console.warn('[Guide] 0G Storage failed, using base64 fallback:', errMsg);
      audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
      storage = 'base64-fallback';
    }

    // Save to Cache
    audioCache.set(cacheKey, { audioUrl, storage, size: audioBuffer.length });

    res.json({ audioUrl, storage, size: audioBuffer.length, poiId, lang });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Guide] Error:', message);
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

const PORT = process.env.GUIDE_PORT || 3004;
app.listen(PORT, () => console.log(`Guide Agent (${IDENTITY.ens}) running on :${PORT}`));
