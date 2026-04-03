import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import {
  CityRegistry,
  CityBadgeNFT,
  ENSSubnameRegistry,
  UserPOIRegistry,
  RoamPoints,
} from '../typechain-types';

describe('Phase 4 — Badges, City, ENS', () => {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let other: SignerWithAddress;

  let cityRegistry: CityRegistry;
  let cityBadgeNFT: CityBadgeNFT;
  let ensRegistry: ENSSubnameRegistry;
  let poiRegistry: UserPOIRegistry;
  let roamPoints: RoamPoints;

  const CANNES_ID = ethers.keccak256(ethers.toUtf8Bytes('cannes'));
  const CITY2_ID  = ethers.keccak256(ethers.toUtf8Bytes('paris'));

  // 3 Cannes POIs for testing (we'll set totalPOIs=3 in the test city)
  const POI_1 = ethers.keccak256(ethers.toUtf8Bytes('poi-1'));
  const POI_2 = ethers.keccak256(ethers.toUtf8Bytes('poi-2'));
  const POI_3 = ethers.keccak256(ethers.toUtf8Bytes('poi-3'));

  const MOCK_ENS_REGISTRY = ethers.ZeroAddress;
  const MOCK_ENS_RESOLVER = ethers.ZeroAddress;
  const MOCK_ROAM_NODE = ethers.keccak256(ethers.toUtf8Bytes('roam.eth'));

  beforeEach(async () => {
    [owner, user, other] = await ethers.getSigners();

    // Deploy dependencies
    poiRegistry = await (await ethers.getContractFactory('UserPOIRegistry')).deploy();
    roamPoints  = await (await ethers.getContractFactory('RoamPoints')).deploy(await poiRegistry.getAddress());
    cityRegistry = await (await ethers.getContractFactory('CityRegistry')).deploy();
    cityBadgeNFT = await (await ethers.getContractFactory('CityBadgeNFT')).deploy(
      await poiRegistry.getAddress(),
      await cityRegistry.getAddress(),
      await roamPoints.getAddress()
    );
    ensRegistry = await (await ethers.getContractFactory('ENSSubnameRegistry')).deploy(
      MOCK_ENS_REGISTRY,
      MOCK_ENS_RESOLVER,
      MOCK_ROAM_NODE
    );

    // Wire roles
    await roamPoints.setMinter(await cityBadgeNFT.getAddress(), true);
    await cityBadgeNFT.setAuthorized(owner.address, true);
    await poiRegistry.setAuthorized(owner.address, true);

    // Add a test city with 3 POIs
    await cityRegistry.addCity(CITY2_ID, 'Paris', 3, 'ipfs://paris-badge.png');
    await poiRegistry.addPOIToCity(CITY2_ID, POI_1);
    await poiRegistry.addPOIToCity(CITY2_ID, POI_2);
    await poiRegistry.addPOIToCity(CITY2_ID, POI_3);
  });

  // ─── CityRegistry ────────────────────────────────────────────────────────────

  describe('CityRegistry', () => {
    it('seeds Cannes with 12 POIs on deploy', async () => {
      expect(await cityRegistry.getCityPOICount(CANNES_ID)).to.equal(12n);
      expect(await cityRegistry.getCityName(CANNES_ID)).to.equal('Cannes');
      expect(await cityRegistry.isActive(CANNES_ID)).to.be.true;
    });

    it('owner can add a new city', async () => {
      expect(await cityRegistry.getCityPOICount(CITY2_ID)).to.equal(3n);
      expect(await cityRegistry.getCityName(CITY2_ID)).to.equal('Paris');
    });

    it('reverts adding city that already exists', async () => {
      await expect(
        cityRegistry.addCity(CITY2_ID, 'Paris', 3, 'ipfs://x')
      ).to.be.revertedWith('CityRegistry: city exists');
    });

    it('reverts adding city with zero POIs', async () => {
      await expect(
        cityRegistry.addCity(ethers.keccak256(ethers.toUtf8Bytes('london')), 'London', 0, 'ipfs://x')
      ).to.be.revertedWith('CityRegistry: zero POIs');
    });

    it('non-owner cannot add city', async () => {
      await expect(
        cityRegistry.connect(user).addCity(ethers.ZeroHash, 'X', 1, 'ipfs://x')
      ).to.be.revertedWith('CityRegistry: not owner');
    });

    it('owner can update badge image URI', async () => {
      await cityRegistry.setBadgeImageURI(CANNES_ID, 'ipfs://new-cannes.png');
      expect(await cityRegistry.getBadgeImageURI(CANNES_ID)).to.equal('ipfs://new-cannes.png');
    });

    it('emits CityAdded event', async () => {
      const newId = ethers.keccak256(ethers.toUtf8Bytes('berlin'));
      await expect(cityRegistry.addCity(newId, 'Berlin', 5, 'ipfs://berlin'))
        .to.emit(cityRegistry, 'CityAdded')
        .withArgs(newId, 'Berlin', 5n);
    });
  });

  // ─── CityBadgeNFT ────────────────────────────────────────────────────────────

  describe('CityBadgeNFT', () => {
    it('does not mint when POIs incomplete', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      // Only 2/3 unlocked
      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);
      expect(await cityBadgeNFT.balanceOf(user.address)).to.equal(0n);
    });

    it('mints badge when all 3 POIs unlocked', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);
      expect(await cityBadgeNFT.balanceOf(user.address)).to.equal(1n);
    });

    it('emits BadgeMinted', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      await expect(cityBadgeNFT.checkAndMint(user.address, CITY2_ID))
        .to.emit(cityBadgeNFT, 'BadgeMinted')
        .withArgs(user.address, CITY2_ID, 1n);
    });

    it('is idempotent — second call does not double-mint', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);
      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID); // second call
      expect(await cityBadgeNFT.balanceOf(user.address)).to.equal(1n);
    });

    it('grants +100 ROAM bonus on mint', async () => {
      const BONUS = 100n * 10n ** 18n;
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);
      expect(await roamPoints.balanceOf(user.address)).to.equal(BONUS);
    });

    it('hasBadge is true after mint', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);
      expect(await cityBadgeNFT.hasBadge(user.address, CITY2_ID)).to.be.true;
    });

    it('unauthorized caller cannot mint', async () => {
      await expect(
        cityBadgeNFT.connect(user).checkAndMint(user.address, CITY2_ID)
      ).to.be.revertedWith('CityBadgeNFT: not authorized');
    });

    it('tokenURI returns non-empty data URI', async () => {
      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);
      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);

      const uri = await cityBadgeNFT.tokenURI(1n);
      expect(uri).to.include('data:application/json;utf8,');
      expect(uri).to.include('Paris');
      expect(uri).to.include('Explorer Badge');
    });

    it('different users can each earn their own badge', async () => {
      for (const u of [user, other]) {
        await poiRegistry.recordUnlock(u.address, POI_1);
        await poiRegistry.recordUnlock(u.address, POI_2);
        await poiRegistry.recordUnlock(u.address, POI_3);
        await cityBadgeNFT.checkAndMint(u.address, CITY2_ID);
      }
      expect(await cityBadgeNFT.balanceOf(user.address)).to.equal(1n);
      expect(await cityBadgeNFT.balanceOf(other.address)).to.equal(1n);
      expect(await cityBadgeNFT.ownerOf(1n)).to.equal(user.address);
      expect(await cityBadgeNFT.ownerOf(2n)).to.equal(other.address);
    });
  });

  // ─── ENSSubnameRegistry ──────────────────────────────────────────────────────

  describe('ENSSubnameRegistry', () => {
    it('owner can register a subname', async () => {
      await ensRegistry.registerSubname('alice', user.address);
      expect(await ensRegistry.isRegistered(user.address)).to.be.true;
      expect(await ensRegistry.getLabel(user.address)).to.equal('alice');
    });

    it('emits SubnameRegistered', async () => {
      const label = 'alice';
      const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
      const expectedNode = ethers.keccak256(ethers.concat([MOCK_ROAM_NODE, labelHash]));
      await expect(ensRegistry.registerSubname(label, user.address))
        .to.emit(ensRegistry, 'SubnameRegistered')
        .withArgs(user.address, label, expectedNode);
    });

    it('reverts registering same address twice', async () => {
      await ensRegistry.registerSubname('alice', user.address);
      await expect(
        ensRegistry.registerSubname('alice2', user.address)
      ).to.be.revertedWith('ENSSubnameRegistry: already registered');
    });

    it('reverts registering zero address', async () => {
      await expect(
        ensRegistry.registerSubname('bad', ethers.ZeroAddress)
      ).to.be.revertedWith('ENSSubnameRegistry: zero address');
    });

    it('non-owner cannot register', async () => {
      await expect(
        ensRegistry.connect(user).registerSubname('bad', other.address)
      ).to.be.revertedWith('ENSSubnameRegistry: not owner');
    });

    it('getNode → getAddress round-trip', async () => {
      await ensRegistry.registerSubname('bob', other.address);
      const node = await ensRegistry.getNode(other.address);
      expect(await ensRegistry.getContributor(node)).to.equal(other.address);
    });

    it('can register multiple different contributors', async () => {
      await ensRegistry.registerSubname('alice', user.address);
      await ensRegistry.registerSubname('bob', other.address);
      expect(await ensRegistry.isRegistered(user.address)).to.be.true;
      expect(await ensRegistry.isRegistered(other.address)).to.be.true;
    });
  });

  // ─── Integration: full city completion flow ───────────────────────────────────

  describe('Integration — complete city → badge + bonus points', () => {
    it('unlock all 3 POIs → badge minted + 100 ROAM bonus', async () => {
      const BONUS = 100n * 10n ** 18n;

      await poiRegistry.recordUnlock(user.address, POI_1);
      await poiRegistry.recordUnlock(user.address, POI_2);
      await poiRegistry.recordUnlock(user.address, POI_3);

      // Trigger check (in production this is called by the escrow/redeemer contract)
      await cityBadgeNFT.checkAndMint(user.address, CITY2_ID);

      // Badge minted
      expect(await cityBadgeNFT.balanceOf(user.address)).to.equal(1n);
      expect(await cityBadgeNFT.hasBadge(user.address, CITY2_ID)).to.be.true;

      // Bonus ROAM minted
      expect(await roamPoints.balanceOf(user.address)).to.equal(BONUS);

      // Token metadata valid
      const uri = await cityBadgeNFT.tokenURI(1n);
      expect(uri).to.include('Paris');
    });
  });
});
