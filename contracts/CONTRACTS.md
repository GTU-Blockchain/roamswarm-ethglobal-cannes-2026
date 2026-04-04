# Roam-Swarm — Contracts Reference

Smart contract interface reference for frontend and agent integration.  
**Network:** Ethereum Sepolia Testnet (`chainId: 11155111`)

---

## Deployed Addresses

| Contract | Sepolia Address |
|---|---|
| `CommissionSplitter` | `0xeDF81E3bAE711848a0CBc3B02351624646a9E4ac` |
| `UserPOIRegistry` | `0x9d0530bc24694E5e1f6b74239fAa0442Eb6072CC` |
| `RoamEscrow` | `0x3c6869AB251b03D5ecF13DEAba13391eCfb3C809` |
| `ContributorRegistry` | `0x29Ee229a3Cf875f707C35B83C82119Cf685fEA68` |
| `RoamPoints` | `0x9ca3e0044485508522CDE1651F9E7DCC13B46517` |
| `PointsRedeemer` | `0xA951BF3C4CDcBA81f5E8A2112b4afD744C9E5E8D` |
| `CityRegistry` | `0x7e5Df80570c7ED392D5227Ecb17a0A8f809b2D16` |
| `CityBadgeNFT` | `0xD577fc122Ca3Efe572c7E5805fF465A3D3AE2D9e` |
| `ENSSubnameRegistry` | *(see `ENS_SUBNAME_REGISTRY_CONTRACT` in `.env`)* |

All addresses are also in the root `.env` file.

---

## POI & City IDs

POI IDs and city IDs on-chain are **`bytes32` hashes**, not raw strings.

```ts
import { ethers } from 'ethers';

const cannesId = ethers.keccak256(ethers.toUtf8Bytes('cannes'));       // city
const poi01Id  = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));    // POI
```

The 12 Cannes POI string IDs are: `cannes-01` through `cannes-12` (see `data/cannes-pois.json`).

---

## Contract Details

---

### UserPOIRegistry

Tracks which POIs each user has unlocked and city completion counts.

**Address:** `0x9d0530bc24694E5e1f6b74239fAa0442Eb6072CC`

#### Read functions

```ts
// Has a user unlocked a specific POI?
unlockedPOIs(user: address, poiId: bytes32): bool

// How many total POIs has a user unlocked (across all cities)?
getUserPOICount(user: address): uint256

// How many POIs in a given city has the user unlocked?
getUnlockedCount(user: address, cityId: bytes32): uint256

// All poiIds registered under a city
getCityPOIs(cityId: bytes32): bytes32[]
```

#### Events

```ts
event POIUnlocked(address indexed user, bytes32 indexed poiId)
```

#### Frontend usage

```ts
import { ethers } from 'ethers';
import UserPOIRegistryABI from '@/contracts/abis/UserPOIRegistry.json';

const registry = new ethers.Contract(
  process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT!,
  UserPOIRegistryABI,
  provider
);

const cannesId = ethers.keccak256(ethers.toUtf8Bytes('cannes'));
const poi01    = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));

// Check if user unlocked a POI
const isUnlocked = await registry.unlockedPOIs(userAddress, poi01);

// How many of the 12 Cannes POIs has this user unlocked?
const progress = await registry.getUnlockedCount(userAddress, cannesId);

// Total POI count (used by RoamPoints.claimDailyPoints internally)
const total = await registry.getUserPOICount(userAddress);
```

---

### RoamEscrow

Holds the ETH payment for a POI unlock. The backend (Orchestrator agent) calls `release()` after delivering the audio URL. Users can call `refund()` if content is never delivered.

**Address:** `0x3c6869AB251b03D5ecF13DEAba13391eCfb3C809`

#### Write functions

```ts
// Lock payment for a POI unlock — called by user with ETH value
lockPayment(poiId: bytes32, contributor: address): payable

// Release payment to CommissionSplitter — called by owner (backend)
release(poiId: bytes32, audioUrl: string): onlyOwner

// Refund locked payment — called by original payer if content not delivered
refund(poiId: bytes32)
```

#### Read functions

