import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('=== Phase 3 Deploy — Ethereum Sepolia ===');
  console.log('Deployer :', deployer.address);
  console.log('Balance  :', ethers.formatEther(balance), 'ETH\n');

  // Read Phase 2 addresses from env
  const poiRegistryAddr: string | undefined = process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT;
  if (!poiRegistryAddr || poiRegistryAddr.trim() === '') {
    throw new Error('NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT not set in .env. Run deploy-phase2.ts first.');
  }
  console.log('UserPOIRegistry (phase2):', poiRegistryAddr, '\n');

  // 1. RoamPoints (needs UserPOIRegistry address)
  console.log('1/2 Deploying RoamPoints...');
  const RoamPoints = await ethers.getContractFactory('RoamPoints');
  const roamPoints = await RoamPoints.deploy(poiRegistryAddr);
  await roamPoints.waitForDeployment();
  const roamPointsAddr = await roamPoints.getAddress();
  console.log('    ✅ RoamPoints:', roamPointsAddr);

  // 2. PointsRedeemer (needs RoamPoints + UserPOIRegistry)
  console.log('2/2 Deploying PointsRedeemer...');
  const PointsRedeemer = await ethers.getContractFactory('PointsRedeemer');
  const pointsRedeemer = await PointsRedeemer.deploy(roamPointsAddr, poiRegistryAddr);
  await pointsRedeemer.waitForDeployment();
  const pointsRedeemerAddr = await pointsRedeemer.getAddress();
  console.log('    ✅ PointsRedeemer:', pointsRedeemerAddr);

  // 3. Authorize PointsRedeemer as a burner on RoamPoints
  console.log('\nAuthorizing PointsRedeemer as burner on RoamPoints...');
  const setBurnerTx = await roamPoints.setBurner(pointsRedeemerAddr, true);
  await setBurnerTx.wait();
  console.log('    ✅ PointsRedeemer is now a burner');

  // 4. Authorize PointsRedeemer to call UserPOIRegistry.recordUnlock
  console.log('Authorizing PointsRedeemer on UserPOIRegistry...');
  const UserPOIRegistry = await ethers.getContractAt('UserPOIRegistry', poiRegistryAddr);
  const authTx = await UserPOIRegistry.setAuthorized(pointsRedeemerAddr, true);
  await authTx.wait();
  console.log('    ✅ PointsRedeemer authorized on UserPOIRegistry');

  // Summary
  const addresses = {
    NEXT_PUBLIC_ROAM_POINTS_CONTRACT: roamPointsAddr,
    NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT: pointsRedeemerAddr,
  };

  console.log('\n=== Deployed Addresses ===');
  for (const [key, val] of Object.entries(addresses)) {
    console.log(`${key}=${val}`);
  }

  // Write to file
  const outPath = path.resolve(__dirname, '../deployed-phase3.json');
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log('\nAddresses saved to contracts/deployed-phase3.json');
  console.log('Copy the values above into your .env file.');
}

main().catch((e) => { console.error(e); process.exit(1); });
