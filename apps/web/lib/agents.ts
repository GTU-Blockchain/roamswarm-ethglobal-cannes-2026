// Agent swarm orchestrator API calls

export interface VenueRecommendation {
  name: string;
  isOpen: boolean;
  note: string; // Chainlink CRE validated
}

export interface ExperienceResult {
  story: string;
  venue: VenueRecommendation;
  audioUrl: string; // 0G Storage URL
}

export async function triggerExperience(poiId: string, lang = 'en'): Promise<ExperienceResult> {
  const res = await fetch(`/api/experience/${poiId}?lang=${lang}`);
  if (!res.ok) throw new Error('Agent swarm failed');
  return res.json();
}
