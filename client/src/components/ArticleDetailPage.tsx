import React from 'react';
import { ArrowLeft, Calendar, ExternalLink, Send, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { ArticleContent } from './ArticleContent';

export const ArticleDetailPage: React.FC<{ article: Article | null; loading?: boolean }> = ({ article, loading }) => {
  const { deleteArticle, publishArticle, closeArticle } = useArticles();
  const { isEditor } = useAuth();

  if (!article) return <div className="article-page-loading">{loading ? 'Loading article…' : 'Article not found.'}</div>;

  const handleDelete = async () => {
    if (window.confirm(`Delete article: "${article.headline}"?`)) {
      await deleteArticle(article.id);
      closeArticle();
    }
  };
  const handlePublish = async () => {
    await publishArticle(article.id);
  };

  return <div className="article-page">
    <div className="article-detail-nav article-page-nav">
      <button className="back-btn" onClick={closeArticle}><ArrowLeft size={16} /> Back to Articles</button>
      {isEditor && <div className="article-editor-actions">{article.publicationStatus === 'draft' && <button className="btn-publish-article" onClick={() => void handlePublish()}><Send size={14} /> Publish</button>}<button className="btn-delete" onClick={() => void handleDelete()}><Trash2 size={14} /> Delete</button></div>}
    </div>
    {article.teaserImage?.url && <div className="article-hero-wrap"><img src={article.teaserImage.url} alt="" className="article-hero-img" /><div className="article-hero-gradient" /></div>}
    <header className="database-article-header article-page-header">
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
  </div>;
};
