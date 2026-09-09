import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Send, Sparkles, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { ArticleContent } from './ArticleContent';
import { AudioBriefPlayer } from './reader/AudioBriefPlayer';
import { ExecutiveBriefCard } from './reader/ExecutiveBriefCard';
import { ArticleStudio } from './liquid/ArticleStudio';
import type { AudioBriefFormat, ExecutiveNewsletterFormat } from '../types/liquid';

export const ArticleDetailPage: React.FC<{ article: Article | null; loading?: boolean }> = ({
  article,
  loading,
}) => {
  const { deleteArticle, publishArticle, closeArticle } = useArticles();
  const { isEditor } = useAuth();
  const [showMultimodalStudio, setShowMultimodalStudio] = useState(false);

  // Generate dynamic or stored Audio Brief format for Read-Aloud
  const audioBrief: AudioBriefFormat = useMemo(() => {
    if (!article) {
      return {
        headline: '',
        wordCount: 0,
        estimatedDurationSeconds: 60,
        script: '',
        ssml: '',
        voiceProfile: { languageCode: 'en-US', voiceName: 'en-US-Journey-F', gender: 'FEMALE' },
        approved: false,
      };
    }
    const isGerman = article.language === 'de';
    const firstPara =
      article.body?.find((b) => b.type === 'paragraph' && b.text?.trim())?.text || '';
    const script = `${article.headline}. ${article.lead || firstPara.slice(0, 160)}. ${
      isGerman
        ? 'Für die Neue Zürcher Zeitung, Audio-Redaktion.'
        : 'For the Neue Zürcher Zeitung, Audio Desk.'
    }`;

    return {
      headline: article.headline,
      wordCount: Math.max(45, script.split(/\s+/).length),
      estimatedDurationSeconds: 60,
      script,
      ssml: `<speak>${article.headline}. <break time="300ms"/> ${article.lead || firstPara.slice(0, 160)}</speak>`,
      voiceProfile: {
        languageCode: isGerman ? 'de-DE' : 'en-US',
        voiceName: isGerman ? 'de-DE-Neural2-B' : 'en-US-Journey-F',
        gender: 'FEMALE',
      },
      approved: true,
    };
  }, [article]);

  // Generate dynamic or stored 60-Second Executive Summary
  const executiveBrief: ExecutiveNewsletterFormat = useMemo(() => {
    if (!article) {
      return {
        headline: '',
        subhead: '',
        bullets: ['', '', ''],
        wordCount: 0,
        approved: false,
      };
    }
    const paragraphs =
      article.body
        ?.filter((b) => b.type === 'paragraph' && b.text?.trim())
        .map((b) => b.text!.trim()) || [];

    const b1 = paragraphs[0]
      ? paragraphs[0].length > 130
        ? paragraphs[0].slice(0, 130) + '…'
        : paragraphs[0]
      : article.lead || 'Core analytical thesis and market context.';
    const b2 = paragraphs[1]
      ? paragraphs[1].length > 130
        ? paragraphs[1].slice(0, 130) + '…'
        : paragraphs[1]
      : 'Structural data indicators and institutional response.';
    const b3 = paragraphs[2]
      ? paragraphs[2].length > 130
        ? paragraphs[2].slice(0, 130) + '…'
        : paragraphs[2]
      : 'Strategic implications, geopolitical scenarios, and future outlook.';

    return {
      headline: article.headline,
      subhead: article.lead || (article.language === 'de' ? 'Auf einen Blick: Die 3 Kernpunkte' : 'At a Glance: 3 Key Strategic Points'),
      bullets: [b1, b2, b3],
      wordCount: 80,
      approved: true,
    };
  }, [article]);

  if (!article) {
    return (
      <div className="article-page-loading">
        {loading ? 'Loading article…' : 'Article not found.'}
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm(`Delete article: "${article.headline}"?`)) {
      await deleteArticle(article.id);
      closeArticle();
    }
  };

  const handlePublish = async () => {
    await publishArticle(article.id);
  };

  return (
    <div className="article-page">
      {/* Detail Navigation & Actions Bar */}
      <div className="article-detail-nav article-page-nav flex items-center justify-between">
        <button className="back-btn" onClick={closeArticle}>
          <ArrowLeft size={16} /> Back to Articles
        </button>

        <div className="flex items-center gap-2">
          {isEditor && (
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showMultimodalStudio
                  ? 'bg-red-600 text-white border-red-500 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              onClick={() => setShowMultimodalStudio((prev) => !prev)}
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>{showMultimodalStudio ? 'Close Derivative Studio' : 'Multimodal Studio (Carousel & Video)'}</span>
            </button>
          )}

          {isEditor && (
            <div className="article-editor-actions">
              {article.publicationStatus === 'draft' && (
                <button className="btn-publish-article" onClick={() => void handlePublish()}>
                  <Send size={14} /> Publish
                </button>
              )}
              <button className="btn-delete" onClick={() => void handleDelete()}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Visual */}
      {article.teaserImage?.url && (
        <div className="article-hero-wrap">
          <img src={article.teaserImage.url} alt="" className="article-hero-img" />
          <div className="article-hero-gradient" />
        </div>
      )}

      {/* Editorial Header */}
      <header className="database-article-header article-page-header">
        <span className="hero-category-badge">{article.section || 'Uncategorised'}</span>
        <h1 className="article-hero-title">{article.headline}</h1>
        {article.lead && <p className="article-hero-sub">{article.lead}</p>}
      </header>

      {/* Meta Bar */}
      <div className="article-meta-bar">
        <div>
          <div className="author-name-lg">{article.authorLine || 'Author unavailable'}</div>
          <div className="author-role-lg">
            {article.language?.toUpperCase() || 'Language unavailable'} ·{' '}
            {article.sourceFormat === 'NZZ_JSON' ? 'NZZ JSON' : 'Markdown import'}
          </div>
        </div>
        <div className="article-metrics-row">
          <span className="metric-item">
            <Calendar size={14} />{' '}
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Date unavailable'}
          </span>
          {article.sourceUrl && (
            <a className="metric-item" href={article.sourceUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Original
            </a>
          )}
        </div>
      </div>

      {/* Multimodal Studio Drawer (for Editor) */}
      {isEditor && showMultimodalStudio && (
        <div className="my-6 p-6 rounded-2xl bg-slate-950 border border-red-500/30 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-white font-serif">
                Multimodal Derivative Studio
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
                Vertex AI &amp; Cloud TTS
              </span>
            </div>
            <button
              onClick={() => setShowMultimodalStudio(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Studio ✕
            </button>
          </div>

          <ArticleStudio
            articleId={article.id}
            articleRecord={article}
            language={article.language === 'de' ? 'de' : 'en'}
            onBack={() => setShowMultimodalStudio(false)}
          />
        </div>
      )}

      {/* Reader Feature 1: Read Aloud / Audio Brief */}
      <div className="my-6">
        <AudioBriefPlayer audioBrief={audioBrief} headline={article.headline} />
      </div>

      {/* Reader Feature 2: 60-Second Executive Summary */}
      <div className="my-6">
        <ExecutiveBriefCard brief={executiveBrief} language={article.language as 'en' | 'de'} />
      </div>

      {/* Main Article Content & Inline Visualizations */}
      <ArticleContent article={article} isEditor={isEditor} />
    </div>
  );
};
