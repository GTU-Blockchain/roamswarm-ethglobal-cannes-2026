# Roam-Swarm — Developer Setup Guide

This guide is for any developer setting up the project from scratch.
**Dev 1 (Frontend), Dev 2 (Contracts), and Dev 3 (Agents)** — all common steps are documented here.

---

## Prerequisites

Make sure the following tools are installed on your machine:

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | v20+ | `node --version` |
| npm | v9+ | `npm --version` |
| Git | any | `git --version` |
| MetaMask | browser extension | — |

---

## 1. Clone the Repo

```bash
git clone https://github.com/TEAM_NAME/roamswarm-ethglobal-cannes-2026.git
cd roamswarm-ethglobal-cannes-2026
```

---

## 2. Create the .env File

```bash
cp .env.example .env
```

Open `.env` and fill in the sections below.

---

## 3. Get API Keys

### A. MetaMask Private Key (REQUIRED — everyone)

Open MetaMask → click the account icon → **Account Details** → **Show private key** → copy it.

```env
PRIVATE_KEY=0xyour_private_key_here
```

> ⚠️ Never share your private key with anyone. The `.env` file is in `.gitignore` and will not be pushed to GitHub.

---

### B. 0G Testnet Setup (REQUIRED — Agents)

0G is a blockchain-based AI compute and storage infrastructure. It works through your wallet.

**Step 1:** Add the 0G testnet to MetaMask:
| Field | Value |
|---|---|
| Network Name | 0G-Galileo-Testnet |
| RPC URL | `https://evmrpc-testnet.0g.ai` |
| Chain ID | `16602` |
| Symbol | `0G` |

