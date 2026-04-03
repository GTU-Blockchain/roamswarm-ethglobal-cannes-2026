# PRD: Roam-Swarm
## AI-Powered Urban Discovery Protocol
**ETHGlobal Cannes 2026 — Product Requirements Document**
**Version 2.0 — Updated: April 3, 2026**

---

## Changelog v2.1
- **Agent Names:** history-agent → `lore`, food-agent → `scout`, voice-agent → `guide`
- **Repo Structure:** Chainlink CRE Workflow moved to `integrations/chainlink-cre/` (not an agent)
- **ENS:** Updated agent subnames to `lore.roam.eth`, `scout.roam.eth`, `guide.roam.eth`

## Changelog v2.0
- **Chain:** Arc removed → All contracts deployed on **Ethereum Mainnet**
- **New Feature:** Daily Points Accrual System
- **New Feature:** Free Unlock via Points Threshold
- **New Feature:** City Completion Badge (on-chain ERC-721)
- **Design:** 21st.dev Magic MCP integrated for all UI components

---

## 1. Overview

### Problem
Tourists want real-time, hyper-local information while walking through a city — not static blog posts, not overpriced generic tours. Local contributors generate valuable knowledge but receive no economic reward. Fake reviews and AI-spam poison information ecosystems. Web3 UX barriers prevent mainstream adoption.

### Solution
Roam-Swarm is an AI agent swarm protocol that delivers pay-per-use, location-triggered urban discovery experiences. When a user enters a geofence around a point of interest, an agent swarm activates: Lore compiles the building's story, Scout finds the best local spot using real-time data, and Guide streams everything in the user's native language. Users pay per experience via x402 micropayments on Ethereum, or redeem accumulated points for free unlocks. Local contributors are verified via World ID 4.0 and earn automatic commissions.

Users who unlock all POIs in a city earn a **City Completion Badge** — an on-chain ERC-721 NFT displayed on their profile.

### Pitch
> *"Roam-Swarm keeps cities alive through the stories people tell each other. As you walk, an AI agent swarm activates — local knowledge is protected from bots via World ID, cent-sized payments flow instantly via x402, Chainlink CRE makes real-time data trustworthy, and 0G runs all inference without a central server. Discover more, earn points, unlock for free — complete a city and claim your badge."*

---

## 2. Target Users

**Primary — Tourist / Visitor**
- Wants authentic, real-time local knowledge
- Not a crypto native; needs zero-friction onboarding
- Willing to pay small amounts per experience, or redeem points earned over time

**Secondary — Local Contributor**
- Resident or long-term local with genuine knowledge
- Wants passive income from their expertise
- Needs simple content submission flow

**Tertiary — City Explorer / Collector**
- Motivated by completion mechanics and badges
- Returns to the app to finish what they started
- Shares on-chain achievements on their profile

---

## 3. Core User Flows

### 3.1 Tourist Flow
1. Open app → Reown AppKit social login (Google/Apple/email) → smart wallet auto-created, no seed phrase
2. Map loads → nearby POIs visible; unlocked shown in full color, locked in grey
3. User walks within 50m of a POI → notification: *"This building has a hidden story. Unlock for 0.5 USDC — or use your 500 Roam Points."*
4. User chooses: **pay with USDC** (x402 on Ethereum) or **redeem points** (if threshold met)
5. If USDC: `RoamEscrow.sol` holds funds → 0G Storage delivers valid audio URL → escrow releases
6. If Points: `PointsRedeemer.sol` burns 500 points → experience unlocks immediately
7. Guide streams audio from 0G Storage → plays in user's earphones
8. Scout returns verified real-time venue recommendation (Chainlink CRE validated)
9. POI marked as "owned" in `UserPOIRegistry.sol` → daily points accrual begins
10. When all POIs in a city are unlocked → `CityBadgeNFT.sol` mints automatically

### 3.2 Points System Flow
1. User purchases any POI experience (USDC payment)
2. That POI enters "owned" state — recorded in `UserPOIRegistry.sol`
3. Every 24 hours: **+10 Roam Points per owned POI** (claimed via `claimDailyPoints()`)
4. Points accumulate in `RoamPoints.sol` (non-transferable ERC-20)
5. When balance reaches **500 points threshold**, "Free Unlock" becomes available
6. User selects any locked POI → taps "Unlock with Points" → 500 points burned → experience unlocks
7. POI enters owned state, accrual continues

