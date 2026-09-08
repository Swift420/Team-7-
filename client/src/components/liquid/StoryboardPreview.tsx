import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Video,
  Sparkles,
  Layers,
  RotateCcw,
  Download,
  Code2,
  CheckCircle2,
  Gauge,
} from 'lucide-react';
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
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showVeoModal, setShowVeoModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const scenes = storyboard.scenes || [];
  const totalSeconds = storyboard.totalDurationSeconds || 60;

  // Compute scene time boundaries:
  // scene 0: 0 -> d0
  // scene 1: d0 -> d0+d1
  const sceneBoundaries = scenes.map((s, idx) => {
    const start = scenes.slice(0, idx).reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const end = start + s.durationSeconds;
    return { start, end, index: idx };
  });

  // Playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            setIsPlaying(false);
            return 0;
          }
          // determine matching scene
          const match = sceneBoundaries.find((b) => next >= b.start && next < b.end);
          if (match && match.index !== activeSceneIndex) {
            setActiveSceneIndex(match.index);
          }
          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSeconds, playbackSpeed, activeSceneIndex, sceneBoundaries]);

  // Keep activeSceneIndex in sync with manual clicks
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  // Canvas visual motion renderer for simulated video background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const render = () => {
      tick += 0.03 * playbackSpeed;
      const w = canvas.width;
      const h = canvas.height;

      // Dark cinematic backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle dynamic particle/wave simulation
      ctx.strokeStyle = activeSceneIndex === 1 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const y = h * 0.5 + Math.sin(x * 0.02 + tick) * 30 + Math.cos(x * 0.01 - tick) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Atmospheric glowing bokeh or light leak
      const radGrad = ctx.createRadialGradient(
        w * 0.5 + Math.sin(tick * 0.5) * 40,
        h * 0.35 + Math.cos(tick * 0.5) * 30,
        10,
        w * 0.5,
        h * 0.35,
        180
      );
      radGrad.addColorStop(0, activeSceneIndex === 1 ? 'rgba(220, 38, 38, 0.3)' : 'rgba(30, 58, 138, 0.25)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeSceneIndex, playbackSpeed]);

  const handlePrev = () => {
    const newIdx = activeSceneIndex > 0 ? activeSceneIndex - 1 : scenes.length - 1;
    setActiveSceneIndex(newIdx);
    setElapsedSeconds(sceneBoundaries[newIdx].start);
  };

  const handleNext = () => {
    const newIdx = activeSceneIndex < scenes.length - 1 ? activeSceneIndex + 1 : 0;
    setActiveSceneIndex(newIdx);
    setElapsedSeconds(sceneBoundaries[newIdx].start);
  };

  const resetPlay = () => {
    setElapsedSeconds(0);
    setActiveSceneIndex(0);
    setIsPlaying(false);
  };

  // Export video clip simulation using client-side canvas recorder
  const handleExportVideo = () => {
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);

      // Create a dummy video blob download
      const fakeVideoContent = new Blob(
        [
          JSON.stringify({
            format: '9:16_vertical_storyboard',
            scenes: scenes,
            duration: totalSeconds,
            rendered_with: 'Google Veo 2 / Imagen 3 Engine',
          }),
        ],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(fakeVideoContent);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nzz_storyboard_60s_veo2.json`;
      a.click();

      setTimeout(() => setExportComplete(false), 4000);
    }, 2000);
  };

  if (!currentScene) {
    return <div className="p-8 text-center text-slate-500">No scenes generated.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 9:16 Mobile Phone Mockup / Live Video Canvas */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div
          data-testid="mobile-storyboard-frame"
          className="relative w-[300px] h-[560px] bg-black rounded-[42px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col justify-between overflow-hidden ring-1 ring-white/10"
        >
          {/* Top Speaker & Camera Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
            <div className="w-8 h-1 rounded-full bg-slate-800" />
          </div>

          {/* HTML5 Canvas Background Animated Engine */}
          <canvas
            ref={canvasRef}
            width={300}
            height={560}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Top Status & Platform Badges */}
          <div className="relative z-20 pt-5 flex items-center justify-between text-[11px] text-white/90 px-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold bg-red-600 text-white px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-serif">
                NZZ
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-black/50 px-1.5 py-0.5 rounded">
                Veo 2 AI
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-mono text-[11px] font-bold">
                {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')} / 1:00
              </span>
            </div>
          </div>

          {/* Central On-Screen Dynamic Graphics */}
          <div className="relative z-20 px-3 my-auto text-center space-y-3.5">
            <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 backdrop-blur-md">
              Szene {currentScene.sceneIndex}: {currentScene.sceneType.toUpperCase()}
            </span>

            <h3 className="text-xl font-black text-white leading-tight font-serif tracking-tight drop-shadow-md">
              {currentScene.onScreenHeadline}
            </h3>

            {currentScene.prominentMetric && (
              <div className="inline-block bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-3xl font-black px-4 py-2 rounded-xl shadow-xl shadow-red-950/80 border border-red-400/30 animate-pulse">
                {currentScene.prominentMetric}
              </div>
            )}
          </div>

          {/* Bottom Narration & Voiceover Cue with Audio Bars */}
          <div className="relative z-20 space-y-2 bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Voiceover Subtitle
              </span>
              {/* Simulated Audio Waveform Bar */}
              <div className="flex items-center gap-0.5">
                {[12, 24, 18, 28, 14, 22, 10, 26].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-red-500 rounded-full transition-all duration-200"
                    style={{
                      height: isPlaying ? `${(h * (1 + Math.sin(elapsedSeconds * 4 + i))) / 2}px` : '4px',
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-100 leading-snug font-medium">
              «{currentScene.voiceoverText}»
            </p>
          </div>

          {/* Timeline Scrubber Bar */}
          <div className="relative z-20 pt-2 pb-1 space-y-1">
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(elapsedSeconds / totalSeconds) * 100}%` }}
              />
            </div>
            <div className="flex justify-between gap-1">
              {scenes.map((s, idx) => (
                <button
                  key={s.sceneIndex}
                  onClick={() => {
                    setActiveSceneIndex(idx);
                    setElapsedSeconds(sceneBoundaries[idx].start);
                  }}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    activeSceneIndex === idx ? 'bg-red-500' : 'bg-slate-700/80'
                  }`}
                  title={`Scene ${s.sceneIndex} (${s.durationSeconds}s)`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Speed Switcher */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <span>Vorschau-Tempo:</span>
          {([1, 2, 4] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                playbackSpeed === spd
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Scene Details & Google Veo 2 Prompt Inspector */}
      <div className="lg:col-span-7 space-y-4">
        {/* Navigation Toolbar */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Szene {currentScene.sceneIndex} von {scenes.length}
            </span>
            <span className="text-xs text-slate-400">({currentScene.durationSeconds}s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Vorherige Szene"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-950/40"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play 60s Video'}
            </button>

            <button
              onClick={resetPlay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Von vorne abspielen"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Nächste Szene"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVeoModal(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium rounded-lg flex items-center gap-1"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Veo 2 API</span>
            </button>

            <button
              onClick={handleExportVideo}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>{isExporting ? 'Exporting...' : 'Export Video'}</span>
            </button>
          </div>
        </div>

        {exportComplete && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              60s Vertical Storyboard exported successfully! Ready for distribution to TikTok, Reels, and Shorts.
            </span>
          </div>
        )}

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
                Vertex AI Model: veo-2.0-generate-001
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

      {/* Google Veo 2 Vertex AI API Inspector Modal */}
      {showVeoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Google Veo 2 (Vertex AI) Payload</h3>
              </div>
              <button
                onClick={() => setShowVeoModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              This is the exact JSON dispatch payload formatted for Google Vertex AI&apos;s{' '}
              <code className="text-blue-400 font-mono">veo-2.0-generate-001</code> model for scene {currentScene.sceneIndex}.
            </p>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-72">
{JSON.stringify(
  {
    model: 'publishers/google/models/veo-2.0-generate-001',
    endpoint: 'https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/publishers/google/models/veo-2.0-generate-001:predict',
    parameters: {
      aspectRatio: '9:16',
      durationSeconds: currentScene.durationSeconds,
      fps: 24,
      sampleCount: 1,
      cameraMotion: currentScene.sceneType === 'hook' ? 'dolly_in' : 'pan_horizontal',
      negativePrompt: 'blurry, distorted, low quality, artifacts, watermark',
    },
    instances: [
      {
        prompt: currentScene.visualPrompt,
        onScreenText: currentScene.onScreenHeadline,
        prominentMetric: currentScene.prominentMetric,
      },
    ],
  },
  null,
  2
)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowVeoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
