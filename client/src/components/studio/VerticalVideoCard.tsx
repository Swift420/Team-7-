import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Share2,
  Clock,
  Smartphone,
  Subtitles,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Clapperboard,
} from 'lucide-react';
import type { SocialStoryboardFormat } from '../../types/liquid';
import { AssetStatus } from './types';

interface VerticalVideoCardProps {
  storyboard?: SocialStoryboardFormat;
  status: AssetStatus;
  articleHeadline?: string;
  onShare: (platform: string, caption: string) => void;
  onToast: (msg: string) => void;
  language?: 'en' | 'de';
}

export const VerticalVideoCard: React.FC<VerticalVideoCardProps> = ({
  storyboard,
  status,
  articleHeadline = 'Scientists May Have Just Caught Gravity Behaving Quantum Mechanically',
  onShare,
  onToast,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const duration = storyboard?.totalDurationSeconds || 16;
  const timerRef = useRef<number | null>(null);

  const scenes = storyboard?.scenes && storyboard.scenes.length > 0
    ? storyboard.scenes
    : [
        {
          sceneIndex: 1,
          timeRange: '0:00 - 0:04',
          sceneType: 'Hook',
          onScreenHeadline: 'When Gravity Gets Quantum',
          voiceoverText: "For decades, Einstein's gravity and quantum mechanics refused to talk.",
        },
        {
          sceneIndex: 2,
          timeRange: '0:04 - 0:10',
          sceneType: 'The Breakthrough',
          onScreenHeadline: 'Ultracold Atoms See What Einstein Couldn’t',
          voiceoverText: 'Using ultracold atoms, scientists observed a long-predicted quantum gravitational effect.',
        },
        {
          sceneIndex: 3,
          timeRange: '0:10 - 0:16',
          sceneType: 'The Horizon',
          onScreenHeadline: 'A New Window Into the Universe',
          voiceoverText: 'A landmark step toward a unified theory of physics. Read the analysis on nzz.ch',
        },
      ];

  // Determine current active scene based on playback position
  const activeSceneIndex = Math.min(
    scenes.length - 1,
    Math.floor((currentTime / Math.max(1, duration)) * scenes.length)
  );
  const currentScene = scenes[activeSceneIndex];

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const interval = 100; // 100ms
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(duration, +(prev + 0.1).toFixed(1));
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(+(pos * duration).toFixed(1));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = () => {
    onToast(isDe ? 'Vertical Video (MP4) wird exportiert...' : 'Exporting Vertical Video (MP4)...');
    // Simulated video download trigger
    setTimeout(() => {
      const blob = new Blob(
        [JSON.stringify({ title: storyboard?.title || articleHeadline, scenes, duration }, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nzz-vertical-video-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onToast(isDe ? 'Video-Asset erfolgreich heruntergeladen' : 'Video asset downloaded successfully');
    }, 800);
  };

  const handleShare = () => {
    const caption = `When Gravity Gets Quantum: Scientists observe non-classical gravitational signatures in ultracold atoms.\n\nRead the full report on nzz.ch #NZZ #Physics #Science`;
    onShare('Vertical Video', caption);
  };

  return (
    <article className="nzz-asset-card" aria-label="Vertical Video format">
      {/* Header */}
      <div className="nzz-asset-card-header">
        <div className="nzz-asset-card-header-left">
          <div className="nzz-asset-icon-box" style={{ color: '#d80000' }}>
            <Clapperboard size={18} />
          </div>
          <div className="nzz-asset-card-titles">
            <h3 className="nzz-asset-card-title">Vertical Video</h3>
            <span className="nzz-asset-card-desc">
              {isDe
                ? 'Ein kurzes, fesselndes Video für Reels, TikTok oder Shorts.'
                : 'A short, engaging video for Reels, TikTok or YouTube Shorts.'}
            </span>
          </div>
        </div>

        <div className={`nzz-asset-status-pill ${status}`}>
          <span className="nzz-status-dot" />
          <span>{status === 'ready' ? (isDe ? 'Bereit' : 'Ready') : status === 'generating' ? (isDe ? 'Erstellt...' : 'Generating...') : 'Ready'}</span>
        </div>
      </div>

      {/* 2-Column: Player + Details */}
      <div className="nzz-video-content-grid">
        {/* Left: 9:16 Video Player Preview */}
        <div className="nzz-video-player-box" role="region" aria-label="Video preview player">
          <div className="nzz-video-bg-ambient" />

          {/* Top Bar inside player */}
          <div className="nzz-video-top-bar">
            <span className="nzz-video-logo">NZZ</span>
            <span className="text-[8px] font-semibold bg-white/20 backdrop-blur px-1.5 py-0.5 rounded text-white">
              9:16
            </span>
          </div>

          {/* Dynamic Scene Content / Headline Overlay */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto px-2">
            <span className="text-[8px] uppercase tracking-wider text-red-400 font-semibold mb-1">
              {currentScene?.sceneType || 'Scene'}
            </span>
            <h4 className="nzz-video-overlay-title">
              {currentScene?.onScreenHeadline || storyboard?.title || 'When Gravity Gets Quantum'}
            </h4>
            {isPlaying && currentScene?.voiceoverText && (
              <p className="text-[8px] text-neutral-300 mt-2 line-clamp-2 px-1 italic">
                «{currentScene.voiceoverText}»
              </p>
            )}
          </div>

          {/* Center Play/Pause button */}
          <button
            type="button"
            className="nzz-video-play-center"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
          </button>

          {/* Bottom Player Controls */}
          <div className="nzz-video-bottom-controls">
            <div
              className="nzz-video-scrubber-track"
              onClick={handleSeek}
              role="slider"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
            >
              <div
                className="nzz-video-scrubber-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <div className="nzz-video-controls-row">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="nzz-video-controls-actions">
                <button
                  type="button"
                  className="nzz-video-ctrl-btn"
                  onClick={() => setIsMuted((prev) => !prev)}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  type="button"
                  className="nzz-video-ctrl-btn"
                  onClick={() => onToast(isDe ? 'Vollbildmodus' : 'Fullscreen preview')}
                  title="Fullscreen"
                >
                  <Maximize2 size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video Details Column */}
        <div className="nzz-video-details-col">
          <h4 className="nzz-video-details-heading">
            {isDe ? 'Video-Details' : 'Video details'}
          </h4>

          <ul className="nzz-video-details-list">
            <li className="nzz-video-detail-item">
              <Clock className="nzz-video-detail-icon" />
              <span className="nzz-video-detail-label">{isDe ? 'Dauer:' : 'Duration:'}</span>
              <span className="nzz-video-detail-val">{duration} {isDe ? 'Sekunden' : 'seconds'}</span>
            </li>

            <li className="nzz-video-detail-item">
              <Smartphone className="nzz-video-detail-icon" />
              <span className="nzz-video-detail-label">{isDe ? 'Format:' : 'Format:'}</span>
              <span className="nzz-video-detail-val">9:16 ({isDe ? 'Vertikal' : 'Vertical'})</span>
            </li>

            <li className="nzz-video-detail-item">
              <Subtitles className="nzz-video-detail-icon" />
              <span className="nzz-video-detail-label">{isDe ? 'Untertitel:' : 'Subtitles:'}</span>
              <span className="nzz-video-detail-val">{isDe ? 'Enthalten' : 'Included'}</span>
            </li>

            <li className="nzz-video-detail-item">
              <Sparkles className="nzz-video-detail-icon" />
              <span className="nzz-video-detail-label">{isDe ? 'Stil:' : 'Style:'}</span>
              <span className="nzz-video-detail-val">{isDe ? 'Kinematisch, minimal' : 'Cinematic, minimal'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Export Action Buttons */}
      <div className="nzz-social-actions-row">
        <button
          type="button"
          className="nzz-btn-export-secondary"
          onClick={handleDownload}
        >
          <Download size={14} />
          <span>{isDe ? 'Video herunterladen' : 'Download Video'}</span>
        </button>

        <button
          type="button"
          className="nzz-btn-export-primary"
          onClick={handleShare}
        >
          <Share2 size={14} />
          <span>{isDe ? 'Auf Social Media teilen' : 'Share to Social Media'}</span>
        </button>
      </div>
    </article>
  );
};
