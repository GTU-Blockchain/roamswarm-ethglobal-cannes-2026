# Roam-Swarm — AI-Powered Urban Discovery Protocol

**ETHGlobal Cannes 2026**

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?logo=ethereum)
![World ID](https://img.shields.io/badge/World_ID-4.0-00B0FF)
![0G](https://img.shields.io/badge/0G-Compute_%26_Storage-6366F1)
![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE-375BD2)
![ENS](https://img.shields.io/badge/ENS-roamswarm.eth-5284FF)
![x402](https://img.shields.io/badge/x402-Pay--Per--Use-F5A623)

---

## Overview

Roam-Swarm turns cities into living, breathing story engines. Each Point of Interest (POI) is a geofenced trigger: walk close enough and a swarm of AI agents springs into action — generating a hyper-local audio story, surfacing a real-time venue recommendation, and delivering it all via a pay-per-use x402 micropayment or redeemed ROAM points.

Contributors submit GPS-tagged stories and venue tips, get World ID verified, and earn 20% of every unlock their content powers. Cities become completable quests: unlock all 12 Cannes POIs, earn your City Badge NFT.

---

## Architecture

```
User (PWA)
  └── GeofenceWatcher (50m radius)
        └── UnlockModal → PaymentGate (x402 / ROAM Points)
              └── Orchestrator Agent (orchestrator.roamswarm.eth)
                    ├── Lore Agent (lore.roamswarm.eth) → 0G Compute LLM → Story
                    ├── Scout Agent (scout.roamswarm.eth) → Chainlink CRE → Venue data
                    └── Guide Agent (guide.roamswarm.eth) → ElevenLabs TTS → 0G Storage → audioUrl

On-chain (Ethereum Sepolia):
  RoamEscrow → CommissionSplitter (80/20)
  ContributorRegistry (World ID 4.0) → ENSSubnameRegistry (auto-grant {id}.roamswarm.eth)
  UserPOIRegistry → CityBadgeNFT (auto-mint on city completion)
  RoamPoints (non-transferable ERC-20) → PointsRedeemer (500 ROAM = 1 free unlock)
  CityRegistry (12 Cannes POIs seeded)
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env
# Fill in your keys (see Environment Variables section below)

# Run all services (web + agents)
npm run dev

# Or run just the web app
cd apps/web && npm run dev
```

---

## Environment Variables

See `.env.example` for all required variables. Key sections:

| Section | Variable | Description |
|---|---|---|
| Chain | `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) |
| Chain | `SEPOLIA_RPC_URL` | Alchemy/Infura Sepolia endpoint |
| Chain | `PRIVATE_KEY` | Deployer wallet private key (no 0x prefix) |
| Contracts | `NEXT_PUBLIC_ESCROW_CONTRACT` | RoamEscrow address |
| Contracts | `NEXT_PUBLIC_ROAM_POINTS_CONTRACT` | RoamPoints address |
| Contracts | `COMMISSION_SPLITTER_CONTRACT` | CommissionSplitter address |
| World ID | `NEXT_PUBLIC_WORLDID_ADDRESS` | `0x469449f251692e0779667583026b5a1e99512157` |
| World ID | `NEXT_PUBLIC_WORLDID_APP_ID` | Your World ID app ID |
| 0G | `OG_COMPUTE_API_KEY` | 0G Compute API key |
| Chainlink | `CHAINLINK_CRE_API_KEY` | Chainlink CRE key |
| TTS | `ELEVENLABS_API_KEY` | ElevenLabs API key |
| Etherscan | `ETHERSCAN_API_KEY` | For contract verification |

---

## Contracts

All contracts are in `contracts/` and deploy to **Ethereum Sepolia Testnet** (`chainId: 11155111`).

| Contract | Address (Sepolia) | Purpose |
|---|---|---|
| `CommissionSplitter` | `0xeDF81E3bAE711848a0CBc3B02351624646a9E4ac` | 80% platform / 20% contributor |
| `UserPOIRegistry` | `0x9d0530bc24694E5e1f6b74239fAa0442Eb6072CC` | Tracks user POI unlocks |
| `RoamEscrow` | `0x3c6869AB251b03D5ecF13DEAba13391eCfb3C809` | Holds x402 payment until delivery |
| `ContributorRegistry` | `0x29Ee229a3Cf875f707C35B83C82119Cf685fEA68` | World ID verified contributors |
| `RoamPoints` | `0x9ca3e0044485508522CDE1651F9E7DCC13B46517` | Non-transferable ERC-20 points |
| `PointsRedeemer` | `0xA951BF3C4CDcBA81f5E8A2112b4afD744C9E5E8D` | Burns 500 ROAM → free unlock |
| `CityRegistry` | `0x7e5Df80570c7ED392D5227Ecb17a0A8f809b2D16` | City definitions (12 Cannes POIs) |
| `CityBadgeNFT` | `0xD577fc122Ca3Efe572c7E5805fF465A3D3AE2D9e` | ERC-721 auto-minted on city completion |
| `ENSSubnameRegistry` | *(set `ENS_SUBNAME_REGISTRY_CONTRACT` in `.env`)* | `{id}.roamswarm.eth` subnames |

### Compile

```bash
cd contracts
npx hardhat compile
```

### Run Tests

```bash
cd contracts

# Phase 2 tests (CommissionSplitter, RoamEscrow, UserPOIRegistry, ContributorRegistry)
npx hardhat test test/Phase2.test.ts

# Phase 3 tests (RoamPoints, PointsRedeemer)
npx hardhat test test/Phase3.test.ts

# Phase 4 tests (CityRegistry, CityBadgeNFT, ENSSubnameRegistry)
npx hardhat test test/Phase4.test.ts
```

### Deploy by Phase

Contracts are deployed in phases. Each phase reads the previous phase's addresses from `.env`.

```bash
cd contracts

# Phase 2 — Core contracts
npx hardhat run scripts/deploy-phase2.ts --network sepolia
# → Copy printed addresses into .env

# Phase 3 — Points system
npx hardhat run scripts/deploy-phase3.ts --network sepolia
# → Copy printed addresses into .env

# Phase 4 — Badges + ENS
npx hardhat run scripts/deploy-phase4.ts --network sepolia
# → Copy printed addresses into .env
```

**Deploy order matters:**
```
CommissionSplitter → UserPOIRegistry → RoamEscrow → ContributorRegistry
  → RoamPoints → PointsRedeemer
    → CityRegistry → CityBadgeNFT → ENSSubnameRegistry
```

### Verify on Etherscan

After all phases are deployed and addresses are in `.env`:

```bash
cd contracts
npx hardhat run scripts/verify-all.ts --network sepolia
```

Verifies all 9 contracts in one run. Skips already-verified contracts automatically.

### Seed Demo Wallet

Pre-seeds a wallet with 612 ROAM points and 7 Cannes POIs unlocked (realistic judge demo state):

```bash
cd contracts
DEMO_WALLET=0xYourAddress npx hardhat run scripts/seed-demo-wallet.ts --network sepolia
```

If `DEMO_WALLET` is not set, the deployer address is used.

**What it does:**
1. Grants deployer minter role on RoamPoints (temporarily)
2. Mints 612 ROAM to the demo wallet
3. Authorizes deployer on UserPOIRegistry
4. Seeds Cannes POI registry + records 7 unlocks for the demo wallet
5. Checks badge eligibility (7/12 — no badge yet, requires all 12)

To trigger the CityBadgeNFT auto-mint during the demo, unlock the remaining 5 POIs via the app.

### Wire up ENS Subnames (after deploy)

Contributors automatically receive an ENS subname on registration (`register()` calls ENSSubnameRegistry). To activate this:

```bash
# 1. Deploy ENSSubnameRegistry (done in Phase 4)
# 2. Authorize ContributorRegistry as a caller on ENSSubnameRegistry:
#    (run once, after Phase 4 deploy)
npx hardhat run scripts/wire-ens.ts --network sepolia
```

Or manually via Etherscan: call `ENSSubnameRegistry.setAuthorized(ContributorRegistry_address, true)`, then call `ContributorRegistry.setENSSubnameRegistry(ENSSubnameRegistry_address)`.

---

## Agents

| Agent | ENS | Port | Runtime |
|---|---|---|---|
| Orchestrator | `orchestrator.roamswarm.eth` | 3001 | Express + 0G |
| Lore | `lore.roamswarm.eth` | 3002 | 0G Compute LLM |
| Scout | `scout.roamswarm.eth` | 3003 | Chainlink CRE |
| Guide | `guide.roamswarm.eth` | 3004 | ElevenLabs + 0G Storage |

Chainlink CRE Workflow is in `integrations/chainlink-cre/` — not an agent, but the data pipeline Scout calls.

---

## Points Economy

| Action | Points |
|---|---|
| Daily claim (per owned POI) | +10 ROAM/day |
| City completion bonus | +100 ROAM |
| Free POI unlock threshold | 500 ROAM |

ROAM is **non-transferable** — no `transfer()`, no bridge.

---

## Design System (21st.dev)

This project uses the 21st.dev Magic MCP for AI-assisted component generation. Configure your API key in `.env` and `.claude/mcp.json`.

```bash
# The MCP server is auto-configured in .claude/mcp.json
# Set TWENTY_FIRST_DEV_API_KEY in your .env
# Use /ui command in Claude Code chat to generate components
```

---

## POIs — Cannes

12 Points of Interest seeded for ETHGlobal Cannes 2026. See `data/cannes-pois.json`.

| ID | Name |
|---|---|
| cannes-01 | Palais des Festivals |
| cannes-02 | La Croisette |
| cannes-03 | Marché Forville |
| cannes-04 | Rue Meynadier |
| cannes-05 | Le Suquet |
| cannes-06 | Port Vieux Ferry Point |
| cannes-07 | Villa Domergue |
| cannes-08 | Hôtel Carlton |
| cannes-09 | Allée de la Liberté |
| cannes-10 | Palais Carnot |
| cannes-11 | Musée de la Castre |
| cannes-12 | Église Notre-Dame d'Espérance |
