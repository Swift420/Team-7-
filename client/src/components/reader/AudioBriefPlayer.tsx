import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { AudioBriefFormat } from '../../types/liquid';

interface AudioBriefPlayerProps {
  audioBrief: AudioBriefFormat;
  headline: string;
}

export const AudioBriefPlayer: React.FC<AudioBriefPlayerProps> = ({
  audioBrief,
  headline,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = audioBrief.estimatedDurationSeconds || 60;

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const progress = Math.min(100, (currentTime / duration) * 100);

  const togglePlay = () => {
    if (audioBrief.audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const resetPlay = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="bg-gradient-to-r from-neutral-900 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg my-6">
      {audioBrief.audioUrl && (
        <audio
          ref={audioRef}
          src={audioBrief.audioUrl}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Branding & Headline */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50 transition-all hover:scale-105"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                60s Pendler-Briefing
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-1 line-clamp-1">
              {headline}
            </p>
          </div>
        </div>

        {/* Right: Sound info & Voice profile */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
            {audioBrief.voiceProfile?.voiceName || 'Neural2 Voice'}
          </span>
          <button
            onClick={resetPlay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Von vorne abspielen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-red-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
