// City badge mint status + metadata (CityBadgeNFT contract)

export interface CityBadge {
  cityId: string;
  cityName: string;
  completedAt: string;
  poiCount: number;
  imageUri: string;
  tokenId?: number;
}

export async function getUserBadges(userAddress: string): Promise<CityBadge[]> {
  // TODO: query CityBadgeNFT for user's tokens
  return [];
}

export async function checkAndMintBadge(userAddress: string, cityId: string): Promise<boolean> {
  // TODO: call CityBadgeNFT.checkAndMint(userAddress, cityId)
  return false;
}
