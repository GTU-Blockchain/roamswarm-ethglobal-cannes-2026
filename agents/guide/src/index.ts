// Guide Agent — guide.roam.eth
// ERC-8004 Identity: registered on Ethereum Mainnet
// TTS via ElevenLabs → upload to 0G Storage → return stream URL

import express from 'express';

const app = express();
app.use(express.json());

app.post('/synthesize', async (req, res) => {
  const { story, lang = 'en' } = req.body;

  // TODO: call ElevenLabs TTS API
  // const audioBuffer = await elevenLabs.tts({ text: story, lang });

  // TODO: upload to 0G Storage
  // const audioUrl = await ogStorage.upload(audioBuffer, `audio/${Date.now()}.mp3`);

  res.json({ audioUrl: '' });
});

app.listen(3004, () => console.log('Guide Agent running on :3004'));