**Points Economy:**
```
Earn:        +10 points / owned POI / day
Threshold:   500 points = 1 free unlock (~0.5 USDC value)
Break-even:  Own 1 POI  → free unlock every 50 days
             Own 5 POIs → free unlock every 10 days
             Own 10 POIs → free unlock every 5 days
```

### 3.3 City Completion Flow
1. Every city has a fixed POI count in `CityRegistry.sol` (Cannes = 12 POIs)
2. `UserPOIRegistry.sol` tracks which POIs each user has unlocked
3. When user's unlocked count for a city equals the total → `CityBadgeNFT.sol` mints automatically
4. Badge metadata stored on IPFS: city name, completion date, POI count, user's ENS name
5. Badge displayed on `/profile` page with city artwork
6. Completion also grants +100 bonus points

### 3.4 Local Contributor Flow
1. Verify identity via World ID 4.0 ZK proof (human, not bot)
2. Receive ENS subname: `{id}.contributors.roam.eth`
3. Submit content: street story, venue tip, local secret — linked to GPS coordinates
4. Every time a tourist unlocks that content (USDC or points) → automatic commission via `CommissionSplitter.sol`
5. Reputation score stored in ENS text records; higher quality = more visibility

---

## 4. Technical Architecture

### 4.1 Frontend — Next.js PWA + 21st.dev Design System

**Stack:** Next.js 14 (App Router), deployed on Vercel as a Progressive Web App.

**Design System:** All UI components are generated and refined using the **21st.dev Magic MCP server**. Claude Code uses `/ui` commands to produce modern, production-grade React components. See Section 9 for MCP setup instructions.

**Key modules:**

```
/app
  /page.tsx               → Landing + Reown AppKit login
  /map/page.tsx           → Main map view with POI markers + lock states
  /experience/[id]/       → Active experience player
  /contribute/            → Contributor content submission
  /profile/               → Points balance, owned POIs, city badges
  /city/[id]/             → City overview + completion progress

/components               (all generated via 21st.dev Magic MCP)
  /WalletProvider.tsx     → Reown AppKit wrapper
  /GeofenceWatcher.tsx    → Browser Geolocation API + Haversine
  /UnlockModal.tsx        → Choose: pay USDC or redeem points
  /PaymentGate.tsx        → x402 USDC payment flow
  /AudioPlayer.tsx        → 0G Storage stream player
  /MapView.tsx            → Leaflet.js with POI markers + lock states
  /PointsBalance.tsx      → Points display with accrual animation
  /CityProgress.tsx       → City completion progress ring
  /BadgeCard.tsx          → City Completion Badge display component

/lib
  /x402.ts                → x402 client, payment header construction
  /geofence.ts            → watchPosition() + distance calculation
  /agents.ts              → Agent orchestrator API calls
  /ens.ts                 → ENS subname resolution + text records
  /points.ts              → Points balance read + redemption logic
  /badges.ts              → City badge mint status + metadata
```

**Geofencing logic:**
```typescript
// /lib/geofence.ts
navigator.geolocation.watchPosition((pos) => {
  const dist = haversineDistance(
    pos.coords.latitude, pos.coords.longitude,
    POI_LAT, POI_LNG
  );
  if (dist < 50) triggerExperience(poiId);
});
```

**x402 payment flow (Ethereum Mainnet):**
```typescript
// /lib/x402.ts
const response = await fetch(contentEndpoint, {
  headers: {
    'X-PAYMENT': buildPaymentHeader({
      amount: '0.5',
      token: 'USDC',
      network: 'eip155:1',           // Ethereum Mainnet
      recipient: ESCROW_CONTRACT_ADDRESS
    })
  }
});
```

**Points redemption flow:**
```typescript
// /lib/points.ts
const balance = await pointsContract.balanceOf(userAddress);
const THRESHOLD = 500n * 10n**18n;

if (balance >= THRESHOLD) {
  await pointsRedeemerContract.redeemForUnlock(poiId);
}
```

### 4.2 Agent Swarm — OpenClaw on 0G

All agents are built with the OpenClaw framework, running inference on 0G Compute. Each agent has an ERC-8004 Identity registration and an ENS subname.

**Agents:**

