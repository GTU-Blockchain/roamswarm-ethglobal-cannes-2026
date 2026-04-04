// Chainlink CRE Workflow — roam-venue-check
// Confidential HTTP to Google Places API (API key stored as CRE secret, never on-chain)
// On-chain write: SCOUT_CONTRACT.updateVenueStatus
//
// Run:  cre simulate workflow.ts
// Deploy: cre deploy workflow.ts

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowStep {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface WorkflowDefinition {
  name: string;
  version: string;
  description: string;
  secrets: string[];
  inputs: Record<string, string>;
  steps: WorkflowStep[];
}

// ─── Workflow Definition ──────────────────────────────────────────────────────

export const workflow: WorkflowDefinition = {
  name: 'roam-venue-check',
  version: '1.0.0',
  description: 'Fetches real-time venue open/closed status from Google Places API via confidential HTTP, then writes result on-chain via SCOUT_CONTRACT.updateVenueStatus',
  secrets: ['GOOGLE_PLACES_KEY'],
  inputs: {
    placeId: 'string',   // Google Places Place ID
    poiId: 'string',     // Roam POI ID (e.g. cannes-01)
  },
  steps: [
    {
      id: 'fetch-venue',
      type: 'confidential-http',
      method: 'POST',
      url: 'https://places.googleapis.com/v1/places:searchText',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': '{{secret.GOOGLE_PLACES_KEY}}',
        'X-Goog-FieldMask': 'places.displayName,places.currentOpeningHours,places.rating',
      },
      body: {
        textQuery: '{{inputs.placeId}}',
        maxResultCount: 1,
      },
      extract: {
        venueName: 'places[0].displayName.text',
        isOpen: 'places[0].currentOpeningHours.openNow',
        rating: 'places[0].rating',
      },
    },
    {
      id: 'write-on-chain',
      type: 'on-chain-write',
      contract: '{{env.SCOUT_CONTRACT}}',
      method: 'updateVenueStatus',
      args: ['{{inputs.poiId}}', '{{steps.fetch-venue.isOpen}}', '{{steps.fetch-venue.venueName}}'],
      chain: 'ethereum-sepolia',
    },
  ],
};

// ─── Simulate (required for Chainlink prize submission) ───────────────────────

export async function simulate() {
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  console.log('\n🔗 Chainlink CRE Workflow Simulation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Workflow:', workflow.name, `v${workflow.version}`);
  console.log('Steps:', workflow.steps.map((s) => s.id).join(' → '));
  console.log('');

  // Step 1: confidential-http — call Google Places
  console.log('▶ Step 1: confidential-http (fetch-venue)');
  console.log('  URL: https://places.googleapis.com/v1/places:searchText');
  console.log('  API Key: [REDACTED — stored as CRE secret]');

  let venueResult: { venueName: string; isOpen: boolean | null; rating: number | null } | null = null;

  if (apiKey) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.currentOpeningHours,places.rating',
        },
        body: JSON.stringify({ textQuery: 'Palais des Festivals Cannes France', maxResultCount: 1 }),
      });

      if (res.ok) {
        const data = await res.json() as {
          places?: { displayName?: { text: string }; currentOpeningHours?: { openNow: boolean }; rating?: number }[];
        };
        const place = data.places?.[0];
        venueResult = {
          venueName: place?.displayName?.text ?? 'Palais des Festivals',
          isOpen: place?.currentOpeningHours?.openNow ?? null,
          rating: place?.rating ?? null,
        };
        console.log('  ✓ Response received');
        console.log('  venueName:', venueResult.venueName);
        console.log('  isOpen:', venueResult.isOpen);
        console.log('  rating:', venueResult.rating);
      } else {
        console.log('  ⚠ Places API returned', res.status, '— using mock data');
        venueResult = { venueName: 'Palais des Festivals', isOpen: true, rating: 4.6 };
      }
    } catch {
      console.log('  ⚠ Network error — using mock data');
      venueResult = { venueName: 'Palais des Festivals', isOpen: true, rating: 4.6 };
    }
  } else {
    console.log('  ⚠ GOOGLE_PLACES_KEY not set — using mock data');
    venueResult = { venueName: 'Palais des Festivals', isOpen: true, rating: 4.6 };
  }

  // Step 2: on-chain-write (simulated)
  console.log('\n▶ Step 2: on-chain-write (write-on-chain)');
  console.log('  Contract: SCOUT_CONTRACT (Ethereum Sepolia)');
  console.log('  Method: updateVenueStatus');
  console.log('  Args: [cannes-01,', venueResult.isOpen + ',', `"${venueResult.venueName}"]`);
  console.log('  [SIMULATION — no actual tx sent]');

  console.log('\n✅ CRE Simulation complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Result:', JSON.stringify({ poiId: 'cannes-01', ...venueResult }, null, 2));
  console.log('');
  console.log('📋 Save this output for Chainlink prize submission.\n');

  return { poiId: 'cannes-01', ...venueResult };
}

export async function deploy() {
  console.log('Deploying CRE workflow:', workflow.name);
  console.log('Run: cre deploy workflow.ts');
}

// Run simulate if called directly
simulate();
