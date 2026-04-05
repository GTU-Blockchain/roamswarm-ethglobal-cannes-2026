/**
 * deploy-all.ts
 * Full fresh deploy: Phase 2 → 3 → 4, then auto-patch both .env files.
 *
 * Usage:
 *   cd contracts && npm run deploy:fresh
 */

import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// ─── World ID & ENS constants ─────────────────────────────────────────────────

const WORLD_ID_SEPOLIA  = '0x469449f251692e0779667583026b5a1e99512157';
const ENS_REGISTRY      = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_RESOLVER      = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const ROAM_NODE         = ethers.keccak256(ethers.toUtf8Bytes('roamswarm.eth'));

// External nullifier — must match exactly what IDKit sends to the World ID bridge.
//
// IDKit computes:  hashToField(packed(hashToField(appId), hashToField(action)))
// where:           hashToField(x: string) = keccak256(utf8(x)) >> 8
//                  hashToField(x: bytes)  = keccak256(x) >> 8
//
// appId  = process.env.NEXT_PUBLIC_WORLDID_APP_ID  ("app_64cc7693dcddbd90361336d0ef091ea6")
// action = "register_contributor"   (matches <IDKitWidget action="register_contributor">)
const _hashToField = (input: Uint8Array): bigint =>
  BigInt(ethers.keccak256(input)) >> 8n;

const _h1 = _hashToField(ethers.toUtf8Bytes('app_64cc7693dcddbd90361336d0ef091ea6'));
const _h2 = _hashToField(ethers.toUtf8Bytes('register_contributor'));
const _packed = ethers.getBytes(ethers.solidityPacked(['uint256', 'uint256'], [_h1, _h2]));
const EXTERNAL_NULLIFIER = _hashToField(_packed);

// ─── Env patch helper ─────────────────────────────────────────────────────────

