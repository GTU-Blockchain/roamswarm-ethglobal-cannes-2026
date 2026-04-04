import { expect } from 'chai';
import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { RoamPoints, PointsRedeemer, UserPOIRegistry } from '../typechain-types';

describe('Phase 3 — Points System', () => {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  let roamPoints: RoamPoints;
  let redeemer: PointsRedeemer;
  let registry: UserPOIRegistry;

  const POI_ID_1 = ethers.keccak256(ethers.toUtf8Bytes('cannes-01'));
  const POI_ID_2 = ethers.keccak256(ethers.toUtf8Bytes('cannes-02'));
  const POI_ID_3 = ethers.keccak256(ethers.toUtf8Bytes('cannes-03'));
  const ONE_DAY = 24 * 60 * 60;
  const THRESHOLD = ethers.parseEther('500');
  const PTS_PER_POI_PER_DAY = ethers.parseEther('10');

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();

    // Deploy UserPOIRegistry
    registry = await (await ethers.getContractFactory('UserPOIRegistry')).deploy();

    // Deploy RoamPoints (linked to registry)
    roamPoints = await (await ethers.getContractFactory('RoamPoints')).deploy(await registry.getAddress());

    // Deploy PointsRedeemer
    redeemer = await (await ethers.getContractFactory('PointsRedeemer')).deploy(
      await roamPoints.getAddress(),
      await registry.getAddress()
    );

    // Wire up roles:
    // - PointsRedeemer can burn ROAM
    await roamPoints.setBurner(await redeemer.getAddress(), true);
    // - PointsRedeemer can call UserPOIRegistry.recordUnlock
    await registry.setAuthorized(await redeemer.getAddress(), true);
    // - owner can call registry directly for test setup
    await registry.setAuthorized(owner.address, true);
  });

  // ─── RoamPoints: non-transferable ───────────────────────────────────────────

  describe('RoamPoints — non-transferable', () => {
    it('reverts transfer()', async () => {
      await expect(roamPoints.connect(user).transfer(other.address, 1n)).to.be.revertedWith(
        'ROAM: non-transferable'
      );
    });

    it('reverts transferFrom()', async () => {
      await expect(roamPoints.connect(user).transferFrom(user.address, other.address, 1n)).to.be.revertedWith(
        'ROAM: non-transferable'
      );
    });
  });

  // ─── RoamPoints: access control ─────────────────────────────────────────────

  describe('RoamPoints — access control', () => {
    it('only minter can call mint()', async () => {
      await expect(roamPoints.connect(user).mint(user.address, 100n)).to.be.revertedWith('ROAM: not a minter');
    });

    it('only burner can call burn()', async () => {
      await expect(roamPoints.connect(user).burn(user.address, 100n)).to.be.revertedWith('ROAM: not a burner');
    });

    it('authorized minter can mint', async () => {
      await roamPoints.setMinter(owner.address, true);
      await roamPoints.mint(user.address, ethers.parseEther('100'));
      expect(await roamPoints.balanceOf(user.address)).to.equal(ethers.parseEther('100'));
    });

    it('authorized burner can burn', async () => {
      await roamPoints.setMinter(owner.address, true);
      await roamPoints.mint(user.address, ethers.parseEther('100'));
      await roamPoints.setBurner(owner.address, true);
      await roamPoints.burn(user.address, ethers.parseEther('100'));
      expect(await roamPoints.balanceOf(user.address)).to.equal(0n);
    });

    it('non-owner cannot setMinter', async () => {
      await expect(roamPoints.connect(user).setMinter(user.address, true)).to.be.revertedWith('ROAM: not owner');
    });
  });

  // ─── RoamPoints: claimDailyPoints ───────────────────────────────────────────

  describe('RoamPoints — claimDailyPoints', () => {
    beforeEach(async () => {
      // Give user 2 owned POIs
      await registry.recordUnlock(user.address, POI_ID_1);
      await registry.recordUnlock(user.address, POI_ID_2);
    });

    it('reverts if called before 24h', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      await expect(roamPoints.connect(user).claimDailyPoints()).to.be.revertedWith('ROAM: claim too soon');
    });

    it('reverts with zero owned POIs', async () => {
      await expect(roamPoints.connect(other).claimDailyPoints()).to.be.revertedWith('ROAM: no owned POIs');
    });

    it('mints correct amount for 1 day, 2 POIs', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      expect(await roamPoints.balanceOf(user.address)).to.equal(PTS_PER_POI_PER_DAY * 2n);
    });

    it('emits PointsClaimed', async () => {
      await expect(roamPoints.connect(user).claimDailyPoints())
        .to.emit(roamPoints, 'PointsClaimed')
        .withArgs(user.address, PTS_PER_POI_PER_DAY * 2n);
    });

    it('cannot claim again before another 24h', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      await time.increase(ONE_DAY - 10);
      await expect(roamPoints.connect(user).claimDailyPoints()).to.be.revertedWith('ROAM: claim too soon');
    });

    it('can claim again after 24h', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      await time.increase(ONE_DAY);
      await roamPoints.connect(user).claimDailyPoints();
      // 2 claims × 2 POIs × 10 pts
      expect(await roamPoints.balanceOf(user.address)).to.equal(PTS_PER_POI_PER_DAY * 2n * 2n);
    });

    it('catch-up: mints proportional to full intervals elapsed after first claim', async () => {
      // First claim sets the clock (1 interval)
      await roamPoints.connect(user).claimDailyPoints();
      // Now wait 3 more days
      await time.increase(ONE_DAY * 3);
      await roamPoints.connect(user).claimDailyPoints();
      // 1st claim: 2 POIs × 10 = 20 pts
      // 2nd claim: 3 intervals × 2 POIs × 10 = 60 pts
      // Total: 80 pts
      expect(await roamPoints.balanceOf(user.address)).to.equal(PTS_PER_POI_PER_DAY * 2n * 4n);
    });

    it('pendingPoints returns 0 immediately after claiming', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      expect(await roamPoints.pendingPoints(user.address)).to.equal(0n);
    });

    it('pendingPoints returns correct amount after another 24h', async () => {
      await roamPoints.connect(user).claimDailyPoints();
      await time.increase(ONE_DAY);
      expect(await roamPoints.pendingPoints(user.address)).to.equal(PTS_PER_POI_PER_DAY * 2n);
    });

    it('pendingPoints shows 1 interval for fresh user with POIs (first claim)', async () => {
      // lastClaimed == 0 → should show 1 interval ready
      expect(await roamPoints.pendingPoints(user.address)).to.equal(PTS_PER_POI_PER_DAY * 2n);
    });

  });

  // ─── PointsRedeemer: redeemForUnlock ────────────────────────────────────────

  describe('PointsRedeemer — redeemForUnlock', () => {
    beforeEach(async () => {
      // Give user exactly 500 ROAM (via owner minting)
      await roamPoints.setMinter(owner.address, true);
      await roamPoints.mint(user.address, THRESHOLD);
    });

    it('burns 500 ROAM and records unlock', async () => {
      await redeemer.connect(user).redeemForUnlock(POI_ID_1);

      expect(await roamPoints.balanceOf(user.address)).to.equal(0n);
      expect(await registry.unlockedPOIs(user.address, POI_ID_1)).to.be.true;
    });

    it('emits PointsRedeemed', async () => {
      await expect(redeemer.connect(user).redeemForUnlock(POI_ID_1))
        .to.emit(redeemer, 'PointsRedeemed')
        .withArgs(user.address, POI_ID_1, THRESHOLD);
    });

    it('reverts when already unlocked', async () => {
      await redeemer.connect(user).redeemForUnlock(POI_ID_1);
      // Give more points and try again
      await roamPoints.mint(user.address, THRESHOLD);
      await expect(redeemer.connect(user).redeemForUnlock(POI_ID_1)).to.be.revertedWith(
        'PointsRedeemer: already unlocked'
      );
    });

    it('reverts with insufficient points', async () => {
      await expect(redeemer.connect(other).redeemForUnlock(POI_ID_3)).to.be.revertedWith(
        'PointsRedeemer: insufficient points'
      );
    });

    it('canRedeem() returns true when balance >= 500', async () => {
      expect(await redeemer.canRedeem(user.address)).to.be.true;
    });

    it('canRedeem() returns false when balance < 500', async () => {
      expect(await redeemer.canRedeem(other.address)).to.be.false;
    });

    it('partial balance (499 pts) is rejected', async () => {
      await roamPoints.mint(other.address, THRESHOLD - 1n);
      await expect(redeemer.connect(other).redeemForUnlock(POI_ID_3)).to.be.revertedWith(
        'PointsRedeemer: insufficient points'
      );
    });

    it('user can redeem multiple different POIs (with enough points)', async () => {
      // Give user 1000 pts total
      await roamPoints.mint(user.address, THRESHOLD); // now 1000 pts

      await redeemer.connect(user).redeemForUnlock(POI_ID_1);
      expect(await roamPoints.balanceOf(user.address)).to.equal(THRESHOLD); // 500 pts left

      await redeemer.connect(user).redeemForUnlock(POI_ID_2);
      expect(await roamPoints.balanceOf(user.address)).to.equal(0n);

      expect(await registry.unlockedPOIs(user.address, POI_ID_1)).to.be.true;
      expect(await registry.unlockedPOIs(user.address, POI_ID_2)).to.be.true;
    });
  });

  // ─── Integration: earn via daily claim → unlock via redemption ──────────────

  describe('Integration — earn via daily claim → unlock via redemption', () => {
    it('user earns 500 pts over 50 days (1 POI) then redeems', async () => {
      // Unlock one paid POI first
      await registry.recordUnlock(user.address, POI_ID_1);

      // First claim: 1 interval (1 POI × 10 = 10 pts)
      await roamPoints.connect(user).claimDailyPoints();

      // Wait 49 days, claim again (49 intervals × 1 POI × 10 = 490 pts)
      await time.increase(ONE_DAY * 49);
      await roamPoints.connect(user).claimDailyPoints();

      // Total: 10 + 490 = 500 pts
      expect(await roamPoints.balanceOf(user.address)).to.equal(THRESHOLD);
      expect(await redeemer.canRedeem(user.address)).to.be.true;

      // Redeem for POI_2
      await redeemer.connect(user).redeemForUnlock(POI_ID_2);

      expect(await roamPoints.balanceOf(user.address)).to.equal(0n);
      expect(await registry.unlockedPOIs(user.address, POI_ID_2)).to.be.true;
      expect(await registry.getUserPOICount(user.address)).to.equal(2n);
    });
  });
});
