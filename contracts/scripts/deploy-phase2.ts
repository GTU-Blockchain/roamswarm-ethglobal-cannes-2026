import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// World ID Sepolia staging verifier
// https://docs.worldcoin.org/reference/address-book
const WORLD_ID_SEPOLIA = '0x469449f251692e0779667583026b5a1e99512157';

// externalNullifier = hash of app_id + action
const EXTERNAL_NULLIFIER = BigInt(
  ethers.keccak256(ethers.toUtf8Bytes('app_roam_swarm_register_contributor'))
);

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('=== Phase 2 Deploy — Ethereum Sepolia ===');
  console.log('Deployer :', deployer.address);
  console.log('Balance  :', ethers.formatEther(balance), 'ETH\n');

  // 1. CommissionSplitter (platform = deployer)
  console.log('1/4 Deploying CommissionSplitter...');
  const CommissionSplitter = await ethers.getContractFactory('CommissionSplitter');
  const commissionSplitter = await CommissionSplitter.deploy(deployer.address);
  await commissionSplitter.waitForDeployment();
  const splitterAddr = await commissionSplitter.getAddress();
  console.log('    ✅ CommissionSplitter:', splitterAddr);

  // 2. UserPOIRegistry
  console.log('2/4 Deploying UserPOIRegistry...');
  const UserPOIRegistry = await ethers.getContractFactory('UserPOIRegistry');
  const userPOIRegistry = await UserPOIRegistry.deploy();
  await userPOIRegistry.waitForDeployment();
  const registryAddr = await userPOIRegistry.getAddress();
  console.log('    ✅ UserPOIRegistry:', registryAddr);

  // 3. RoamEscrow (needs CommissionSplitter)
  console.log('3/4 Deploying RoamEscrow...');
  const RoamEscrow = await ethers.getContractFactory('RoamEscrow');
  const roamEscrow = await RoamEscrow.deploy(splitterAddr);
  await roamEscrow.waitForDeployment();
  const escrowAddr = await roamEscrow.getAddress();
  console.log('    ✅ RoamEscrow:', escrowAddr);

  // 4. ContributorRegistry (needs World ID)
  console.log('4/4 Deploying ContributorRegistry...');
  const ContributorRegistry = await ethers.getContractFactory('ContributorRegistry');
  const contributorRegistry = await ContributorRegistry.deploy(
    WORLD_ID_SEPOLIA,
    EXTERNAL_NULLIFIER
  );
  await contributorRegistry.waitForDeployment();
  const contributorAddr = await contributorRegistry.getAddress();
  console.log('    ✅ ContributorRegistry:', contributorAddr);

  // Authorize RoamEscrow to call UserPOIRegistry.recordUnlock
  console.log('\nAuthorizing RoamEscrow on UserPOIRegistry...');
  const authTx = await userPOIRegistry.setAuthorized(escrowAddr, true);
  await authTx.wait();
  console.log('    ✅ RoamEscrow authorized');

  // Summary
  const addresses = {
    NEXT_PUBLIC_ESCROW_CONTRACT: escrowAddr,
    NEXT_PUBLIC_CONTRIBUTOR_REGISTRY: contributorAddr,
    COMMISSION_SPLITTER_CONTRACT: splitterAddr,
    NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT: registryAddr,
  };

  console.log('\n=== Deployed Addresses ===');
  for (const [key, val] of Object.entries(addresses)) {
    console.log(`${key}=${val}`);
  }

  // Write addresses to a file for easy .env update
  const outPath = path.resolve(__dirname, '../deployed-phase2.json');
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to contracts/deployed-phase2.json`);
  console.log('Copy the values above into your .env file.');
}

main().catch((e) => { console.error(e); process.exit(1); });
