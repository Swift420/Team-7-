import React, { Suspense, useState } from 'react';
import { FileText, Globe2, Plus, RefreshCw } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { ArticleCard } from './ArticleCard';
const StoryGlobeExplorer = React.lazy(() => import('./StoryGlobeExplorer').then((module) => ({ default: module.StoryGlobeExplorer })));

export const ArticleFeed: React.FC = () => {
  const { articles, loading, error, selectedCategory, searchQuery, openArticle, openCreateArticle, refreshArticles } = useArticles();
  const { isEditor } = useAuth();
  const [globeOpen, setGlobeOpen] = useState(false);
  const query = searchQuery.trim().toLowerCase();
  const filtered = articles.filter((article) => {
    const categoryMatches = selectedCategory === 'all' || article.section === selectedCategory;
    const searchMatches = !query || [article.headline, article.lead, article.authorLine, article.section, ...article.tags]
      .some((value) => value?.toLowerCase().includes(query));
    return categoryMatches && searchMatches;
  });

  return <div className="article-feed-container">
    {!globeOpen && <button className="story-globe-launcher" onClick={() => setGlobeOpen(true)} aria-label="Open global story explorer"><Globe2 size={17} /><span>Explore globally</span></button>}
    {globeOpen && <Suspense fallback={<div className="story-globe-loading"><RefreshCw className="spin" size={18} /> Loading global story explorer…</div>}><StoryGlobeExplorer onClose={() => setGlobeOpen(false)} /></Suspense>}
    <div className="section-header-banner">
      <div className="header-text-group">
        <h2 className="feed-title">{selectedCategory === 'all' ? 'Articles' : selectedCategory}</h2>
        <p className="feed-desc">Structured source articles ready for editorial review and future Visual Velocity analysis.</p>
      </div>
      <div className="header-action-group">
        <button className="btn-secondary" onClick={() => void refreshArticles()}><RefreshCw size={15} /> Refresh</button>
        {isEditor && <><button className="btn-feed-create" onClick={() => openCreateArticle('import')}><Plus size={16} /> Import Article</button><button className="btn-feed-create" onClick={() => openCreateArticle('create')}><Plus size={16} /> Create Article</button></>}
        <div className="articles-count-badge"><strong>{filtered.length}</strong> {filtered.length === 1 ? 'Article' : 'Articles'}</div>
      </div>
    </div>
    {error && <div className="form-error-banner">{error}</div>}
    {loading ? <div className="empty-state-box"><RefreshCw className="spin" /><p>Loading articles from PostgreSQL…</p></div>
      : filtered.length ? <section className="articles-grid">{filtered.map((article) => <ArticleCard key={article.id} article={article} onOpen={(item) => void openArticle(item.id)} />)}</section>
      : <div className="empty-state-box"><FileText size={48} className="empty-icon" /><h3>No articles found</h3><p>{query ? `No imported articles matched “${searchQuery}”.` : 'Import the supplied JSON dataset or upload an article to begin.'}</p>{isEditor && <button className="btn-create-empty" onClick={() => openCreateArticle('import')}><Plus size={16} /> Import Article</button>}</div>}
  </div>;
};
