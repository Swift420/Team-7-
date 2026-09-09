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
  articleRecord?: any;
}

type ActiveArtifactType = 'carousel' | 'audio' | 'video' | 'newsletter' | null;

export const ArticleStudio: React.FC<ArticleStudioProps> = ({
  articleId,
  language,
  onBack,
  articleRecord,
}) => {
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(true);
  const [showFullBody, setShowFullBody] = useState(false);

  // Derivative formats (only generated when user prompts)
  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash'>('gemini-2.5-pro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFormatName, setGeneratingFormatName] = useState<string>('Instagram Carousel');
  const [activeArtifact, setActiveArtifact] = useState<ActiveArtifactType>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Load article metadata on mount or language switch
  useEffect(() => {
    if (articleRecord) {
      const bodyText = Array.isArray(articleRecord.body)
        ? articleRecord.body.map((b: any) => b.text || '').filter(Boolean).join('\n\n')
        : (articleRecord.body || '');
      const words = bodyText.split(/\s+/).filter(Boolean).length;
      setArticle({
        id: articleRecord.id,
        headline: articleRecord.headline,
        lead: articleRecord.lead || '',
        author: articleRecord.authorLine || 'NZZ Redaktion',
        section: articleRecord.section || 'General',
        category: articleRecord.section || 'General',
        tags: articleRecord.tags || ['#NZZ'],
        status: articleRecord.publicationStatus || 'published',
        wordCount: words,
        body: bodyText,
        teaserImage: articleRecord.teaserImage ? {
          url: articleRecord.teaserImage.url || '',
          caption: articleRecord.teaserImage.caption || '',
          credit: articleRecord.teaserImage.credit || '',
        } : undefined,
        language: articleRecord.language === 'de' ? 'de' : 'en',
      });
      setLoadingArticle(false);
      return;
    }

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
  }, [articleId, language, articleRecord]);

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
    setGenError(null);

    try {
      const result = await generateLiquidFormats({
        articleId,
        headline: article?.headline,
        lead: article?.lead,
        body: article?.body,
        author: article?.author,
        section: article?.section,
        language,
        model: selectedModel,
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
    <div className="w-full max-w-5xl mx-auto px-2 py-4 space-y-6 animate-fade-in text-neutral-900">
      {/* Top Breadcrumb & Section Bar */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>{language === 'de' ? 'Zurück zu allen Artikeln' : 'Back to Articles'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-0.5 bg-stone-100 border border-stone-300 text-stone-800 font-bold uppercase tracking-wider text-[11px]">
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
          <span className="text-stone-500 font-mono text-[11px] uppercase">
            {language === 'de' ? 'Deutsch' : 'English'}
          </span>
        </div>
      </div>

      {/* Article Editorial Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-red-600" />
            <span className="text-stone-900 font-semibold">{article.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>2026-09-09</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{Math.round((article.wordCount || 1200) / 200)} min read ({article.wordCount} words)</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-black leading-[1.2]">
          {article.headline}
        </h1>

        {article.lead && (
          <p className="text-base text-stone-700 font-serif leading-relaxed border-l-2 border-red-600 pl-3.5 py-1.5 italic bg-[#fbfbfa]">
            {article.lead}
          </p>
        )}

        {/* Optional Collapsible Body Preview */}
        {article.body && article.body !== article.lead && (
          <div className="pt-1">
            <button
              onClick={() => setShowFullBody(!showFullBody)}
              className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1.5 transition-colors font-mono"
            >
              <span>{showFullBody ? (language === 'de' ? 'Text einklappen' : 'Hide full text') : (language === 'de' ? 'Vollständigen Artikeltext anzeigen' : 'Read source article text')}</span>
              {showFullBody ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullBody && (
              <div className="mt-2.5 p-4 bg-white border border-stone-200 text-stone-700 text-sm leading-relaxed max-h-64 overflow-y-auto font-serif space-y-2.5">
                {article.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prominent Action Bar: Generate Media Artifacts */}
      <div className="bg-white border border-stone-300 p-5 shadow-sm">
        {/* Editorial Separation Notice */}
        <div className="flex items-start gap-2.5 p-3 bg-[#fbfbfa] border border-stone-200 border-l-4 border-l-red-600 text-xs text-stone-700 mb-4">
          <Sparkles className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-black">
              {language === 'de' ? 'Social-Derivative & Syndikations-Export Studio:' : 'Social Derivative & Syndicate Export Studio:'}
            </strong>{' '}
            {language === 'de'
              ? 'Hier generierte Formate (Instagram-Karusselle, Audio-Briefings, Storyboards) sind ausschliesslich für den externen Export bestimmt. Sie verändern oder überschreiben niemals die authentische redaktionelle Fotografie auf der Zeitungs-Website.'
              : 'Artifacts synthesized here (Instagram Carousels, Commuter Audio Briefs, Video Storyboards) are strictly intended for external distribution and social export. They will never alter or overwrite your lead editorial photography on the newspaper website.'}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-serif font-bold text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-600" />
              <span>
                {language === 'de'
                  ? 'In Liquid Media-Formate transformieren'
                  : 'Synthesize Liquid Media Artifacts'}
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {language === 'de'
                ? 'Wählen Sie ein Format, um die multimodale Generierung nach NZZ-Qualitätsstandards zu starten.'
                : 'Select an artifact to trigger on-demand AI generation matching NZZ editorial standards.'}
            </p>
          </div>
        </div>

        {/* Real-time Error Feedback */}
        {genError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs text-red-900">
            <div className="font-bold text-red-700 mb-0.5">
              {language === 'de' ? 'Fehler bei der Modellgenerierung:' : 'Model Generation Error:'}
            </div>
            <div className="font-mono text-[11px] break-words">{genError}</div>
          </div>
        )}

        {/* AI Engine Model Selection Bar with proper spacing */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#fbfbfa] border border-stone-200 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-black text-[11px] uppercase tracking-wider">AI Engine:</span>
            <div className="inline-flex items-center gap-2 p-0.5 bg-stone-100 border border-stone-300">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-pro')}
                className={`px-3 py-1 text-xs font-semibold transition-all ${
                  selectedModel === 'gemini-2.5-pro'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-stone-600 hover:text-black hover:bg-stone-200'
                }`}
              >
                Gemini 2.5 Pro (Deep Reasoning)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-flash')}
                className={`px-3 py-1 text-xs font-semibold transition-all ${
                  selectedModel === 'gemini-2.5-flash'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-stone-600 hover:text-black hover:bg-stone-200'
                }`}
              >
                Gemini 2.5 Flash (Fast)
              </button>
            </div>
          </div>
          {derivatives && (
            <div className="flex items-center gap-2 text-stone-600">
              <span className="font-medium text-stone-500">Provenance:</span>
              <span className={`px-2 py-0.5 font-mono text-[11px] font-semibold ${
                derivatives.source === 'vertex-ai'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : derivatives.source === 'template'
                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                  : 'bg-stone-100 text-stone-800 border border-stone-300'
              }`}>
                {derivatives.source === 'vertex-ai' ? '● Live Vertex AI' : (derivatives.source || 'live')}
              </span>
              <span className="text-stone-400 font-mono">|</span>
              <span className="text-stone-800 font-mono font-medium">Model: {derivatives.model || selectedModel}</span>
              {derivatives.elapsedMs && (
                <>
                  <span className="text-stone-400 font-mono">|</span>
                  <span className="text-stone-500 font-mono">{derivatives.elapsedMs}ms</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4 Dedicated Generation Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Button 1: Instagram Carousel (Style A) */}
          <button
            onClick={() => handleGenerateArtifact('carousel')}
            disabled={isGenerating}
            className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
              activeArtifact === 'carousel'
                ? 'bg-[#fff5f5] border-red-600 ring-1 ring-red-600/40 shadow-sm'
                : 'bg-white hover:bg-stone-50 border-stone-300 hover:border-black'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-red-50 text-red-600 border border-red-200">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600">
                4:5 Deck
              </span>
            </div>
            <div>
              <div className="font-bold text-black text-xs">
                {language === 'de' ? 'Instagram Karussell' : 'Instagram Carousel'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 font-serif">
                {language === 'de' ? 'Stil A (Schweizer Prestige, 6 Folien)' : 'Style A (Swiss Prestige, 6 Slides)'}
              </div>
            </div>
          </button>

          {/* Button 2: Audio Brief (Google Cloud TTS) */}
          <button
            onClick={() => handleGenerateArtifact('audio')}
            disabled={isGenerating}
            className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
              activeArtifact === 'audio'
                ? 'bg-[#fff5f5] border-red-600 ring-1 ring-red-600/40 shadow-sm'
                : 'bg-white hover:bg-stone-50 border-stone-300 hover:border-black'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-red-50 text-red-600 border border-red-200">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600">
                60s Cloud TTS
              </span>
            </div>
            <div>
              <div className="font-bold text-black text-xs">
                {language === 'de' ? 'Audio-Briefing' : 'Commuter Audio Brief'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 font-serif">
                {language === 'de' ? 'Natürliche Sprachausgabe (60s)' : '140 Words, Studio Cadence'}
              </div>
            </div>
          </button>

          {/* Button 3: Vertical Video Storyboard */}
          <button
            onClick={() => handleGenerateArtifact('video')}
            disabled={isGenerating}
            className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
              activeArtifact === 'video'
                ? 'bg-[#fff5f5] border-red-600 ring-1 ring-red-600/40 shadow-sm'
                : 'bg-white hover:bg-stone-50 border-stone-300 hover:border-black'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-red-50 text-red-600 border border-red-200">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600">
                9:16 Video
              </span>
            </div>
            <div>
              <div className="font-bold text-black text-xs">
                {language === 'de' ? 'Vertikales Video' : 'Vertical Video'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 font-serif">
                {language === 'de' ? '5 Szenen für TikTok/Reels' : '5-Scene Storyboard for Reels'}
              </div>
            </div>
          </button>

          {/* Button 4: Executive Brief & Fact Box */}
          <button
            onClick={() => handleGenerateArtifact('newsletter')}
            disabled={isGenerating}
            className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
              activeArtifact === 'newsletter'
                ? 'bg-[#fff5f5] border-red-600 ring-1 ring-red-600/40 shadow-sm'
                : 'bg-white hover:bg-stone-50 border-stone-300 hover:border-black'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 bg-red-50 text-red-600 border border-red-200">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600">
                Newsletter
              </span>
            </div>
            <div>
              <div className="font-bold text-black text-xs">
                {language === 'de' ? 'Executive Brief' : 'Executive Brief'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5 font-serif">
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
        <div className="bg-white border border-stone-300 p-6 shadow-sm animate-fade-in">
          {/* Header of the Display Area */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
            <div>
              <div className="text-[11px] uppercase font-mono tracking-widest text-red-600 font-bold">
                {language === 'de' ? 'Generiertes Medien-Artefakt' : 'Generated Media Artifact'}
              </div>
              <h3 className="text-lg font-serif font-bold text-black mt-0.5">
                {activeArtifact === 'carousel' && (language === 'de' ? 'Instagram Karussell (Stil A - Schweizer Prestige)' : 'Instagram Carousel (Style A - Swiss Prestige)')}
                {activeArtifact === 'audio' && (language === 'de' ? '60-Sekunden Audio-Briefing' : '60-Second Audio Brief')}
                {activeArtifact === 'video' && (language === 'de' ? 'Vertikales Video-Storyboard (9:16)' : 'Vertical Video Storyboard (9:16)')}
                {activeArtifact === 'newsletter' && (language === 'de' ? 'Executive Brief & Faktenleiste' : 'Executive Newsletter & Fact Box')}
              </h3>
            </div>

            <div className="text-xs font-mono text-stone-600 bg-stone-100 px-2.5 py-1 border border-stone-200">
              Model: {derivatives.model}
            </div>
          </div>

          {/* 1. Carousel Preview */}
          {activeArtifact === 'carousel' && derivatives.instagramCarousel && (
            <CarouselPreview
              carousel={derivatives.instagramCarousel}
              language={language}
              onUpdateSlide={(updatedSlide) => {
                setDerivatives((prev) => {
                  if (!prev?.instagramCarousel?.slides) return prev;
                  return {
                    ...prev,
                    instagramCarousel: {
                      ...prev.instagramCarousel,
                      slides: prev.instagramCarousel.slides.map((s) =>
                        s.slideNumber === updatedSlide.slideNumber ? updatedSlide : s,
                      ),
                    },
                  };
                });
              }}
            />
          )}

          {/* 2. Audio Brief Preview */}
          {activeArtifact === 'audio' && derivatives.audioBrief && (
            <div className="max-w-xl mx-auto space-y-5">
              <AudioBriefPlayer
                audioBrief={derivatives.audioBrief}
                headline={article.headline}
              />
              <div className="p-4 bg-[#fbfbfa] border border-stone-200">
                <div className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                  {language === 'de' ? 'Gesprochenes Manuskript (140 Wörter)' : 'Spoken Script (140 Words)'}
                </div>
                <p className="text-stone-800 font-serif leading-relaxed text-sm">
                  {derivatives.audioBrief.script}
                </p>
              </div>
            </div>
          )}

          {/* 3. Storyboard Preview */}
          {activeArtifact === 'video' && derivatives.socialStoryboard && (
            <StoryboardPreview
              storyboard={derivatives.socialStoryboard}
              language={language}
              articleId={article.id}
              onUpdateStoryboard={(updated) =>
                setDerivatives((prev) => (prev ? { ...prev, socialStoryboard: updated } : prev))
              }
            />
          )}

          {/* 4. Executive Newsletter & Fact Box */}
          {activeArtifact === 'newsletter' && (
            <div className="max-w-2xl mx-auto space-y-5">
              {derivatives.executiveNewsletter && (
                <div className="p-5 bg-[#fbfbfa] border border-stone-200 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-red-600 font-bold">
                    {language === 'de' ? '3 Analytische Kernaussagen' : '3 Strategic Bullet Points'}
                  </div>
                  <h4 className="text-base font-serif font-bold text-black">
                    {derivatives.executiveNewsletter.subhead}
                  </h4>
                  <ul className="space-y-2.5">
                    {derivatives.executiveNewsletter.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-stone-800 text-sm font-serif">
                        <span className="w-1.5 h-1.5 bg-red-600 mt-2 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {derivatives.factBox?.metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {derivatives.factBox.metrics.map((m) => (
                    <div key={m.id} className="p-3.5 bg-white border border-stone-200">
                      <div className="text-2xl font-serif font-black text-black">{m.value}</div>
                      <div className="text-xs uppercase font-bold text-stone-600 mt-1">{m.metricName}</div>
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
