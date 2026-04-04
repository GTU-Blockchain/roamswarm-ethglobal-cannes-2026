import { keccak256, encodePacked } from 'viem';

// ─── Contract Addresses ───────────────────────────────────────────────────────

export const CONTRACTS = {
  roamPoints:          process.env.NEXT_PUBLIC_ROAM_POINTS_CONTRACT          as `0x${string}`,
  pointsRedeemer:      process.env.NEXT_PUBLIC_POINTS_REDEEMER_CONTRACT      as `0x${string}`,
  userPOIRegistry:     process.env.NEXT_PUBLIC_USER_POI_REGISTRY_CONTRACT    as `0x${string}`,
  cityBadgeNFT:        process.env.NEXT_PUBLIC_CITY_BADGE_NFT_CONTRACT       as `0x${string}`,
  cityRegistry:        process.env.NEXT_PUBLIC_CITY_REGISTRY_CONTRACT        as `0x${string}`,
  roamEscrow:          process.env.NEXT_PUBLIC_ESCROW_CONTRACT                as `0x${string}`,
  contributorRegistry: process.env.NEXT_PUBLIC_CONTRIBUTOR_REGISTRY          as `0x${string}`,
} as const;

// ─── ID Helpers ───────────────────────────────────────────────────────────────

/** "cannes-01" → bytes32 keccak256 (matches Solidity keccak256(abi.encodePacked('cannes-01'))) */
export function poiIdFromSlug(slug: string): `0x${string}` {
  return keccak256(encodePacked(['string'], [slug]));
}

/** "cannes" → bytes32 keccak256 */
export function cityIdFromSlug(slug: string): `0x${string}` {
  return keccak256(encodePacked(['string'], [slug]));
}

// ─── ABIs ─────────────────────────────────────────────────────────────────────

export const RoamPointsABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimDailyPoints',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'lastClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'CLAIM_INTERVAL',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'UNLOCK_THRESHOLD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'POINTS_PER_POI_PER_DAY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingPoints',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'PointsClaimed',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'user',   type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
] as const;

export const PointsRedeemerABI = [
  {
    name: 'redeemForUnlock',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poiId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'canRedeem',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'UNLOCK_THRESHOLD',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'PointsRedeemed',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'user',         type: 'address' },
      { indexed: true,  name: 'poiId',        type: 'bytes32' },
      { indexed: false, name: 'pointsBurned', type: 'uint256' },
    ],
  },
] as const;

export const UserPOIRegistryABI = [
  {
    name: 'unlockedPOIs',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user',  type: 'address' },
      { name: 'poiId', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUserPOICount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUnlockedCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user',   type: 'address' },
      { name: 'cityId', type: 'bytes32' },
    ],
    outputs: [{ name: 'count', type: 'uint256' }],
  },
  {
    name: 'getCityPOIs',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cityId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32[]' }],
  },
  {
    name: 'POIUnlocked',
    type: 'event',
    inputs: [
      { indexed: true, name: 'user',  type: 'address' },
      { indexed: true, name: 'poiId', type: 'bytes32' },
    ],
  },
] as const;

export const CityBadgeNFTABI = [
  {
    name: 'checkAndMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user',   type: 'address' },
      { name: 'cityId', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'hasBadge',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'COMPLETION_BONUS',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'BadgeMinted',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'user',    type: 'address' },
      { indexed: true,  name: 'cityId',  type: 'bytes32' },
      { indexed: false, name: 'tokenId', type: 'uint256' },
    ],
  },
] as const;

export const CityRegistryABI = [
  {
    name: 'getCityName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cityId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'getCityPOICount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cityId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBadgeImageURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cityId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'isActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'cityId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'cities',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'name',          type: 'string' },
      { name: 'totalPOIs',     type: 'uint256' },
      { name: 'badgeImageURI', type: 'string' },
      { name: 'active',        type: 'bool' },
    ],
  },
] as const;

export const RoamEscrowABI = [
  {
    name: 'lockPayment',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'poiId',       type: 'bytes32' },
      { name: 'contributor', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'poiId',    type: 'bytes32' },
      { name: 'audioUrl', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'refund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poiId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'payments',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'bytes32' }],
    outputs: [
      { name: 'payer',       type: 'address' },
      { name: 'contributor', type: 'address' },
      { name: 'amount',      type: 'uint256' },
      { name: 'released',    type: 'bool' },
      { name: 'refunded',    type: 'bool' },
    ],
  },
  {
    name: 'PaymentLocked',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'poiId',       type: 'bytes32' },
      { indexed: true,  name: 'payer',        type: 'address' },
      { indexed: false, name: 'contributor',  type: 'address' },
      { indexed: false, name: 'amount',       type: 'uint256' },
    ],
  },
  {
    name: 'PaymentReleased',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'poiId',    type: 'bytes32' },
      { indexed: false, name: 'audioUrl', type: 'string' },
    ],
  },
] as const;

export const ContributorRegistryABI = [
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'signal',        type: 'address' },
      { name: 'root',          type: 'uint256' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'proof',         type: 'uint256[8]' },
      { name: 'ensSubname',    type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'isVerified',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'contributor', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'ensName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ContributorRegistered',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'contributor', type: 'address' },
      { indexed: false, name: 'ensSubname',  type: 'string' },
    ],
  },
] as const;
