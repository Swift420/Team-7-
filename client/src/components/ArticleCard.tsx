import React from 'react';
import { Bookmark, Clock, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useArticles } from '../hooks/useArticles';
import { useLanguage } from '../hooks/useLanguage';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
  variant?: 'standard' | 'hero' | 'compact';
}

const estimateReadTime = (article: Article): number => {
  const words =
    article.body?.reduce((count, el) => {
      return count + (el.text ? el.text.split(/\s+/).length : 0);
    }, 0) || 500;
  return Math.max(2, Math.ceil(words / 200));
};

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onOpen,
  variant = 'standard',
}) => {
  const { isEditor } = useAuth();
  const { deleteArticle } = useArticles();
  const { language, t, formatSection, formatDate, formatReadTime } = useLanguage();
  const [bookmarked, setBookmarked] = React.useState(false);

  const imageUrl = article.teaserImage?.url;
  const readMinutes = estimateReadTime(article);
  const readTimeLabel = formatReadTime(readMinutes);
  const sectionLabel = formatSection(article.section).toUpperCase();
  const authorName = article.authorLine || t('detail.author_default');

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t('feed.delete_confirm', { title: article.headline }))) {
      await deleteArticle(article.id);
    }
  };

  const handleBookmark = (event: React.MouseEvent) => {
    event.stopPropagation();
    setBookmarked(!bookmarked);
  };

  // 1. Compact Wire Item Variant (for side rail)
  if (variant === 'compact') {
    return (
      <article
        className="nzz-compact-card"
        onClick={() => onOpen(article)}
        role="button"
        tabIndex={0}
      >
        <div className="nzz-compact-meta">
          <span className="nzz-kicker-dot" />
          <span className="nzz-kicker-text">{sectionLabel}</span>
          <span className="nzz-meta-sep">·</span>
          <span className="nzz-read-time">{formatDate(article.publishedAt, 'short')}</span>
        </div>
        <h4 className="nzz-compact-headline">{article.headline}</h4>
        {article.lead && <p className="nzz-compact-lead">{article.lead}</p>}
        <div className="nzz-card-footer compact-footer">
          <span className="nzz-author-name">{authorName}</span>
          <div className="nzz-footer-actions">
            <span className="nzz-time-badge">
              <Clock size={12} /> {readTimeLabel}
            </span>
            <button
              className={`nzz-btn-bookmark ${bookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
              aria-label={t('feed.bookmark')}
              title={t('feed.bookmark')}
            >
              <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            {isEditor && (
              <button
                className="nzz-btn-delete"
                onClick={handleDelete}
                title={t('feed.delete_article')}
                aria-label={t('feed.delete_article')}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // 2. Hero Lead Story Variant
  if (variant === 'hero') {
    return (
      <article
        className="nzz-hero-card"
        onClick={() => onOpen(article)}
        role="button"
        tabIndex={0}
      >
        {imageUrl && (
          <div className="nzz-hero-media">
            <img src={imageUrl} alt="" loading="eager" />
          </div>
        )}
        <div className="nzz-hero-body">
          <div className="nzz-card-kicker">
            <span className="nzz-kicker-dot" />
            <span className="nzz-kicker-text">{sectionLabel}</span>
            <span className="nzz-pro-chip">
              {language === 'de' ? 'NZZ ANALYSE' : 'NZZ ANALYSIS'}
            </span>
          </div>

          <h2 className="nzz-hero-headline">{article.headline}</h2>
          {article.lead && <p className="nzz-hero-lead">{article.lead}</p>}

          <div className="nzz-card-footer hero-footer">
            <div className="nzz-author-block">
              <span className="nzz-author-name">{authorName}</span>
              <span className="nzz-meta-date">{formatDate(article.publishedAt)}</span>
            </div>

            <div className="nzz-footer-actions">
              <span className="nzz-time-badge">
                <Clock size={13} /> {readTimeLabel}
              </span>
              <button
                className={`nzz-btn-bookmark ${bookmarked ? 'bookmarked' : ''}`}
                onClick={handleBookmark}
                aria-label={t('feed.bookmark')}
                title={t('feed.bookmark')}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              {isEditor && (
                <button
                  className="nzz-btn-delete"
                  onClick={handleDelete}
                  title={t('feed.delete_article')}
                  aria-label={t('feed.delete_article')}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 3. Standard Broadsheet Grid Card Variant
  return (
    <article
      className="nzz-editorial-card"
      onClick={() => onOpen(article)}
      role="button"
      tabIndex={0}
    >
      {imageUrl && (
        <div className="nzz-card-media">
          <img src={imageUrl} alt="" loading="lazy" />
        </div>
      )}

      <div className="nzz-card-content">
        <div className="nzz-card-kicker">
          <span className="nzz-kicker-dot" />
          <span className="nzz-kicker-text">{sectionLabel}</span>
        </div>

        <h3 className="nzz-card-headline">{article.headline}</h3>
        {article.lead && <p className="nzz-card-excerpt">{article.lead}</p>}

        <div className="nzz-card-footer">
          <div className="nzz-author-block">
            <span className="nzz-author-name">{authorName}</span>
          </div>

          <div className="nzz-footer-actions">
            <span className="nzz-time-badge">
              <Clock size={12} /> {readTimeLabel}
            </span>
            <button
              className={`nzz-btn-bookmark ${bookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
              aria-label={t('feed.bookmark')}
              title={t('feed.bookmark')}
            >
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            {isEditor && (
              <button
                className="nzz-btn-delete"
                onClick={handleDelete}
                title={t('feed.delete_article')}
                aria-label={t('feed.delete_article')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
