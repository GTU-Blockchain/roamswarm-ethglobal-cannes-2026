// Orchestrator Agent — orchestrator.roam.eth
// ERC-8004 Identity: registered on Ethereum Mainnet
// Triggered by geofence event; coordinates Lore + Scout + Guide agents

import express from 'express';

const app = express();
app.use(express.json());

app.post('/orchestrate', async (req, res) => {
  const { poiId, userId, lang = 'en' } = req.body;

  // TODO: call lore, scout, guide agents in parallel
  // const [story, venue, audioUrl] = await Promise.all([
  //   lore.generate({ poiId, lang }),        // 0G Compute
  //   scout.recommend({ poiId }),             // Chainlink CRE
  //   guide.synthesize({ story, lang }),      // TTS → 0G Storage
  // ]);

  // TODO: write result to 0G Storage
  // await storage.write(`sessions/${userId}/${poiId}`, { story, venue, audioUrl });

  res.json({ audioUrl: '', venue: { name: '', isOpen: false, note: '' }, story: '' });
});

app.listen(3001, () => console.log('Orchestrator running on :3001'));
