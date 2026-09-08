import React, { useState, useEffect } from 'react';
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
  CarouselSlide,
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

  const [activeTab, setActiveTab] = useState<FormatTabId>('audio');
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.8-pro'>('gemini-3.8-flash');
  const [loading, setLoading] = useState<boolean>(false);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [publishedToast, setPublishedToast] = useState<boolean>(false);

  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);
  const [linterWarnings, setLinterWarnings] = useState<string[]>([]);

  // Audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioAudioElement, setAudioAudioElement] = useState<HTMLAudioElement | null>(null);

  // Load available articles on mount
  useEffect(() => {
    fetchArticles()
      .then((data) => {
        setArticles(data);
        if (data.length > 0) {
          // Default to the first article or Germany's welfare state
          const target = data.find((a) => a.id.includes('1886544')) || data[0];
          setSelectedArticleId(target.id);
        }
      })
      .catch((err) => console.error('Failed to load articles:', err));
  }, []);

  // Fetch article detail when selection changes
  useEffect(() => {
    if (!selectedArticleId) return;
    fetchArticleDetail(selectedArticleId)
      .then((detail) => setArticleDetail(detail))
      .catch((err) => console.error('Failed to load article detail:', err));
  }, [selectedArticleId]);

  // Compute available sections and filtered articles
  const sections: string[] = ['All', ...Array.from(new Set(articles.map((a) => a.section).filter((s): s is string => Boolean(s))))];

  const filteredArticles = articles.filter((art) => {
    const matchesSection = selectedSection === 'All' || art.section === selectedSection;
    const matchesSearch =
      !searchQuery ||
      art.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.lead && art.lead.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.author && art.author.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  });

  // Handle generation of all 6 formats
  const handleGenerate = async () => {
    if (!selectedArticleId) return;
    setLoading(true);
    try {
      const data = await generateLiquidFormats({
        articleId: selectedArticleId,
        headline: articleDetail?.headline,
        lead: articleDetail?.lead,
        body: articleDetail?.body,
        author: articleDetail?.author,
        section: articleDetail?.section,
        model,
        mock: true,
      });
      setDerivatives(data);

      // Perform initial NZZ style linting
      const report = await lintText({
        text: data.audioBrief.headline,
        isHeadline: true,
      });
      setLinterWarnings(report.warnings);
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synthesize Cloud TTS Audio
  const handleSynthesizeAudio = async () => {
    if (!derivatives?.audioBrief) return;
    setSynthesizing(true);
    try {
      const result = await synthesizeAudio({
        script: derivatives.audioBrief.script,
        author: articleDetail?.author,
        voiceName: derivatives.audioBrief.voiceProfile.voiceName,
        mock: true,
      });

      setDerivatives((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          audioBrief: {
            ...prev.audioBrief,
            audioUrl: result.audioUrl,
            estimatedDurationSeconds: result.durationSeconds,
            wordCount: result.wordCount,
          },
        };
      });
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // Toggle format approval
  const toggleApproval = (formatKey: keyof LiquidDerivativesPayload) => {
    setDerivatives((prev) => {
      if (!prev) return prev;
      const target = prev[formatKey] as any;
      if (!target || typeof target !== 'object' || !('approved' in target)) return prev;
      return {
        ...prev,
        [formatKey]: {
          ...target,
          approved: !target.approved,
        },
      };
    });
  };

  // Publish approved formats
  const handlePublish = async () => {
    if (!derivatives || !selectedArticleId) return;
    try {
      await publishFormats({
        articleId: selectedArticleId,
        payload: derivatives,
      });
      setPublishedToast(true);
      setTimeout(() => setPublishedToast(false), 3000);
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
      {/* Top Banner: Article Ingestion & Generation Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                Liquid Story Engine
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                Powered by Google Gemini 3.8
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Multimodal Derivative Cockpit
            </h1>
            <p className="text-xs text-slate-400">
              Transform static reporting into 6 liquid formats adhering to the strict NZZ Voice Invariant.
            </p>
          </div>

          {/* Model Selection & Action Controls */}
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
              onClick={handleGenerate}
              disabled={loading || !selectedArticleId}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-red-950/40 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Synthesizing 6 Formats...' : 'Generate Derivatives'}
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

        {/* Article Ingestion Search & Dropdown */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                NZZ Article Corpus
              </span>
              <span className="text-[10px] bg-red-600/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30 font-mono">
                {filteredArticles.length} / {articles.length} Articles Available
              </span>
            </div>

            {/* Rubric / Section Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {sections.slice(0, 7).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                    selectedSection === sec
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 space-y-2">
              {/* Keyword Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter articles by title, keyword, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Source Article Dropdown */}
              <select
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                {filteredArticles.map((art) => (
                  <option key={art.id} value={art.id}>
                    [{art.section || 'NZZ'}] {art.headline} ({art.wordCount} words)
                  </option>
                ))}
              </select>
            </div>

            {articleDetail && (
              <div className="md:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5 truncate pr-4">
                  <span className="text-slate-400 font-medium">Byline: </span>
                  <span className="text-slate-200 font-semibold">{articleDetail.author || 'NZZ Redaktion'}</span>
                  <p className="text-slate-400 truncate">{articleDetail.lead}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {articleDetail.wordCount} words · ~{Math.round(articleDetail.wordCount / 200)} min read
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Voice Invariant Active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Published Toast Alert */}
      {publishedToast && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-xl">
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

      {/* Linter Warnings Alert */}
      {linterWarnings.length > 0 && (
        <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>NZZ Style Notice: {linterWarnings.join(' · ')}</span>
        </div>
      )}

      {/* Main Multi-Tab Derivative Workspace */}
      {derivatives ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <FormatTabs
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            derivatives={derivatives}
          />

          <div className="p-6">
            {/* TAB 1: 60-Second Commuter Audio Brief */}
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
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      {synthesizing ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {synthesizing ? 'Synthesizing...' : 'Synthesize Cloud TTS'}
                    </button>

                    {derivatives.audioBrief.audioUrl && (
                      <button
                        onClick={togglePlayAudio}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        {isPlayingAudio ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        {isPlayingAudio ? 'Pause Audio' : 'Play Audio (60s)'}
                      </button>
                    )}

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BudgetBar
                    current={derivatives.audioBrief.wordCount}
                    min={120}
                    max={150}
                    unit="words"
                    label="Word Budget (140 WPM broadcast pace)"
                  />
                  <BudgetBar
                    current={derivatives.audioBrief.estimatedDurationSeconds}
                    min={55}
                    max={65}
                    unit="seconds"
                    label="Estimated Broadcast Duration"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Audio Script (Spoken Text)
                    </label>
                    <textarea
                      rows={5}
                      value={derivatives.audioBrief.script}
                      onChange={(e) => {
                        const newScript = e.target.value;
                        const words = newScript.trim().split(/\s+/).length;
                        setDerivatives({
                          ...derivatives,
                          audioBrief: {
                            ...derivatives.audioBrief,
                            script: newScript,
                            wordCount: words,
                            estimatedDurationSeconds: Math.round(words / 2.33),
                          },
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Google Cloud SSML (Speech Synthesis Markup Language)
                    </label>
                    <textarea
                      rows={3}
                      readOnly
                      value={derivatives.audioBrief.ssml}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 font-mono leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Executive 3-Bullet Newsletter */}
            {activeTab === 'newsletter' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Executive 3-Bullet Intelligence Brief
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ultra-dense macro and structural takeaways designed for morning executive reading.
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
                  min={50}
                  max={90}
                  unit="words"
                  label="Executive Word Budget (<90 words)"
                />

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Subhead (Noun/Adjective phrase without finite verbs)
                    </label>
                    <input
                      type="text"
                      value={derivatives.executiveNewsletter.subhead}
                      onChange={(e) =>
                        setDerivatives({
                          ...derivatives,
                          executiveNewsletter: {
                            ...derivatives.executiveNewsletter,
                            subhead: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-slate-400 block">
                      Exactly 3 Structural Bullets
                    </label>
                    {derivatives.executiveNewsletter.bullets.map((bullet, idx) => {
                      const labels = [
                        'Bullet 1: The Core Quantified Shift',
                        'Bullet 2: The Structural Mechanism',
                        'Bullet 3: Forward Strategic Risk',
                      ];
                      return (
                        <div key={idx} className="space-y-1">
                          <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                            {labels[idx]}
                          </span>
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...derivatives.executiveNewsletter.bullets] as [
                                string,
                                string,
                                string
                              ];
                              newBullets[idx] = e.target.value;
                              setDerivatives({
                                ...derivatives,
                                executiveNewsletter: {
                                  ...derivatives.executiveNewsletter,
                                  bullets: newBullets,
                                },
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-red-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 60s Vertical Video Storyboard */}
            {activeTab === 'video' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      60-Second Vertical Video Storyboard (9:16)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Engineered for TikTok, Reels & Shorts with Google Veo 2 B-roll prompts.
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

                <StoryboardPreview
                  storyboard={derivatives.socialStoryboard}
                  onUpdateScene={(updatedScene: VideoScene) => {
                    const newScenes = derivatives.socialStoryboard.scenes.map((s) =>
                      s.sceneIndex === updatedScene.sceneIndex ? updatedScene : s
                    );
                    setDerivatives({
                      ...derivatives,
                      socialStoryboard: {
                        ...derivatives.socialStoryboard,
                        scenes: newScenes,
                      },
                    });
                  }}
                />
              </div>
            )}

            {/* TAB 4: Instagram / LinkedIn Carousel */}
            {activeTab === 'carousel' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Instagram & LinkedIn 6-Slide Carousel
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visual swipe deck with Google Imagen 3 background prompts and ready-to-post copy.
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
                  onUpdateSlide={(updatedSlide: CarouselSlide) => {
                    const newSlides = derivatives.instagramCarousel.slides.map((s) =>
                      s.slideNumber === updatedSlide.slideNumber ? updatedSlide : s
                    );
                    setDerivatives({
                      ...derivatives,
                      instagramCarousel: {
                        ...derivatives.instagramCarousel,
                        slides: newSlides,
                      },
                    });
                  }}
                  onUpdateCaption={(caption: string) => {
                    setDerivatives({
                      ...derivatives,
                      instagramCarousel: {
                        ...derivatives.instagramCarousel,
                        captionText: caption,
                      },
                    });
                  }}
                />
              </div>
            )}

            {/* TAB 5: Fact Box Key Metrics */}
            {activeTab === 'factbox' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Key Metrics Fact Box (NZZ Dossier)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      High-density numerical facts with baseline comparison and source notes.
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
                  {derivatives.factBox.metrics.map((metric, idx) => (
                    <div
                      key={metric.id || idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <input
                        type="text"
                        value={metric.metricName}
                        onChange={(e) => {
                          const newMetrics = [...derivatives.factBox.metrics];
                          newMetrics[idx].metricName = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            factBox: { ...derivatives.factBox, metrics: newMetrics },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-semibold"
                      />
                      <input
                        type="text"
                        value={metric.value}
                        onChange={(e) => {
                          const newMetrics = [...derivatives.factBox.metrics];
                          newMetrics[idx].value = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            factBox: { ...derivatives.factBox, metrics: newMetrics },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xl font-bold font-mono text-red-500"
                      />
                      <input
                        type="text"
                        value={metric.contextNote}
                        onChange={(e) => {
                          const newMetrics = [...derivatives.factBox.metrics];
                          newMetrics[idx].contextNote = e.target.value;
                          setDerivatives({
                            ...derivatives,
                            factBox: { ...derivatives.factBox, metrics: newMetrics },
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-400"
                      />
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
          <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">No Liquid Derivatives Generated Yet</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select an article from the dropdown above and click &quot;Generate Derivatives&quot; to synthesize audio briefs, 3-bullet newsletters, 60s video storyboards, and carousels.
          </p>
        </div>
      )}
    </div>
  );
};
