import React, { useState } from 'react';
import {
  X,
  Heart,
  Share2,
  Calendar,
  Clock,
  Eye,
  Edit3,
  Trash2,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { Article } from '../types';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose }) => {
  const { likeArticle, togglePublish, deleteArticle, setEditingArticle, setIsCreateModalOpen } =
    useArticles();
  const { isEditor, currentUser } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!article) return null;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setEditingArticle(article);
    setIsCreateModalOpen(true);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
      deleteArticle(article.id);
      onClose();
    }
  };

  const renderContent = (rawText: string) => {
    const blocks = rawText.split('\n\n');
    return blocks.map((block, i) => {
      if (block.startsWith('## ')) {
        return <h2 key={i} className="article-h2">{block.replace('## ', '')}</h2>;
      }
      if (block.startsWith('### ')) {
        return <h3 key={i} className="article-h3">{block.replace('### ', '')}</h3>;
      }
      if (block.startsWith('> ')) {
        return (
          <blockquote key={i} className="article-quote">
            {block.replace('> ', '')}
          </blockquote>
        );
      }
      if (block.startsWith('```')) {
        const cleaned = block.replace(/```[a-z]*/g, '').trim();
        return (
          <pre key={i} className="article-code-block">
            <code>{cleaned}</code>
          </pre>
        );
      }
      if (block.startsWith('- ')) {
        const items = block.split('\n').map((li) => li.replace('- ', '').trim());
        return (
          <ul key={i} className="article-ul">
            {items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        );
      }
      return <p key={i} className="article-p">{block}</p>;
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window article-detail-window" onClick={(e) => e.stopPropagation()}>
        {/* Top Floating Bar */}
        <div className="article-detail-nav">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={16} /> Back to Articles
          </button>
          
          <div className="nav-actions-right">
            {isEditor && (
              <div className="editor-badge-chip">
                <span>Editor View</span>
              </div>
            )}
            <button className="modal-close-btn" onClick={onClose} aria-label="Close article">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Editor Controls Toolbar (if logged in as Editor) */}
        {isEditor && (
          <div className="editor-actions-banner">
            <div className="editor-banner-status">
              <span className={`status-pill status-${article.status}`}>
                {article.status === 'published' ? '● Published Live' : '● Draft Mode (Editor Only)'}
              </span>
              <span className="editor-banner-hint">You have editor privileges on this article</span>
            </div>
            <div className="editor-action-buttons">
              <button
                className={`btn-toggle-pub ${article.status === 'published' ? 'is-published' : ''}`}
                onClick={() => togglePublish(article.id)}
                title={article.status === 'published' ? 'Switch back to Draft' : 'Publish to live feed'}
              >
                <Sparkles size={14} />
                <span>{article.status === 'published' ? 'Unpublish (Make Draft)' : 'Publish Live'}</span>
              </button>
              <button className="btn-edit" onClick={handleEdit}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        <div className="article-detail-scroll">
          {/* Hero Header */}
          <div className="article-hero-wrap">
            <img src={article.coverImage} alt={article.title} className="article-hero-img" />
            <div className="article-hero-gradient"></div>
            <div className="article-hero-meta">
              <span className="hero-category-badge">{article.category}</span>
              <h1 className="article-hero-title">{article.title}</h1>
              {article.subtitle && <p className="article-hero-sub">{article.subtitle}</p>}
            </div>
          </div>

          {/* Metadata bar */}
          <div className="article-meta-bar">
            <div className="author-card-row">
              <img src={article.author.avatar} alt={article.author.name} className="author-img-lg" />
              <div>
                <div className="author-name-lg">{article.author.name}</div>
                <div className="author-role-lg">{article.author.role}</div>
              </div>
            </div>

            <div className="article-metrics-row">
              <span className="metric-item">
                <Calendar size={14} /> {article.publishedAt}
              </span>
              <span className="metric-item">
                <Clock size={14} /> {article.readTimeMinutes} min read
              </span>
              <span className="metric-item">
                <Eye size={14} /> {article.views.toLocaleString()} views
              </span>
            </div>
          </div>

          {/* Excerpt Callout */}
          <div className="article-excerpt-highlight">
            <p>{article.excerpt}</p>
          </div>

          {/* Article Main Body */}
          <article className="article-content-body">
            {renderContent(article.content)}
          </article>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="article-tags-cluster">
              <span className="tags-label">Tagged:</span>
              {article.tags.map((tag) => (
                <span key={tag} className="article-tag-pill">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reaction & Share Footer */}
          <div className="article-footer-interactions">
            <div className="interaction-left">
              <button
                className="like-btn"
                onClick={() => likeArticle(article.id)}
                title="Clap / Like this article"
              >
                <Heart size={18} className="icon-heart" />
                <span>{article.likes} Likes</span>
              </button>
              <button className="share-btn" onClick={handleShare} title="Share article link">
                {copied ? <Check size={18} className="icon-green" /> : <Share2 size={18} />}
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>

            <div className="interaction-right">
              <span className="user-indicator-text">
                Browsing as <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