| Agent | ENS | Responsibility |
|---|---|---|
| Orchestrator | `orchestrator.roam.eth` | Triggered by geofence, coordinates swarm |
| Lore | `lore.roam.eth` | LLM inference on 0G Compute, generates story |
| Scout | `scout.roam.eth` | Calls Chainlink CRE Workflow, returns venue |
| Guide | `guide.roam.eth` | TTS generation, uploads to 0G Storage, returns stream URL |

**Orchestrator flow:**
```typescript
async function orchestrate(poiId: string, userId: string, lang: string) {
  const story = await lore.generate({ poiId, lang });      // 0G Compute
  const venue = await scout.recommend({ poiId });          // Chainlink CRE
  const audioUrl = await guide.synthesize({ story, lang }); // TTS → 0G Storage

  await storage.write(`sessions/${userId}/${poiId}`, { story, venue, audioUrl });

  return { audioUrl, venue, story };
}
```

### 4.3 Smart Contracts — Ethereum Mainnet

**Network:** Ethereum Sepolia for development, Ethereum Mainnet for demo.

**Why Ethereum:** World ID verifier contracts are live on Ethereum. ENSv2 is deployed exclusively on Ethereum. x402 supports `eip155:1` natively. All three core prize integrations share the same chain — no bridging needed.

**Contracts:**

```solidity
// RoamEscrow.sol
// Holds x402 USDC payment; releases when valid audio URL delivered from 0G
contract RoamEscrow {
  function lockPayment(bytes32 poiId, address contributor) external payable;
  function release(bytes32 poiId, string calldata audioUrl) external;
  function refund(bytes32 poiId) external;
}

// ContributorRegistry.sol
// Stores World ID verified contributors and their ENS addresses
contract ContributorRegistry {
  mapping(address => bool) public verified;
  mapping(address => string) public ensName;
  function register(uint256 worldIdProof, string calldata ensSubname) external;
}

// CommissionSplitter.sol
// On each escrow release: 80% platform, 20% contributor
contract CommissionSplitter {
  uint256 public constant CONTRIBUTOR_BPS = 2000;
  function split(address contributor, uint256 amount) external;
}

// UserPOIRegistry.sol
// Tracks which POIs each user has unlocked
contract UserPOIRegistry {
  mapping(address => mapping(bytes32 => bool)) public unlockedPOIs;
  mapping(address => bytes32[]) public userPOIList;
  function recordUnlock(address user, bytes32 poiId) external;
  function getUnlockedCount(address user, bytes32 cityId) external view returns (uint256);
}

// RoamPoints.sol
// Non-transferable ERC-20; accrues +10 pts per owned POI per day
contract RoamPoints {
  uint256 public constant POINTS_PER_POI_PER_DAY = 10 * 10**18;
  uint256 public constant UNLOCK_THRESHOLD = 500 * 10**18;
  function claimDailyPoints() external;
  function balanceOf(address user) external view returns (uint256);
}

// PointsRedeemer.sol
// Burns UNLOCK_THRESHOLD points → free POI unlock
contract PointsRedeemer {
  function redeemForUnlock(bytes32 poiId) external;
}

// CityRegistry.sol
// Defines each city and its total POI count
contract CityRegistry {
  struct City {
    string name;
    uint256 totalPOIs;
    string badgeImageURI;
  }
  mapping(bytes32 => City) public cities;
}

// CityBadgeNFT.sol
// ERC-721; auto-minted when user unlocks all POIs in a city
contract CityBadgeNFT is ERC721 {
  function checkAndMint(address user, bytes32 cityId) external;
  // Called after each unlock; mints if count == totalPOIs
}
```

**Deployment:**
```bash
npx hardhat deploy --network sepolia
npx hardhat deploy --network mainnet
npx hardhat verify --network mainnet $CONTRACT_ADDRESS
```

### 4.4 Data Layer — Chainlink CRE

**Purpose:** Scout needs real-time venue data without exposing API keys on-chain.

**Location:** `integrations/chainlink-cre/` — this is a data pipeline, not an agent. Scout calls it to fetch venue status.

