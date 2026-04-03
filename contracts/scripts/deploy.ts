import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // 1. CityRegistry
  const CityRegistry = await ethers.getContractFactory('CityRegistry');
  const cityRegistry = await CityRegistry.deploy();
  await cityRegistry.waitForDeployment();
  console.log('CityRegistry:', await cityRegistry.getAddress());

  // 2. UserPOIRegistry
  const UserPOIRegistry = await ethers.getContractFactory('UserPOIRegistry');
  const userPOIRegistry = await UserPOIRegistry.deploy();
  await userPOIRegistry.waitForDeployment();
  console.log('UserPOIRegistry:', await userPOIRegistry.getAddress());

  // 3. RoamPoints (needs UserPOIRegistry)
  const RoamPoints = await ethers.getContractFactory('RoamPoints');
  const roamPoints = await RoamPoints.deploy(await userPOIRegistry.getAddress());
  await roamPoints.waitForDeployment();
  console.log('RoamPoints:', await roamPoints.getAddress());

  // 4. PointsRedeemer (needs RoamPoints + UserPOIRegistry)
  const PointsRedeemer = await ethers.getContractFactory('PointsRedeemer');
  const pointsRedeemer = await PointsRedeemer.deploy(
    await roamPoints.getAddress(),
    await userPOIRegistry.getAddress()
  );
  await pointsRedeemer.waitForDeployment();
  console.log('PointsRedeemer:', await pointsRedeemer.getAddress());

  // 5. CommissionSplitter
  const CommissionSplitter = await ethers.getContractFactory('CommissionSplitter');
  const commissionSplitter = await CommissionSplitter.deploy(deployer.address);
  await commissionSplitter.waitForDeployment();
  console.log('CommissionSplitter:', await commissionSplitter.getAddress());

  // 6. RoamEscrow
  const RoamEscrow = await ethers.getContractFactory('RoamEscrow');
  const roamEscrow = await RoamEscrow.deploy();
  await roamEscrow.waitForDeployment();
  console.log('RoamEscrow:', await roamEscrow.getAddress());

  // 7. ContributorRegistry (needs World ID address)
  const WORLD_ID_ADDRESS = process.env.WORLD_ID_ADDRESS || '0x469449f251692e0779667583026b5a1e99512157';
  const ContributorRegistry = await ethers.getContractFactory('ContributorRegistry');
  const contributorRegistry = await ContributorRegistry.deploy(WORLD_ID_ADDRESS);
  await contributorRegistry.waitForDeployment();
  console.log('ContributorRegistry:', await contributorRegistry.getAddress());

  // 8. CityBadgeNFT
  const CityBadgeNFT = await ethers.getContractFactory('CityBadgeNFT');
  const cityBadgeNFT = await CityBadgeNFT.deploy(
    await userPOIRegistry.getAddress(),
    await cityRegistry.getAddress(),
    await roamPoints.getAddress()
  );
  await cityBadgeNFT.waitForDeployment();
  console.log('CityBadgeNFT:', await cityBadgeNFT.getAddress());

  // 9. ENSSubnameRegistry
  const ENS_REGISTRY = process.env.ENS_REGISTRY || '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
  const ENSSubnameRegistry = await ethers.getContractFactory('ENSSubnameRegistry');
  const ensSubnameRegistry = await ENSSubnameRegistry.deploy(ENS_REGISTRY, ethers.ZeroHash);
  await ensSubnameRegistry.waitForDeployment();
  console.log('ENSSubnameRegistry:', await ensSubnameRegistry.getAddress());

  console.log('\n✅ All contracts deployed. Update .env with the addresses above.');
}

main().catch((e) => { console.error(e); process.exit(1); });