```ts
// Get payment details for a poiId
payments(poiId: bytes32): { payer, contributor, amount, released, refunded }
```

#### Events

```ts
event PaymentLocked(bytes32 indexed poiId, address indexed payer, address contributor, uint256 amount)
event PaymentReleased(bytes32 indexed poiId, string audioUrl)
event PaymentRefunded(bytes32 indexed poiId, address payer, uint256 amount)
```

#### Frontend usage — x402 payment flow

```ts
import RoamEscrowABI from '@/contracts/abis/RoamEscrow.json';

const escrow = new ethers.Contract(
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT!,
  RoamEscrowABI,
  signer  // user must sign this tx
);

const poiId       = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));
const contributor = '0xContributorAddress';
const PRICE_ETH   = ethers.parseEther('0.0002'); // ~0.5 USDC equivalent

const tx = await escrow.lockPayment(poiId, contributor, { value: PRICE_ETH });
await tx.wait();

// Now call your backend API — it will call release() after content delivery
// Listen for PaymentReleased to get the audioUrl
const filter = escrow.filters.PaymentReleased(poiId);
escrow.once(filter, (poiId, audioUrl) => {
  console.log('Audio ready:', audioUrl);
});
```

**Full paid-unlock flow:**
```
1. Frontend: escrow.lockPayment(poiId, contributor) { value: X }
2. Frontend → Backend API: POST /api/experience/[poiId]
3. Backend: Orchestrator calls Lore + Scout + Guide agents
4. Backend: escrow.release(poiId, audioUrl)  ← owner-only
5. CommissionSplitter: 20% → contributor, 80% → platform
6. Frontend listens for PaymentReleased event → receives audioUrl
```

---

### RoamPoints

Non-transferable ERC-20 points token. Users accrue +10 ROAM per owned POI per day. 500 ROAM = 1 free unlock via PointsRedeemer.

**Address:** `0x9ca3e0044485508522CDE1651F9E7DCC13B46517`  
**Symbol:** ROAM | **Decimals:** 18

#### Read functions

```ts
// Standard ERC-20 balance
balanceOf(user: address): uint256

// How many points can the user claim right now (preview without tx)
pendingPoints(user: address): uint256

// Last time user claimed
lastClaimed(user: address): uint256  // unix timestamp

// Constants
POINTS_PER_POI_PER_DAY: uint256  // 10 * 1e18
UNLOCK_THRESHOLD: uint256         // 500 * 1e18
CLAIM_INTERVAL: uint256           // 86400 (1 day in seconds)
```

#### Write functions

```ts
// Claim accumulated daily points — callable once per 24h per user
// Reverts if user has zero owned POIs
claimDailyPoints()
```

#### Events

```ts
event PointsClaimed(address indexed user, uint256 amount)
```

#### Frontend usage

```ts
import RoamPointsABI from '@/contracts/abis/RoamPoints.json';

const points = new ethers.Contract(
  process.env.NEXT_PUBLIC_ROAM_POINTS_CONTRACT!,
  RoamPointsABI,
  provider
);

// Read balance (display as integer — 1e18 = 1 ROAM)
const raw     = await points.balanceOf(userAddress);
const balance = Number(ethers.formatEther(raw)); // e.g. 612

// How many points can be claimed right now?
const pending = await points.pendingPoints(userAddress);
const canClaim = pending > 0n;

// Claim (needs signer)
const pointsWithSigner = points.connect(signer);
const tx = await pointsWithSigner.claimDailyPoints();
await tx.wait();
```

**Claim eligibility logic:**
```
- User needs at least 1 unlocked POI
- Can only claim once every 24h
- If multiple days passed since last claim, credits all intervals at once
- First-ever claim: credits 1 day immediately
```

---

### PointsRedeemer

Burns 500 ROAM and records a free POI unlock — identical outcome to paying with ETH.

**Address:** `0xA951BF3C4CDcBA81f5E8A2112b4afD744C9E5E8D`

#### Write functions

```ts
// Burn 500 ROAM → free POI unlock
// Reverts if: already unlocked, balance < 500 ROAM
redeemForUnlock(poiId: bytes32)
```

#### Read functions

