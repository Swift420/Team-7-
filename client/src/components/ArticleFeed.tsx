import React from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { ArticleCard } from './ArticleCard';
import { AccessControlNotice } from './AccessControlNotice';
import { AnalyticsView } from './AnalyticsView';
import { ARTICLE_CATEGORIES } from '../data/mockArticles';

export const ArticleFeed: React.FC = () => {
  const {
    articles,
    selectedCategory,
    searchQuery,
    setSelectedArticle,
    setIsCreateModalOpen,
  } = useArticles();
  const { isEditor } = useAuth();

  // If Analytics Hub is selected, render AnalyticsView
  if (selectedCategory === 'analytics-hub') {
    return <AnalyticsView />;
  }

  // If Editor Desk is selected and user is NOT an editor, show access control notice!
  if (selectedCategory === 'editor-desk' && !isEditor) {
    return (
      <AccessControlNotice
        title="Restricted Section: Editor Desk & Drafts"
        description="This section contains unpublished draft stories, review queues, and publishing tools reserved strictly for Editors. Viewers can only view published articles in public sections."
      />
    );
  }

  // Filter articles by category & search query
  let filtered = articles;

  // Filter out drafts for viewers: Viewers can ONLY see published articles!
  if (!isEditor) {
    filtered = filtered.filter((a) => a.status === 'published');
  }

  // Filter by category
  if (selectedCategory === 'editor-desk') {
    // Show only drafts in the desk
    filtered = filtered.filter((a) => a.status === 'draft');
  } else if (selectedCategory !== 'all') {
    const matchedCategory = ARTICLE_CATEGORIES.find((c) => c.slug === selectedCategory);
    if (matchedCategory) {
      filtered = filtered.filter((a) => a.category === matchedCategory.name);
    }
  }

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q) ||
        a.author.name.toLowerCase().includes(q)
    );
  }

  const currentCategoryMeta = ARTICLE_CATEGORIES.find((c) => c.slug === selectedCategory);
  const featuredArticle =
    selectedCategory === 'all' && !searchQuery ? articles.find((a) => a.featured && a.status === 'published') : null;
  const regularArticles = featuredArticle
    ? filtered.filter((a) => a.id !== featuredArticle.id)
    : filtered;

  return (
    <div className="article-feed-container">
      {/* Category Section Header */}
      <div className="section-header-banner">
        <div className="header-text-group">
          <div className="section-badge-row">
            <span className="section-type-pill">
              {selectedCategory === 'editor-desk' ? 'Internal Workspace' : 'Editorial Section'}
            </span>
            {selectedCategory === 'editor-desk' && (
              <span className="editor-access-tag">
                <Shield size={12} /> Editor Privileges Active
              </span>
            )}
          </div>
          <h2 className="feed-title">
            {currentCategoryMeta?.name || 'Articles'}
          </h2>
          <p className="feed-desc">
            {currentCategoryMeta?.description || 'Browse published articles and editorial stories.'}
          </p>
        </div>

        {/* Section Right Action */}
        <div className="header-action-group">
          {isEditor && (
            <button
              className="btn-feed-create"
              onClick={() => setIsCreateModalOpen(true)}
              title="Create a new article"
            >
              <Plus size={16} />
              <span>New Article</span>
            </button>
          )}

          <div className="articles-count-badge">
            <strong>{filtered.length}</strong> {filtered.length === 1 ? 'Article' : 'Articles'}
          </div>
        </div>
      </div>

      {/* Featured Article Hero (only shown on 'all' tab when no search) */}
      {featuredArticle && (
        <section className="featured-hero-card" onClick={() => setSelectedArticle(featuredArticle)}>
          <div className="featured-hero-image-wrap">
            <img
              src={featuredArticle.coverImage}
              alt={featuredArticle.title}
              className="featured-hero-img"
            />
            <span className="featured-lead-badge">
              <Sparkles size={12} /> Lead Feature
            </span>
          </div>

          <div className="featured-hero-content">
            <div className="featured-meta-row">
              <span className="category-pill">{featuredArticle.category}</span>
              <span className="read-time-pill">
                <Clock size={12} /> {featuredArticle.readTimeMinutes} min read
              </span>
              <span className="bullet-sep">•</span>
              <span className="date-str">{featuredArticle.publishedAt}</span>
            </div>

            <h1 className="featured-title">{featuredArticle.title}</h1>
            {featuredArticle.subtitle && (
              <p className="featured-subtitle">{featuredArticle.subtitle}</p>
            )}
            <p className="featured-excerpt">{featuredArticle.excerpt}</p>

            <div className="featured-footer-row">
              <div className="featured-author-box">
                <img
                  src={featuredArticle.author.avatar}
                  alt={featuredArticle.author.name}
                  className="author-avatar-md"
                />
                <div>
                  <div className="author-name">{featuredArticle.author.name}</div>
                  <div className="author-role">{featuredArticle.author.role}</div>
                </div>
              </div>

              <div className="featured-read-btn">
                <span>Read Story</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      {filtered.length > 0 ? (
        <section className="articles-grid">
          {regularArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onOpen={(art) => setSelectedArticle(art)}
            />
          ))}
        </section>
      ) : (
        <div className="empty-state-box">
          <FileText size={48} className="empty-icon" />
          <h3>No articles found</h3>
          <p>
            {selectedCategory === 'editor-desk'
              ? 'No drafts currently in review. Click "+ Create Article" at the top to draft a new piece.'
              : searchQuery
              ? `No articles matched your search query "${searchQuery}".`
              : 'There are no articles available in this section yet.'}
          </p>
          {isEditor && (
            <button
              className="btn-create-empty"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} /> Create Article Now
            </button>
          )}
        </div>
      )}
    </div>
  );
};