```typescript
// integrations/chainlink-cre/workflow.ts
const workflow = new CREWorkflow({
  name: 'roam-venue-check',
  steps: [
    {
      type: 'confidential-http',
      url: 'https://places.googleapis.com/v1/places/{placeId}',
      headers: { 'X-Goog-Api-Key': '{{secret.GOOGLE_PLACES_KEY}}' },
      extract: ['currentOpeningHours.openNow', 'currentSecondaryOpeningHours']
    },
    {
      type: 'on-chain-write',
      contract: SCOUT_CONTRACT,
      method: 'updateVenueStatus'
    }
  ]
});

await workflow.simulate();   // Required for Chainlink CRE prize
await workflow.deploy();
```

### 4.5 Identity Layer — World ID 4.0 + ENS

**World ID 4.0 (Ethereum Mainnet):**
```typescript
<IDKitWidget
  app_id="app_roam_swarm"
  action="register_contributor"
  onSuccess={(proof) => registerContributor(proof)}
  verification_level="orb"
/>

// World ID verifier is live on Ethereum Mainnet
IWorldID(WORLD_ID_MAINNET_ADDRESS).verifyProof(root, groupId, signal, nullifierHash, proof);
```

**ENSv2 Subname Registry (Ethereum Mainnet):**
```typescript
// Agent names: lore.roam.eth, scout.roam.eth, guide.roam.eth
// Contributor names: {id}.contributors.roam.eth

// Text records store reputation, points, and badge data:
await ens.setText(userNode, 'roamScore', score.toString());
await ens.setText(userNode, 'roamBadges', JSON.stringify(badgeList));
await ens.setText(userNode, 'roamPoints', points.toString());
```

---

## 5. Points & Gamification System — Detailed Spec

### 5.1 Points Accrual

| Action | Points |
|---|---|
| Each owned POI, every 24h | +10 points |
| Complete a city | +100 bonus points |

Points are non-transferable. Cannot be bought, bridged, or traded. Accrual is passive — frontend calls `claimDailyPoints()` on app open.

### 5.2 Free Unlock Threshold

- **Threshold:** 500 points = 1 free unlock
- **Value parity:** 500 pts ≈ 0.5 USDC
- Points are **burned** on redemption (deflationary)
- Free unlocks are identical to paid unlocks — same content, same contributor commission

### 5.3 City Completion Badge

**Badge metadata (on-chain + IPFS):**
```json
{
  "name": "Cannes Explorer",
  "description": "Completed all 12 POIs in Cannes, France",
  "image": "ipfs://QmXxx...cannes-badge.png",
  "attributes": [
    { "trait_type": "City", "value": "Cannes" },
    { "trait_type": "POIs Completed", "value": 12 },
    { "trait_type": "Completion Date", "value": "2026-04-05" },
    { "trait_type": "Explorer ENS", "value": "umut.roam.eth" }
  ]
}
```

**Profile display:** `/profile` shows all earned badges as collectible cards with city artwork. Badge list also stored in user's ENS text records for cross-app portability.

### 5.4 UnlockModal UI (generated via 21st.dev Magic MCP)

```
┌─────────────────────────────────┐
│  🏛 Palais des Festivals        │
│  Unlock this experience         │
│                                 │
│  [Pay 0.5 USDC]                 │
│  ─────── or ───────             │
│  [Use 500 Points  ✓ Available]  │
│                                 │
│  Your balance: 612 pts          │
│  Earning: 30 pts/day            │
└─────────────────────────────────┘
```

**Map pin states:**
- 🔒 Grey pin — locked, not owned
- 🌟 Gold outline — "Free unlock available" (≥500 pts)
- 🟣 Colored pin — owned, audio available anytime

---

## 6. Prize Pool Strategy

| Sponsor | Track | Amount | Integration |
|---|---|---|---|
| 🌍 World | Best use of World ID 4.0 | $8,000 | `ContributorRegistry.sol` + IDKit on Ethereum |
| 🤖 0G | Best OpenClaw Agent on 0G | $6,000 | OpenClaw + 0G Compute + Storage |
| 🔗 Chainlink | Best workflow with Chainlink CRE | $4,000 | CRE Workflow + Confidential HTTP |
| 🔤 ENS | Best ENS Integration for AI Agents | $5,000 | Subname registry + badge/points text records |
| 🔐 Ledger *(optional)* | AI Agents x Ledger | $6,000 | x402 payment approval via Ledger device |

**Target (without Ledger): $23,000**
**Target (with Ledger): $29,000**

> **Note on Arc:** Arc prize removed — World ID is not deployed on Arc. Ethereum Mainnet is the correct chain where World ID, ENS, and x402 are all natively supported.

