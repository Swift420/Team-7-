import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Video,
  Sparkles,
  Layers,
  Download,
  Loader2,
  RefreshCw,
  Film,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { SocialStoryboardFormat, VideoScene } from '../../types/liquid';
import {
  generateSceneVideo,
  generateAllSceneVideos,
  renderVerticalVideo,
  fetchVideoServiceStatus
} from '../../services/liquidApi';

interface StoryboardPreviewProps {
  storyboard: SocialStoryboardFormat;
  language?: 'en' | 'de';
  articleId?: string;
  onUpdateScene?: (updatedScene: VideoScene) => void;
  onUpdateStoryboard?: (updatedStoryboard: SocialStoryboardFormat) => void;
}

export const StoryboardPreview: React.FC<StoryboardPreviewProps> = ({
  storyboard: initialStoryboard,
  language = 'en',
  articleId,
  onUpdateScene,
  onUpdateStoryboard,
}) => {
  const [storyboard, setStoryboard] = useState<SocialStoryboardFormat>(initialStoryboard);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'scene' | 'full'>('scene');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Generation & rendering states
  const [generatingSceneIndex, setGeneratingSceneIndex] = useState<number | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isRenderingMaster, setIsRenderingMaster] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [veoModel, setVeoModel] = useState<string>('veo-3.1-fast-generate-001');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isEn = language === 'en';

  // Synchronize internal state if initialStoryboard changes
  useEffect(() => {
    setStoryboard(initialStoryboard);
  }, [initialStoryboard]);

  // Load Veo service status on mount
  useEffect(() => {
    fetchVideoServiceStatus().then((status) => {
      if (status.model) {
        setVeoModel(status.model);
      }
    });
  }, []);

  const scenes = storyboard.scenes || [];
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  // Active video source depending on view mode
  const activeVideoUrl =
    viewMode === 'full'
      ? storyboard.renderedVideoUrl || storyboard.videoUrl
      : currentScene?.videoUrl;

  // Toggle playback
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('Playback initiation failed:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    setActiveSceneIndex((prev) => (prev > 0 ? prev - 1 : scenes.length - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setActiveSceneIndex((prev) => (prev < scenes.length - 1 ? prev + 1 : 0));
    setIsPlaying(false);
  };

  // Generate a single scene's Veo 3.1 video clip
  const handleGenerateSceneClip = async (targetIndex: number) => {
    const sceneToGenerate = scenes[targetIndex];
    if (!sceneToGenerate) return;

    setGeneratingSceneIndex(targetIndex + 1);
    setStatusMessage(
      isEn
        ? `Generating Scene ${targetIndex + 1} with Google Veo 3.1 (9:16 vertical)...`
        : `Generiere Szene ${targetIndex + 1} mit Google Veo 3.1 (9:16 vertikal)...`
    );
    setErrorMessage(null);

    try {
      const result = await generateSceneVideo({
        articleId,
        sceneIndex: sceneToGenerate.sceneIndex,
        visualPrompt: sceneToGenerate.visualPrompt,
        onScreenHeadline: sceneToGenerate.onScreenHeadline,
        prominentMetric: sceneToGenerate.prominentMetric,
        sceneType: sceneToGenerate.sceneType,
        durationSeconds: sceneToGenerate.durationSeconds || 5,
        bustCache: true,
      });

      const updatedScenes = [...scenes];
      const updatedScene: VideoScene = {
        ...sceneToGenerate,
        videoUrl: result.videoUrl,
        videoStatus: 'ready',
        modelUsed: result.modelUsed,
      };
      updatedScenes[targetIndex] = updatedScene;

      const updatedStoryboard: SocialStoryboardFormat = {
        ...storyboard,
        scenes: updatedScenes,
      };

      setStoryboard(updatedStoryboard);
      onUpdateScene?.(updatedScene);
      onUpdateStoryboard?.(updatedStoryboard);

      setStatusMessage(
        isEn
          ? `Scene ${targetIndex + 1} clip generated successfully!`
          : `Szene ${targetIndex + 1} Clip erfolgreich generiert!`
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Scene video generation failed:', err);
      setErrorMessage(err.message || 'Video generation failed');
    } finally {
      setGeneratingSceneIndex(null);
    }
  };

  // Generate all scene clips concurrently/sequentially
  const handleGenerateAllClips = async () => {
    setIsGeneratingAll(true);
    setStatusMessage(
      isEn
        ? 'Generating all 5 scene clips via Google Veo 3.1...'
        : 'Generiere alle 5 Szenen-Clips mit Google Veo 3.1...'
    );
    setErrorMessage(null);

    try {
      const updatedScenes = await generateAllSceneVideos({
        articleId,
        scenes,
        bustCache: false,
      });

      const updatedStoryboard: SocialStoryboardFormat = {
        ...storyboard,
        scenes: updatedScenes,
      };

      setStoryboard(updatedStoryboard);
      onUpdateStoryboard?.(updatedStoryboard);
      setStatusMessage(
        isEn
          ? 'All 5 Veo 3.1 clips ready!'
          : 'Alle 5 Veo 3.1 Szenen-Clips sind bereit!'
      );
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Generating all clips failed:', err);
      setErrorMessage(err.message || 'Failed to generate all clips');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Render & stitch the full 60-second vertical video
  const handleRenderFullVideo = async () => {
    setIsRenderingMaster(true);
    setStatusMessage(
      isEn
        ? 'Synthesizing voiceover, rendering broadsheet overlays, & stitching 60s MP4 with ffmpeg...'
        : 'Synthetisiere Voiceover, rendere Typografie-Overlays & schneide 60s MP4 mit ffmpeg...'
    );
    setErrorMessage(null);

    try {
      const result = await renderVerticalVideo({
        articleId,
        storyboard,
        language,
      });

      const updatedStoryboard: SocialStoryboardFormat = {
        ...storyboard,
        renderedVideoUrl: result.videoUrl,
        videoUrl: result.videoUrl,
        renderedVideoStatus: 'ready',
        totalDurationSeconds: result.totalDurationSeconds,
      };

      setStoryboard(updatedStoryboard);
      onUpdateStoryboard?.(updatedStoryboard);

      // Switch to full video preview mode and auto-play
      setViewMode('full');
      setStatusMessage(
        isEn
          ? `Full 60s vertical video rendered! (Duration: ${result.totalDurationSeconds}s)`
          : `Vollständiges 60s Vertikalvideo gerendert! (Dauer: ${result.totalDurationSeconds}s)`
      );
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Rendering master video failed:', err);
      setErrorMessage(err.message || 'Failed to render master vertical video');
    } finally {
      setIsRenderingMaster(false);
    }
  };

  // Download video file directly
  const handleDownloadVideo = () => {
    const targetUrl =
      viewMode === 'full'
        ? storyboard.renderedVideoUrl || storyboard.videoUrl
        : currentScene?.videoUrl;

    if (!targetUrl) return;

    const safeTitle = (storyboard.title || 'nzz_vertical_video')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');
    const filename =
      viewMode === 'full'
        ? `NZZ_${safeTitle}_60s_master.mp4`
        : `NZZ_${safeTitle}_scene_${currentScene.sceneIndex}.mp4`;

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Speech cadence calculation (words per second)
  const wordCount = (currentScene?.voiceoverText || '').trim().split(/\s+/).filter(Boolean).length;
  const sceneSeconds = currentScene?.durationSeconds || 10;
  const wordsPerSec = (wordCount / sceneSeconds).toFixed(1);
  const isPacingOptimal = parseFloat(wordsPerSec) >= 1.6 && parseFloat(wordsPerSec) <= 2.4;

  if (!currentScene) {
    return (
      <div className="p-8 text-center text-stone-500">
        {isEn ? 'No scenes generated.' : 'Keine Szenen generiert.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Production Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-stone-100 border border-stone-300 px-2.5 py-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">Google Veo 3.1</span>
            <span className="text-stone-500 font-mono text-[11px]">({veoModel})</span>
          </div>

          {/* Mode Switcher: Scene Clips vs Full Master Video */}
          <div className="flex items-center bg-stone-100 p-0.5 border border-stone-300">
            <button
              onClick={() => {
                setViewMode('scene');
                setIsPlaying(false);
              }}
              className={`px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'scene'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-stone-600 hover:text-black'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                {isEn ? 'Scene Clips (5 Beats)' : 'Szenen-Clips (5 Beats)'}
              </span>
            </button>
            <button
              onClick={() => {
                setViewMode('full');
                setIsPlaying(false);
              }}
              className={`px-3 py-1 text-xs font-semibold transition-all ${
                viewMode === 'full'
                  ? 'bg-[#E50012] text-white shadow-sm'
                  : 'text-stone-600 hover:text-black'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                {isEn ? 'Full 60s Master Video' : 'Vollständiges 60s Master-Video'}
                {(storyboard.renderedVideoUrl || storyboard.videoUrl) && (
                  <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAllClips}
            disabled={isGeneratingAll || isRenderingMaster}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {isGeneratingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-stone-700" />
            )}
            {isEn ? 'Generate All Veo Clips' : 'Alle Veo Clips generieren'}
          </button>

          <button
            onClick={handleRenderFullVideo}
            disabled={isRenderingMaster || isGeneratingAll}
            className="px-3.5 py-1.5 bg-[#E50012] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isRenderingMaster ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Video className="w-3.5 h-3.5" />
            )}
            {isRenderingMaster
              ? (isEn ? 'Rendering 60s MP4...' : 'Rendere 60s MP4...')
              : (isEn ? 'Render Full 60s Video' : '60s Video rendern')}
          </button>

          {activeVideoUrl && (
            <button
              onClick={handleDownloadVideo}
              className="p-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 hover:text-black transition-colors"
              title={isEn ? 'Download 9:16 MP4' : '9:16 MP4 herunterladen'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Status or Error Notifications */}
      {statusMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 9:16 Mobile Phone Mockup & Video Player */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div
            data-testid="mobile-storyboard-frame"
            className="relative w-[290px] h-[515px] bg-black rounded-[38px] p-2.5 shadow-2xl border-4 border-stone-800 flex flex-col justify-between overflow-hidden"
          >
            {/* Top Speaker & Camera Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-stone-900 rounded-full z-30 flex items-center justify-center pointer-events-none">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-800" />
            </div>

            {/* REAL HTML5 VIDEO PLAYER (when video exists) */}
            {activeVideoUrl ? (
              <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  src={activeVideoUrl}
                  playsInline
                  loop={viewMode === 'scene'}
                  muted={isMuted}
                  onTimeUpdate={(e) => {
                    const target = e.currentTarget;
                    setCurrentTime(target.currentTime);
                    setDuration(target.duration || 0);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-cover"
                />

                {/* Big Center Play/Pause Overlay Button */}
                {!isPlaying && (
                  <button
                    onClick={handleTogglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-all transform hover:scale-105 z-20"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </button>
                )}

                {/* Video Controls Bar inside player */}
                <div className="absolute bottom-8 left-3 right-3 z-20 flex items-center justify-between text-white text-[10px] bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
                  <div className="flex items-center gap-2">
                    <button onClick={handleTogglePlay} className="hover:text-red-400">
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} className="hover:text-red-400">
                      {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <span className="font-mono">
                      {Math.floor(currentTime)}s / {Math.floor(duration || currentScene.durationSeconds)}s
                    </span>
                  </div>

                  <span className="bg-[#E50012] px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                    {viewMode === 'full' ? '60s Master' : `Scene ${currentScene.sceneIndex}`}
                  </span>
                </div>
              </div>
            ) : (
              /* High-Fidelity Editorial Preview State (before video generated) */
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black z-0">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                </div>

                {/* Top Status & Platform Badges */}
                <div className="relative z-10 pt-4 flex items-center justify-between text-[11px] text-white/80 px-2">
                  <span className="font-semibold bg-[#E50012] text-white px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                    NZZ Visual
                  </span>
                  <span className="text-stone-400 font-mono text-[10px]">{currentScene.timeRange}</span>
                </div>

                {/* Central On-Screen Dynamic Graphics */}
                <div className="relative z-10 px-3 my-auto text-center space-y-3">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/10 text-stone-200 border border-white/20">
                    {currentScene.sceneType}
                  </span>

                  <h3 className="text-lg font-bold text-white leading-tight font-serif">
                    {currentScene.onScreenHeadline}
                  </h3>

                  {currentScene.prominentMetric && (
                    <div className="inline-block bg-[#E50012] text-white font-mono text-3xl font-extrabold px-3 py-1.5 rounded-lg shadow-lg">
                      {currentScene.prominentMetric}
                    </div>
                  )}

                  {/* Generate Button in Center if no clip exists */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleGenerateSceneClip(activeSceneIndex)}
                      disabled={generatingSceneIndex === currentScene.sceneIndex}
                      className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                    >
                      {generatingSceneIndex === currentScene.sceneIndex ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Veo 3.1 Clip...</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 text-red-400" />
                          <span>Generate Veo 3.1 Clip</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Narration Subtitles */}
                <div className="relative z-10 space-y-2 bg-black/75 backdrop-blur-md p-3 rounded-2xl border border-white/10 mb-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold uppercase">
                    <Sparkles className="w-3 h-3" /> {isEn ? 'Voiceover Cue' : 'Sprecher-Einsatz'}
                  </div>
                  <p className="text-xs text-stone-200 leading-snug line-clamp-3">
                    «{currentScene.voiceoverText}»
                  </p>
                </div>
              </>
            )}

            {/* Timeline Scrubber Dots */}
            <div className="relative z-30 pt-1 pb-0.5 flex justify-center gap-1.5">
              {scenes.map((s, idx) => (
                <button
                  key={s.sceneIndex}
                  onClick={() => {
                    setActiveSceneIndex(idx);
                    if (viewMode === 'full') setViewMode('scene');
                    setIsPlaying(false);
                  }}
                  className={`h-1 rounded-full transition-all ${
                    activeSceneIndex === idx ? 'w-8 bg-[#E50012]' : 'w-2 bg-stone-700'
                  }`}
                  title={`Scene ${s.sceneIndex}: ${s.onScreenHeadline}`}
                />
              ))}
            </div>
          </div>

          {/* Quick Player Mode Indicator */}
          <div className="text-[11px] text-stone-500 font-mono mt-2 text-center">
            {viewMode === 'full' ? (
              <span className="text-red-600 font-semibold">
                ● Master Video Mode (60s with Audio & Overlays)
              </span>
            ) : (
              <span>
                ● Scene {currentScene.sceneIndex}/5 Clip Mode (
                {currentScene.videoUrl ? 'Veo 3.1 Video Ready' : 'Awaiting Generation'}
                )
              </span>
            )}
          </div>
        </div>

        {/* Scene Details & Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Navigation Toolbar */}
          <div className="flex items-center justify-between bg-[#fbfbfa] border border-stone-200 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black">
                {isEn
                  ? `Scene ${currentScene.sceneIndex} of ${scenes.length}: ${currentScene.sceneType.toUpperCase()}`
                  : `Szene ${currentScene.sceneIndex} von ${scenes.length}: ${currentScene.sceneType.toUpperCase()}`}
              </span>
              <span className="text-xs text-stone-500">({currentScene.durationSeconds}s)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                className="p-1.5 bg-white border border-stone-300 hover:border-black text-stone-700 hover:text-black transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTogglePlay}
                disabled={!activeVideoUrl}
                className="px-3 py-1.5 bg-[#E50012] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                {isPlaying ? (isEn ? 'Pause' : 'Pause') : (isEn ? 'Play Clip' : 'Clip abspielen')}
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 bg-white border border-stone-300 hover:border-black text-stone-700 hover:text-black transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scene Script & Visual Art Direction */}
          <div className="bg-[#fbfbfa] border border-stone-200 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 block">
                {isEn ? 'On-Screen Headline (Max 6 words)' : 'Bildschirm-Schlagzeile (Max. 6 Wörter)'}
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                {currentScene.onScreenHeadline.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <input
              type="text"
              value={currentScene.onScreenHeadline}
              onChange={(e) => {
                const updated = { ...currentScene, onScreenHeadline: e.target.value };
                const newScenes = [...scenes];
                newScenes[activeSceneIndex] = updated;
                const newSb = { ...storyboard, scenes: newScenes };
                setStoryboard(newSb);
                onUpdateScene?.(updated);
                onUpdateStoryboard?.(newSb);
              }}
              className="w-full bg-white border border-stone-300 px-3 py-2 text-sm text-black focus:outline-none focus:border-black"
            />

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                {isEn ? 'Prominent Metric Callout (optional)' : 'Hervorgehobene Kennzahl (optional)'}
              </label>
              <input
                type="text"
                value={currentScene.prominentMetric || ''}
                onChange={(e) => {
                  const updated = { ...currentScene, prominentMetric: e.target.value };
                  const newScenes = [...scenes];
                  newScenes[activeSceneIndex] = updated;
                  const newSb = { ...storyboard, scenes: newScenes };
                  setStoryboard(newSb);
                  onUpdateScene?.(updated);
                  onUpdateStoryboard?.(newSb);
                }}
                placeholder="e.g. 41.9%, CHF 4.2 Mrd."
                className="w-full bg-white border border-stone-300 px-3 py-2 text-sm text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-stone-700" />
                  {isEn
                    ? 'Google Veo 3.1 Visual Cinematography Prompt'
                    : 'Google Veo 3.1 Bildregie & Kamera-Prompt'}
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerateSceneClip(activeSceneIndex)}
                    disabled={generatingSceneIndex === currentScene.sceneIndex}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 px-1.5 py-0.5 border border-red-300 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {generatingSceneIndex === currentScene.sceneIndex ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {currentScene.videoUrl
                      ? (isEn ? 'Regenerate Veo Clip' : 'Veo Clip neu generieren')
                      : (isEn ? 'Generate Veo Clip' : 'Veo Clip generieren')}
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={currentScene.visualPrompt}
                onChange={(e) => {
                  const updated = { ...currentScene, visualPrompt: e.target.value };
                  const newScenes = [...scenes];
                  newScenes[activeSceneIndex] = updated;
                  const newSb = { ...storyboard, scenes: newScenes };
                  setStoryboard(newSb);
                  onUpdateScene?.(updated);
                  onUpdateStoryboard?.(newSb);
                }}
                className="w-full bg-white border border-stone-300 p-2.5 text-xs text-stone-800 font-mono focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 block">
                  {isEn ? 'Spoken Voiceover Script' : 'Gesprochenes Voiceover-Skript'}
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-stone-500">{wordCount} words</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold ${
                      isPacingOptimal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {wordsPerSec} w/s ({isPacingOptimal ? 'Optimal' : 'Check speed'})
                  </span>
                </div>
              </div>
              <textarea
                rows={2}
                value={currentScene.voiceoverText}
                onChange={(e) => {
                  const updated = { ...currentScene, voiceoverText: e.target.value };
                  const newScenes = [...scenes];
                  newScenes[activeSceneIndex] = updated;
                  const newSb = { ...storyboard, scenes: newScenes };
                  setStoryboard(newSb);
                  onUpdateScene?.(updated);
                  onUpdateStoryboard?.(newSb);
                }}
                className="w-full bg-white border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Platform Targets & Specs Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 border border-stone-200 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-500" />
              <span>{isEn ? 'Target Distribution:' : 'Ziel-Distribution:'}</span>
              <span className="font-bold text-black">TikTok, Instagram Reels, YouTube Shorts</span>
            </div>
            <div className="text-[11px] font-mono text-stone-500">
              1080x1920 (9:16) • H.264 / AAC • &lt;= 60s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
