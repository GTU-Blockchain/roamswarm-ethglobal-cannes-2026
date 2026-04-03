// RoamPoints contract interaction

export const UNLOCK_THRESHOLD = 500n * 10n ** 18n;
export const POINTS_PER_POI_PER_DAY = 10n * 10n ** 18n;

export async function getPointsBalance(userAddress: string): Promise<bigint> {
  // TODO: read from RoamPoints.balanceOf(userAddress)
  return 0n;
}

export async function claimDailyPoints(): Promise<void> {
  // TODO: call RoamPoints.claimDailyPoints()
}

export async function redeemForUnlock(poiId: string): Promise<void> {
  // TODO: call PointsRedeemer.redeemForUnlock(poiId)
}

export function canRedeem(balance: bigint): boolean {
  return balance >= UNLOCK_THRESHOLD;
}