```ts
// Quick check — does user have enough ROAM to redeem?
canRedeem(user: address): bool

UNLOCK_THRESHOLD: uint256  // 500 * 1e18
```

#### Events

```ts
event PointsRedeemed(address indexed user, bytes32 indexed poiId, uint256 pointsBurned)
```

#### Frontend usage

```ts
import PointsRedeemerABI from '@/contracts/abis/PointsRedeemer.json';

const redeemer = new ethers.Contract(
  process.env.NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT!,
  PointsRedeemerABI,
  signer
);

const poiId = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));

// Check before attempting
const eligible = await redeemer.canRedeem(userAddress);
if (!eligible) throw new Error('Not enough ROAM points');

const tx = await redeemer.redeemForUnlock(poiId);
await tx.wait();
// POI is now recorded as unlocked in UserPOIRegistry
```

**Free-unlock flow:**
```
1. Frontend checks canRedeem(user) → true
2. Frontend: redeemer.redeemForUnlock(poiId)
3. PointsRedeemer: burns 500 ROAM from user
4. PointsRedeemer: calls UserPOIRegistry.recordUnlock(user, poiId)
5. Backend: Orchestrator is called same as paid flow → returns audioUrl
```

---

### CityRegistry

Defines cities and their total POI counts. Cannes (12 POIs) is pre-seeded.

**Address:** `0x7e5Df80570c7ED392D5227Ecb17a0A8f809b2D16`

#### Read functions

```ts
getCityPOICount(cityId: bytes32): uint256   // 12 for Cannes
getCityName(cityId: bytes32): string        // "Cannes"
getBadgeImageURI(cityId: bytes32): string   // IPFS URI
isActive(cityId: bytes32): bool
```

#### Frontend usage

```ts
import CityRegistryABI from '@/contracts/abis/CityRegistry.json';

const cityReg = new ethers.Contract(
  process.env.NEXT_PUBLIC_CITY_REGISTRY_CONTRACT!,
  CityRegistryABI,
  provider
);

const cannesId = ethers.keccak256(ethers.toUtf8Bytes('cannes'));

const total    = await cityReg.getCityPOICount(cannesId);  // 12
const name     = await cityReg.getCityName(cannesId);      // "Cannes"
const imageURI = await cityReg.getBadgeImageURI(cannesId); // "ipfs://..."
```

---

### CityBadgeNFT

ERC-721. Auto-minted when a user unlocks ALL POIs in a city. Completion also grants +100 ROAM bonus.

**Address:** `0xD577fc122Ca3Efe572c7E5805fF465A3D3AE2D9e`  
**Name:** Roam City Badge | **Symbol:** ROAMBADGE

#### Read functions

```ts
// Does user already have the badge for a city?
hasBadge(user: address, cityId: bytes32): bool

// ERC-721 standard — on-chain JSON metadata
tokenURI(tokenId: uint256): string  // returns data:application/json;utf8,...

// Which city does a token represent?
tokenCity(tokenId: uint256): bytes32

COMPLETION_BONUS: uint256  // 100 * 1e18 (ROAM)
```

#### Events

```ts
event BadgeMinted(address indexed user, bytes32 indexed cityId, uint256 tokenId)
```

#### Frontend usage

```ts
import CityBadgeNFTABI from '@/contracts/abis/CityBadgeNFT.json';

const badge = new ethers.Contract(
  process.env.NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT!,
  CityBadgeNFTABI,
  provider
);

const cannesId = ethers.keccak256(ethers.toUtf8Bytes('cannes'));

// Check if user has earned the Cannes badge
const hasBadge = await badge.hasBadge(userAddress, cannesId);

// Listen for auto-mint event
const filter = badge.filters.BadgeMinted(userAddress, cannesId);
badge.once(filter, (user, cityId, tokenId) => {
  console.log('Badge minted! Token ID:', tokenId.toString());
});
```

**Badge mint is automatic** — `checkAndMint` is called by the backend after every POI unlock. Frontend just needs to listen for the `BadgeMinted` event or poll `hasBadge`.

---

### ContributorRegistry

World ID 4.0 verified contributor registration. On successful registration, automatically grants an ENS subname via ENSSubnameRegistry.

