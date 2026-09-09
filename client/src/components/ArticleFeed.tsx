import React, { Suspense, useMemo } from 'react';
import { ArrowRight, FileText, Globe2, Plus, RefreshCw } from 'lucide-react';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { ArticleCard } from './ArticleCard';
import { sectionsMatch } from '../utils/sectionTranslation';

const StoryGlobeExplorer = React.lazy(() =>
  import('./StoryGlobeExplorer').then((module) => ({ default: module.StoryGlobeExplorer }))
);

export const ArticleFeed: React.FC = () => {
  const {
    articles,
    loading,
    error,
    selectedCategory,
    searchQuery,
    openArticle,
    openCreateArticle,
    refreshArticles,
    isGlobeOpen,
    setIsGlobeOpen,
  } = useArticles();
  const { isEditor } = useAuth();
  const { language, t, formatSection } = useLanguage();

  const query = searchQuery.trim().toLowerCase();
  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const isAll =
        selectedCategory === 'all' ||
        selectedCategory === 'All' ||
        selectedCategory === 'Alle';
      const categoryMatches = isAll || sectionsMatch(article.section, selectedCategory);
      const searchMatches =
        !query ||
        [article.headline, article.lead, article.authorLine, article.section, ...(article.tags || [])].some(
          (value) => value?.toLowerCase().includes(query)
        );
      return categoryMatches && searchMatches;
    });
  }, [articles, selectedCategory, query]);

  // Broadsheet Editorial Hierarchy
  const heroArticle = filtered[0];
  const sideArticles = filtered.slice(1, 4);
  const remainingArticles = filtered.slice(4);

  const isAllCategory =
    selectedCategory === 'all' || selectedCategory === 'All' || selectedCategory === 'Alle';

  return (
    <div className={`nzz-feed-wrapper ${isGlobeOpen ? 'has-docked-globe' : ''}`}>
      {/* Main Feed Column (shrinks when globe is open) */}
      <main className="nzz-main-feed-col">
        {/* NZZ Globus Teaser Banner (when globe is docked closed) */}
        {!isGlobeOpen && (
          <section className="nzz-globus-banner" onClick={() => setIsGlobeOpen(true)}>
            <div className="nzz-globus-banner-badge">
              <span className="nzz-red-dot" /> {t('globe.banner_kicker')}
            </div>
            <div className="nzz-globus-banner-content">
              <h3>{t('globe.banner_headline')}</h3>
              <p>{t('globe.banner_lead')}</p>
            </div>
            <button className="nzz-globus-banner-btn" aria-label={t('globe.banner_open')}>
              <Globe2 size={16} />
              <span>{t('globe.banner_open')}</span>
              <ArrowRight size={14} />
            </button>
          </section>
        )}

        {/* Section / Filter Header Bar */}
        <div className="nzz-feed-subbar">
          <div className="nzz-subbar-title-wrap">
            <h2 className="nzz-subbar-title">
              {isAllCategory ? t('feed.latest_reporting') : formatSection(selectedCategory)}
            </h2>
            <span className="nzz-article-counter">
              <strong>{filtered.length}</strong>{' '}
              {filtered.length === 1 ? t('feed.article_count_single') : t('feed.articles_count')}
            </span>
          </div>

          <div className="nzz-subbar-actions">
            <button
              className="nzz-btn-refresh"
              onClick={() => void refreshArticles()}
              title={t('feed.refresh')}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>{t('feed.refresh')}</span>
            </button>
            {isEditor && (
              <button
                className="nzz-btn-feed-add"
                onClick={() => openCreateArticle('create')}
                title={t('nav.create_article')}
              >
                <Plus size={14} />
                <span>{t('nav.create_article')}</span>
              </button>
            )}
          </div>
        </div>

        {error && <div className="nzz-error-banner">{error}</div>}

        {loading ? (
          <div className="nzz-empty-feed-box">
            <RefreshCw className="spin" size={24} />
            <p>{t('feed.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="nzz-empty-feed-box">
            <FileText size={44} className="text-zinc-400 mb-3" />
            <h3>{language === 'de' ? 'Keine Artikel gefunden' : 'No articles found'}</h3>
            <p>
              {query
                ? language === 'de'
                  ? `Keine Suchergebnisse für «${searchQuery}».`
                  : `No search results matching "${searchQuery}".`
                : t('feed.empty')}
            </p>
            {isEditor && (
              <button
                className="nzz-btn-action dark mt-4"
                onClick={() => openCreateArticle('import')}
              >
                <Plus size={14} />
                <span>{t('role.import_btn')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="nzz-broadsheet-stream">
            {/* 1. Hero Lead Section (70/30 Asymmetry when full width) */}
            {heroArticle && (
              <section className="nzz-hero-showcase">
                <div className="nzz-hero-primary">
                  <ArticleCard
                    article={heroArticle}
                    variant="hero"
                    onOpen={(item) => void openArticle(item.id)}
                  />
                </div>

                {sideArticles.length > 0 && (
                  <aside className="nzz-hero-rail">
                    <div className="nzz-rail-header">
                      <span>{t('feed.more_analyses').toUpperCase()}</span>
                    </div>
                    <div className="nzz-rail-items">
                      {sideArticles.map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          variant="compact"
                          onOpen={(item) => void openArticle(item.id)}
                        />
                      ))}
                    </div>
                  </aside>
                )}
              </section>
            )}

            {/* 2. Remaining Articles Grid */}
            {remainingArticles.length > 0 && (
              <section className="nzz-stream-section">
                <div className="nzz-stream-divider">
                  <span className="nzz-stream-divider-label">
                    {t('feed.all_analyses').toUpperCase()}
                  </span>
                </div>
                <div className="nzz-articles-grid">
                  {remainingArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="standard"
                      onOpen={(item) => void openArticle(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Docked 1/3 Interactive Geopolitical 3D Globe */}
      {isGlobeOpen && (
        <aside
          className="nzz-docked-globe-col"
          aria-label={language === 'de' ? 'Interaktiver Globus Dock' : 'Interactive Globe Dock'}
        >
          <Suspense
            fallback={
              <div className="nzz-docked-loading">
                <RefreshCw className="spin" size={20} />
                <span>
                  {language === 'de' ? '3D Globus wird geladen…' : 'Loading 3D Globe…'}
                </span>
              </div>
            }
          >
            <StoryGlobeExplorer docked={true} onClose={() => setIsGlobeOpen(false)} />
          </Suspense>
        </aside>
      )}
    </div>
  );
};
