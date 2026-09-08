import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Video, Sparkles, Layers } from 'lucide-react';
import type { SocialStoryboardFormat, VideoScene } from '../../types/liquid';

interface StoryboardPreviewProps {
  storyboard: SocialStoryboardFormat;
  onUpdateScene?: (updatedScene: VideoScene) => void;
}

export const StoryboardPreview: React.FC<StoryboardPreviewProps> = ({
  storyboard,
  onUpdateScene,
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenes = storyboard.scenes || [];
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  const handlePrev = () => {
    setActiveSceneIndex((prev) => (prev > 0 ? prev - 1 : scenes.length - 1));
  };

  const handleNext = () => {
    setActiveSceneIndex((prev) => (prev < scenes.length - 1 ? prev + 1 : 0));
  };

  if (!currentScene) {
    return <div className="p-8 text-center text-slate-500">No scenes generated.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 9:16 Mobile Phone Mockup */}
      <div className="lg:col-span-5 flex justify-center">
        <div
          data-testid="mobile-storyboard-frame"
          className="relative w-[280px] h-[520px] bg-black rounded-[36px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col justify-between overflow-hidden"
        >
          {/* Top Speaker & Camera Notch */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
          </div>

          {/* Background simulated footage / art gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-900 z-0">
            {/* Subtle motion visual overlay */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>

          {/* Top Status & Platform Badges */}
          <div className="relative z-10 pt-4 flex items-center justify-between text-[11px] text-white/80 px-2">
            <span className="font-semibold bg-red-600/90 text-white px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              NZZ Visual
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{currentScene.timeRange}</span>
          </div>

          {/* Central On-Screen Dynamic Graphics */}
          <div className="relative z-10 px-3 my-auto text-center space-y-3">
            <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20">
              {currentScene.sceneType}
            </span>

            <h3 className="text-lg font-bold text-white leading-tight font-serif">
              {currentScene.onScreenHeadline}
            </h3>

            {currentScene.prominentMetric && (
              <div className="inline-block bg-red-600 text-white font-mono text-3xl font-extrabold px-3 py-1.5 rounded-lg shadow-lg">
                {currentScene.prominentMetric}
              </div>
            )}
          </div>

          {/* Bottom Narration Subtitles */}
          <div className="relative z-10 space-y-2 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold uppercase">
              <Sparkles className="w-3 h-3" /> Voiceover Cue
            </div>
            <p className="text-xs text-slate-200 leading-snug line-clamp-3">
              «{currentScene.voiceoverText}»
            </p>
          </div>

          {/* Timeline Scrubber Dots */}
          <div className="relative z-10 pt-2 pb-1 flex justify-center gap-1.5">
            {scenes.map((s, idx) => (
              <button
                key={s.sceneIndex}
                onClick={() => setActiveSceneIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  activeSceneIndex === idx ? 'w-8 bg-red-600' : 'w-2 bg-slate-700'
                }`}
                title={`Scene ${s.sceneIndex}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scene Details & Google Veo 2 Prompt Inspector */}
      <div className="lg:col-span-7 space-y-4">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Szene {currentScene.sceneIndex} von {scenes.length}
            </span>
            <span className="text-xs text-slate-400">({currentScene.durationSeconds}s)</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play 60s Preview'}
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scene Script & Visual Art Direction */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              On-Screen Headline (Max 6 words)
            </label>
            <input
              type="text"
              value={currentScene.onScreenHeadline}
              onChange={(e) =>
                onUpdateScene?.({ ...currentScene, onScreenHeadline: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Prominent Metric Callout (optional)
            </label>
            <input
              type="text"
              value={currentScene.prominentMetric || ''}
              onChange={(e) =>
                onUpdateScene?.({ ...currentScene, prominentMetric: e.target.value })
              }
              placeholder="e.g. 42%, €100 Mrd."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-400" />
                Google Veo 2 / Imagen 3 Cinematic Visual Prompt
              </label>
              <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                AI Video Gen Ready
              </span>
            </div>
            <textarea
              rows={3}
              value={currentScene.visualPrompt}
              onChange={(e) =>
                onUpdateScene?.({ ...currentScene, visualPrompt: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Spoken Voiceover Script (1-2 sentences)
            </label>
            <textarea
              rows={2}
              value={currentScene.voiceoverText}
              onChange={(e) =>
                onUpdateScene?.({ ...currentScene, voiceoverText: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Platform Targets Banner */}
        <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Configured for 9:16 vertical distribution on:</span>
          <span className="font-semibold text-slate-200">TikTok, Instagram Reels, YouTube Shorts</span>
        </div>
      </div>
    </div>
  );
};

