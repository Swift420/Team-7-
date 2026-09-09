import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import type { AudioBriefFormat } from '../../types/liquid';
import { AssetStatus } from './types';

interface CommuterAudioCardProps {
  audioBrief?: AudioBriefFormat;
  status: AssetStatus;
  articleHeadline?: string;
  isIncludedInArticle: boolean;
  onInclusionChange: (included: boolean) => void;
  onToast: (msg: string) => void;
  language?: 'en' | 'de';
}

export const CommuterAudioCard: React.FC<CommuterAudioCardProps> = ({
  audioBrief,
  status,
  articleHeadline = 'Scientists May Have Just Caught Gravity Behaving Quantum Mechanically',
  isIncludedInArticle,
  onInclusionChange,
  onToast,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const totalDuration = audioBrief?.estimatedDurationSeconds || 134; // 2:14
  const timerRef = useRef<number | null>(null);

  // 36 waveform bars with deterministic realistic amplitude heights
  const waveformHeights = [
    30, 45, 60, 40, 80, 65, 90, 75, 45, 60,
    95, 80, 50, 70, 85, 100, 60, 40, 75, 90,
    65, 80, 55, 70, 85, 60, 45, 75, 90, 65,
    50, 70, 85, 60, 40, 25,
  ];

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(totalDuration, +(prev + 0.2 * playbackSpeed).toFixed(1));
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDuration, playbackSpeed]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSeekWaveform = (index: number) => {
    const fraction = (index + 0.5) / waveformHeights.length;
    setCurrentTime(+(fraction * totalDuration).toFixed(1));
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadAudio = () => {
    onToast(isDe ? 'Audio Brief (MP3) wird heruntergeladen...' : 'Downloading Audio Brief (MP3)...');
    setTimeout(() => {
      // Create synthetic audio brief transcript text file or mp3 trigger
      const blob = new Blob(
        [
          `NZZ COMMUTER AUDIO BRIEF\n` +
          `Title: ${audioBrief?.headline || articleHeadline}\n` +
          `Duration: ${formatTime(totalDuration)}\n\n` +
          `${audioBrief?.script || 'Audio brief synthesis transcript.'}`
        ],
        { type: 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nzz-audio-brief-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 600);
  };

  const handleToggleArticle = () => {
    const nextVal = !isIncludedInArticle;
    onInclusionChange(nextVal);
    onToast(
      nextVal
        ? (isDe ? 'Audio Brief zum Artikel hinzugefügt' : 'Audio Brief added to article')
        : (isDe ? 'Audio Brief aus dem Artikel entfernt' : 'Audio Brief removed from article')
    );
  };

  const elapsedFraction = currentTime / Math.max(1, totalDuration);

  return (
    <article className="nzz-asset-card" aria-label="Commuter Audio Brief format">
      {/* Header */}
      <div className="nzz-asset-card-header">
        <div className="nzz-asset-card-header-left">
          <div className="nzz-asset-icon-box" style={{ color: '#1a56db' }}>
            <Headphones size={18} />
          </div>
          <div className="nzz-asset-card-titles">
            <h3 className="nzz-asset-card-title">Commuter Audio Brief</h3>
            <span className="nzz-asset-card-desc">
              {isDe
                ? 'Eine prägnante Zusammenfassung von 2–3 Minuten für unterwegs.'
                : 'A concise, 2–3 minute audio summary for on-the-go listening.'}
            </span>
          </div>
        </div>

        <div className={`nzz-asset-status-pill ${status}`}>
          <span className="nzz-status-dot" />
          <span>{status === 'ready' ? (isDe ? 'Bereit' : 'Ready') : status === 'generating' ? (isDe ? 'Erstellt...' : 'Generating...') : 'Ready'}</span>
        </div>
      </div>

      {/* Custom Audio Player Strip */}
      <div className="nzz-audio-player-strip" role="region" aria-label="Audio player">
        {/* Play / Pause circular button */}
        <button
          type="button"
          className="nzz-audio-play-round"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
        </button>

        {/* Dynamic Waveform Visualizer */}
        <div
          className="nzz-waveform-container"
          role="slider"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={totalDuration}
          aria-label="Audio waveform progress"
        >
          {waveformHeights.map((h, i) => {
            const barFraction = (i + 1) / waveformHeights.length;
            const isFilled = barFraction <= elapsedFraction;
            return (
              <div
                key={i}
                className={`nzz-waveform-bar ${isFilled ? 'active' : ''}`}
                style={{ height: `${Math.max(15, h)}%` }}
                onClick={() => handleSeekWaveform(i)}
                title={`Seek to ${formatTime((i / waveformHeights.length) * totalDuration)}`}
              />
            );
          })}
        </div>

        {/* Timestamp */}
        <span className="nzz-audio-time-pill">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>

        {/* Speed button */}
        <button
          type="button"
          className="nzz-speed-btn"
          onClick={cycleSpeed}
          title="Playback speed"
        >
          {playbackSpeed}x
        </button>

        {/* Download action button */}
        <button
          type="button"
          className="nzz-audio-action-btn"
          onClick={handleDownloadAudio}
          title="Download audio"
          aria-label="Download audio file"
        >
          <Download size={14} />
        </button>

        {/* More button */}
        <button
          type="button"
          className="nzz-audio-action-btn"
          onClick={() => onToast(isDe ? 'Audio-Optionen' : 'Audio settings')}
          title="More options"
          aria-label="More audio options"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Article Inclusion Toggle Switch */}
      <div className="nzz-inclusion-toggle-row">
        <button
          type="button"
          role="switch"
          aria-checked={isIncludedInArticle}
          className={`nzz-switch-btn ${isIncludedInArticle ? 'active' : ''}`}
          onClick={handleToggleArticle}
        >
          <span className="nzz-switch-thumb" />
        </button>

        <div className="nzz-inclusion-text-group">
          <span className="nzz-inclusion-label">
            {isDe ? 'Zum Artikel hinzufügen' : 'Add to article'}
          </span>
          <span className="nzz-inclusion-desc">
            {isIncludedInArticle
              ? (isDe ? 'Leser sehen diesen Audio Brief im veröffentlichten Artikel.' : 'Readers will see this audio brief in the published article.')
              : (isDe ? 'Diesen Audio Brief innerhalb des Artikels anzeigen.' : 'Display this audio brief within the article.')}
          </span>
        </div>
      </div>
    </article>
  );
};