function patchEnv(envPath: string, updates: Record<string, string>): void {
  if (!fs.existsSync(envPath)) {
    console.warn(`  ⚠️  ${envPath} not found — skipping`);
    return;
  }

  let content = fs.readFileSync(envPath, 'utf8');

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${key}=).*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${value}`);
    } else {
      // Key doesn't exist yet — append it
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, content);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   RoamSwarm — Full Fresh Deploy       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`Deployer : ${deployer.address}`);
  console.log(`Balance  : ${ethers.formatEther(balance)} ETH\n`);

  if (ethers.formatEther(balance) < '0.05') {
    throw new Error('Balance too low — need at least 0.05 ETH on Sepolia');
  }

  // ── MockWorldID (staging only — real on-chain World ID rejects simulator roots) ─
  console.log('─── Staging setup ────────────────────────────');
  console.log('  [0/1] MockWorldID (accepts any IDKit simulator proof)...');
  const MockWorldID = await ethers.getContractFactory('MockWorldID');
  const mockWorldId = await MockWorldID.deploy();
  await mockWorldId.waitForDeployment();
  const mockWorldIdAddr = await mockWorldId.getAddress();
  console.log(`        ✅ MockWorldID: ${mockWorldIdAddr}\n`);

  // ── PHASE 2: Core contracts ─────────────────────────────────────────────────
  console.log('─── Phase 2: Core contracts ──────────────────');

  console.log('  [1/4] CommissionSplitter...');
  const CommissionSplitter = await ethers.getContractFactory('CommissionSplitter');
  const commissionSplitter = await CommissionSplitter.deploy(deployer.address);
  await commissionSplitter.waitForDeployment();
  const splitterAddr = await commissionSplitter.getAddress();
  console.log(`        ✅ ${splitterAddr}`);

  console.log('  [2/4] UserPOIRegistry...');
  const UserPOIRegistry = await ethers.getContractFactory('UserPOIRegistry');
  const userPOIRegistry = await UserPOIRegistry.deploy();
  await userPOIRegistry.waitForDeployment();
  const poiRegistryAddr = await userPOIRegistry.getAddress();
  console.log(`        ✅ ${poiRegistryAddr}`);

  console.log('  [3/4] RoamEscrow...');
  const RoamEscrow = await ethers.getContractFactory('RoamEscrow');
  const roamEscrow = await RoamEscrow.deploy(splitterAddr, poiRegistryAddr);
  await roamEscrow.waitForDeployment();
  const escrowAddr = await roamEscrow.getAddress();
  console.log(`        ✅ ${escrowAddr}`);

  console.log('  [4/4] ContributorRegistry (with MockWorldID for staging)...');
  const ContributorRegistry = await ethers.getContractFactory('ContributorRegistry');
  const contributorRegistry = await ContributorRegistry.deploy(mockWorldIdAddr, EXTERNAL_NULLIFIER);
  await contributorRegistry.waitForDeployment();
  const contributorAddr = await contributorRegistry.getAddress();
  console.log(`        ✅ ${contributorAddr}`);

  console.log('  Authorizing RoamEscrow on UserPOIRegistry...');
  await (await userPOIRegistry.setAuthorized(escrowAddr, true)).wait();
  console.log('        ✅ RoamEscrow authorized\n');

  // ── PHASE 3: Points system ──────────────────────────────────────────────────
  console.log('─── Phase 3: Points system ───────────────────');

  console.log('  [1/2] RoamPoints...');
  const RoamPoints = await ethers.getContractFactory('RoamPoints');
  const roamPoints = await RoamPoints.deploy(poiRegistryAddr);
  await roamPoints.waitForDeployment();
  const roamPointsAddr = await roamPoints.getAddress();
  console.log(`        ✅ ${roamPointsAddr}`);

  console.log('  [2/2] PointsRedeemer...');
  const PointsRedeemer = await ethers.getContractFactory('PointsRedeemer');
  const pointsRedeemer = await PointsRedeemer.deploy(roamPointsAddr, poiRegistryAddr);
  await pointsRedeemer.waitForDeployment();
  const pointsRedeemerAddr = await pointsRedeemer.getAddress();
  console.log(`        ✅ ${pointsRedeemerAddr}`);

  console.log('  Authorizing PointsRedeemer as burner on RoamPoints...');
  await (await roamPoints.setBurner(pointsRedeemerAddr, true)).wait();
  console.log('        ✅ Burner set');

  console.log('  Authorizing PointsRedeemer on UserPOIRegistry...');
  await (await userPOIRegistry.setAuthorized(pointsRedeemerAddr, true)).wait();
  console.log('        ✅ PointsRedeemer authorized\n');

  // ── PHASE 4: NFT + ENS ─────────────────────────────────────────────────────
  console.log('─── Phase 4: NFT + ENS ───────────────────────');

  console.log('  [1/3] CityRegistry...');
  const CityRegistry = await ethers.getContractFactory('CityRegistry');
  const cityRegistry = await CityRegistry.deploy();
  await cityRegistry.waitForDeployment();
  const cityRegistryAddr = await cityRegistry.getAddress();
  console.log(`        ✅ ${cityRegistryAddr}`);

  console.log('  [2/3] CityBadgeNFT...');
  const CityBadgeNFT = await ethers.getContractFactory('CityBadgeNFT');
  const cityBadgeNFT = await CityBadgeNFT.deploy(poiRegistryAddr, cityRegistryAddr, roamPointsAddr);
  await cityBadgeNFT.waitForDeployment();
  const cityBadgeNFTAddr = await cityBadgeNFT.getAddress();
  console.log(`        ✅ ${cityBadgeNFTAddr}`);

  console.log('  [3/3] ENSSubnameRegistry...');
  const ENSSubnameRegistry = await ethers.getContractFactory('ENSSubnameRegistry');
  const ensSubnameRegistry = await ENSSubnameRegistry.deploy(ENS_REGISTRY, ENS_RESOLVER, ROAM_NODE);
  await ensSubnameRegistry.waitForDeployment();
  const ensSubnameRegistryAddr = await ensSubnameRegistry.getAddress();
  console.log(`        ✅ ${ensSubnameRegistryAddr}`);

  console.log('  Authorizing CityBadgeNFT as minter on RoamPoints...');
  await (await roamPoints.setMinter(cityBadgeNFTAddr, true)).wait();
  console.log('        ✅ CityBadgeNFT minter set');

  // Register agent ENS subnames
  console.log('  Registering agent ENS subnames...');
  const signers = await ethers.getSigners();
  const getAgentAddr = (i: number) =>
    signers[i] ? signers[i].address : ethers.Wallet.createRandom().address;

  const agentSubnames: [string, string][] = [
    ['orchestrator', getAgentAddr(1)],
    ['lore',         getAgentAddr(2)],
    ['scout',        getAgentAddr(3)],
    ['guide',        getAgentAddr(4)],
  ];
  for (const [label, addr] of agentSubnames) {
    try {
      await (await ensSubnameRegistry.registerSubname(label, addr)).wait();
      console.log(`        ✅ ${label}.roamswarm.eth → ${addr}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.slice(0, 60) : String(e);
      console.log(`        ⚠️  ${label} skipped: ${msg}`);
    }
  }

  // ── Collect all addresses ────────────────────────────────────────────────────
  const newAddresses: Record<string, string> = {
    NEXT_PUBLIC_ESCROW_CONTRACT:             escrowAddr,
    NEXT_PUBLIC_CONTRIBUTOR_REGISTRY:        contributorAddr,
    NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT:  poiRegistryAddr,
    COMMISSION_SPLITTER_CONTRACT:            splitterAddr,
    NEXT_PUBLIC_ROAM_POINTS_CONTRACT:        roamPointsAddr,
    NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT:    pointsRedeemerAddr,
    NEXT_PUBLIC_CITY_REGISTRY_CONTRACT:      cityRegistryAddr,
    NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT:     cityBadgeNFTAddr,
    ENS_SUBNAME_REGISTRY_CONTRACT:           ensSubnameRegistryAddr,
  };

  console.log('\n─── Deployed Addresses ───────────────────────');
  for (const [key, val] of Object.entries(newAddresses)) {
    console.log(`  ${key}=${val}`);
  }

  // ── Patch both .env files ───────────────────────────────────────────────────
  const root    = path.resolve(__dirname, '../../');
  const rootEnv = path.join(root, '.env');
  const webEnv  = path.join(root, 'apps/web/.env');

  console.log('\n─── Updating .env files ──────────────────────');
  patchEnv(rootEnv, newAddresses);
  console.log(`  ✅ ${rootEnv}`);
  patchEnv(webEnv, newAddresses);
  console.log(`  ✅ ${webEnv}`);

  // Save snapshot for reference
  const snapshotPath = path.resolve(__dirname, '../deployed-latest.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(
    { deployedAt: new Date().toISOString(), deployer: deployer.address, ...newAddresses },
    null, 2
  ));
  console.log(`  ✅ Snapshot saved to contracts/deployed-latest.json`);

  // Clear Next.js + Turbo cache so NEXT_PUBLIC_* vars are picked up fresh
  console.log('\n─── Clearing build caches ────────────────────');
  const nextCacheDir = path.join(root, 'apps/web/.next');
  const turboCacheDir = path.join(root, '.turbo');
  for (const dir of [nextCacheDir, turboCacheDir]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`  ✅ Cleared ${path.relative(root, dir)}`);
    }
  }

  console.log('\n✨ All done! Run `npm run dev` (web) + `npm run swarm` (agents) to start fresh.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
