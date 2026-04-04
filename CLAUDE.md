# Roam-Swarm — Claude Code Guidelines

## Responsive Design is Mandatory

This is a **PWA used on foot, on a phone.** Every UI change must be mobile-first.

- **Minimum width: 375px.** Nothing breaks below this.
- **Thumb-friendly tap targets:** minimum 44×44px for all interactive elements.
- **No horizontal scroll** — ever. No fixed-width layouts that overflow on mobile.
- **Test at mobile breakpoints first**, then scale up to desktop.
- Desktop is a bonus. Mobile is the product.

When generating or editing any component, always ask: *"Does this work on a 375px phone screen held in one hand?"*

---

## Stack

- **Frontend:** Next.js 14 (App Router) · Tailwind CSS · TypeScript
- **Wallet:** Reown AppKit (Ethereum Mainnet)
- **Chain:** Ethereum Sepolia Testnet (`eip155:11155111`)
- **Payments:** x402 micropayments · 0.5 USDC per POI
- **Agents:** OpenClaw on 0G Compute (`agents/`)
- **Storage:** 0G Storage (audio files)
- **Data:** Chainlink CRE Workflow (`integrations/chainlink-cre/`)
- **Identity:** World ID 4.0 + ENSv2

## Agent Names

| Agent | ENS | Role |
|---|---|---|
| Orchestrator | `orchestrator.roamswarm.eth` | Coordinates the swarm |
| Lore | `lore.roamswarm.eth` | History storytelling via 0G Compute |
| Scout | `scout.roamswarm.eth` | Venue discovery via Chainlink CRE |
| Guide | `guide.roamswarm.eth` | TTS narration via ElevenLabs + 0G Storage |

## Key Constraints

- All contracts on **Ethereum Sepolia Testnet**
- Points (`ROAM`) are **non-transferable** — no transfer(), no bridge
- Free unlock threshold: **500 ROAM = 1 POI**
- City completion auto-mints **CityBadgeNFT** (ERC-721) + grants +100 pts
- Chainlink CRE Workflow lives in `integrations/chainlink-cre/`, not in `agents/`

## UI Components

All components are generated via **21st.dev Magic MCP** (`/ui` command in Claude Code chat). See `.claude/mcp.json` for setup.

## Role-Based Onboarding

When a developer identifies their role at the start of a conversation, **immediately**:
1. Read their role file from `.claude/roles/`
2. Create a TodoWrite task list from their task list
3. Start working on the first incomplete task

### Trigger phrases → Role file

| Trigger | File |
|---|---|
| "yazılımcı 1", "developer 1", "dev 1", "frontend", "frontcu" | `.claude/roles/frontend.md` |
| "yazılımcı 2", "developer 2", "dev 2", "contracts", "solidity" | `.claude/roles/contracts.md` |
| "yazılımcı 3", "developer 3", "dev 3", "agents", "backend" | `.claude/roles/agents.md` |

### Example

> User: "yazılımcı 1'im, başlayalım"

→ Read `.claude/roles/frontend.md` → Create TodoWrite with all tasks → Start Phase 1, Task 1.

Each task is completed one at a time. Mark it done, move to the next. Ask before skipping phases.

---

## Full Spec

See `.claude/prd.md` for the complete Product Requirements Document.
