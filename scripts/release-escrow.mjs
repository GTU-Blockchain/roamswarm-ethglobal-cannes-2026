// Manuel escrow release scripti
// Kullanım: node scripts/release-escrow.mjs <walletAddress> [poiId]
// Örnek:    node scripts/release-escrow.mjs 0x8dFA5816ecA334F3Ed40AcC52Feb782e1c1cA449
//           node scripts/release-escrow.mjs 0x8dFA5816... cannes-01

import { ethers } from 'ethers';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

const PAYER       = process.argv[2];
const SINGLE_POI  = process.argv[3]; // optional: release only this POI

if (!PAYER || !PAYER.startsWith('0x')) {
  console.error('Usage: node scripts/release-escrow.mjs <walletAddress> [poiId]');
  process.exit(1);
}

const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';
const PRIVATE_KEY    = process.env.PRIVATE_KEY;
const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT;

if (!PRIVATE_KEY || !ESCROW_ADDRESS) {
  console.error('PRIVATE_KEY and NEXT_PUBLIC_ESCROW_CONTRACT must be set in apps/web/.env');
  process.exit(1);
}

const ESCROW_ABI = [
  'function release(bytes32 poiId, address payer, string calldata audioUrl) external',
  'function payments(bytes32 key) external view returns (address payer, address contributor, uint256 amount, bool released, bool refunded)',
];

const POIS = JSON.parse(readFileSync(path.resolve(__dirname, '../apps/web/data/cannes-pois.json'), 'utf8'));
const DUMMY_AUDIO = 'https://placeholder.0g.ai/audio.mp3';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
const escrow   = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

const poisToCheck = SINGLE_POI
  ? POIS.filter(p => p.id === SINGLE_POI)
  : POIS;

console.log(`\nChecking escrow for payer: ${PAYER}\n`);

for (const poi of poisToCheck) {
  const poiBytes32 = ethers.keccak256(ethers.toUtf8Bytes(poi.id));
  const key = ethers.keccak256(ethers.solidityPacked(['bytes32', 'address'], [poiBytes32, PAYER]));

  try {
    const [payerAddr, , amount, released, refunded] = await escrow.payments(key);

    if (payerAddr === '0x0000000000000000000000000000000000000000') {
      console.log(`  ${poi.id} (${poi.name}): no payment`);
      continue;
    }

    if (released) {
      console.log(`  ${poi.id} (${poi.name}): already released ✓`);
      continue;
    }

    if (refunded) {
      console.log(`  ${poi.id} (${poi.name}): refunded`);
      continue;
    }

    const eth = ethers.formatEther(amount);
    console.log(`  ${poi.id} (${poi.name}): locked ${eth} ETH → releasing...`);

    const tx = await escrow.release(poiBytes32, PAYER, DUMMY_AUDIO, { gasLimit: 200_000 });
    console.log(`    TX: ${tx.hash}`);
    await tx.wait();
    console.log(`    ✓ Released! recordUnlock çağrıldı, getUserPOICount artık artar.`);
  } catch (err) {
    console.error(`  ${poi.id}: ERROR — ${err.message}`);
  }
}

console.log('\nDone. Profile sayfasını yenile, claim butonu aktif olmalı.\n');
