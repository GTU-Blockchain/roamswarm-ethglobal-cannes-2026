// Lore Agent — lore.roam.eth
// ERC-8004 Identity: registered on Ethereum Mainnet
// Runs LLM inference on 0G Compute to generate a POI history story

import express from 'express';

const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { poiId, lang = 'en' } = req.body;

  // TODO: call 0G Compute API with OpenClaw framework
  // const story = await ogCompute.infer({
  //   model: 'gpt-4o',
  //   prompt: `Tell the history of POI ${poiId} in ${lang}...`,
  // });

  res.json({ story: `[History of ${poiId} in ${lang}]` });
});

app.listen(3002, () => console.log('Lore Agent running on :3002'));