**Address:** `0x29Ee229a3Cf875f707C35B83C82119Cf685fEA68`  
**World ID Verifier (Sepolia):** `0x469449f251692e0779667583026b5a1e99512157`

#### Write functions

```ts
// Register as verified contributor with World ID ZK proof
register(
  signal: address,        // must equal msg.sender
  root: uint256,          // World ID Merkle root
  nullifierHash: uint256, // unique per user per action
  proof: uint256[8],      // ZK proof from World ID SDK
  ensSubname: string      // desired subname e.g. "alice" → alice.roamswarm.eth
)
```

#### Read functions

```ts
isVerified(contributor: address): bool
verified(contributor: address): bool  // same as above, public mapping
ensName(contributor: address): string // stored subname label
```

#### Events

```ts
event ContributorRegistered(address indexed contributor, string ensSubname)
```

#### Frontend usage (World ID IDKit)

```tsx
import { IDKitWidget } from '@worldcoin/idkit';

// Proof is generated by IDKit widget, then passed to contract
async function onProofSuccess(proof: ISuccessResult) {
  const registry = new ethers.Contract(
    process.env.NEXT_PUBLIC_CONTRIBUTOR_REGISTRY!,
    ContributorRegistryABI,
    signer
  );

  await registry.register(
    userAddress,           // signal == msg.sender
    proof.merkle_root,
    proof.nullifier_hash,
    // proof.proof is an ABI-encoded uint256[8]
    ethers.AbiCoder.defaultAbiCoder().decode(
      ['uint256[8]'],
      ethers.hexlify(proof.proof)
    )[0],
    'alice'  // desired ENS subname
  );
}

// IDKit widget config
<IDKitWidget
  app_id={process.env.NEXT_PUBLIC_WORLDID_APP_ID}
  action="register_contributor"
  signal={userAddress}
  onSuccess={onProofSuccess}
  verification_level="orb"
/>
```

**Note:** `externalNullifier` is computed as:
```ts
keccak256(toUtf8Bytes('app_roam_swarm_register_contributor'))
```
This is hardcoded in the contract constructor — the IDKit widget handles it automatically when `action="register_contributor"` is set.

---

### ENSSubnameRegistry

Manages ENS subnames under `roamswarm.eth`. Automatically called by `ContributorRegistry.register()` — frontend doesn't need to call this directly.

**Address:** *(see `ENS_SUBNAME_REGISTRY_CONTRACT` in `.env`)*

#### Read functions

```ts
// Get the ENS node (bytes32) for a contributor address
getNode(contributor: address): bytes32

// Get the label (e.g. "alice") for a contributor address
getLabel(contributor: address): string

// Is this address registered?
isRegistered(contributor: address): bool
```

#### Frontend usage

```ts
// Resolve contributor ENS label
const label = await ensRegistry.getLabel(contributorAddress);
const fullName = label ? `${label}.roamswarm.eth` : null;
```

---

### CommissionSplitter

Internal contract — not called directly from frontend. Called by `RoamEscrow.release()`.

**Split:** 20% contributor / 80% platform  
**Address:** `0xeDF81E3bAE711848a0CBc3B02351624646a9E4ac`

---

## Key bytes32 Values

Pre-computed values you'll need in the frontend:

```ts
import { ethers } from 'ethers';

// City IDs
const CANNES_ID = ethers.keccak256(ethers.toUtf8Bytes('cannes'));
// → 0x359d0f2d3c0b5a4d30fc2ce35d9bf90a9b3a76ed1b2feee47ad5b98ccc44c5fc

// POI IDs (cannes-01 through cannes-12)
const POI_IDS = Array.from({ length: 12 }, (_, i) =>
  ethers.keccak256(ethers.toUtf8Bytes(`cannes-${String(i + 1).padStart(2, '0')}`))
);
```

---

## ABI Files

After running `npx hardhat compile` in `contracts/`, TypeScript types and ABI JSONs are generated at:

```
contracts/artifacts/         ← raw ABI JSON files
contracts/typechain-types/   ← TypeScript typed interfaces
```

To use in the Next.js app, either:

