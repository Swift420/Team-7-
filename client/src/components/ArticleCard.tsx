import React from 'react';
import { Calendar, FileJson, FileText, Trash2 } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

interface ArticleCardProps { article: Article; onOpen: (article: Article) => void }

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
  : 'Date unavailable';

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onOpen }) => {
  const { isEditor } = useAuth();
  const { deleteArticle } = useArticles();
  const imageUrl = article.teaserImage?.url;

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Delete article: "${article.headline}"?`)) await deleteArticle(article.id);
  };

  return <article className="article-card" onClick={() => onOpen(article)}>
    {imageUrl && <div className="article-card-cover"><img src={imageUrl} alt="" loading="lazy" className="cover-img" /></div>}
    <div className="article-card-body">
      <div className="article-card-meta">
        <span className="category-badge">{article.section || 'Uncategorised'}</span>
        <span className="read-time"><Calendar size={12} /> {formatDate(article.publishedAt)}</span>
      </div>
      <h3 className="article-card-title">{article.headline}</h3>
      {article.lead && <p className="article-card-excerpt">{article.lead}</p>}
      <div className="article-card-footer">
        <div className="author-info-sm">
          <span className="author-name">{article.authorLine || 'Author unavailable'}</span>
          <span className="author-title">{article.sourceFormat === 'NZZ_JSON' ? <FileJson size={12} /> : <FileText size={12} />} {article.sourceFormat === 'NZZ_JSON' ? 'NZZ JSON' : 'Markdown'}</span>
        </div>
        {isEditor && <button className="btn-toolbar-delete" onClick={handleDelete} title="Delete article"><Trash2 size={14} /></button>}
      </div>
    </div>
  </article>;
};
