'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';

export interface AudioPlayerProps {
  audioUrl: string;
  poiName: string;
}

const BAR_COUNT = 28;

function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-roam-gold"
          animate={
            playing
              ? {
                  height: [
                    `${12 + Math.random() * 20}px`,
                    `${20 + Math.random() * 20}px`,
                    `${8 + Math.random() * 20}px`,
                  ],
                }
              : { height: '6px' }
          }
          transition={
            playing
              ? {
                  duration: 0.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  delay: i * 0.04,
                  ease: 'easeInOut',
                }
              : { duration: 0.3 }
          }
          style={{ minHeight: '6px' }}
        />
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ audioUrl, poiName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const isGenerating = !audioUrl;

  useEffect(() => {
    setAudioError(false);
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => setPlaying(false);
    const onError = () => { setAudioError(true); setPlaying(false); };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || isGenerating || audioError) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
      }).catch((err: Error) => {
        console.warn('[AudioPlayer] play() failed:', err.message);
        setPlaying(false);
        setAudioError(true);
      });
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const pct = Number(e.target.value);
    audio.currentTime = (pct / 100) * duration;
    setProgress(pct);
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Volume2 size={15} className="text-roam-gold shrink-0" />
        <span className="text-xs font-semibold text-white/70 truncate">
          {isGenerating ? 'Generating audio narration…' : `Audio Guide · ${poiName}`}
        </span>
      </div>

      {/* Waveform */}
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-[3px] h-10"
          >
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <motion.div
                key={i}
                className="w-[3px] rounded-full bg-white/20"
                animate={{ height: ['6px', '18px', '6px'] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div key="waveform" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <WaveformBars playing={playing} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isGenerating || audioError}
          className="w-10 h-10 rounded-full bg-roam-gold flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:scale-95"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <Pause size={18} className="text-roam-dark" />
          ) : (
            <Play size={18} className="text-roam-dark ml-0.5" />
          )}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSeek}
            disabled={isGenerating || !duration}
            className="w-full h-1 appearance-none rounded-full bg-white/10 accent-roam-gold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-white/40 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" crossOrigin="anonymous" />}
      {audioError && (
        <p className="text-[11px] text-red-400/70 text-center">
          Audio unavailable — format not supported by browser
        </p>
      )}
    </div>
  );
}
