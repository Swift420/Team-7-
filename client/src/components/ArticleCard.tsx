import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileJson, FileText, Layers, Image as ImageIcon, Trash2, ArrowRight } from 'lucide-react';
import { Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
    : 'Date unavailable';

interface CardSlide {
  slideNumber: number;
  label: string;
  badge: string;
  title: string;
  text: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onOpen }) => {
  const { isEditor } = useAuth();
  const { deleteArticle } = useArticles();
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'image'>('carousel');

  const imageUrl = article.teaserImage?.url;

  // Build 5 rich editorial overview slides for horizontal browsing without opening the article
  const slides: CardSlide[] = useMemo(() => {
    const paragraphs = article.body?.filter((b) => b.type === 'paragraph' && b.text?.trim()) || [];
    const p1 = paragraphs[0]?.text?.trim() || article.lead || 'In-depth analysis from the NZZ editorial team.';
    const p2 = paragraphs[1]?.text?.trim() || paragraphs[0]?.text?.trim() || 'Key developments shaping this report.';
    const p3 = paragraphs[2]?.text?.trim() || paragraphs[paragraphs.length - 1]?.text?.trim() || 'Analytical context and structural implications.';

    return [
      {
        slideNumber: 1,
        label: '1 / 5',
        badge: article.section || 'NZZ Analysis',
        title: article.headline,
        text: article.lead || p1.slice(0, 160) + '…',
      },
      {
        slideNumber: 2,
        label: '2 / 5',
        badge: 'Core Context',
        title: 'The Defining Development',
        text: p1.slice(0, 200) + (p1.length > 200 ? '…' : ''),
      },
      {
        slideNumber: 3,
        label: '3 / 5',
        badge: 'Evidence & Impact',
        title: 'Key Numbers & Realities',
        text: p2.slice(0, 200) + (p2.length > 200 ? '…' : ''),
      },
      {
        slideNumber: 4,
        label: '4 / 5',
        badge: 'Analysis & Friction',
        title: 'Strategic Divergence',
        text: p3.slice(0, 200) + (p3.length > 200 ? '…' : ''),
      },
      {
        slideNumber: 5,
        label: '5 / 5',
        badge: 'Editorial Verdict',
        title: 'NZZ Conclusion',
        text: 'Comprehensive assessment and future scenarios in the full dossier.',
      },
    ];
  }, [article]);

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(`Delete article: "${article.headline}"?`)) {
      await deleteArticle(article.id);
    }
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveSlide(index);
  };

  const currentSlide = slides[activeSlide];

  return (
    <article className="article-card" onClick={() => onOpen(article)}>
      {/* Top Carousel Area with Horizontal Pagination */}
      <div className="article-card-cover relative group" style={{ minHeight: '230px', height: 'auto', background: '#090d16' }}>
        {viewMode === 'image' && imageUrl ? (
          <div className="relative w-full h-[230px] overflow-hidden">
            <img src={imageUrl} alt="" loading="lazy" className="cover-img w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        ) : (
          /* Horizontal 5-Slide Carousel Overview */
          <div
            className="w-full p-4 flex flex-col justify-between min-h-[230px] relative overflow-hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(145deg, #101726 0%, #080c14 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Slide Header: Badge + Pagination Counter */}
            <div className="flex items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/40">
                  {currentSlide.badge}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                <Layers size={11} className="text-slate-400" />
                <span>{currentSlide.label}</span>
              </div>
            </div>

            {/* Slide Content Body */}
            <div className="my-2.5 z-10 flex-1 flex flex-col justify-center">
              <h4 className="text-sm font-bold text-white font-serif line-clamp-2 leading-snug mb-1.5">
                {currentSlide.title}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {currentSlide.text}
              </p>
            </div>

            {/* Pagination Controls & Navigation Dots */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 z-10" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                onClick={handlePrevSlide}
                title="Previous slide"
              >
                <ChevronLeft size={14} />
              </button>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleDotClick(e, idx)}
                    className={`transition-all rounded-full ${
                      idx === activeSlide
                        ? 'w-4 h-1.5 bg-red-500'
                        : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                onClick={handleNextSlide}
                title="Next slide"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* View Mode Switcher Pill (Carousel vs Photo) */}
        {imageUrl && (
          <button
            type="button"
            className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-black/70 hover:bg-black text-[10px] text-slate-300 border border-slate-700 backdrop-blur-sm flex items-center gap-1 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode((m) => (m === 'carousel' ? 'image' : 'carousel'));
            }}
            title={viewMode === 'carousel' ? 'Show Photo' : 'Show 5-Slide Carousel Overview'}
          >
            {viewMode === 'carousel' ? (
              <>
                <ImageIcon size={10} />
                <span>Photo</span>
              </>
            ) : (
              <>
                <Layers size={10} />
                <span>Carousel (5)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="article-card-body">
        <div className="article-card-meta">
          <span className="category-badge">{article.section || 'Uncategorised'}</span>
          <span className="read-time">
            <Calendar size={12} /> {formatDate(article.publishedAt)}
          </span>
        </div>

        <h3 className="article-card-title">{article.headline}</h3>
        {article.lead && <p className="article-card-excerpt">{article.lead}</p>}

        <div className="article-card-footer">
          <div className="author-info-sm">
            <span className="author-name">{article.authorLine || 'Author unavailable'}</span>
            <span className="author-title">
              {article.sourceFormat === 'NZZ_JSON' ? <FileJson size={12} /> : <FileText size={12} />}{' '}
              {article.sourceFormat === 'NZZ_JSON' ? 'NZZ JSON' : 'Markdown'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 hover:text-indigo-300">
              Read <ArrowRight size={12} />
            </span>
            {isEditor && (
              <button className="btn-toolbar-delete" onClick={handleDelete} title="Delete article">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
