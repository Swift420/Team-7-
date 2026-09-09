import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  MoreVertical,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Article } from '../types';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { ArticleContent } from './ArticleContent';
import { AudioBriefPlayer } from './reader/AudioBriefPlayer';
import { ExecutiveBriefCard } from './reader/ExecutiveBriefCard';
import { MultimodalContentStudio } from './studio/MultimodalContentStudio';
import type { ArticleInclusionSettings } from './studio/types';
import type { AudioBriefFormat, ExecutiveNewsletterFormat } from '../types/liquid';

export const ArticleDetailPage: React.FC<{ article: Article | null; loading?: boolean }> = ({
  article,
  loading,
}) => {
  const { deleteArticle, publishArticle, closeArticle } = useArticles();
  const { isEditor } = useAuth();
  const { language, t, formatSection, formatDate } = useLanguage();
  const [showMultimodalStudio, setShowMultimodalStudio] = useState(true);

  // Synchronized article inclusion settings (audio & exec brief)
  const [inclusionSettings, setInclusionSettings] = useState<ArticleInclusionSettings>(() => {
    if (!article) return { commuterAudioEnabled: false, executiveBriefEnabled: false };
    try {
      const stored = localStorage.getItem(`nzz_article_inclusion_${article.id}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return { commuterAudioEnabled: false, executiveBriefEnabled: false };
  });

  useEffect(() => {
    if (article) {
      try {
        const stored = localStorage.getItem(`nzz_article_inclusion_${article.id}`);
        if (stored) {
          setInclusionSettings(JSON.parse(stored));
        } else {
          setInclusionSettings({ commuterAudioEnabled: false, executiveBriefEnabled: false });
        }
      } catch {
        // ignore
      }
    }
  }, [article?.id]);

  // Word count and estimated read time
  const wordCount = useMemo(() => {
    if (!article) return 460;
    const text = (article.body || [])
      .filter((b) => b.type === 'paragraph' && b.text)
      .map((b) => b.text || '')
      .join(' ');
    return text.trim() ? text.trim().split(/\s+/).length : 460;
  }, [article]);

  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  // Generate dynamic or stored Audio Brief format for Read-Aloud
  const audioBrief: AudioBriefFormat = useMemo(() => {
    if (!article) {
      return {
        headline: '',
        wordCount: 0,
        estimatedDurationSeconds: 134,
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
      estimatedDurationSeconds: 134,
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
        bullets: ['Takeaway 1', 'Takeaway 2', 'Takeaway 3'],
        wordCount: 0,
        approved: false,
      };
    }

    const isGerman = language === 'de';
    const paragraphs = (article.body || [])
      .filter((b) => b.type === 'paragraph' && Boolean(b.text && b.text.trim()))
      .map((b) => (b.text || '').trim());

    const b1 = paragraphs[0]
      ? paragraphs[0].length > 130
        ? paragraphs[0].slice(0, 130) + '…'
        : paragraphs[0]
      : article.lead || (isGerman ? 'Zentrale analytische These und Marktumfeld.' : 'First experimental evidence of a quantum effect of gravity using ultracold atoms.');
    const b2 = paragraphs[1]
      ? paragraphs[1].length > 130
        ? paragraphs[1].slice(0, 130) + '…'
        : paragraphs[1]
      : (isGerman ? 'Strukturelle Datenindikatoren und institutionelle Reaktion.' : 'Could help bridge the gap between general relativity and quantum mechanics.');
    const b3 = paragraphs[2]
      ? paragraphs[2].length > 130
        ? paragraphs[2].slice(0, 130) + '…'
        : paragraphs[2]
      : (isGerman ? 'Strategische Konsequenzen, geopolitische Szenarien und Ausblick.' : 'May open new research directions in fundamental physics and cosmology.');

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
      {/* 1. Detail Top Navigation Bar (Mockup Match) */}
      <div className="nzz-topbar-strip">
        <button className="nzz-btn-back" onClick={closeArticle}>
          <ArrowLeft size={16} />
          <span>{language === 'de' ? 'Zurück zum Artikel' : 'Back to article'}</span>
        </button>

        <div className="nzz-topbar-actions-group">
          <div className="nzz-last-saved-badge">
            <Check size={14} className="nzz-last-saved-icon" />
            <span>{language === 'de' ? 'Zuletzt gespeichert 10:42' : 'Last saved 10:42'}</span>
          </div>

          <button
            type="button"
            className="nzz-btn-top-preview"
            onClick={() => {
              const stream = document.querySelector('.nzz-article-body-stream');
              if (stream) stream.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {language === 'de' ? 'Artikel Vorschau' : 'Preview Article'}
          </button>

          <button
            type="button"
            className="nzz-btn-top-publish"
            onClick={() => void handlePublish()}
          >
            {language === 'de' ? 'Veröffentlichen' : 'Publish'}
          </button>

          <button
            type="button"
            className={`p-1.5 rounded cursor-pointer transition-colors ${showMultimodalStudio ? 'bg-neutral-200 text-black' : 'text-neutral-500 hover:text-black'}`}
            onClick={() => setShowMultimodalStudio((prev) => !prev)}
            title={showMultimodalStudio ? 'Studio einklappen' : 'Studio anzeigen'}
          >
            <Sparkles size={16} />
          </button>

          {isEditor && (
            <button
              type="button"
              className="p-1.5 text-neutral-400 hover:text-red-600 rounded cursor-pointer"
              onClick={() => void handleDelete()}
              title={t('detail.delete')}
            >
              <Trash2 size={15} />
            </button>
          )}

          <button
            type="button"
            className="nzz-btn-top-menu"
            title="Options"
            aria-label="Options"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* 2. Editorial Header (2-Column Broadsheet Mockup Match) */}
      <header className="nzz-article-header">
        <div className="nzz-detail-header-grid">
          {/* Left Column: Kicker, Headline, Lead */}
          <div className="nzz-detail-header-main">
            <div className="nzz-kicker-pill-row">
              <span>{sectionLabel || 'ECONOMY'}</span>
              <span className="nzz-kicker-red-dot" />
              <span>{language === 'de' ? 'NZZ INTERNATIONAL' : 'NZZ INTERNATIONAL'}</span>
            </div>

            <h1 className="nzz-article-headline">{article.headline}</h1>

            {article.lead && <p className="nzz-article-lead">{article.lead}</p>}
          </div>

          {/* Right Column: Editorial Metadata Panel */}
          <div className="nzz-header-meta-panel">
            <div className="nzz-meta-item-row">
              <span className="nzz-meta-item-label">{language === 'de' ? 'Autor' : 'Author'}</span>
              <span className="nzz-meta-item-val">{article.authorLine || 'NZZ Editorial'}</span>
            </div>

            <div className="nzz-meta-item-row">
              <span className="nzz-meta-item-label">{language === 'de' ? 'Datum' : 'Date'}</span>
              <span className="nzz-meta-item-val">
                {article.publishedAt ? formatDate(article.publishedAt, 'long') : '9 September 2026'}
              </span>
            </div>

            <div className="nzz-meta-item-row">
              <span className="nzz-meta-item-label">{language === 'de' ? 'Lesezeit' : 'Read Time'}</span>
              <span className="nzz-meta-item-val">
                {readTime} min read ({wordCount} words)
              </span>
            </div>

            <div className="nzz-meta-item-row">
              <span className="nzz-meta-item-label">{language === 'de' ? 'Themen' : 'Tags'}</span>
              <div className="nzz-meta-tags-list">
                {(article.tags && article.tags.length > 0
                  ? article.tags
                  : ['Science', 'Physics', 'Quantum Mechanics']
                ).map((t, idx) => (
                  <span key={idx} className="nzz-meta-tag-chip">
                    {t.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Multimodal Content Studio (Directly underneath article header) */}
      {showMultimodalStudio && (
        <MultimodalContentStudio
          article={article}
          language={language}
          onInclusionChange={(settings) => setInclusionSettings(settings)}
          initialInclusion={inclusionSettings}
        />
      )}

      {/* 4. Hero Visual & Editorial Caption (if available) */}
      {article.teaserImage?.url && (
        <figure className="nzz-article-hero-figure">
          <img
            src={article.teaserImage.url}
            alt={article.headline}
            className="nzz-article-hero-image"
          />
          <figcaption className="nzz-article-hero-caption">
            <span>{article.lead?.slice(0, 110) || article.headline}.</span>
            <span className="nzz-photo-credit">{t('detail.photo_credit')}</span>
          </figcaption>
        </figure>
      )}

      {/* 5. Reader Features: Audio Brief & Executive Summary (rendered only if toggled on) */}
      {(inclusionSettings.commuterAudioEnabled || inclusionSettings.executiveBriefEnabled) && (
        <section className="nzz-reader-enhancements">
          {inclusionSettings.commuterAudioEnabled && (
            <AudioBriefPlayer audioBrief={audioBrief} headline={article.headline} />
          )}
          {inclusionSettings.executiveBriefEnabled && (
            <ExecutiveBriefCard brief={executiveBrief} language={language} />
          )}
        </section>
      )}

      {/* 6. Main Article Body & Visualizations */}
      <section className="nzz-article-body-stream">
        <ArticleContent article={article} isEditor={isEditor} />
      </section>
    </article>
  );
};
