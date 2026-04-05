// Scout Agent — scout.roamswarm.eth
// ERC-8004 Identity: registered on Ethereum Sepolia Testnet
// Discovers nearby places via Google Places Nearby Search API

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const require = createRequire(import.meta.url);
const pois: { id: string; name: string; lat: number; lng: number }[] = require(
  path.resolve(__dirname, '../../../data/cannes-pois.json')
);

const app = express();
app.use(express.json());

const IDENTITY = {
  name: 'Scout Agent',
  ens: 'scout.roamswarm.eth',
  role: 'Discovers nearby places via Google Places Nearby Search API',
  version: '0.2.0',
};

const NEARBY_RADIUS_METERS = 500;
const MAX_RESULTS = 5;

interface NearbyPlace {
  name: string;
  lat: number;
  lng: number;
  types: string[];
  isOpen: boolean | null;
  rating: number | null;
  placeId: string;
}

// Fallback mock data when no API key — offset coords from the POI location
function mockNearbyPlaces(lat: number, lng: number): NearbyPlace[] {
  const offsets = [
    { dLat: 0.001,  dLng: 0.002,  name: 'Le Palais Brasserie',    types: ['restaurant', 'bar'] },
    { dLat: -0.002, dLng: 0.001,  name: 'Café de la Croisette',   types: ['cafe', 'restaurant'] },
    { dLat: 0.003,  dLng: -0.001, name: 'Musée de la Castre',     types: ['museum', 'tourist_attraction'] },
    { dLat: -0.001, dLng: -0.003, name: 'Bar du Marché',          types: ['bar', 'food'] },
    { dLat: 0.002,  dLng: 0.003,  name: 'Plage de la Bocca',      types: ['natural_feature', 'tourist_attraction'] },
  ];

  return offsets.map((o, i) => ({
    name:    o.name,
    lat:     Math.round((lat + o.dLat) * 1e6) / 1e6,
    lng:     Math.round((lng + o.dLng) * 1e6) / 1e6,
    types:   o.types,
    isOpen:  Math.random() > 0.3,
    rating:  Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    placeId: `mock-place-${i + 1}`,
  }));
}

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
): Promise<{ places: NearbyPlace[]; source: string }> {
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  if (!apiKey) {
    return { places: mockNearbyPlaces(lat, lng), source: 'fallback' };
  }

  // Google Places Nearby Search (Legacy API) — no type filter → all place types
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius:   String(NEARBY_RADIUS_METERS),
    key:      apiKey,
    keyword: 'restaurant|cafe|bar',
  });
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places Nearby Search error: ${res.status} — ${err}`);
  }

  const data = await res.json() as {
    status: string;
    results?: {
      place_id?: string;
      name?: string;
      geometry?: { location: { lat: number; lng: number } };
      types?: string[];
      opening_hours?: { open_now: boolean };
      rating?: number;
    }[];
  };

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return { places: mockNearbyPlaces(lat, lng), source: 'google-places-empty' };
  }

  const places: NearbyPlace[] = data.results.slice(0, MAX_RESULTS).map((p) => ({
    name:    p.name ?? 'Unknown Place',
    lat:     p.geometry?.location.lat ?? lat,
    lng:     p.geometry?.location.lng ?? lng,
    types:   p.types ?? [],
    isOpen:  p.opening_hours?.open_now ?? null,
    rating:  p.rating ?? null,
    placeId: p.place_id ?? '',
  }));

  return { places, source: 'google-places-nearby' };
}

// POST /recommend
// Body:    { poiId: string }
// Returns: { poiId, poiLat, poiLng, radiusMeters, source, places: NearbyPlace[] }
app.post('/recommend', async (req, res) => {
  const { poiId } = req.body;

  if (!poiId) {
    res.status(400).json({ error: 'poiId is required' });
    return;
  }

  const poi = pois.find((p) => p.id === poiId);
  if (!poi) {
    res.status(404).json({ error: `POI not found: ${poiId}` });
    return;
  }

  try {
    const { places, source } = await fetchNearbyPlaces(poi.lat, poi.lng);
    res.json({
      poiId,
      poiLat: poi.lat,
      poiLng: poi.lng,
      radiusMeters: NEARBY_RADIUS_METERS,
      source,
      places,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Scout] Error:', message);
    res.status(500).json({ error: message });
  }
});

// GET /identity — ERC-8004
app.get('/identity', (_req, res) => {
  res.json(IDENTITY);
});

// GET /health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: IDENTITY.ens });
});

const PORT = process.env.SCOUT_PORT || 3003;
app.listen(PORT, () => console.log(`Scout Agent (${IDENTITY.ens}) running on :${PORT}`));
