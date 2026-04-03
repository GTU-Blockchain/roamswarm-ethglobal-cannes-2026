# Roam-Swarm — AI-Powered Urban Discovery Protocol

**ETHGlobal Cannes 2026**

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Ethereum](https://img.shields.io/badge/Ethereum-Mainnet-627EEA?logo=ethereum)
![World ID](https://img.shields.io/badge/World_ID-Verified-00B0FF)
![0G](https://img.shields.io/badge/0G-Compute_%26_Storage-6366F1)
![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE-375BD2)
![ENS](https://img.shields.io/badge/ENS-roam.eth-5284FF)
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
              └── Orchestrator Agent (orchestrator.roam.eth)
                    ├── Lore Agent (lore.roam.eth) → 0G Compute LLM → Story
                    ├── Scout Agent (scout.roam.eth) → Chainlink CRE → Venue data
                    └── Guide Agent (guide.roam.eth) → ElevenLabs TTS → 0G Storage → audioUrl

On-chain (Ethereum Mainnet):
  RoamEscrow → CommissionSplitter (80/20)
  ContributorRegistry (World ID)
  UserPOIRegistry → CityBadgeNFT (auto-mint on completion)
  RoamPoints (non-transferable ERC-20) → PointsRedeemer
  CityRegistry
  ENSSubnameRegistry ({id}.contributors.roam.eth)
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env

# Run all services (web + agents)
npm run dev

# Or run just the web app
cd apps/web && npm run dev
```

---

## Environment Variables

See `.env.example` for all required variables. Key sections:

- **Ethereum RPC** — mainnet RPC URL and deployed contract addresses
- **Reown AppKit** — wallet connection project ID
- **World ID** — app ID and verifier address
- **0G** — compute and storage API keys
- **Chainlink CRE** — API key and Google Places key
- **ElevenLabs** — TTS API key
- **21st.dev Magic MCP** — design system API key

---

## Contracts

All contracts are in `/contracts/` and compile with Hardhat.

| Contract | Purpose |
|---|---|
| `RoamEscrow` | Holds x402 USDC payment until audio delivery |
| `ContributorRegistry` | World ID verified contributors |
| `CommissionSplitter` | 80% platform / 20% contributor |
| `UserPOIRegistry` | Tracks user POI unlocks |
| `RoamPoints` | Non-transferable ERC-20 points |
| `PointsRedeemer` | Burns 500 ROAM → free unlock |
| `CityRegistry` | City definitions and POI counts |
| `CityBadgeNFT` | ERC-721 auto-minted on city completion |
| `ENSSubnameRegistry` | {id}.contributors.roam.eth subnames |

```bash
cd contracts
npm run compile
npm run deploy:sepolia
```

---

## Agents

| Agent | ENS | Runtime |
|---|---|---|
| Orchestrator | `orchestrator.roam.eth` | Express + 0G |
| Lore | `lore.roam.eth` | 0G Compute LLM |
| Scout | `scout.roam.eth` | Chainlink CRE |
| Guide | `guide.roam.eth` | ElevenLabs + 0G Storage |

Chainlink CRE Workflow is in `integrations/chainlink-cre/` — not an agent, but the data pipeline Scout calls.

---

## Design System (21st.dev)

This project uses the 21st.dev Magic MCP for AI-assisted component generation. Configure your API key in `.env` and `.claude/mcp.json`.

```bash
# The MCP server is auto-configured in .claude/mcp.json
# Set TWENTY_FIRST_DEV_API_KEY in your .env
```

---

## POIs — Cannes

12 Points of Interest seeded for ETHGlobal Cannes 2026. See `data/cannes-pois.json`.
