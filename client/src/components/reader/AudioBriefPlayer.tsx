import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Loader2, AlertCircle } from 'lucide-react';
import type { AudioBriefFormat } from '../../types/liquid';
import { synthesizeAudio } from '../../services/liquidApi';

interface AudioBriefPlayerProps {
  audioBrief: AudioBriefFormat;
  headline: string;
}

export const AudioBriefPlayer: React.FC<AudioBriefPlayerProps> = ({
  audioBrief,
  headline,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | undefined>(audioBrief.audioUrl);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = audioBrief.estimatedDurationSeconds || 60;

  useEffect(() => {
    setAudioSrc(audioBrief.audioUrl);
  }, [audioBrief.audioUrl]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
        } else {
          setCurrentTime((prev) => (prev >= duration ? 0 : prev + 1));
        }
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const progress = Math.min(100, (currentTime / duration) * 100);

  const togglePlay = async () => {
    setErrorMessage(null);

    // If we don't have audioSrc yet, synthesize now via Google Cloud TTS
    if (!audioSrc) {
      try {
        setIsLoading(true);
        const res = await synthesizeAudio({
          script: audioBrief.script,
          language: audioBrief.voiceProfile?.languageCode?.startsWith('de') ? 'de' : 'en',
          voiceName: audioBrief.voiceProfile?.voiceName,
        });
        setAudioSrc(res.audioUrl);
        setIsLoading(false);

        // Allow DOM to update audio src then play
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch((err) => {
              setErrorMessage(`Playback error: ${err.message}`);
              setIsPlaying(false);
            });
          }
        }, 100);
        return;
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err.message || 'Google Cloud TTS synthesis failed');
        return;
      }
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          setErrorMessage(`Playback error: ${err.message}`);
          setIsPlaying(false);
        });
      }
    }
  };

  const resetPlay = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  return (
    <div className="bg-gradient-to-r from-neutral-900 to-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg my-6">
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {errorMessage && (
        <div className="mb-3 px-3 py-2 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Branding & Headline */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50 transition-all hover:scale-105 disabled:opacity-75"
            aria-label={isPlaying ? 'Pause Audio Brief' : 'Play Audio Brief'}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900">
                60s Audio Brief
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
          <span className="text-[10px] bg-slate-800 px-2.5 py-1 rounded-full text-slate-300 flex items-center gap-1 font-mono">
            <Volume2 className="w-3 h-3 text-red-400" />
            {audioBrief.voiceProfile?.voiceName || 'en-US-Journey-F'}
          </span>
          <button
            onClick={resetPlay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Restart playback"
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
