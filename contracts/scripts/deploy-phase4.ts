import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// Sepolia ENS Registry (mainnet & sepolia share the same address)
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
// Sepolia Public Resolver
const ENS_RESOLVER = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
// roamswarm.eth node — we use a mock node for Sepolia (we don't own roamswarm.eth on Sepolia)
// This is keccak256("cannes") in bytes32 for local tracking purposes
const ROAM_NODE = ethers.keccak256(ethers.toUtf8Bytes('roamswarm.eth'));

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('=== Phase 4 Deploy — Ethereum Sepolia ===');
  console.log('Deployer :', deployer.address);
  console.log('Balance  :', ethers.formatEther(balance), 'ETH\n');

  // Read Phase 3 addresses from env
  const poiRegistryAddr = process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT!;
  const roamPointsAddr = process.env.NEXT_PUBLIC_ROAM_POINTS_CONTRACT!;

  if (!poiRegistryAddr || !roamPointsAddr) {
    throw new Error('Missing phase 3 addresses in .env. Run deploy-phase3.ts first.');
  }

  console.log('UserPOIRegistry :', poiRegistryAddr);
  console.log('RoamPoints      :', roamPointsAddr, '\n');

  // 1. CityRegistry
  console.log('1/3 Deploying CityRegistry...');
  const CityRegistry = await ethers.getContractFactory('CityRegistry');
  const cityRegistry = await CityRegistry.deploy();
  await cityRegistry.waitForDeployment();
  const cityRegistryAddr = await cityRegistry.getAddress();
  console.log('    ✅ CityRegistry:', cityRegistryAddr);

  // 2. CityBadgeNFT (needs UserPOIRegistry + CityRegistry + RoamPoints)
  console.log('2/3 Deploying CityBadgeNFT...');
  const CityBadgeNFT = await ethers.getContractFactory('CityBadgeNFT');
  const cityBadgeNFT = await CityBadgeNFT.deploy(poiRegistryAddr, cityRegistryAddr, roamPointsAddr);
  await cityBadgeNFT.waitForDeployment();
  const cityBadgeNFTAddr = await cityBadgeNFT.getAddress();
  console.log('    ✅ CityBadgeNFT:', cityBadgeNFTAddr);

  // 3. ENSSubnameRegistry
  console.log('3/3 Deploying ENSSubnameRegistry...');
  const ENSSubnameRegistry = await ethers.getContractFactory('ENSSubnameRegistry');
  const ensSubnameRegistry = await ENSSubnameRegistry.deploy(ENS_REGISTRY, ENS_RESOLVER, ROAM_NODE);
  await ensSubnameRegistry.waitForDeployment();
  const ensSubnameRegistryAddr = await ensSubnameRegistry.getAddress();
  console.log('    ✅ ENSSubnameRegistry:', ensSubnameRegistryAddr);

  // ─── Wire up authorizations ───────────────────────────────────────────────

  // CityBadgeNFT needs to be a minter on RoamPoints (for +100 bonus)
  console.log('\nAuthorizing CityBadgeNFT as minter on RoamPoints...');
  const roamPoints = await ethers.getContractAt('RoamPoints', roamPointsAddr);
  const setMinterTx = await roamPoints.setMinter(cityBadgeNFTAddr, true);
  await setMinterTx.wait();
  console.log('    ✅ CityBadgeNFT is now a minter');

  // CityBadgeNFT authorized on UserPOIRegistry — it only reads, but authorize for future use
  // (checkAndMint reads via IUserPOIRegistry interface — no write access needed)

  // ─── Seed: register agent ENS subnames (local tracking) ──────────────────

  console.log('\nSeeding agent ENS subnames (local tracking)...');
  // Use distinct mock addresses per agent (signers[1..4] or derived addresses)
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
      const tx = await ensSubnameRegistry.registerSubname(label, addr);
      await tx.wait();
      console.log(`    ✅ ${label}.roamswarm.eth → ${addr}`);
    } catch (e: any) {
      console.log(`    ⚠️  ${label}.roamswarm.eth skipped: ${e.message?.slice(0, 60)}`);
    }
  }

  // Summary
  const addresses = {
    NEXT_PUBLIC_CITY_REGISTRY_CONTRACT: cityRegistryAddr,
    NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT: cityBadgeNFTAddr,
    ENS_SUBNAME_REGISTRY_CONTRACT: ensSubnameRegistryAddr,
  };

  console.log('\n=== Deployed Addresses ===');
  for (const [key, val] of Object.entries(addresses)) {
    console.log(`${key}=${val}`);
  }

  const outPath = path.resolve(__dirname, '../deployed-phase4.json');
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log('\nAddresses saved to contracts/deployed-phase4.json');
  console.log('Copy the values above into your .env file.');
}

main().catch((e) => { console.error(e); process.exit(1); });
