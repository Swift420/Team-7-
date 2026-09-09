import React from 'react';
import { ArrowLeft, Calendar, ExternalLink, Trash2, X } from 'lucide-react';
import { Article } from '../types';
import { useArticles } from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { ArticleContent } from './ArticleContent';

interface ArticleDetailModalProps { article: Article | null; onClose: () => void }

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose }) => {
  const { deleteArticle } = useArticles();
  const { isEditor } = useAuth();
  if (!article) return null;

  const handleDelete = async () => {
    if (window.confirm(`Delete article: "${article.headline}"?`)) { await deleteArticle(article.id); onClose(); }
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-window article-detail-window" onClick={(event) => event.stopPropagation()}>
      <div className="article-detail-nav">
        <button className="back-btn" onClick={onClose}><ArrowLeft size={16} /> Back to Articles</button>
        <div className="nav-actions-right">
          {isEditor && <button className="btn-delete" onClick={handleDelete}><Trash2 size={14} /> Delete</button>}
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
      </div>
      <div className="article-detail-scroll">
        {article.teaserImage?.url && <div className="article-hero-wrap"><img src={article.teaserImage.url} alt="" className="article-hero-img" /><div className="article-hero-gradient" /></div>}
        <header className="database-article-header">
          <span className="hero-category-badge">{article.section || 'Uncategorised'}</span>
          <h1 className="article-hero-title">{article.headline}</h1>
          {article.lead && <p className="article-hero-sub">{article.lead}</p>}
        </header>
        <div className="article-meta-bar">
          <div><div className="author-name-lg">{article.authorLine || 'Author unavailable'}</div><div className="author-role-lg">{article.language?.toUpperCase() || 'Language unavailable'} · {article.sourceFormat === 'NZZ_JSON' ? 'NZZ JSON' : 'Markdown import'}</div></div>
          <div className="article-metrics-row">
            <span className="metric-item"><Calendar size={14} /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Date unavailable'}</span>
            {article.sourceUrl && <a className="metric-item" href={article.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Original</a>}
          </div>
        </div>
        <ArticleContent article={article} isEditor={isEditor} />
      </div>
    </div>
  </div>;
};
