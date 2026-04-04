import { ethers } from 'hardhat';

const PAYMENT = ethers.parseEther('0.001');
const POI_ID  = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));
const CITY_ID = ethers.keccak256(ethers.toUtf8Bytes('cannes'));

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('=== Smoke Test — Sepolia ===');
  console.log('Wallet:', deployer.address, '\n');

  // ── Load contracts ────────────────────────────────────────────────────────
  const splitter  = await ethers.getContractAt('CommissionSplitter', process.env.COMMISSION_SPLITTER_CONTRACT!);
  const registry  = await ethers.getContractAt('UserPOIRegistry',    process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT!);
  const escrow    = await ethers.getContractAt('RoamEscrow',         process.env.NEXT_PUBLIC_ESCROW_CONTRACT!);
  const contributor_registry = await ethers.getContractAt('ContributorRegistry', process.env.NEXT_PUBLIC_CONTRIBUTOR_REGISTRY!);

  // ── 1. CommissionSplitter: split() ───────────────────────────────────────
  console.log('1/4 CommissionSplitter.split()...');
  const platBefore = await ethers.provider.getBalance(deployer.address);
  const tx1 = await splitter.split(deployer.address, { value: PAYMENT });
  const r1  = await tx1.wait();
  console.log(`    tx: ${r1!.hash}`);
  console.log(`    gas used: ${r1!.gasUsed}`);
  console.log('    ✅ split() OK\n');

  // ── 2. UserPOIRegistry: addPOIToCity + recordUnlock + getUnlockedCount ───
  console.log('2/4 UserPOIRegistry...');

  // addPOIToCity (owner call)
  const tx2a = await registry.addPOIToCity(CITY_ID, POI_ID);
  await tx2a.wait();
  console.log(`    addPOIToCity tx: ${tx2a.hash}`);

  // recordUnlock (deployer is authorized as owner)
  const tx2b = await registry.recordUnlock(deployer.address, POI_ID);
  const r2b  = await tx2b.wait();
  console.log(`    recordUnlock tx: ${r2b!.hash}`);

  // getUnlockedCount
  const count = await registry.getUnlockedCount(deployer.address, CITY_ID);
  console.log(`    getUnlockedCount: ${count}`);
  if (count !== 1n) throw new Error(`Expected 1, got ${count}`);
  console.log('    ✅ UserPOIRegistry OK\n');

  // ── 3. RoamEscrow: lockPayment → release ─────────────────────────────────
  console.log('3/4 RoamEscrow.lockPayment() + release()...');

  const tx3a = await escrow.lockPayment(POI_ID, deployer.address, { value: PAYMENT });
  const r3a  = await tx3a.wait();
  console.log(`    lockPayment tx: ${r3a!.hash}`);

  const payment = await escrow.payments(POI_ID);
  console.log(`    amount locked: ${ethers.formatEther(payment.amount)} ETH`);
  if (payment.amount !== PAYMENT) throw new Error('Payment amount mismatch');

  const tx3b = await escrow.release(POI_ID, 'https://0g.storage/audio/smoke-test.mp3');
  const r3b  = await tx3b.wait();
  console.log(`    release tx: ${r3b!.hash}`);

  const settled = await escrow.payments(POI_ID);
  if (!settled.released) throw new Error('Payment not marked released');
  console.log('    ✅ RoamEscrow OK\n');

  // ── 4. ContributorRegistry: read state ───────────────────────────────────
  console.log('4/4 ContributorRegistry.isVerified()...');
  const isVerified = await contributor_registry.isVerified(deployer.address);
  console.log(`    isVerified(deployer): ${isVerified}`);
  // deployer hasn't gone through World ID, so false is correct
  console.log('    ✅ ContributorRegistry readable OK\n');

  console.log('=== All smoke tests passed ✅ ===');
}

main().catch((e) => { console.error('\n❌', e.message); process.exit(1); });
