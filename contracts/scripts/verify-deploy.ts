import { ethers } from 'hardhat';

async function main() {
  console.log('=== Verifying Phase 2 Contracts on Sepolia ===\n');

  const checks = [
    ['CommissionSplitter',  process.env.COMMISSION_SPLITTER_CONTRACT!],
    ['UserPOIRegistry',     process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT!],
    ['RoamEscrow',          process.env.NEXT_PUBLIC_ESCROW_CONTRACT!],
    ['ContributorRegistry', process.env.NEXT_PUBLIC_CONTRIBUTOR_REGISTRY!],
  ];

  let allOk = true;
  for (const [name, addr] of checks) {
    const code = await ethers.provider.getCode(addr);
    const ok = code !== '0x';
    console.log(`${ok ? '✅' : '❌'} ${name}: ${addr}`);
    if (!ok) allOk = false;
  }

  if (!allOk) { console.error('\nSome contracts missing!'); process.exit(1); }
  console.log('\n✅ All Phase 2 contracts verified on Sepolia');
}

main().catch((e) => { console.error(e); process.exit(1); });