**Step 2:** Get tokens from the faucet:
- [https://faucet.0g.ai](https://faucet.0g.ai) → enter your MetaMask address → request tokens
- Google Cloud faucet (more tokens): [https://cloud.google.com/application/web3/faucet/0g/galileo](https://cloud.google.com/application/web3/faucet/0g/galileo)

**Step 3:** Install the 0G Compute CLI (PowerShell):
```powershell
# Set pnpm PATH
pnpm config set global-bin-dir "C:\Users\YOUR_USERNAME\AppData\Local\pnpm"
$env:PATH += ";C:\Users\YOUR_USERNAME\AppData\Local\pnpm"

# Install SDK
pnpm add @0glabs/0g-serving-broker -g
```

**Step 4:** Set up the network and log in:
```powershell
0g-compute-cli setup-network   # select testnet
0g-compute-cli login           # enter your private key
0g-compute-cli deposit --amount 5
0g-compute-cli inference list-providers   # copy the provider address
0g-compute-cli transfer-fund --provider PROVIDER_ADDRESS --amount 1
0g-compute-cli inference get-secret --provider PROVIDER_ADDRESS
# → copy the output (app-sk-XXXX)
```

**Step 5:** Add to `.env`:
```env
OG_COMPUTE_API_KEY=app-sk-your_token
OG_PROVIDER_ADDRESS=0x_provider_address
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
```

---

### C. ElevenLabs API Key (REQUIRED — Guide Agent)

1. Go to [https://elevenlabs.io](https://elevenlabs.io) → Sign Up (free)
2. Log in → bottom-left profile icon → **API Keys**
3. **Create API Key** → enable all permissions → copy it

```env
ELEVENLABS_API_KEY=sk_your_key
```

---

### D. Reown AppKit Project ID (REQUIRED — Frontend)

1. Go to [https://cloud.reown.com](https://cloud.reown.com) → Sign Up
2. **Create Project** → Web → give it a name
3. Copy the Project ID

```env
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id
```

---

### E. Google Places API Key (OPTIONAL — Scout real data)

Without this key, Scout runs in fallback mode (random `isOpen`/`rating`). Not required for demo.

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com) → create a new project
2. **APIs & Services → Library** → **Places API (New)** → Enable
3. **APIs & Services → Credentials** → Create Credentials → API Key

```env
GOOGLE_PLACES_KEY=AIza_your_key
```

---

### F. Chainlink CRE (OPTIONAL — CRE Simulate)

```powershell
# Install CLI (PowerShell)
irm https://cre.chain.link/install.ps1 | iex
# Open a new PowerShell window, add to PATH:
$env:PATH += ";C:\Users\YOUR_USERNAME\AppData\Local\Programs\cre"
cre login   # opens a browser, create an account
```

---

## 4. Install Dependencies

### Agents

```bash
cd agents/orchestrator && npm install && cd ../..
cd agents/lore && npm install && cd ../..
cd agents/scout && npm install && cd ../..
cd agents/guide && npm install && cd ../..
```

### Frontend

```bash
cd apps/web && npm install
```

### Contracts

```bash
cd contracts && npm install
```

### Chainlink CRE

```bash
cd integrations/chainlink-cre && npm install
```

---

## 5. Start Services

### Agents — Single Command (recommended)

From the project root, run all 4 agents at once:

```powershell
npm run swarm
```

All agents start in the same terminal with colored prefixes:
- `[ORCH]` magenta — Orchestrator :3001
- `[LORE]` cyan — Lore :3002
- `[SCOUT]` green — Scout :3003
- `[GUIDE]` yellow — Guide :3004

Press `Ctrl+C` to stop all agents. If one agent crashes, the rest stop automatically.

### Agents — Separate Terminals (alternative)

```powershell
npm run swarm
```

### Frontend (Dev 1 responsible)

```bash
cd apps/web && npm run dev
# → http://localhost:3000
```

### Contracts Deploy (Dev 2 responsible)

```bash
cd contracts
npm run compile
npm run deploy:sepolia
# Add the output addresses to .env
```

---

## 6. Verification Tests

### Health Check
```powershell
curl http://localhost:3001/health   # Orchestrator
curl http://localhost:3002/health   # Lore
curl http://localhost:3003/health   # Scout
curl http://localhost:3004/health   # Guide
```
All should return `{"status":"ok","agent":"xxx.roamswarm.eth"}`.

### Lore Agent (~25-45 sec)
```powershell
curl -X POST http://localhost:3002/generate -H "Content-Type: application/json" -d '{"poiId":"cannes-01","lang":"en"}'
```

### Scout Agent
```powershell
curl -X POST http://localhost:3003/recommend -H "Content-Type: application/json" -d '{"poiId":"cannes-01"}'
```

### Guide Agent
```powershell
curl -X POST http://localhost:3004/synthesize -H "Content-Type: application/json" -d '{"story":"Test.","lang":"en","poiId":"cannes-01"}'
```

### Full Pipeline — SSE Streaming
```powershell
curl -N "http://localhost:3001/orchestrate/stream?poiId=cannes-01&lang=en"
```

---

## 7. Project Structure

```
roamswarm-ethglobal-cannes-2026/
├── apps/web/                   ← Next.js 14 frontend (Dev 1)
├── agents/
│   ├── orchestrator/           ← Port 3001
│   ├── lore/                   ← Port 3002 — 0G Compute LLM
│   ├── scout/                  ← Port 3003 — Chainlink CRE
│   ├── guide/                  ← Port 3004 — ElevenLabs + 0G Storage
│   ├── AGENTS.md               ← API endpoint documentation
│   └── SETUP.md                ← This file
├── contracts/                  ← Solidity contracts (Dev 2)
├── integrations/chainlink-cre/ ← CRE Workflow
├── data/cannes-pois.json       ← 12 Cannes POIs
└── .env.example                ← All environment variables
```

---

## 8. Common Errors

| Error | Fix |
|---|---|
| `PRIVATE_KEY not set` | Add `PRIVATE_KEY=0x...` to `.env` |
| `OG_PROVIDER_ADDRESS not set` | Run `list-providers` to get the address, add to `.env` |
| `ElevenLabs error: 402` | Regenerate the API key with all permissions enabled |
| `insufficient funds` | Get more 0G tokens from the faucet |
| `0G Compute error: 400` | Verify `OG_PROVIDER_ADDRESS` is correct |
| Port in use | Run `netstat -ano \| findstr :3001` to find the blocking process |

---

## 9. Useful Links

| Resource | URL |
|---|---|
| 0G Faucet | https://faucet.0g.ai |
| 0G Compute Marketplace | https://compute-marketplace.0g.ai/inference |
| ElevenLabs | https://elevenlabs.io |
| Reown Cloud | https://cloud.reown.com |
| Chainlink CRE | https://cre.chain.link |
| World ID Developer | https://developer.worldcoin.org |
| Sepolia Faucet | https://faucets.chain.link/sepolia |
| Sepolia Explorer | https://sepolia.etherscan.io |
| Agent API Docs | `agents/AGENTS.md` |
