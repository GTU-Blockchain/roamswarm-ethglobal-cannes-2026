# Roam-Swarm Agent Endpoints

All agents run locally during development. Start each in a separate terminal.

## Quick Start

```bash
# Terminal 1
cd agents/lore && npm install && npm run dev       # :3002

# Terminal 2
cd agents/scout && npm install && npm run dev      # :3003

# Terminal 3
cd agents/guide && npm install && npm run dev      # :3004

# Terminal 4
cd agents/orchestrator && npm install && npm run dev  # :3001
```

---

## Orchestrator — port 3001

The main entry point. Calls Lore → Scout + Guide in parallel.

### POST /orchestrate
Full JSON response (waits for all agents).

```bash
curl -X POST http://localhost:3001/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"poiId":"cannes-01","lang":"en","userId":"0xabc"}'
```

**Response:**
```json
{
  "poiId": "cannes-01",
  "story": "The Palais des Festivals...",
  "venue": { "name": "Palais des Festivals", "isOpen": null, "note": "..." },
  "audioUrl": "https://indexer-storage-testnet-turbo.0g.ai/file?root=0x...",
  "elapsed": 27878
}
```

### GET /orchestrate/stream
SSE streaming — sends events as each agent completes. Use this in the frontend for live loading states.

```bash
curl -N "http://localhost:3001/orchestrate/stream?poiId=cannes-01&lang=en"
```

**Events (in order):**
| Event | Data |
|---|---|
| `status` | `{ step: "scout", message: "Finding nearby venues..." }` |
| `status` | `{ step: "lore", message: "Generating historical story..." }` |
| `story` | `{ story: "..." }` |
| `venue` | `{ venue: { name, isOpen, note } }` |
| `status` | `{ step: "guide", message: "Synthesizing audio narration..." }` |
| `audio` | `{ audioUrl: "https://..." }` |
| `done` | Full result object |
| `error` | `{ error: "..." }` (only on failure) |

### GET /health
```bash
curl http://localhost:3001/health
# → { "status": "ok", "agent": "orchestrator.roam.eth" }
```

### GET /identity
```bash
curl http://localhost:3001/identity
# → { "name": "Orchestrator Agent", "ens": "orchestrator.roam.eth", ... }
```

---

## Lore Agent — port 3002

Generates POI history stories via 0G Compute (Qwen 2.5 7B LLM).

### POST /generate
```bash
curl -X POST http://localhost:3002/generate \
  -H "Content-Type: application/json" \
  -d '{"poiId":"cannes-01","lang":"en"}'
```

**Response:**
```json
{
  "poiId": "cannes-01",
  "poiName": "Palais des Festivals",
  "lang": "en",
  "story": "Right before your eyes stands the iconic Palais des Festivals..."
}
```

**Supported POI IDs:** `cannes-01` → `cannes-12`  
**Supported langs:** `en`, `fr`  
**Latency:** ~25-45s (0G Compute LLM)

---

## Scout Agent — port 3003

Fetches real-time venue data via Google Places API (Chainlink CRE confidential HTTP).

### POST /recommend
```bash
curl -X POST http://localhost:3003/recommend \
  -H "Content-Type: application/json" \
  -d '{"poiId":"cannes-01"}'
```

**Response:**
```json
{
  "poiId": "cannes-01",
  "name": "Palais des Festivals",
  "isOpen": true,
  "rating": 4.6,
  "note": "Open now · Rating: 4.6 ⭐",
  "source": "google-places-cre"
}
```

> If `GOOGLE_PLACES_KEY` is not set, returns `source: "fallback"` with `isOpen: null`.

---

## Guide Agent — port 3004

Text-to-speech via ElevenLabs → uploads MP3 to 0G Storage → returns URL.

### POST /synthesize
```bash
curl -X POST http://localhost:3004/synthesize \
  -H "Content-Type: application/json" \
  -d '{"story":"The Palais des Festivals has hosted the Cannes Film Festival since 1949.","lang":"en","poiId":"cannes-01"}'
```

**Response:**
```json
{
  "audioUrl": "https://indexer-storage-testnet-turbo.0g.ai/file?root=0x...",
  "storage": "0g-storage",
  "size": 77784,
  "poiId": "cannes-01",
  "lang": "en"
}
```

> `audioUrl` is a permanent 0G Storage URL. Play directly in `<audio src="...">`.  
> If 0G Storage fails, `storage: "base64-fallback"` is returned instead.

---

## Frontend API Route

### GET /api/experience/[id]
Proxies to the Orchestrator. Use from Next.js frontend.

```typescript
// Standard JSON
const res = await fetch('/api/experience/cannes-01?lang=en');
const data = await res.json();
// → { story, venue, audioUrl, elapsed }

// SSE Streaming (recommended — shows loading steps)
const eventSource = new EventSource('/api/experience/cannes-01?stream=true&lang=en');
eventSource.addEventListener('story', (e) => {
  const { story } = JSON.parse(e.data);
  // show story immediately
});
eventSource.addEventListener('audio', (e) => {
  const { audioUrl } = JSON.parse(e.data);
  // start playing audio
});
eventSource.addEventListener('done', () => {
  eventSource.close();
});
```

---

## Environment Variables (agents)

| Variable | Required | Description |
|---|---|---|
| `PRIVATE_KEY` | ✅ | MetaMask wallet private key (0G auth + storage fees) |
| `OG_RPC_URL` | ✅ | `https://evmrpc-testnet.0g.ai` |
| `OG_PROVIDER_ADDRESS` | ✅ | 0G Compute provider address |
| `OG_COMPUTE_API_KEY` | ✅ | `app-sk-xxx` from `0g-compute-cli inference get-secret` |
| `OG_STORAGE_INDEXER` | ✅ | `https://indexer-storage-testnet-turbo.0g.ai` |
| `ELEVENLABS_API_KEY` | ✅ | ElevenLabs API key (free tier) |
| `GOOGLE_PLACES_KEY` | ⚠️ Optional | Google Places API key (Scout real data) |
| `ORCHESTRATOR_URL` | ⚠️ Optional | Default: `http://localhost:3001` |
| `LORE_URL` | ⚠️ Optional | Default: `http://localhost:3002` |
| `SCOUT_URL` | ⚠️ Optional | Default: `http://localhost:3003` |
| `GUIDE_URL` | ⚠️ Optional | Default: `http://localhost:3004` |
