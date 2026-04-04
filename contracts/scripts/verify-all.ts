/**
 * Phase 5 — Etherscan Verification
 *
 * Verifies all 9 Roam-Swarm contracts on Sepolia Etherscan.
 * Reads addresses from process.env (your .env file).
 *
 * Usage:
 *   cd contracts
 *   npx hardhat run scripts/verify-all.ts --network sepolia
 */

import { ethers, run } from 'hardhat';

// ─── Constants (must match deploy scripts exactly) ───────────────────────────

const WORLD_ID_SEPOLIA = '0x469449f251692e0779667583026b5a1e99512157';

const EXTERNAL_NULLIFIER = BigInt(
  ethers.keccak256(ethers.toUtf8Bytes('app_roam_swarm_register_contributor'))
).toString();

const ENS_REGISTRY  = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_RESOLVER  = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const ROAM_NODE     = ethers.keccak256(ethers.toUtf8Bytes('roamswarm.eth'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verify(name: string, address: string, constructorArguments: unknown[] = []) {
  console.log(`\nVerifying ${name} at ${address} ...`);
  try {
    await run('verify:verify', { address, constructorArguments });
    console.log(`  ✅ ${name} verified`);
  } catch (e: any) {
    if (e.message?.toLowerCase().includes('already verified')) {
      console.log(`  ✓  ${name} already verified`);
    } else {
      console.error(`  ❌ ${name} failed:`, e.message?.slice(0, 120));
    }
  }
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('=== Phase 5 — Etherscan Verify All ===');
  console.log('Network  : Sepolia');
  console.log('Deployer :', deployer.address);

  // Load addresses from .env
  const splitterAddr     = requireEnv('COMMISSION_SPLITTER_CONTRACT');
  const poiRegistryAddr  = requireEnv('NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT');
  const escrowAddr       = requireEnv('NEXT_PUBLIC_ESCROW_CONTRACT');
  const contributorAddr  = requireEnv('NEXT_PUBLIC_CONTRIBUTOR_REGISTRY');
  const roamPointsAddr   = requireEnv('NEXT_PUBLIC_ROAM_POINTS_CONTRACT');
  const redeemerAddr     = requireEnv('NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT');
  const cityRegistryAddr = requireEnv('NEXT_PUBLIC_CITY_REGISTRY_CONTRACT');
  const cityBadgeAddr    = requireEnv('NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT');
  const ensSubnameAddr   = process.env.ENS_SUBNAME_REGISTRY_CONTRACT ?? '';

  // ── Phase 2 ──────────────────────────────────────────────────────────────

  // CommissionSplitter(address _platform)
  await verify('CommissionSplitter', splitterAddr, [deployer.address]);

  // UserPOIRegistry() — no args
  await verify('UserPOIRegistry', poiRegistryAddr, []);

  // RoamEscrow(address _commissionSplitter, address _poiRegistry)
  await verify('RoamEscrow', escrowAddr, [splitterAddr, poiRegistryAddr]);

  // ContributorRegistry(address _worldIdAddress, uint256 _externalNullifier)
  await verify('ContributorRegistry', contributorAddr, [
    WORLD_ID_SEPOLIA,
    EXTERNAL_NULLIFIER,
  ]);

  // ── Phase 3 ──────────────────────────────────────────────────────────────

  // RoamPoints(address _poiRegistry)
  await verify('RoamPoints', roamPointsAddr, [poiRegistryAddr]);

  // PointsRedeemer(address _roamPoints, address _poiRegistry)
  await verify('PointsRedeemer', redeemerAddr, [roamPointsAddr, poiRegistryAddr]);

  // ── Phase 4 ──────────────────────────────────────────────────────────────

  // CityRegistry() — no args
  await verify('CityRegistry', cityRegistryAddr, []);

  // CityBadgeNFT(address _poiRegistry, address _cityRegistry, address _roamPoints)
  await verify('CityBadgeNFT', cityBadgeAddr, [
    poiRegistryAddr,
    cityRegistryAddr,
    roamPointsAddr,
  ]);

  // ENSSubnameRegistry(address _ensRegistry, address _ensResolver, bytes32 _roamNode)
  if (ensSubnameAddr) {
    await verify('ENSSubnameRegistry', ensSubnameAddr, [
      ENS_REGISTRY,
      ENS_RESOLVER,
      ROAM_NODE,
    ]);
  } else {
    console.log('\n⚠️  ENS_SUBNAME_REGISTRY_CONTRACT not set — skipping ENSSubnameRegistry verify');
  }

  console.log('\n=== Done ===');
  console.log('Check: https://sepolia.etherscan.io');
}

main().catch((e) => { console.error(e); process.exit(1); });
