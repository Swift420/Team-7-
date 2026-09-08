import React, { useState, useEffect } from 'react';
import {
  fetchArticles,
  fetchArticleDetail,
  fetchPublishedFormats,
} from '../../services/liquidApi';
import type {
  ArticleSummary,
  ArticleDetail,
  LiquidDerivativesPayload,
} from '../../types/liquid';
import { AudioBriefPlayer } from './AudioBriefPlayer';
import { ExecutiveBriefCard } from './ExecutiveBriefCard';
import { FactBoxStrip } from './FactBoxStrip';
import { DialecticalAccordion } from './DialecticalAccordion';
import { StoryboardPreview } from '../liquid/StoryboardPreview';
import { CarouselPreview } from '../liquid/CarouselPreview';
import { Headphones, Video, Layers, BookOpen, Sparkles, FileText } from 'lucide-react';

export const ReaderView: React.FC = () => {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [published, setPublished] = useState<LiquidDerivativesPayload | null>(null);

  // Multimodal view toggles
  const [showAudio, setShowAudio] = useState(true);
  const [showExecutiveBrief, setShowExecutiveBrief] = useState(true);
  const [activeMediaOverlay, setActiveMediaOverlay] = useState<'video' | 'carousel' | null>(null);

  useEffect(() => {
    fetchArticles().then((list) => {
      setArticles(list);
      if (list.length > 0) {
        const target = list.find((a) => a.id.includes('1886544')) || list[0];
        setSelectedArticleId(target.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedArticleId) return;
    fetchArticleDetail(selectedArticleId).then((data) => setArticle(data));
    fetchPublishedFormats(selectedArticleId).then((pub) => setPublished(pub));
  }, [selectedArticleId]);

  if (!article) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>Lade NZZ Artikel...</p>
      </div>
    );
  }

  // Split markdown body into paragraphs
  const paragraphs = article.body
    .split('\n\n')
    .filter((p) => p.trim().length > 0 && !p.startsWith('#') && !p.startsWith('!'));

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Article Switcher Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-slate-300">Lesemodus:</span>
          <select
            value={selectedArticleId}
            onChange={(e) => setSelectedArticleId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-red-500"
          >
            {articles.map((art) => (
              <option key={art.id} value={art.id}>
                {art.headline}
              </option>
            ))}
          </select>
        </div>

        {/* Multimodal Quick Toggles */}
        <div className="flex items-center gap-1.5">
          {published?.audioBrief && (
            <button
              onClick={() => setShowAudio(!showAudio)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                showAudio
                  ? 'bg-red-950/60 border-red-800 text-red-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Audio Briefing einblenden"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Audio 60s</span>
            </button>
          )}

          {published?.executiveNewsletter && (
            <button
              onClick={() => setShowExecutiveBrief(!showExecutiveBrief)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                showExecutiveBrief
                  ? 'bg-red-950/60 border-red-800 text-red-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="3-Punkte Briefing einblenden"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3-Bullet Brief</span>
            </button>
          )}

          {published?.socialStoryboard && (
            <button
              onClick={() =>
                setActiveMediaOverlay(activeMediaOverlay === 'video' ? null : 'video')
              }
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                activeMediaOverlay === 'video'
                  ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="60s Video Storyboard"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Video 9:16</span>
            </button>
          )}

          {published?.instagramCarousel && (
            <button
              onClick={() =>
                setActiveMediaOverlay(activeMediaOverlay === 'carousel' ? null : 'carousel')
              }
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                activeMediaOverlay === 'carousel'
                  ? 'bg-purple-950/60 border-purple-800 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Instagram Carousel"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Carousel</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Modal for Storyboard or Carousel if open */}
      {activeMediaOverlay && (
        <div className="bg-slate-900 border-2 border-red-600/40 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              {activeMediaOverlay === 'video'
                ? '60-Sekunden Vertikale Story (TikTok / Reels)'
                : 'Instagram & LinkedIn 6-Slide Swipe Deck'}
            </h3>
            <button
              onClick={() => setActiveMediaOverlay(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
            >
              Schließen ✕
            </button>
          </div>

          {activeMediaOverlay === 'video' && published?.socialStoryboard && (
            <StoryboardPreview storyboard={published.socialStoryboard} />
          )}

          {activeMediaOverlay === 'carousel' && published?.instagramCarousel && (
            <CarouselPreview carousel={published.instagramCarousel} />
          )}
        </div>
      )}

      {/* NZZ Editorial Article Container */}
      <article className="bg-slate-950 border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
        {/* Article Rubric / Section */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs">
          <span className="uppercase font-bold tracking-widest text-red-500">
            {article.section || 'Wirtschaft'}
          </span>
          <span className="text-slate-500 font-mono">
            {article.wordCount} Wörter · Neue Zürcher Zeitung
          </span>
        </div>

        {/* Headline & Lead */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-tight leading-tight">
            {article.headline}
          </h1>

          <p className="text-base sm:text-lg font-serif text-slate-300 leading-relaxed font-medium">
            {article.lead}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="font-semibold text-slate-200">
              Von {article.author || 'NZZ Redaktion'}
            </span>
            <span>·</span>
            <span>Zürich & Düsseldorf</span>
          </div>
        </div>

        {/* 60s Commuter Audio Brief Player */}
        {showAudio && published?.audioBrief && (
          <AudioBriefPlayer
            audioBrief={published.audioBrief}
            headline={published.audioBrief.headline}
          />
        )}

        {/* Executive 3-Bullet Card */}
        {showExecutiveBrief && published?.executiveNewsletter && (
          <ExecutiveBriefCard brief={published.executiveNewsletter} />
        )}

        {/* First Batch of Paragraphs */}
        <div className="prose prose-invert max-w-none text-slate-300 font-serif leading-relaxed space-y-4 text-sm sm:text-base">
          {paragraphs.slice(0, 3).map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Embedded Key Metrics Fact Box */}
        {published?.factBox && <FactBoxStrip factBox={published.factBox} />}

        {/* Remaining Paragraphs */}
        <div className="prose prose-invert max-w-none text-slate-300 font-serif leading-relaxed space-y-4 text-sm sm:text-base">
          {paragraphs.slice(3, 8).map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Embedded Dialectical FAQ (Consensus vs Counterargument) */}
        {published?.dialecticalFaq && (
          <DialecticalAccordion faq={published.dialecticalFaq} />
        )}

        {/* Article Footnote / Sign-off */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>© Neue Zürcher Zeitung AG. Alle Rechte vorbehalten.</span>
          <span className="text-red-500 font-serif font-black text-sm">NZZ</span>
        </div>
      </article>
    </div>
  );
};
