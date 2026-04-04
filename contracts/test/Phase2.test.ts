import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  CommissionSplitter,
  RoamEscrow,
  UserPOIRegistry,
} from '../typechain-types';

describe('Phase 2 — Core Contracts', () => {
  let owner: SignerWithAddress;
  let platform: SignerWithAddress;
  let contributor: SignerWithAddress;
  let user: SignerWithAddress;

  let splitter: CommissionSplitter;
  let escrow: RoamEscrow;
  let registry: UserPOIRegistry;

  const POI_ID = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));
  const CITY_ID = ethers.keccak256(ethers.toUtf8Bytes('cannes'));
  const PAYMENT = ethers.parseEther('0.01');

  beforeEach(async () => {
    [owner, platform, contributor, user] = await ethers.getSigners();

    splitter = await (await ethers.getContractFactory('CommissionSplitter')).deploy(platform.address);
    escrow = await (await ethers.getContractFactory('RoamEscrow')).deploy(await splitter.getAddress());
    registry = await (await ethers.getContractFactory('UserPOIRegistry')).deploy();
  });

  // ─── CommissionSplitter ──────────────────────────────────────────────────────

  describe('CommissionSplitter', () => {
    it('splits 20% to contributor and 80% to platform', async () => {
      const contBefore = await ethers.provider.getBalance(contributor.address);
      const platBefore = await ethers.provider.getBalance(platform.address);

      await splitter.split(contributor.address, { value: PAYMENT });

      const contAfter = await ethers.provider.getBalance(contributor.address);
      const platAfter = await ethers.provider.getBalance(platform.address);

      expect(contAfter - contBefore).to.equal((PAYMENT * 2000n) / 10000n);
      expect(platAfter - platBefore).to.equal((PAYMENT * 8000n) / 10000n);
    });

    it('emits CommissionSplit event', async () => {
      await expect(splitter.split(contributor.address, { value: PAYMENT }))
        .to.emit(splitter, 'CommissionSplit')
        .withArgs(contributor.address, (PAYMENT * 2000n) / 10000n, (PAYMENT * 8000n) / 10000n);
    });

    it('reverts with zero value', async () => {
      await expect(splitter.split(contributor.address, { value: 0 })).to.be.revertedWith('No value');
    });

    it('reverts with zero address contributor', async () => {
      await expect(splitter.split(ethers.ZeroAddress, { value: PAYMENT })).to.be.revertedWith(
        'Invalid contributor'
      );
    });
  });

  // ─── RoamEscrow ─────────────────────────────────────────────────────────────

  describe('RoamEscrow', () => {
    it('locks a payment', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });

      const p = await escrow.payments(POI_ID);
      expect(p.payer).to.equal(user.address);
      expect(p.contributor).to.equal(contributor.address);
      expect(p.amount).to.equal(PAYMENT);
      expect(p.released).to.be.false;
      expect(p.refunded).to.be.false;
    });

    it('emits PaymentLocked', async () => {
      await expect(escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT }))
        .to.emit(escrow, 'PaymentLocked')
        .withArgs(POI_ID, user.address, contributor.address, PAYMENT);
    });

    it('releases payment and splits commission', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });

      const contBefore = await ethers.provider.getBalance(contributor.address);
      await escrow.connect(owner).release(POI_ID, 'https://0g.storage/audio/test.mp3');
      const contAfter = await ethers.provider.getBalance(contributor.address);

      expect(contAfter - contBefore).to.equal((PAYMENT * 2000n) / 10000n);

      const p = await escrow.payments(POI_ID);
      expect(p.released).to.be.true;
    });

    it('refunds payer', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });

      const balBefore = await ethers.provider.getBalance(user.address);
      const tx = await escrow.connect(user).refund(POI_ID);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(user.address);

      expect(balAfter - balBefore + gasUsed).to.equal(PAYMENT);

      const p = await escrow.payments(POI_ID);
      expect(p.refunded).to.be.true;
    });

    it('prevents double lock', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });
      await expect(
        escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT })
      ).to.be.revertedWith('Already locked');
    });

    it('prevents double settle', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });
      await escrow.connect(owner).release(POI_ID, 'https://0g.storage/audio/test.mp3');
      await expect(escrow.connect(user).refund(POI_ID)).to.be.revertedWith('Already settled');
    });

    it('only owner can release', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });
      await expect(
        escrow.connect(user).release(POI_ID, 'https://0g.storage/audio/test.mp3')
      ).to.be.revertedWith('Not owner');
    });

    it('only payer can refund', async () => {
      await escrow.connect(user).lockPayment(POI_ID, contributor.address, { value: PAYMENT });
      await expect(escrow.connect(contributor).refund(POI_ID)).to.be.revertedWith('Not payer');
    });
  });

  // ─── UserPOIRegistry ────────────────────────────────────────────────────────

  describe('UserPOIRegistry', () => {
    const POI_ID_2 = ethers.keccak256(ethers.toUtf8Bytes('cannes-02'));

    beforeEach(async () => {
      await registry.setAuthorized(owner.address, true);
      await registry.addPOIToCity(CITY_ID, POI_ID);
      await registry.addPOIToCity(CITY_ID, POI_ID_2);
    });

    it('records a POI unlock', async () => {
      await registry.recordUnlock(user.address, POI_ID);
      expect(await registry.unlockedPOIs(user.address, POI_ID)).to.be.true;
    });

    it('emits POIUnlocked', async () => {
      await expect(registry.recordUnlock(user.address, POI_ID))
        .to.emit(registry, 'POIUnlocked')
        .withArgs(user.address, POI_ID);
    });

    it('does not double-count same POI', async () => {
      await registry.recordUnlock(user.address, POI_ID);
      await registry.recordUnlock(user.address, POI_ID);
      expect(await registry.getUserPOICount(user.address)).to.equal(1n);
    });

    it('counts unlocked POIs in a city', async () => {
      expect(await registry.getUnlockedCount(user.address, CITY_ID)).to.equal(0n);
      await registry.recordUnlock(user.address, POI_ID);
      expect(await registry.getUnlockedCount(user.address, CITY_ID)).to.equal(1n);
      await registry.recordUnlock(user.address, POI_ID_2);
      expect(await registry.getUnlockedCount(user.address, CITY_ID)).to.equal(2n);
    });

    it('blocks unauthorized callers', async () => {
      await expect(registry.connect(user).recordUnlock(user.address, POI_ID)).to.be.revertedWith(
        'Not authorized'
      );
    });

    it('allows authorized contract to recordUnlock', async () => {
      await registry.setAuthorized(contributor.address, true);
      await registry.connect(contributor).recordUnlock(user.address, POI_ID);
      expect(await registry.unlockedPOIs(user.address, POI_ID)).to.be.true;
    });
  });
});
