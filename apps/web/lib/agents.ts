// Agent swarm orchestrator API calls

export interface VenueRecommendation {
  name:         string;
  isOpen:       boolean | null;
  note:         string;
  suggestedBy?: { name: string; avatar?: string }[];
}

export interface ExperienceResult {
  story:    string;
  venue:    VenueRecommendation;
  audioUrl: string; // 0G Storage URL
}

export type SSEStep = 'scout' | 'lore' | 'guide' | 'done' | 'error';

export interface SSEProgress {
  step:     SSEStep;
  message?: string;
  story?:   string;
  venue?:   VenueRecommendation;
  audioUrl?: string;
  error?:   string;
}

// ─── JSON mode (single request, waits for all agents) ────────────────────────

export async function triggerExperience(
  poiId:       string,
  lang         = 'en',
  userAddress?: string
): Promise<ExperienceResult> {
  const params = new URLSearchParams({ lang });
  if (userAddress) params.set('userAddress', userAddress);

  const res = await fetch(`/api/experience/${poiId}?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Agent swarm failed' }));
    throw new Error(err.error ?? 'Agent swarm failed');
  }
  return res.json();
}

// ─── SSE streaming mode (step-by-step progress) ──────────────────────────────

export function streamExperience(
  poiId:       string,
  onProgress:  (p: SSEProgress) => void,
  onResult:    (r: ExperienceResult) => void,
  onError:     (msg: string) => void,
  lang         = 'en',
  userAddress?: string
): () => void {
  const params = new URLSearchParams({ stream: 'true', lang });
  if (userAddress) params.set('userAddress', userAddress);

  const url        = `/api/experience/${poiId}?${params}`;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf       = '';
      let eventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
            continue;
          }
          if (!line.startsWith('data: ')) { eventType = ''; continue; }
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') return;

          const ev = eventType;
          eventType = '';

          try {
            const payload = JSON.parse(raw) as Record<string, unknown>;

            if (ev === 'status' || (!ev && payload.step && payload.message)) {
              onProgress({ step: (payload.step ?? ev) as SSEStep, message: payload.message as string });
            } else if (ev === 'story' || (!ev && payload.story && !payload.audioUrl)) {
              onProgress({ step: 'lore', story: payload.story as string });
            } else if (ev === 'venue' || (!ev && payload.venue && !payload.story)) {
              onProgress({ step: 'scout', venue: payload.venue as VenueRecommendation });
            } else if (ev === 'audio' || (!ev && typeof payload.audioUrl !== 'undefined' && !payload.story)) {
              onProgress({ step: 'guide', audioUrl: payload.audioUrl as string });
            } else if (ev === 'done' || (!ev && payload.story && typeof payload.audioUrl !== 'undefined' && payload.venue)) {
              onResult({
                story:    payload.story as string,
                venue:    payload.venue as VenueRecommendation,
                audioUrl: payload.audioUrl as string,
              });
              return;
            } else if (ev === 'error' || payload.error) {
              onError((payload.error ?? payload.message ?? 'Agent swarm error') as string);
              return;
            }
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      onError(err instanceof Error ? err.message : String(err));
    }
  })();

  return () => controller.abort();
}
