import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, ExternalLink, Send, Sparkles, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { language, t, formatSection, formatDate } = useLanguage();
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
    const isGerman = language === 'de';
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
  }, [article, language]);

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

    const isGerman = language === 'de';
    const b1 = paragraphs[0]
      ? paragraphs[0].length > 130
        ? paragraphs[0].slice(0, 130) + '…'
        : paragraphs[0]
      : article.lead || (isGerman ? 'Zentrale analytische These und Marktumfeld.' : 'Core analytical thesis and market context.');
    const b2 = paragraphs[1]
      ? paragraphs[1].length > 130
        ? paragraphs[1].slice(0, 130) + '…'
        : paragraphs[1]
      : (isGerman ? 'Strukturelle Datenindikatoren und institutionelle Reaktion.' : 'Structural data indicators and institutional response.');
    const b3 = paragraphs[2]
      ? paragraphs[2].length > 130
        ? paragraphs[2].slice(0, 130) + '…'
        : paragraphs[2]
      : (isGerman ? 'Strategische Konsequenzen, geopolitische Szenarien und Ausblick.' : 'Strategic implications, geopolitical scenarios, and future outlook.');

    return {
      headline: article.headline,
      subhead: article.lead || t('exec.default_subhead'),
      bullets: [b1, b2, b3],
      wordCount: 80,
      approved: true,
    };
  }, [article, language, t]);

  if (!article) {
    return (
      <div className="article-page-loading">
        {loading ? t('detail.loading') : t('detail.not_found')}
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm(t('feed.delete_confirm', { title: article.headline }))) {
      await deleteArticle(article.id);
      closeArticle();
    }
  };

  const handlePublish = async () => {
    await publishArticle(article.id);
  };

  const sectionLabel = formatSection(article.section).toUpperCase();

  return (
    <article className="nzz-article-detail-view">
      {/* 1. Detail Top Navigation Bar */}
      <div className="nzz-detail-top-nav">
        <button className="nzz-btn-back" onClick={closeArticle}>
          <ArrowLeft size={16} />
          <span>{t('detail.back')}</span>
        </button>

        <div className="nzz-detail-actions-right">
          {isEditor && (
            <button
              type="button"
              className={`nzz-btn-studio-toggle ${showMultimodalStudio ? 'active' : ''}`}
              onClick={() => setShowMultimodalStudio((prev) => !prev)}
            >
              <Sparkles size={14} className={showMultimodalStudio ? 'text-white' : 'text-amber-500'} />
              <span>
                {showMultimodalStudio
                  ? (language === 'de' ? 'Studio schliessen' : 'Close Studio')
                  : (language === 'de' ? 'Multimodales Studio (Video & Audio)' : 'Multimodal Studio (Video & Audio)')}
              </span>
            </button>
          )}

          {isEditor && (
            <div className="nzz-editor-actions-strip">
              {article.publicationStatus === 'draft' && (
                <button
                  className="nzz-btn-publish"
                  onClick={() => void handlePublish()}
                  title={t('detail.publish')}
                >
                  <Send size={13} />
                  <span>{t('detail.publish')}</span>
                </button>
              )}
              <button
                className="nzz-btn-delete-article"
                onClick={() => void handleDelete()}
                title={t('detail.delete')}
              >
                <Trash2 size={14} />
                <span>{t('detail.delete')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Multimodal Studio Drawer (for Editor) */}
      {isEditor && showMultimodalStudio && (
        <div className="nzz-studio-drawer-box">
          <div className="nzz-studio-drawer-header">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <h3 className="font-serif text-lg font-bold text-black">
                {language === 'de' ? 'Multimodales Studio' : 'Multimodal Derivative Studio'}
              </h3>
              <span className="nzz-pro-chip">Vertex AI · Cloud TTS</span>
            </div>
            <button
              onClick={() => setShowMultimodalStudio(false)}
              className="nzz-btn-close-studio"
            >
              {t('detail.close_studio')}
            </button>
          </div>

          <ArticleStudio
            articleId={article.id}
            articleRecord={article}
            language={language}
            onBack={() => setShowMultimodalStudio(false)}
          />
        </div>
      )}

      {/* 2. Editorial Header */}
      <header className="nzz-article-header">
        <div className="nzz-article-kicker-bar">
          <span className="nzz-kicker-dot" />
          <span className="nzz-kicker-text">{sectionLabel}</span>
          <span className="nzz-kicker-sep">·</span>
          <span className="nzz-kicker-edition">
            {language === 'de' ? 'NZZ am Sonntag / NZZ Digital' : 'NZZ International / Digital'}
          </span>
        </div>

        <h1 className="nzz-article-headline">{article.headline}</h1>

        {article.lead && <p className="nzz-article-lead">{article.lead}</p>}

        {/* Byline & Metadata Bar */}
        <div className="nzz-article-byline-bar">
          <div className="nzz-byline-left">
            <span className="nzz-byline-author">{article.authorLine || t('detail.author_default')}</span>
            <span className="nzz-byline-sep">·</span>
            <span className="nzz-byline-date">
              <Calendar size={13} />
              {article.publishedAt ? formatDate(article.publishedAt, 'long') : t('detail.today')}
            </span>
            {article.sourceUrl && (
              <>
                <span className="nzz-byline-sep">·</span>
                <a
                  className="nzz-byline-original"
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={12} /> {t('detail.original_source')}
                </a>
              </>
            )}
          </div>

          <div className="nzz-byline-right">
            <span className="nzz-badge-format">
              {article.sourceFormat === 'NZZ_JSON' ? t('detail.format_json') : t('detail.format_md')}
            </span>
          </div>
        </div>
      </header>

      {/* 3. Hero Visual & Editorial Caption */}
      {article.teaserImage?.url && (
        <figure className="nzz-article-hero-figure">
          <img
            src={article.teaserImage.url}
            alt={article.headline}
            className="nzz-article-hero-image"
          />
          <figcaption className="nzz-article-hero-caption">
            <span>
              {article.lead?.slice(0, 110) || article.headline}.
            </span>
            <span className="nzz-photo-credit">{t('detail.photo_credit')}</span>
          </figcaption>
        </figure>
      )}

      {/* 4. Reader Features: Audio Brief & Executive Summary */}
      <section className="nzz-reader-enhancements">
        <AudioBriefPlayer audioBrief={audioBrief} headline={article.headline} />
        <ExecutiveBriefCard brief={executiveBrief} language={language} />
      </section>

      {/* 5. Main Article Body & Visualizations */}
      <section className="nzz-article-body-stream">
        <ArticleContent article={article} isEditor={isEditor} />
      </section>
    </article>
  );
};
