import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  Share2,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  Bot,
  Search,
  LayoutGrid,
  List,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react';
import { FormatTabs, FormatTabId } from './FormatTabs';
import { BudgetBar } from './BudgetBar';
import { StoryboardPreview } from './StoryboardPreview';
import { CarouselPreview } from './CarouselPreview';
import type {
  ArticleSummary,
  ArticleDetail,
  LiquidDerivativesPayload,
  VideoScene,
} from '../../types/liquid';
import {
  fetchArticles,
  fetchArticleDetail,
  generateLiquidFormats,
  synthesizeAudio,
  publishFormats,
  lintText,
} from '../../services/liquidApi';

export const LiquidCockpit: React.FC = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [articleDetail, setArticleDetail] = useState<ArticleDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const [activeTab, setActiveTab] = useState<FormatTabId>('video');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.8-pro'>('gemini-3.8-flash');
  const [loading, setLoading] = useState<boolean>(false);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [publishedToast, setPublishedToast] = useState<boolean>(false);

  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);
  const [linterWarnings, setLinterWarnings] = useState<string[]>([]);

  // Audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioAudioElement, setAudioAudioElement] = useState<HTMLAudioElement | null>(null);

  // Auto-generate function
  const triggerGeneration = useCallback(
    async (artId: string, detail?: ArticleDetail | null) => {
      if (!artId) return;
      setLoading(true);
      try {
        const data = await generateLiquidFormats({
          articleId: artId,
          headline: detail?.headline,
          lead: detail?.lead,
          body: detail?.body,
          author: detail?.author,
          section: detail?.section,
          model,
        });
        setDerivatives(data);

        // Run linter on headline and subhead
        if (data.executiveNewsletter) {
          const l1 = await lintText({ text: data.executiveNewsletter.headline, isHeadline: true });
          const l2 = await lintText({ text: data.executiveNewsletter.subhead, isSubhead: true });
          setLinterWarnings([...l1.warnings, ...l2.warnings]);
        }
      } catch (err) {
        console.error('Generation failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [model]
  );

  // Load available articles on mount
  useEffect(() => {
    fetchArticles()
      .then((data) => {
        setArticles(data);
        if (data.length > 0) {
          const target = data.find((a) => a.id.includes('1886544')) || data[0];
          setSelectedArticleId(target.id);
          fetchArticleDetail(target.id).then((detail) => {
            setArticleDetail(detail);
            triggerGeneration(target.id, detail);
          });
        }
      })
      .catch((err) => console.error('Failed to load articles:', err));
  }, [triggerGeneration]);

  // Fetch article detail when selection changes
  const handleSelectArticle = async (artId: string) => {
    setSelectedArticleId(artId);
    try {
      const detail = await fetchArticleDetail(artId);
      setArticleDetail(detail);
      triggerGeneration(artId, detail);
    } catch (err) {
      console.error('Failed to switch article:', err);
    }
  };

  // Compute available sections and filtered articles
  const sections: string[] = [
    'All',
    ...Array.from(new Set(articles.map((a) => a.section).filter((s): s is string => Boolean(s)))),
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesSection = selectedSection === 'All' || art.section === selectedSection;
    const matchesSearch =
      !searchQuery ||
      art.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.lead && art.lead.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.author && art.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  const getSectionBadgeClass = (section?: string) => {
    const s = (section || '').toLowerCase();
    if (s.includes('wirt') || s.includes('finanz')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (s.includes('tech')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    if (s.includes('inter')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (s.includes('wiss')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (s.includes('sport')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (s.includes('feuill') || s.includes('kultur')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Approval toggles
  const toggleApproval = (formatKey: keyof LiquidDerivativesPayload) => {
    if (!derivatives) return;
    const target = derivatives[formatKey] as any;
    if (target && typeof target.approved === 'boolean') {
      target.approved = !target.approved;
      setDerivatives({ ...derivatives });
    }
  };

  // Handle synthesize audio
  const handleSynthesizeAudio = async () => {
    if (!derivatives?.audioBrief) return;
    setSynthesizing(true);
    try {
      const res = await synthesizeAudio({
        script: derivatives.audioBrief.script,
        author: articleDetail?.author,
      });
      setDerivatives({
        ...derivatives,
        audioBrief: {
          ...derivatives.audioBrief,
          audioUrl: res.audioUrl,
          estimatedDurationSeconds: res.durationSeconds,
        },
      });
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!selectedArticleId || !derivatives) return;
    try {
      await publishFormats({
        articleId: selectedArticleId,
        payload: derivatives,
      });
      setPublishedToast(true);
      setTimeout(() => setPublishedToast(false), 3500);
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  const togglePlayAudio = () => {
    if (!derivatives?.audioBrief?.audioUrl) return;
    if (isPlayingAudio) {
      audioAudioElement?.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(derivatives.audioBrief.audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play().catch(() => {});
      setAudioAudioElement(audio);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MODEL CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                Liquid Story Engine
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                Google Gemini 3.8 & Veo 2
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Multimodal Editorial Cockpit
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Transform static reporting into 6 liquid derivatives (60s Vertical Video, Commuter Audio, 3-Bullet Newsletter, Instagram Carousel, Fact Box, Dialectical FAQ) adhering to the strict NZZ Voice Invariant.
            </p>
          </div>

          {/* Model Switcher & CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setModel('gemini-3.8-flash')}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  model === 'gemini-3.8-flash'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini 3.8 Flash (Fast)
              </button>
              <button
                onClick={() => setModel('gemini-3.8-pro')}
                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
                  model === 'gemini-3.8-pro'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini 3.8 Pro (Deep)
              </button>
            </div>

            <button
              onClick={() => triggerGeneration(selectedArticleId, articleDetail)}
              disabled={loading || !selectedArticleId}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Synthesizing Formats...' : 'Regenerate Derivatives'}
            </button>

            {derivatives && (
              <button
                onClick={handlePublish}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Publish Approved Formats
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. NZZ ARTICLE CORPUS & SELECTION GALLERY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Gallery Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              NZZ Article Corpus
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
              {filteredArticles.length} of {articles.length} Ingested
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded text-xs transition-all ${
                  viewMode === 'compact' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dropdown List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search headline, author, lead..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Rubric Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedSection === sec
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* View Mode 1: Visual Cards Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredArticles.map((art) => {
              const isSelected = selectedArticleId === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => handleSelectArticle(art.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-3 ${
                    isSelected
                      ? 'bg-red-950/20 border-red-500/80 ring-1 ring-red-500/50 shadow-lg shadow-red-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getSectionBadgeClass(
                          art.section
                        )}`}
                      >
                        {art.section || 'NZZ'}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        ~{Math.round((art.wordCount || 1000) / 200)} min ({art.wordCount || 1000}w)
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {art.headline}
                    </h3>

                    {art.lead && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {art.lead}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5 truncate max-w-[170px]">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-slate-300 font-medium truncate">{art.author || 'NZZ Redaktion'}</span>
                    </span>

                    <span
                      className={`font-semibold flex items-center gap-1 text-[11px] ${
                        isSelected ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Active' : 'Select'}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode 2: Compact Dropdown */}
        {viewMode === 'compact' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
            <div className="md:col-span-8">
              <select
                value={selectedArticleId}
                onChange={(e) => handleSelectArticle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                {filteredArticles.map((art) => (
                  <option key={art.id} value={art.id}>
                    [{art.section || 'NZZ'}] {art.headline} ({art.wordCount} words)
                  </option>
                ))}
              </select>
            </div>
            {articleDetail && (
              <div className="md:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs">
                <span className="text-slate-400">Byline: </span>
                <span className="text-white font-medium">{articleDetail.author || 'NZZ Redaktion'}</span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  {articleDetail.wordCount} words · ~{Math.round(articleDetail.wordCount / 200)} min read
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. ACTIVE ARTICLE SPOTLIGHT CARD */}
      {articleDetail && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">
                Active Source Story
              </span>
              <span className="text-xs text-slate-400">
                By {articleDetail.author || 'NZZ Redaktion'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {articleDetail.headline}
            </h2>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-3xl">
              {articleDetail.lead}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-mono text-slate-300 block">
                {articleDetail.wordCount} Words
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                Voice Invariant Enforced
              </span>
            </div>
            <button
              onClick={() => triggerGeneration(selectedArticleId, articleDetail)}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Synthesize
            </button>
          </div>
        </div>
      )}

      {/* 4. TOAST ALERTS & LINTER FEEDBACK */}
      {publishedToast && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Liquid formats successfully published to the Dynamic Reader Experience!
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 underline cursor-pointer">
            View Reader Mode
          </span>
        </div>
      )}

      {linterWarnings.length > 0 && (
        <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>NZZ Style Notice: {linterWarnings.join(' · ')}</span>
        </div>
      )}

      {/* 5. MULTI-TAB DERIVATIVE WORKSPACE */}
      {derivatives ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <FormatTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            derivatives={derivatives}
          />

          <div className="p-6">
            {/* TAB 1: 60-Second Vertical Video Storyboard */}
            {activeTab === 'video' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      60-Second Vertical Video (TikTok, Reels, Shorts)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target 60 seconds (5 structured scenes) with Google Veo 2 / Imagen 3 visual prompts, motion canvas, and metric callouts.
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval('socialStoryboard')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      derivatives.socialStoryboard.approved
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {derivatives.socialStoryboard.approved ? '✓ Approved' : 'Approve Format'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 flex justify-center">
                    <StoryboardPreview
                      storyboard={derivatives.socialStoryboard}
                    />
                  </div>

                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        5 Scene Breakdown (60s Duration)
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Veo 2 Prompt Pipeline
                      </span>
                    </div>

                    <div className="space-y-3">
                      {derivatives.socialStoryboard.scenes.map((scene: VideoScene, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 font-mono text-xs flex items-center justify-center font-bold">
                                {scene.sceneIndex}
                              </span>
                              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                                {scene.sceneType.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {scene.timeRange} ({scene.durationSeconds}s)
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block">
                              On-Screen Headline
                            </label>
                            <input
                              type="text"
                              value={scene.onScreenHeadline}
                              onChange={(e) => {
                                const newScenes = [...derivatives.socialStoryboard.scenes];
                                newScenes[idx].onScreenHeadline = e.target.value;
                                setDerivatives({
                                  ...derivatives,
                                  socialStoryboard: {
                                    ...derivatives.socialStoryboard,
                                    scenes: newScenes,
                                  },
                                });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>

                          {scene.prominentMetric && (
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-red-400 block">
                                Prominent Metric Callout
                              </label>
                              <input
                                type="text"
                                value={scene.prominentMetric}
                                onChange={(e) => {
                                  const newScenes = [...derivatives.socialStoryboard.scenes];
                                  newScenes[idx].prominentMetric = e.target.value;
                                  setDerivatives({
                                    ...derivatives,
                                    socialStoryboard: {
                                      ...derivatives.socialStoryboard,
                                      scenes: newScenes,
                                    },
                                  });
                                }}
                                className="w-36 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold text-red-400"
                              />
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-400 block">
                              Voiceover Script
                            </label>
                            <textarea
                              rows={2}
                              value={scene.voiceoverText}
                              onChange={(e) => {
                                const newScenes = [...derivatives.socialStoryboard.scenes];
                                newScenes[idx].voiceoverText = e.target.value;
                                setDerivatives({
                                  ...derivatives,
                                  socialStoryboard: {
                                    ...derivatives.socialStoryboard,
                                    scenes: newScenes,
                                  },
                                });
                              }}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 60-Second Commuter Audio Brief */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-red-500" />
                      60-Second Commuter Audio Brief
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Target 55–65 seconds (130–150 words @ 140 WPM) with natural SSML breath pauses.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSynthesizeAudio}
                      disabled={synthesizing}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-red-400" />
                      {synthesizing ? 'Synthesizing Audio...' : 'Generate Cloud TTS'}
                    </button>

                    <button
                      onClick={() => toggleApproval('audioBrief')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        derivatives.audioBrief.approved
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {derivatives.audioBrief.approved ? '✓ Approved' : 'Approve Format'}
                    </button>
                  </div>
                </div>

                <BudgetBar
                  current={derivatives.audioBrief.wordCount}
                  min={130}
                  max={150}
                  unit="words"
                  label="Audio Brief Budget"
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-4">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Broadcast Script (130–150 words)
                    </label>
                    <textarea
                      rows={6}
                      value={derivatives.audioBrief.script}
                      onChange={(e) => {
                        const newScript = e.target.value;
                        const words = newScript.trim().split(/\s+/).filter(Boolean).length;
                        setDerivatives({
                          ...derivatives,
                          audioBrief: {
                            ...derivatives.audioBrief,
                            script: newScript,
                            wordCount: words,
                            estimatedDurationSeconds: Math.round((words / 140) * 60),
                          },
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-red-500 font-serif"
                    />

                    {derivatives.audioBrief.audioUrl && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={togglePlayAudio}
                            className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow"
                          >
                            {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Synthesized Audio Stream
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Neural2-B (Sober NZZ Anchor Voice) · {derivatives.audioBrief.estimatedDurationSeconds}s
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
                      Acoustic Parameters
                    </h4>
                    <div className="space-y-2 text-slate-400">
                      <div className="flex justify-between">
                        <span>Pacing:</span>
                        <span className="font-mono text-slate-200">140 WPM (Analytical)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voice Model:</span>
                        <span className="font-mono text-slate-200">de-DE-Neural2-B</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Swiss Phonetics:</span>
                        <span className="font-mono text-emerald-400">Enforced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Executive 3-Bullet Newsletter */}
            {activeTab === 'newsletter' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Executive 3-Bullet Newsletter
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Exactly 3 analytical bullets (&lt;45 words total). Subhead strictly without finite verbs.
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval('executiveNewsletter')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      derivatives.executiveNewsletter.approved
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {derivatives.executiveNewsletter.approved ? '✓ Approved' : 'Approve Format'}
                  </button>
                </div>

                <BudgetBar
                  current={derivatives.executiveNewsletter.wordCount}
                  min={30}
                  max={45}
                  unit="words"
                  label="Newsletter Word Budget"
                />

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      Subhead (Verb-Free Nominal Style)
                    </label>
                    <input
                      type="text"
                      value={derivatives.executiveNewsletter.subhead}
                      onChange={(e) => {
                        setDerivatives({
                          ...derivatives,
                          executiveNewsletter: {
                            ...derivatives.executiveNewsletter,
                            subhead: e.target.value,
                          },
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs font-medium text-slate-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      3 Executive Bullets
                    </label>
                    {derivatives.executiveNewsletter.bullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...derivatives.executiveNewsletter.bullets];
                            newBullets[idx] = e.target.value;
                            setDerivatives({
                              ...derivatives,
                              executiveNewsletter: {
                                ...derivatives.executiveNewsletter,
                                bullets: [newBullets[0] || '', newBullets[1] || '', newBullets[2] || ''],
                              },
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Instagram Carousel Deck */}
            {activeTab === 'carousel' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      Instagram & LinkedIn Carousel Deck (4:5 Ratio)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      6 structured slides with Google Imagen 3 art directions and copyable caption.
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval('instagramCarousel')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      derivatives.instagramCarousel.approved
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {derivatives.instagramCarousel.approved ? '✓ Approved' : 'Approve Format'}
                  </button>
                </div>

                <CarouselPreview
                  carousel={derivatives.instagramCarousel}
                />
              </div>
            )}

            {/* TAB 5: Fact Box Strip */}
            {activeTab === 'factbox' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Key Metrics Fact Box (Wirtschafts-Indikatoren)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      High-impact verified data points with deltas and directional context.
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval('factBox')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      derivatives.factBox.approved
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {derivatives.factBox.approved ? '✓ Approved' : 'Approve Format'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {derivatives.factBox.metrics.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <input
                        type="text"
                        value={m.metricName}
                        onChange={(e) => {
                          const newM = [...derivatives.factBox.metrics];
                          newM[idx].metricName = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            factBox: { ...derivatives.factBox, metrics: newM },
                          });
                        }}
                        className="w-full bg-transparent border-none text-xs font-semibold text-slate-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={m.value}
                        onChange={(e) => {
                          const newM = [...derivatives.factBox.metrics];
                          newM[idx].value = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            factBox: { ...derivatives.factBox, metrics: newM },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-2xl font-bold font-mono text-white"
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-mono font-medium">{m.delta}</span>
                        <span className="text-slate-400">{m.contextNote}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: Dialectical FAQ Deep Dive */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Dialectical FAQ (Kontroverse & Einordnung)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rigorous counter-arguments and economic debate trade-offs.
                    </p>
                  </div>

                  <button
                    onClick={() => toggleApproval('dialecticalFaq')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      derivatives.dialecticalFaq.approved
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {derivatives.dialecticalFaq.approved ? '✓ Approved' : 'Approve Format'}
                  </button>
                </div>

                <div className="space-y-4">
                  {derivatives.dialecticalFaq.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">
                          {item.perspective.replace('_', ' ')}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const newItems = [...derivatives.dialecticalFaq.items];
                          newItems[idx].question = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            dialecticalFaq: { ...derivatives.dialecticalFaq, items: newItems },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs font-semibold text-white"
                      />
                      <textarea
                        rows={3}
                        value={item.answer}
                        onChange={(e) => {
                          const newItems = [...derivatives.dialecticalFaq.items];
                          newItems[idx].answer = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            dialecticalFaq: { ...derivatives.dialecticalFaq, items: newItems },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-300 leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
          <h2 className="text-base font-bold text-white">Synthesizing Liquid Derivatives...</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Extracting core angles, drafting audio briefs, and generating 60s video storyboard scenes for the selected article.
          </p>
        </div>
      )}
    </div>
  );
};
