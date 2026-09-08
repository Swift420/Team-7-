import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, Sparkles, Hash, Image as ImageIcon } from 'lucide-react';
import type { InstagramCarouselFormat, CarouselSlide } from '../../types/liquid';

interface CarouselPreviewProps {
  carousel: InstagramCarouselFormat;
  onUpdateSlide?: (updatedSlide: CarouselSlide) => void;
  onUpdateCaption?: (caption: string) => void;
}

export const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  carousel,
  onUpdateSlide,
  onUpdateCaption,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const slides = carousel.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0];

  const handlePrev = () => {
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNext = () => {
    setActiveSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handleCopyCaption = () => {
    const fullText = `${carousel.captionText}\n\n${carousel.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentSlide) {
    return <div className="p-8 text-center text-slate-500">No carousel slides generated.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 4:5 Carousel Card Mockup */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="w-[320px] aspect-[4/5] bg-slate-950 rounded-2xl p-6 shadow-2xl border-2 border-slate-700 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle NZZ background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-slate-950 to-black z-0" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl pointer-events-none" />

          {/* Top Header: Monogram & Slide Counter */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-red-600 text-white font-serif font-black text-[11px] flex items-center justify-center">
                N
              </span>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                NZZ Dossier
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              Slide {currentSlide.slideNumber} / {slides.length}
            </span>
          </div>

          {/* Center Content based on Slide Type */}
          <div className="relative z-10 my-auto space-y-4">
            <span className="text-[9px] uppercase font-bold tracking-widest text-red-400 block">
              {currentSlide.slideType.replace('_', ' ')}
            </span>

            <h3 className="text-xl font-bold text-white font-serif leading-tight">
              {currentSlide.headline}
            </h3>

            {currentSlide.metricHighlight && (
              <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-3 text-center">
                <div className="text-3xl font-extrabold text-red-500 font-mono">
                  {currentSlide.metricHighlight.value}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {currentSlide.metricHighlight.label}
                </div>
              </div>
            )}

            {currentSlide.quote && (
              <div className="border-l-2 border-red-500 pl-3 py-1 text-slate-200">
                <p className="text-sm italic font-serif">
                  {currentSlide.quote.text}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  — {currentSlide.quote.speaker}
                </p>
              </div>
            )}

            {currentSlide.bodyText && (
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {currentSlide.bodyText}
              </p>
            )}
          </div>

          {/* Bottom Controls / Swipe Prompt */}
          <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] text-slate-400">
            <span>Swipe for next slide &rarr;</span>
            <div className="flex gap-1">
              {slides.map((s, idx) => (
                <div
                  key={s.slideNumber}
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeSlideIndex === idx ? 'bg-red-500' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide Edit & Social Caption Controls */}
      <div className="lg:col-span-7 space-y-4">
        {/* Navigation Toolbar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-xs font-semibold text-slate-300">
            Folie {currentSlide.slideNumber} von {slides.length} ({currentSlide.slideType})
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Editor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Slide Headline
            </label>
            <input
              type="text"
              value={currentSlide.headline}
              onChange={(e) =>
                onUpdateSlide?.({ ...currentSlide, headline: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                Google Imagen 3 Background Prompt
              </label>
              <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                Imagen 3 Ready
              </span>
            </div>
            <textarea
              rows={2}
              value={currentSlide.imagePrompt}
              onChange={(e) =>
                onUpdateSlide?.({ ...currentSlide, imagePrompt: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Ready-to-Publish Instagram Caption & Hashtags */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Social Media Caption & Editorial Copy
            </span>
            <button
              onClick={handleCopyCaption}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Caption & Hashtags'}
            </button>
          </div>

          <textarea
            rows={3}
            value={carousel.captionText}
            onChange={(e) => onUpdateCaption?.(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />

          <div className="flex flex-wrap gap-1.5 items-center">
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            {carousel.hashtags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-900"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
