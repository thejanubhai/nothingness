'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles } from 'lucide-react';

interface AudioVibePlayerProps {
  audioUrl?: string;
  alias: string;
}

export default function AudioVibePlayer({ audioUrl, alias }: AudioVibePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-rose-950/40 to-purple-950/40 border border-rose-500/30 p-2 px-3 rounded-2xl shadow-md w-max">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-md shrink-0"
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
