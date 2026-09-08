import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Headphones,
  Video,
  FileText,
  Clock,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ArticleDetail, LiquidDerivativesPayload } from '../../types/liquid';
import { fetchArticleDetail, generateLiquidFormats } from '../../services/liquidApi';
import { CarouselPreview } from './CarouselPreview';
import { StoryboardPreview } from './StoryboardPreview';
import { AudioBriefPlayer } from '../reader/AudioBriefPlayer';
import { GenerationProgressBar } from './GenerationProgressBar';

interface ArticleStudioProps {
  articleId: string;
  language: 'en' | 'de';
  onBack: () => void;
}

type ActiveArtifactType = 'carousel' | 'audio' | 'video' | 'newsletter' | null;

export const ArticleStudio: React.FC<ArticleStudioProps> = ({
  articleId,
  language,
  onBack,
}) => {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [showFullBody, setShowFullBody] = useState(false);

  // Derivative formats (only generated when user prompts)
  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFormatName, setGeneratingFormatName] = useState<string>('Instagram Carousel');
  const [activeArtifact, setActiveArtifact] = useState<ActiveArtifactType>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Load article metadata on mount or language switch
  useEffect(() => {
    let isMounted = true;
    setLoadingArticle(true);
    fetchArticleDetail(articleId, language)
      .then((data) => {
        if (isMounted) {
          setArticle(data);
          setLoadingArticle(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load article detail:', err);
        if (isMounted) setLoadingArticle(false);
      });

    return () => {
      isMounted = false;
    };
  }, [articleId, language]);

  const handleGenerateArtifact = async (artifactType: 'carousel' | 'audio' | 'video' | 'newsletter') => {
    const formatLabels: Record<string, string> = {
      carousel: language === 'de' ? 'Instagram Karussell (Stil A)' : 'Instagram Carousel (Style A)',
      audio: language === 'de' ? 'Audio-Briefing (60s)' : 'Audio Brief (60s)',
      video: language === 'de' ? 'Vertikales Video-Storyboard' : 'Vertical Video Storyboard',
      newsletter: language === 'de' ? 'Executive Brief & Fact Box' : 'Executive Brief & Fact Box',
    };

    setGeneratingFormatName(formatLabels[artifactType]);
    setIsGenerating(true);
    setActiveArtifact(artifactType);

    try {
      const result = await generateLiquidFormats({
        articleId,
        headline: article?.headline,
        lead: article?.lead,
        body: article?.body,
        author: article?.author,
        section: article?.section,
        language,
        model: 'gemini-2.5-flash',
      });

      setDerivatives(result);
      if (result.detectedCategory || result.suggestedTags) {
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                category: result.detectedCategory || prev.category,
                tags: result.suggestedTags || prev.tags,
              }
            : null
        );
      }
    } catch (err: any) {
      console.error('Failed to generate artifact:', err);
      setGenError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingArticle) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-stone-400">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <span className="font-serif italic text-stone-300">
          {language === 'de' ? 'Artikel wird geladen...' : 'Loading article dossier...'}
        </span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-stone-400 font-serif">
          {language === 'de' ? 'Artikel konnte nicht geladen werden.' : 'Article could not be found.'}
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-stone-800 text-stone-200 rounded-lg text-sm hover:bg-stone-700"
        >
          {language === 'de' ? '← Zurück zur Übersicht' : '← Back to Articles'}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Section Bar */}
      <div className="flex items-center justify-between border-b border-stone-800/80 pb-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-medium text-stone-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{language === 'de' ? 'Zurück zu allen Artikeln' : 'Back to Articles'}</span>
        </button>

        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded bg-stone-800/80 text-stone-300 font-medium uppercase tracking-wider">
            {article.category || article.section}
          </span>
          {article.tags && article.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {article.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="font-mono text-[10px] text-stone-500">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}
          <span className="text-stone-500 font-mono uppercase">
            {language === 'de' ? 'Deutsch' : 'English'}
          </span>
        </div>
      </div>

      {/* Article Editorial Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-red-500" />
            <span className="text-stone-300 font-medium">{article.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>2025-05-29</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>{Math.round((article.wordCount || 1200) / 200)} min read ({article.wordCount} words)</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight text-white leading-[1.18]">
          {article.headline}
        </h1>

        {article.lead && (
          <p className="text-lg text-stone-300 font-serif leading-relaxed border-l-2 border-red-600 pl-4 py-1 italic bg-stone-900/30 rounded-r-lg">
            {article.lead}
          </p>
        )}

        {/* Optional Collapsible Body Preview */}
        {article.body && article.body !== article.lead && (
          <div className="pt-2">
            <button
              onClick={() => setShowFullBody(!showFullBody)}
              className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1.5 transition-colors font-mono"
            >
              <span>{showFullBody ? (language === 'de' ? 'Text einklappen' : 'Hide full text') : (language === 'de' ? 'Vollständigen Artikeltext anzeigen' : 'Read source article text')}</span>
              {showFullBody ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullBody && (
              <div className="mt-3 p-5 bg-stone-900/60 border border-stone-800/80 rounded-xl text-stone-300 text-sm leading-relaxed max-h-72 overflow-y-auto font-serif space-y-3">
                {article.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prominent Action Bar: Generate Media Artifacts */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>
                {language === 'de'
                  ? 'In Liquid Media-Formate transformieren'
                  : 'Synthesize Liquid Media Artifacts'}
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {language === 'de'
                ? 'Wählen Sie ein Format, um die multimodale Generierung zu starten.'
                : 'Select an artifact to trigger on-demand AI generation in NZZ editorial standard.'}
            </p>
          </div>
        </div>

        {/* Real-time Error Feedback */}
        {genError && (
          <div className="mb-4 p-4 rounded-xl bg-red-950/80 border border-red-800 text-sm text-red-200">
            <div className="font-semibold text-red-400 mb-1">
              {language === 'de' ? 'Fehler bei der Modellgenerierung:' : 'Model Generation Error:'}
            </div>
            <div className="font-mono text-xs break-words">{genError}</div>
          </div>
        )}

        {/* Real-time Model Provenance & Source Badge */}
        {derivatives && (
          <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs">
            <span className="font-sans font-medium text-stone-400">Source:</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold ${
              derivatives.source === 'vertex-ai'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : derivatives.source === 'template'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-blue-950 text-blue-400 border border-blue-800'
            }`}>
              {derivatives.source === 'vertex-ai' ? '● Live Vertex AI' : (derivatives.source || 'vertex-ai')}
            </span>
            <span className="text-stone-600 font-mono">|</span>
            <span className="text-stone-400 font-mono">Model: {derivatives.model || 'gemini-2.5-flash'}</span>
            {derivatives.elapsedMs && (
              <>
                <span className="text-stone-600 font-mono">|</span>
                <span className="text-stone-400 font-mono">Latency: {derivatives.elapsedMs}ms</span>
              </>
            )}
          </div>
        )}

        {/* 4 Dedicated Generation Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Button 1: Instagram Carousel (Style A) */}
          <button
            onClick={() => handleGenerateArtifact('carousel')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeArtifact === 'carousel'
                ? 'bg-red-950/40 border-red-600/80 ring-1 ring-red-600/50 shadow-lg'
                : 'bg-stone-950/80 hover:bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/20">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                4:5 Deck
              </span>
            </div>
            <div>
              <div className="font-semibold text-stone-100 text-sm">
                {language === 'de' ? 'Instagram Karussell' : 'Instagram Carousel'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-serif">
                {language === 'de' ? 'Stil A (Schweizer Prestige, 6 Folien)' : 'Style A (Swiss Prestige, 6 Slides)'}
              </div>
            </div>
          </button>

          {/* Button 2: Audio Brief (Google Cloud TTS) */}
          <button
            onClick={() => handleGenerateArtifact('audio')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeArtifact === 'audio'
                ? 'bg-red-950/40 border-red-600/80 ring-1 ring-red-600/50 shadow-lg'
                : 'bg-stone-950/80 hover:bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/20">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                60s Cloud TTS
              </span>
            </div>
            <div>
              <div className="font-semibold text-stone-100 text-sm">
                {language === 'de' ? 'Audio-Briefing' : 'Commuter Audio Brief'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-serif">
                {language === 'de' ? 'Natürliche Sprachausgabe (60s)' : '140 Words, Studio Cadence'}
              </div>
            </div>
          </button>

          {/* Button 3: Vertical Video Storyboard */}
          <button
            onClick={() => handleGenerateArtifact('video')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeArtifact === 'video'
                ? 'bg-red-950/40 border-red-600/80 ring-1 ring-red-600/50 shadow-lg'
                : 'bg-stone-950/80 hover:bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/20">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                9:16 Video
              </span>
            </div>
            <div>
              <div className="font-semibold text-stone-100 text-sm">
                {language === 'de' ? 'Vertikales Video' : 'Vertical Video'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-serif">
                {language === 'de' ? '5 Szenen für TikTok/Reels' : '5-Scene Storyboard for Reels'}
              </div>
            </div>
          </button>

          {/* Button 4: Executive Brief & Fact Box */}
          <button
            onClick={() => handleGenerateArtifact('newsletter')}
            disabled={isGenerating}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeArtifact === 'newsletter'
                ? 'bg-red-950/40 border-red-600/80 ring-1 ring-red-600/50 shadow-lg'
                : 'bg-stone-950/80 hover:bg-stone-900/80 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-600/10 text-red-500 border border-red-600/20">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                Newsletter
              </span>
            </div>
            <div>
              <div className="font-semibold text-stone-100 text-sm">
                {language === 'de' ? 'Executive Brief' : 'Executive Brief'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5 font-serif">
                {language === 'de' ? '3 Thesen & Faktenleiste' : '3 Key Bullets & Fact Metrics'}
              </div>
            </div>
          </button>
        </div>

        {/* Real-time Generation Progress Bar */}
        <GenerationProgressBar
          isLoading={isGenerating}
          formatName={generatingFormatName}
        />
      </div>

      {/* Render Active Generated Artifact */}
      {derivatives && !isGenerating && (
        <div className="bg-stone-950 border border-stone-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl animate-fade-in">
          {/* Header of the Display Area */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-800">
            <div>
              <div className="text-xs uppercase font-mono tracking-widest text-red-500">
                {language === 'de' ? 'Generiertes Medien-Artefakt' : 'Generated Media Artifact'}
              </div>
              <h3 className="text-xl font-serif font-bold text-white mt-1">
                {activeArtifact === 'carousel' && (language === 'de' ? 'Instagram Karussell (Stil A - Schweizer Prestige)' : 'Instagram Carousel (Style A - Swiss Prestige)')}
                {activeArtifact === 'audio' && (language === 'de' ? '60-Sekunden Audio-Briefing' : '60-Second Audio Brief')}
                {activeArtifact === 'video' && (language === 'de' ? 'Vertikales Video-Storyboard (9:16)' : 'Vertical Video Storyboard (9:16)')}
                {activeArtifact === 'newsletter' && (language === 'de' ? 'Executive Brief & Faktenleiste' : 'Executive Newsletter & Fact Box')}
              </h3>
            </div>

            <div className="text-xs font-mono text-stone-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
              Model: {derivatives.model}
            </div>
          </div>

          {/* 1. Carousel Preview */}
          {activeArtifact === 'carousel' && derivatives.instagramCarousel && (
            <CarouselPreview carousel={derivatives.instagramCarousel} language={language} />
          )}

          {/* 2. Audio Brief Preview */}
          {activeArtifact === 'audio' && derivatives.audioBrief && (
            <div className="max-w-xl mx-auto space-y-6">
              <AudioBriefPlayer
                audioBrief={derivatives.audioBrief}
                headline={article.headline}
              />
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  {language === 'de' ? 'Gesprochenes Manuskript (140 Wörter)' : 'Spoken Script (140 Words)'}
                </div>
                <p className="text-stone-300 font-serif leading-relaxed text-sm">
                  {derivatives.audioBrief.script}
                </p>
              </div>
            </div>
          )}

          {/* 3. Storyboard Preview */}
          {activeArtifact === 'video' && derivatives.socialStoryboard && (
            <StoryboardPreview storyboard={derivatives.socialStoryboard} />
          )}

          {/* 4. Executive Newsletter & Fact Box */}
          {activeArtifact === 'newsletter' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {derivatives.executiveNewsletter && (
                <div className="p-6 bg-stone-900 border border-stone-800 rounded-xl space-y-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-red-500">
                    {language === 'de' ? '3 Analytische Kernaussagen' : '3 Strategic Bullet Points'}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-white">
                    {derivatives.executiveNewsletter.subhead}
                  </h4>
                  <ul className="space-y-3">
                    {derivatives.executiveNewsletter.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-300 text-sm font-serif">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {derivatives.factBox?.metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {derivatives.factBox.metrics.map((m) => (
                    <div key={m.id} className="p-4 bg-stone-900 border border-stone-800 rounded-xl">
                      <div className="text-2xl font-serif font-black text-white">{m.value}</div>
                      <div className="text-xs uppercase font-semibold text-stone-400 mt-1">{m.metricName}</div>
                      {m.contextNote && (
                        <div className="text-[11px] text-stone-500 mt-1 font-serif">{m.contextNote}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
