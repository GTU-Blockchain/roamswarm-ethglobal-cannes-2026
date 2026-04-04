// ENS subname resolution + text records (Ethereum Mainnet)

export const AGENT_ENS_NAMES = {
  orchestrator: 'orchestrator.roamswarm.eth',
  history: 'lore.roamswarm.eth',
  food: 'scout.roamswarm.eth',
  voice: 'guide.roamswarm.eth',
} as const;

export async function getContributorENS(address: string): Promise<string | null> {
  // TODO: resolve {id}.contributors.roam.eth subname for contributor
  return null;
}

export async function setUserTextRecord(
  node: string,
  key: 'roamScore' | 'roamBadges' | 'roamPoints',
  value: string
): Promise<void> {
  // TODO: write to ENS text record via ENS registry on Ethereum Mainnet
}
