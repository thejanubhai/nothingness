'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles } from 'lucide-react';

interface AudioVibePlayerProps {
  audioUrl?: string | null;
  alias: string;
}

export default function AudioVibePlayer({ audioUrl, alias }: AudioVibePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthesizedSensoryVibe = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(216, ctx.currentTime); // Deep warm frequency
      osc.frequency.exponentialRampToValueAtTime(432, ctx.currentTime + 1.5);
      osc.frequency.exponentialRampToValueAtTime(324, ctx.currentTime + 3.5);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 4);
      setIsPlaying(true);

      setTimeout(() => {
        setIsPlaying(false);
      }, 4000);
    } catch (_) {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Fallback to sensory vibe synthesizer
        playSynthesizedSensoryVibe();
      });
    } else {
      playSynthesizedSensoryVibe();
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-rose-950/40 via-zinc-900 to-purple-950/40 border border-rose-500/30 p-2 px-3 rounded-2xl shadow-md w-max">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
        title={`Listen to @${alias} Sensory Tone`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Animated Soundwave Visualizer */}
      <div className="flex items-center gap-1 h-4 px-1">
        {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3].map((heightScale, idx) => (
          <div
            key={idx}
            className={`w-1 rounded-full bg-rose-400 transition-all duration-300 ${
              isPlaying ? 'animate-pulse' : 'opacity-40'
            }`}
            style={{
              height: isPlaying ? `${Math.max(4, heightScale * 16)}px` : '4px',
              animationDelay: `${idx * 100}ms`
            }}
          />
        ))}
      </div>

      <span className="text-[10px] font-mono text-rose-300 font-semibold uppercase tracking-wider pr-1">
        Sensory Note
      </span>
    </div>
  );
}
