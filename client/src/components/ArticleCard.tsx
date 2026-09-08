import React from 'react';
import { Clock, Eye, Heart, Edit3, Trash2, Sparkles, FileText } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onOpen }) => {
  const { isEditor } = useAuth();
  const { togglePublish, deleteArticle, setEditingArticle, setIsCreateModalOpen, likeArticle } =
    useArticles();

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArticle(article);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete article: "${article.title}"?`)) {
      deleteArticle(article.id);
    }
  };

  const handleTogglePublish = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePublish(article.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeArticle(article.id);
  };

  return (
    <article className="article-card" onClick={() => onOpen(article)}>
      {/* Cover Image */}
      <div className="article-card-cover">
        <img
          src={article.coverImage}
          alt={article.title}
          loading="lazy"
          className="cover-img"
        />
        <div className="cover-tags">
          <span className="category-badge">{article.category}</span>
          {article.status === 'draft' ? (
            <span className="status-badge-draft">
              <FileText size={12} /> Draft
            </span>
          ) : (
            <span className="status-badge-pub">
              <Sparkles size={12} /> Published
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="article-card-body">
        <div className="article-card-meta">
          <span className="read-time">
            <Clock size={12} /> {article.readTimeMinutes} min read
          </span>
          <span className="bullet-sep">•</span>
          <span className="card-date">{article.publishedAt}</span>
        </div>

        <h3 className="article-card-title">{article.title}</h3>
        <p className="article-card-excerpt">{article.excerpt}</p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="card-tags-list">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author info & stats */}
        <div className="article-card-footer">
          <div className="author-cluster">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="author-avatar-sm"
            />
            <div className="author-info-sm">
              <span className="author-name">{article.author.name}</span>
              <span className="author-title">{article.author.role}</span>
            </div>
          </div>

          <div className="card-stats">
            <button
              className="stat-btn heart-stat"
              onClick={handleLike}
              title="Like article"
            >
              <Heart size={14} className="icon-heart" />
              <span>{article.likes}</span>
            </button>
            <span className="stat-item views-stat" title="Total views">
              <Eye size={14} />
              <span>{article.views}</span>
            </span>
          </div>
        </div>

        {/* Editor Quick Actions Bar */}
        {isEditor && (
          <div className="card-editor-toolbar" onClick={(e) => e.stopPropagation()}>
            <span className="toolbar-label">Editor Actions:</span>
            <div className="toolbar-buttons">
              <button
                className={`btn-toolbar-toggle ${article.status === 'published' ? 'published' : 'draft'}`}
                onClick={handleTogglePublish}
                title={article.status === 'published' ? 'Change to Draft' : 'Publish Article'}
              >
                <Sparkles size={12} />
                <span>{article.status === 'published' ? 'Unpublish' : 'Publish'}</span>
              </button>
              <button className="btn-toolbar-edit" onClick={handleEdit} title="Edit article">
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
              <button className="btn-toolbar-delete" onClick={handleDelete} title="Delete article">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
