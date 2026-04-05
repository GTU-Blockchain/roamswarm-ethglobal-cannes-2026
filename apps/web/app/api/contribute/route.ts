import { NextResponse } from 'next/server';

export interface ContributorStory {
  address:   string;
  ensName?:  string;
  poiId:     string;  // e.g. "cannes-01"
  poiName:   string;
  story:     string;
  tip?:      string;
  createdAt: number;
}

// In-memory store — survives hot reloads in dev, resets on full restart.
// Good enough for hackathon; swap for a DB/file in production.
declare global {
  // eslint-disable-next-line no-var
  var __contributorStories: ContributorStory[] | undefined;
}
globalThis.__contributorStories ??= [];
const store = globalThis.__contributorStories;

// POST /api/contribute — save a contributor story
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { address, ensName, poiId, poiName, story, tip } = body as Record<string, string>;

  if (!address || !poiId || !poiName || !story) {
    return NextResponse.json({ error: 'address, poiId, poiName and story are required' }, { status: 400 });
  }

  // One entry per address+poiId — update if already exists
  const idx = store.findIndex((s) => s.address.toLowerCase() === address.toLowerCase() && s.poiId === poiId);
  const entry: ContributorStory = { address, ensName, poiId, poiName, story, tip, createdAt: Date.now() };

  if (idx >= 0) store[idx] = entry;
  else store.push(entry);

  return NextResponse.json({ ok: true });
}

// GET /api/contribute?poiId=cannes-01 — fetch stories for a POI
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const poiId = searchParams.get('poiId');

  const results = poiId
    ? store.filter((s) => s.poiId === poiId)
    : store;

  return NextResponse.json({ stories: results });
}