### Why each integration is genuine, not cosmetic
- **World ID:** Contributor system is Sybil-vulnerable without it. `verifyProof` on Ethereum is a hard architectural requirement.
- **0G:** All AI inference runs on 0G Compute via OpenClaw. Audio on 0G Storage. No central server anywhere.
- **Chainlink CRE:** Scout's real-time venue data needs verifiable provenance. CRE + Confidential HTTP provides it without leaking API keys.
- **ENS:** Agents need human-readable identity. User badges and points live in ENS text records for cross-app portability.

---

## 7. Team & Responsibilities

### Person 1 — Frontend + UX
- Next.js 14 App Router + PWA config
- Reown AppKit integration
- Map UI, POI lock states, geofencing
- UnlockModal: USDC or points redemption
- Points balance widget, daily accrual display
- City progress ring + badge gallery + profile page
- Responsive mobile-first design
- Vercel deployment
- **All components via 21st.dev Magic MCP**

### Person 2 — Smart Contracts + Protocol
- `RoamEscrow.sol`, `ContributorRegistry.sol`, `CommissionSplitter.sol`
- `UserPOIRegistry.sol`, `RoamPoints.sol`, `PointsRedeemer.sol`
- `CityRegistry.sol`, `CityBadgeNFT.sol`
- `ENSSubnameRegistry.sol`
- Ethereum Sepolia/Mainnet deployment
- World ID IDKit integration
- Hardhat/Foundry + test coverage

### Person 3 — Agent Swarm + Backend
- OpenClaw framework on 0G
- Lore agent (0G Compute), Scout agent (Chainlink CRE), Guide agent (TTS + 0G Storage)
- Orchestrator coordination logic
- Chainlink CRE Workflow (`integrations/chainlink-cre/`)
- ERC-8004 agent identity registration
- Cannes 12 POI data seeding
- REST API endpoints for frontend

---

## 8. 48-Hour Build Plan

**Priority order:** Ethereum setup → World ID → x402 escrow → Points → 0G agents → Chainlink CRE → ENS → Badges → Polish

| Time | Phase | Person 1 | Person 2 | Person 3 |
|---|---|---|---|---|
| Hour 0–8 | Foundation | Next.js + Reown + 21st.dev MCP setup, mock UI | Hardhat + Ethereum Sepolia, World ID sandbox | OpenClaw + 0G testnet, mock agent |
| Hour 8–20 | Core Build | Map + geofencing, x402 UI, unlock modal | RoamEscrow + ContributorRegistry deploy, World ID | Lore + Scout agent, Chainlink CRE Workflow |
| Hour 20–32 | Points | Points balance UI, redemption flow, accrual display | RoamPoints + PointsRedeemer + UserPOIRegistry | Guide agent TTS + 0G Storage stream |
| Hour 32–40 | Badges + ENS | City progress ring, badge gallery, profile page | CityBadgeNFT + CityRegistry + ENS subnames | Cannes POI seeding, agent memory |
| Hour 40–44 | Polish | 12 Cannes POIs on map, animations, mobile check | Mainnet deploy, gas optimization | Live audio test, 0G latency check |
| Hour 44–48 | Submission | Demo video, Vercel prod deploy | Contract addresses, architecture diagram | Demo link, per-sponsor notes |

### Risk Mitigations
- **Chainlink CRE blocked:** Use mock venue data, simulate flag, still submit
- **0G latency:** OpenClaw local mode, keep Storage intact
- **ENS deploy:** Hardcode subnames for demo, include tx hash
- **Points not ready for demo:** Pre-seed a wallet with 612 pts in constructor for live demo

---

## 9. Design System — 21st.dev Magic MCP

All UI components must be generated or inspired by the **21st.dev Magic MCP server**.

### Setup in Claude Code

Add to `.claude/mcp.json` in project root:
```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"your-api-key\""]
    }
  }
}
```

Or via CLI:
```bash
claude mcp add @21st-dev/magic \
  --scope project \
  -- npx --yes @21st-dev/magic@latest API_KEY="your-21st-dev-api-key"
```

