'use client';

// TODO: Audio streaming player
// Props: audioUrl (0G Storage stream URL), poiName
// - Play/pause controls
// - Progress bar + seek
// - Waveform visualization
// - Show "generating..." state when audioUrl is empty

export interface AudioPlayerProps {
  audioUrl: string;
  poiName: string;
}

export function AudioPlayer({ audioUrl, poiName }: AudioPlayerProps) {
  return <></>;
}
