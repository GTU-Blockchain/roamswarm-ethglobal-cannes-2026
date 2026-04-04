import { ethers } from 'hardhat';

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  const network = await ethers.provider.getNetwork();

  console.log('Network :', network.name, '| chainId:', network.chainId.toString());
  console.log('Wallet  :', signer.address);
  console.log('Balance :', ethers.formatEther(balance), 'ETH');

  if (network.chainId !== 11155111n) {
    console.error('❌ Wrong network! Expected Sepolia (11155111)');
    process.exit(1);
  }

  if (balance === 0n) {
    console.error('❌ Wallet has no ETH. Get some from sepoliafaucet.com');
    process.exit(1);
  }

  console.log('✅ Sepolia connection OK, wallet funded');
}

main().catch((e) => { console.error(e); process.exit(1); });