Get API key: [21st.dev](https://21st.dev) (free account required)

### Usage in Claude Code Chat

```
/ui Create a POI unlock modal — two options: pay 0.5 USDC button and redeem 500 points button.
    Show current balance. Dark glassmorphism theme.

/ui Build a city completion progress ring: 7/12 POIs with animated fill.
    City name and percentage in center.

/ui Design a city badge collectible card — badge artwork, city name, completion date, POI count.
    Subtle holographic shimmer effect.

/ui Create a points balance widget with animated counter, daily rate display,
    and "Free Unlock Available" state with gold highlight.

/ui Map pin component with 3 states: locked (grey), free-unlock-available (gold star),
    owned (colored glow). Smooth transition animations between states.
```

### Design Principles
- **Responsive / mobile-first is non-negotiable.** Roam-Swarm is a PWA used on foot, on a phone. Every component must work at 375px width and up. Desktop is a bonus, not the primary target.
- Dark theme (suits outdoor/nighttime use)
- Thumb-friendly tap targets (min 44×44px)
- Glassmorphism for map overlays
- Smooth animations for points accrual and badge unlock
- Content-first on small screens — avoid horizontal scroll, overflow, or fixed layouts that break on mobile

---

## 10. Repository Structure

```
roam-swarm/
├── .claude/
│   └── mcp.json                       # 21st.dev Magic MCP config
│
├── apps/
│   └── web/                           # Next.js PWA
│       ├── app/
│       │   ├── page.tsx
│       │   ├── map/
│       │   ├── experience/[id]/
│       │   ├── contribute/
│       │   ├── profile/               # Points + badge gallery
│       │   └── city/[id]/             # City completion view
│       ├── components/                # All via 21st.dev Magic MCP
│       │   ├── WalletProvider.tsx
│       │   ├── GeofenceWatcher.tsx
│       │   ├── UnlockModal.tsx
│       │   ├── PaymentGate.tsx
│       │   ├── AudioPlayer.tsx
│       │   ├── MapView.tsx
│       │   ├── PointsBalance.tsx
│       │   ├── CityProgress.tsx
│       │   └── BadgeCard.tsx
│       └── lib/
│           ├── x402.ts
│           ├── geofence.ts
│           ├── agents.ts
│           ├── ens.ts
│           ├── points.ts
│           └── badges.ts
│
├── contracts/                         # Solidity — Ethereum Mainnet
│   ├── RoamEscrow.sol
│   ├── ContributorRegistry.sol
│   ├── CommissionSplitter.sol
│   ├── UserPOIRegistry.sol
│   ├── RoamPoints.sol
│   ├── PointsRedeemer.sol
│   ├── CityRegistry.sol
│   ├── CityBadgeNFT.sol
│   └── ENSSubnameRegistry.sol
│
├── agents/                            # OpenClaw on 0G
│   ├── orchestrator/
│   ├── lore/                          # History storytelling — 0G Compute LLM
│   ├── scout/                         # Venue discovery — Chainlink CRE
│   └── guide/                         # TTS narration — ElevenLabs + 0G Storage
│
├── integrations/
│   └── chainlink-cre/                 # Chainlink CRE Workflow (data pipeline, not an agent)
│
├── data/
│   └── cannes-pois.json               # 12 Cannes POIs with coordinates
│
└── README.md
```

---

## 11. Environment Variables

```bash
# Ethereum Mainnet
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_ESCROW_CONTRACT=
NEXT_PUBLIC_CONTRIBUTOR_REGISTRY=
NEXT_PUBLIC_ROAM_POINTS_CONTRACT=
NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT=
NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT=
NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT=
NEXT_PUBLIC_CITY_REGISTRY_CONTRACT=

# Reown AppKit
NEXT_PUBLIC_REOWN_PROJECT_ID=

# World ID (Ethereum Mainnet verifier)
NEXT_PUBLIC_WORLDID_APP_ID=
NEXT_PUBLIC_WORLDID_ADDRESS=0x469449f251692e0779667583026b5a1e99512157
WORLDID_ACTION=register_contributor

# ENS (Ethereum Mainnet)
NEXT_PUBLIC_ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
NEXT_PUBLIC_ROAM_ETH_NODE=

# 0G
OG_COMPUTE_API_KEY=
OG_STORAGE_API_KEY=
OG_RPC_URL=

# Chainlink CRE
CHAINLINK_CRE_API_KEY=
GOOGLE_PLACES_KEY=           # Stored as CRE secret — never exposed on-chain

# TTS
ELEVENLABS_API_KEY=

# 21st.dev Magic MCP
TWENTY_FIRST_DEV_API_KEY=
```

---

## 12. Demo Script (3 minutes, for judges)

**Location:** Palais des Festivals et des Congrès, Cannes (POI #1 of 12)
**Setup:** Phone + earphones, Vercel prod URL in browser

```
[0:00] Open app → Google login via Reown → wallet auto-created
       Map: 12 Cannes POIs visible, all grey/locked
       City progress ring: "0/12 — Cannes Explorer Badge"

[0:20] Approach Festival Palace (or DevTools location override)
       UnlockModal appears: "Pay 0.5 USDC" + "Use 500 pts (0 balance, disabled)"

[0:40] Choose USDC → x402 tx on Ethereum → explorer link shown
       POI turns colored (owned)
       Points widget: "Earning 10 pts/day from this POI"

[1:00] Audio streams from 0G → Guide narrates the building (Lore's story)
       Scout card: "Café de la Plage is quiet right now" (CRE validated)

[1:20] City progress ring: "1/12 — keep going!"

[1:35] Switch to pre-seeded demo wallet: 612 pts, 7 POIs owned
       UnlockModal for POI #8: both buttons active
       Tap "Redeem 500 Points" → instant unlock → balance drops to 112 pts
       Progress ring: "8/12"

[1:55] Show Profile page:
       - Points: 112 pts, earning 80 pts/day
       - City progress cards
       - Pre-minted "Cannes Explorer" badge (12/12 demo)
       - Badge: city artwork, completion date, ENS name

[2:20] Switch to ENS tab: lore.roam.eth, scout.roam.eth, guide.roam.eth
       World ID tab: contributor ZK proof tx on Ethereum
       Etherscan: CommissionSplitter tx → contributor earned 0.1 USDC

[2:45] Q&A
```

---

## 13. Cannes POI Data

```json
[
  { "id": "cannes-01", "name": "Palais des Festivals", "lat": 43.5503, "lng": 7.0174 },
  { "id": "cannes-02", "name": "La Croisette", "lat": 43.5514, "lng": 7.0271 },
  { "id": "cannes-03", "name": "Marché Forville", "lat": 43.5528, "lng": 7.0138 },
  { "id": "cannes-04", "name": "Rue Meynadier", "lat": 43.5521, "lng": 7.0142 },
  { "id": "cannes-05", "name": "Le Suquet", "lat": 43.5508, "lng": 7.0103 },
  { "id": "cannes-06", "name": "Port Vieux Ferry Point", "lat": 43.5493, "lng": 7.0118 },
  { "id": "cannes-07", "name": "Villa Domergue", "lat": 43.5567, "lng": 7.0298 },
  { "id": "cannes-08", "name": "Hôtel Carlton", "lat": 43.5519, "lng": 7.0245 },
  { "id": "cannes-09", "name": "Allée de la Liberté", "lat": 43.5497, "lng": 7.0171 },
  { "id": "cannes-10", "name": "Palais Carnot", "lat": 43.5536, "lng": 7.0151 },
  { "id": "cannes-11", "name": "Musée de la Castre", "lat": 43.5503, "lng": 7.0097 },
  { "id": "cannes-12", "name": "Église Notre-Dame d'Espérance", "lat": 43.5499, "lng": 7.0094 }
]
```

---

## 14. Submission Checklist

- [ ] Public GitHub repo with README (setup instructions, architecture diagram)
- [ ] Vercel production URL (live demo)
- [ ] Demo video ≤ 3 minutes
- [ ] World ID: on-chain `verifyProof` tx hash (Ethereum Sepolia/Mainnet)
- [ ] 0G: OpenClaw agent repo + 0G Compute/Storage usage documented
- [ ] Chainlink: CRE Workflow simulation output (`cre simulate` log)
- [ ] ENS: subname registry tx hash, `lore.roam.eth` resolution
- [ ] Points: `RoamPoints.sol` + `PointsRedeemer.sol` deployment addresses
- [ ] City badge: `CityBadgeNFT.sol` deployment + minted token ID for demo wallet
- [ ] Per-sponsor submission notes
- [ ] Screenshot of 21st.dev Magic MCP generating components in Claude Code

---

*ETHGlobal Cannes 2026 · April 3–5, 2026 · Cannes, France*
*Chain: Ethereum Mainnet · Design: 21st.dev Magic MCP · Agents: OpenClaw on 0G*
