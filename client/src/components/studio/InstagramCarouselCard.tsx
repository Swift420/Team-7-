import React, { useState, useRef } from 'react';
import { ChevronRight, Download, Share2 } from 'lucide-react';
import type { InstagramCarouselFormat, CarouselSlide } from '../../types/liquid';
import { AssetStatus } from './types';
import { downloadAllSlidesAsZip } from '../../utils/exportCarousel';

// NZZ Instagram Outline Icon
const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface InstagramCarouselCardProps {
  carousel?: InstagramCarouselFormat;
  status: AssetStatus;
  articleHeadline?: string;
  onShare: (carousel: InstagramCarouselFormat) => void;
  onToast: (msg: string) => void;
  language?: 'en' | 'de';
}

export const InstagramCarouselCard: React.FC<InstagramCarouselCardProps> = ({
  carousel,
  status,
  articleHeadline = 'Scientists May Have Just Caught Gravity Behaving Quantum Mechanically',
  onShare,
  onToast,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const stripRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Default fallback slides matching the exact mockup
  const slides: CarouselSlide[] = carousel?.slides && carousel.slides.length > 0
    ? carousel.slides
    : [
        {
          slideNumber: 1,
          slideType: 'cover',
          headline: 'Gravity Behaves Quantum Mechanically',
          bodyText: 'Scientists may have just caught gravity behaving quantum mechanically in a landmark experiment.',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
          badge: 'Focus',
        },
        {
          slideNumber: 2,
          slideType: 'context',
          headline: 'A long-standing mystery',
          bodyText: 'For decades, physicists have tried to unify gravity and quantum mechanics.',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
        },
        {
          slideNumber: 3,
          slideType: 'data_point',
          headline: 'A new experiment',
          bodyText: 'Using ultracold atoms, researchers observed a quantum effect of gravity.',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
        },
        {
          slideNumber: 4,
          slideType: 'context',
          headline: 'What it could mean',
          bodyText: 'A step closer to a unified theory — and a new window into the universe.',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
        },
        {
          slideNumber: 5,
          slideType: 'consequences',
          headline: 'Science for a more complete picture.',
          bodyText: 'NZZ International provides deep reporting on fundamental physics.',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
        },
        {
          slideNumber: 6,
          slideType: 'outro',
          headline: 'Read the full analysis on nzz.ch',
          bodyText: 'Link in bio',
          theme: 'dark',
          hasImage: false,
          imagePrompt: '',
        },
      ];

  const totalSlides = slides.length;

  const scrollNext = () => {
    if (stripRef.current) {
      const cardWidth = 120;
      stripRef.current.scrollBy({ left: cardWidth * 2, behavior: 'smooth' });
    }
    setActiveSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const validElements = slideRefs.current.filter((el): el is HTMLDivElement => el !== null);
      if (validElements.length > 0) {
        await downloadAllSlidesAsZip(validElements, `nzz-carousel-${Date.now()}.zip`);
        onToast(isDe ? `${totalSlides} Slides als ZIP heruntergeladen` : `Downloaded ${totalSlides} slides as ZIP`);
      } else {
        onToast(isDe ? 'Download wird vorbereitet...' : 'Preparing slide downloads...');
      }
    } catch (err) {
      console.error('Download error:', err);
      onToast(isDe ? 'Download fehlgeschlagen' : 'Download failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareClick = () => {
    const activeCarousel: InstagramCarouselFormat = carousel || {
      title: articleHeadline,
      aspectRatio: '4:5',
      theme: 'dark',
      slides,
      captionText: `${articleHeadline}\n\nSwipe through for the breakdown →\n\nRead the full investigation on nzz.ch/international`,
      hashtags: ['#NZZ', '#Physics', '#QuantumMechanics', '#Science'],
      approved: true,
    };
    onShare(activeCarousel);
  };

  return (
    <article className="nzz-asset-card" aria-label="Instagram Carousel format">
      {/* Card Header */}
      <div className="nzz-asset-card-header">
        <div className="nzz-asset-card-header-left">
          <div className="nzz-asset-icon-box" style={{ color: '#e1306c' }}>
            <InstagramIcon size={18} />
          </div>
          <div className="nzz-asset-card-titles">
            <h3 className="nzz-asset-card-title">Instagram Carousel</h3>
            <span className="nzz-asset-card-desc">
              {isDe ? 'Eine visuell ansprechende Zusammenfassung für Instagram.' : 'A visually engaging summary for Instagram.'}
            </span>
          </div>
        </div>

        <div className={`nzz-asset-status-pill ${status}`}>
          <span className="nzz-status-dot" />
          <span>{status === 'ready' ? (isDe ? 'Bereit' : 'Ready') : status === 'generating' ? (isDe ? 'Erstellt...' : 'Generating...') : 'Ready'}</span>
        </div>
      </div>

      {/* Horizontal Slide Strip (5 visible slides) */}
      <div className="nzz-carousel-viewport">
        <div
          className="nzz-carousel-strip"
          ref={stripRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            const progress = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
            const index = Math.min(totalSlides - 1, Math.round(progress * (totalSlides - 1)));
            setActiveSlideIndex(index);
          }}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.slideNumber || idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className="nzz-carousel-slide-item"
              onClick={() => setActiveSlideIndex(idx)}
              style={{
                outline: activeSlideIndex === idx ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
              }}
            >
              <div className="nzz-carousel-slide-header">
                <span className="nzz-carousel-slide-logo">NZZ</span>
                {idx === 0 && (
                  <span className="text-[7px] tracking-wider uppercase text-red-500 font-bold">
                    Focus
                  </span>
                )}
              </div>

              <div className="nzz-carousel-slide-content">
                {slide.badge && (
                  <span className="nzz-carousel-slide-kicker">{slide.badge}</span>
                )}
                <h4 className="nzz-carousel-slide-headline">
                  {slide.headline}
                </h4>
                {slide.bodyText && (
                  <p className="nzz-carousel-slide-body">
                    {slide.bodyText}
                  </p>
                )}
              </div>

              <div className="nzz-carousel-slide-footer">
                <span>{idx + 1}/{totalSlides}</span>
                <span className="text-[7px] text-neutral-400">nzz.ch</span>
              </div>
            </div>
          ))}
        </div>

        {/* Next navigation arrow */}
        <button
          type="button"
          className="nzz-carousel-next-btn"
          onClick={scrollNext}
          aria-label="Next slides"
          title="Next slide"
        >
          <ChevronRight size={16} />
        </button>

        {/* Pagination Dots */}
        <div className="nzz-carousel-dots-row" role="tablist">
          {slides.slice(0, 5).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`nzz-carousel-dot ${activeSlideIndex === i ? 'active' : ''}`}
              onClick={() => {
                setActiveSlideIndex(i);
                if (stripRef.current) {
                  const cardWidth = 120;
                  stripRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
                }
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Social Export Actions (2-Button Row) */}
      <div className="nzz-social-actions-row">
        <button
          type="button"
          className="nzz-btn-export-secondary"
          onClick={handleDownloadZip}
          disabled={isExporting}
        >
          <Download size={14} />
          <span>
            {isExporting
              ? (isDe ? 'Wird exportiert...' : 'Exporting...')
              : (isDe ? `Download (${totalSlides} Slides)` : `Download (${totalSlides} slides)`)}
          </span>
        </button>

        <button
          type="button"
          className="nzz-btn-export-primary"
          onClick={handleShareClick}
        >
          <Share2 size={14} />
          <span>{isDe ? 'Auf Instagram teilen' : 'Share to Instagram'}</span>
        </button>
      </div>
    </article>
  );
};