**Option A — import from artifacts:**
```ts
import UserPOIRegistryABI from '@/../contracts/artifacts/UserPOIRegistry.sol/UserPOIRegistry.json';
const abi = UserPOIRegistryABI.abi;
```

**Option B — copy ABIs to `apps/web/lib/abis/`:**
```bash
cp contracts/artifacts/UserPOIRegistry.sol/UserPOIRegistry.json apps/web/lib/abis/
```

---

## Common Error Messages

| Error | Contract | Cause |
|---|---|---|
| `"ROAM: non-transferable"` | RoamPoints | Tried to call transfer() or transferFrom() |
| `"ROAM: no owned POIs"` | RoamPoints | claimDailyPoints() with zero unlocked POIs |
| `"ROAM: claim too soon"` | RoamPoints | Called claimDailyPoints() within 24h of last claim |
| `"ROAM: not a burner"` | RoamPoints | Unauthorized address tried to call burn() |
| `"PointsRedeemer: already unlocked"` | PointsRedeemer | POI already unlocked for this user |
| `"PointsRedeemer: insufficient points"` | PointsRedeemer | Balance < 500 ROAM |
| `"Already locked"` | RoamEscrow | lockPayment() called twice for same poiId |
| `"Already settled"` | RoamEscrow | Tried to release/refund an already-settled payment |
| `"Not payer"` | RoamEscrow | refund() called by someone other than original payer |
| `"Already registered"` | ContributorRegistry | Wallet already World ID verified |
| `"Proof already used"` | ContributorRegistry | nullifierHash already seen (duplicate proof) |
| `"Not authorized"` | UserPOIRegistry | recordUnlock() called by non-authorized contract |
| `"CityBadgeNFT: unknown city"` | CityBadgeNFT | checkAndMint() called with unknown cityId |

---

## Full Unlock Flow (both paths)

```
Paid unlock (x402):
  user → RoamEscrow.lockPayment(poiId, contributor) { value: X ETH }
       → backend receives event → Orchestrator runs agents
       → backend → RoamEscrow.release(poiId, audioUrl)
       → CommissionSplitter: 20% contributor / 80% platform
       → [implicit] UserPOIRegistry.recordUnlock() called by RoamEscrow? 
         ↳ NOTE: backend should call UserPOIRegistry.recordUnlock() separately
       → backend → CityBadgeNFT.checkAndMint(user, cityId)
       → frontend receives PaymentReleased event with audioUrl

Free unlock (ROAM points):
  user → PointsRedeemer.redeemForUnlock(poiId)
       → burns 500 ROAM from user
       → UserPOIRegistry.recordUnlock(user, poiId)  ← automatic
       → backend detects POIUnlocked event → Orchestrator runs agents
       → backend → CityBadgeNFT.checkAndMint(user, cityId)
       → frontend receives audioUrl from backend API
```

> **Note for backend:** After `RoamEscrow.release()`, separately call `UserPOIRegistry.recordUnlock(user, poiId)` so the user's progress is tracked and `CityBadgeNFT.checkAndMint()` works correctly.

---

## Network Config (for wagmi / Reown AppKit)

```ts
// apps/web/lib/wagmi.ts or similar
import { sepolia } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [sepolia];

export const CONTRACT_ADDRESSES = {
  escrow:              '0x3c6869AB251b03D5ecF13DEAba13391eCfb3C809',
  contributorRegistry: '0x29Ee229a3Cf875f707C35B83C82119Cf685fEA68',
  roamPoints:          '0x9ca3e0044485508522CDE1651F9E7DCC13B46517',
  pointsRedeemer:      '0xA951BF3C4CDcBA81f5E8A2112b4afD744C9E5E8D',
  userPOIRegistry:     '0x9d0530bc24694E5e1f6b74239fAa0442Eb6072CC',
  cityBadgeNFT:        '0xD577fc122Ca3Efe572c7E5805fF465A3D3AE2D9e',
  cityRegistry:        '0x7e5Df80570c7ED392D5227Ecb17a0A8f809b2D16',
  commissionSplitter:  '0xeDF81E3bAE711848a0CBc3B02351624646a9E4ac',
} as const;
```
