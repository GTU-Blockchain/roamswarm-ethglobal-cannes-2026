// Chainlink CRE Workflow — Food Agent venue data
// Confidential HTTP to Google Places API (API key never exposed on-chain)
// On-chain write: FOOD_AGENT_CONTRACT.updateVenueStatus

// import { CREWorkflow } from '@chainlink/cre-sdk'; // TODO: install actual SDK

const FOOD_AGENT_CONTRACT = process.env.FOOD_AGENT_CONTRACT || '';

export const workflow = {
  name: 'roam-venue-check',
  steps: [
    {
      type: 'confidential-http',
      url: 'https://places.googleapis.com/v1/places/{placeId}',
      headers: { 'X-Goog-Api-Key': '{{secret.GOOGLE_PLACES_KEY}}' },
      extract: ['currentOpeningHours.openNow', 'currentSecondaryOpeningHours'],
    },
    {
      type: 'on-chain-write',
      contract: FOOD_AGENT_CONTRACT,
      method: 'updateVenueStatus',
    },
  ],
};

export async function simulate() {
  // TODO: await CREWorkflow.simulate(workflow)
  console.log('CRE simulate — required for Chainlink prize');
}

export async function deploy() {
  // TODO: await CREWorkflow.deploy(workflow)
  console.log('CRE deploy');
}
