/**
 * Phase 5 — Demo Wallet Seed
 *
 * Pre-seeds a demo wallet so judges/testers see a realistic state:
 *   - 612 ROAM points minted
 *   - 7 of 12 Cannes POIs unlocked
 *
 * Usage:
 *   cd contracts
 *   DEMO_WALLET=0xYourAddress npx hardhat run scripts/seed-demo-wallet.ts --network sepolia
 *
 * If DEMO_WALLET is not set, the deployer's own address is used.
 *
 * Pre-conditions:
 *   - All Phase 2-4 contracts deployed and addresses in .env
 *   - Deployer is owner of RoamPoints and UserPOIRegistry
 */

import { ethers } from 'hardhat';

// Cannes POI IDs (must match data/cannes-pois.json and any on-chain seeding)
const CANNES_POIS = [
  'cannes-01', 'cannes-02', 'cannes-03', 'cannes-04',
  'cannes-05', 'cannes-06', 'cannes-07', 'cannes-08',
  'cannes-09', 'cannes-10', 'cannes-11', 'cannes-12',
];

// Seed: unlock first 7 POIs
const POIs_TO_UNLOCK = CANNES_POIS.slice(0, 7);

// 612 ROAM points (18 decimals)
const ROAM_TO_MINT = ethers.parseEther('612');

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  const demoWallet = process.env.DEMO_WALLET ?? deployer.address;

  console.log('=== Phase 5 — Seed Demo Wallet ===');
  console.log('Deployer    :', deployer.address);
  console.log('Demo wallet :', demoWallet);
  console.log('ROAM to mint:', ethers.formatEther(ROAM_TO_MINT), 'ROAM');
  console.log('POIs to unlock:', POIs_TO_UNLOCK.length, '\n');

  const roamPointsAddr  = requireEnv('NEXT_PUBLIC_ROAM_POINTS_CONTRACT');
  const poiRegistryAddr = requireEnv('NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT');
  const cityRegistryAddr = requireEnv('NEXT_PUBLIC_CITY_REGISTRY_CONTRACT');
  const cityBadgeAddr   = requireEnv('NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT');

  const roamPoints    = await ethers.getContractAt('RoamPoints', roamPointsAddr);
  const poiRegistry   = await ethers.getContractAt('UserPOIRegistry', poiRegistryAddr);
  const cityRegistry  = await ethers.getContractAt('CityRegistry', cityRegistryAddr);
  const cityBadgeNFT  = await ethers.getContractAt('CityBadgeNFT', cityBadgeAddr);

  const cannesId = ethers.keccak256(ethers.toUtf8Bytes('cannes'));

  // ── Step 1: Grant deployer minter role on RoamPoints ─────────────────────
  console.log('Step 1/5: Setting deployer as RoamPoints minter...');
  const alreadyMinter = await roamPoints.minters(deployer.address);
  if (!alreadyMinter) {
    const tx = await roamPoints.setMinter(deployer.address, true);
    await tx.wait();
  }
  console.log('  ✅ Minter granted\n');

  // ── Step 2: Mint 612 ROAM to demo wallet ─────────────────────────────────
  console.log(`Step 2/5: Minting ${ethers.formatEther(ROAM_TO_MINT)} ROAM → ${demoWallet}...`);
  const mintTx = await roamPoints.mint(demoWallet, ROAM_TO_MINT);
  await mintTx.wait();
  const balance = await roamPoints.balanceOf(demoWallet);
  console.log(`  ✅ Balance: ${ethers.formatEther(balance)} ROAM\n`);

  // ── Step 3: Authorize deployer on UserPOIRegistry ────────────────────────
  console.log('Step 3/5: Authorizing deployer on UserPOIRegistry...');
  const alreadyAuth = await poiRegistry.authorized(deployer.address);
  if (!alreadyAuth) {
    const tx = await poiRegistry.setAuthorized(deployer.address, true);
    await tx.wait();
  }
  console.log('  ✅ Authorized\n');

  // ── Step 4: Seed Cannes POIs into registry & unlock 7 ────────────────────
  console.log('Step 4/5: Seeding Cannes POIs and recording unlocks...');
  for (const poiIdStr of POIs_TO_UNLOCK) {
    const poiIdBytes = ethers.keccak256(ethers.toUtf8Bytes(poiIdStr));

    // Register POI under Cannes city (idempotent — check first)
    const cityPOIs: string[] = await poiRegistry.getCityPOIs(cannesId);
    if (!cityPOIs.includes(poiIdBytes)) {
      const addTx = await poiRegistry.addPOIToCity(cannesId, poiIdBytes);
      await addTx.wait();
    }

    // Record unlock for demo wallet (idempotent)
    const alreadyUnlocked = await poiRegistry.unlockedPOIs(demoWallet, poiIdBytes);
    if (!alreadyUnlocked) {
      const unlockTx = await poiRegistry.recordUnlock(demoWallet, poiIdBytes);
      await unlockTx.wait();
    }

    console.log(`  ✅ ${poiIdStr} unlocked`);
  }

  const unlockedCount = await poiRegistry.getUnlockedCount(demoWallet, cannesId);
  console.log(`\n  Total unlocked in Cannes: ${unlockedCount}/12\n`);

  // ── Step 5: Check if badge should be minted (7/12 = no badge yet) ────────
  console.log('Step 5/5: Badge check (7/12 POIs — badge requires 12)...');
  const cityBadgeAuthorized = await cityBadgeNFT.authorized(deployer.address);
  if (!cityBadgeAuthorized) {
    const tx = await cityBadgeNFT.setAuthorized(deployer.address, true);
    await tx.wait();
  }
  const checkTx = await cityBadgeNFT.checkAndMint(demoWallet, cannesId);
  await checkTx.wait();
  const hasBadge = await cityBadgeNFT.hasBadge(demoWallet, cannesId);
  console.log(`  Badge minted: ${hasBadge} (expected: false — 7/12 unlocked)\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('=== Seed Complete ===');
  console.log('Demo wallet :', demoWallet);
  console.log('ROAM balance:', ethers.formatEther(await roamPoints.balanceOf(demoWallet)));
  console.log('POIs unlocked (Cannes):', Number(await poiRegistry.getUnlockedCount(demoWallet, cannesId)));
  console.log('Has city badge:', await cityBadgeNFT.hasBadge(demoWallet, cannesId));
  console.log('\nNext: unlock remaining 5 POIs via the demo to trigger CityBadgeNFT auto-mint.');
}

main().catch((e) => { console.error(e); process.exit(1); });
