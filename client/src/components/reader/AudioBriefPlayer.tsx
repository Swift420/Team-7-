import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Loader2, AlertCircle } from 'lucide-react';
import type { AudioBriefFormat } from '../../types/liquid';
import { synthesizeAudio } from '../../services/liquidApi';
import { useLanguage } from '../../hooks/useLanguage';

interface AudioBriefPlayerProps {
  audioBrief: AudioBriefFormat;
  headline: string;
}

export const AudioBriefPlayer: React.FC<AudioBriefPlayerProps> = ({
  audioBrief,
  headline,
}) => {
  const { language, t } = useLanguage();
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
          language: language === 'de' ? 'de' : 'en',
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
    <div className="nzz-audio-player">
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
        <div className="nzz-audio-error">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="nzz-audio-player-inner">
        {/* Left: Play button, kicker, headline */}
        <div className="nzz-audio-left">
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="nzz-audio-play-btn"
            aria-label={isPlaying ? t('audio.pause') : t('audio.play')}
            title={isPlaying ? t('audio.pause') : t('audio.play')}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 text-white" />
            )}
          </button>

          <div className="nzz-audio-info">
            <div className="nzz-audio-kicker-row">
              <span className="nzz-kicker-dot" />
              <span className="nzz-audio-kicker">{t('audio.kicker')}</span>
              <span className="nzz-audio-timer">
                {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')} / {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
              </span>
            </div>
            <p className="nzz-audio-headline">{headline}</p>
          </div>
        </div>

        {/* Right: Voice indicator and restart */}
        <div className="nzz-audio-right">
          <span className="nzz-audio-voice-badge">
            <Volume2 className="w-3.5 h-3.5 text-red-600" />
            <span>{audioBrief.voiceProfile?.voiceName?.split('-').slice(0, 2).join('-') || t('audio.voice_default')}</span>
          </span>
          <button
            onClick={resetPlay}
            className="nzz-btn-audio-reset"
            title={t('audio.restart')}
            aria-label={t('audio.restart')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="nzz-audio-progress-track">
        <div
          className="nzz-audio-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
