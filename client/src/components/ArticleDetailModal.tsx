import React from 'react';
import { ArrowLeft, Calendar, ExternalLink, FileBarChart, Trash2, X } from 'lucide-react';
import { Article, ArticleBodyElement } from '../types';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';

interface ArticleDetailModalProps { article: Article | null; onClose: () => void }

const renderElement = (element: ArticleBodyElement) => {
  if (element.type === 'heading') {
    return element.level && element.level >= 3
      ? <h3 key={element.id} className="article-h3">{element.text}</h3>
      : <h2 key={element.id} className="article-h2">{element.text}</h2>;
  }
  if (element.type === 'image' && element.url) {
    return <figure key={element.id} className="article-inline-figure"><img src={element.url} alt={element.caption || ''} />{(element.caption || element.credit) && <figcaption>{element.caption}{element.credit && ` — ${element.credit}`}</figcaption>}</figure>;
  }
  if (element.type === 'q_tool_embed') {
    return <aside key={element.id} className="existing-visual-placeholder"><FileBarChart size={22} /><span>Existing data visualization</span></aside>;
  }
  if (element.type === 'embed') {
    return <aside key={element.id} className="existing-visual-placeholder"><span>Embedded media{element.service ? ` · ${element.service}` : ''}</span></aside>;
  }
  if (element.text) return <p key={element.id} className="article-p">{element.text}</p>;
  return null;
};

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
        <article className="article-content-body">{article.body?.map(renderElement)}</article>
      </div>
    </div>
  </div>;
};
