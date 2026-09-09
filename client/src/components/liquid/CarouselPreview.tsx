import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Download,
  FileArchive,
  Palette,
} from 'lucide-react';
import type {
  InstagramCarouselFormat,
  CarouselSlide,
  CarouselTheme,
} from '../../types/liquid';
import { generateSlideImage, generateDeckImagesApi } from '../../services/liquidApi';
import { SlideCanvas1080 } from './SlideCanvas1080';
import { downloadSlidePng, downloadAllSlidesAsZip } from '../../utils/exportCarousel';

interface CarouselPreviewProps {
  carousel: InstagramCarouselFormat;
  language?: 'en' | 'de';
  onUpdateSlide?: (updatedSlide: CarouselSlide) => void;
  onUpdateCaption?: (caption: string) => void;
}

export const CarouselPreview: React.FC<CarouselPreviewProps> = ({
  carousel,
  language = 'en',
  onUpdateSlide,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [deckProgress, setDeckProgress] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Headless PNG and ZIP export state
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);
  const [isExportingSingle, setIsExportingSingle] = useState<number | null>(null);

  // Live Theme Override for Editor Preview
  const [themeOverride, setThemeOverride] = useState<CarouselTheme | null>(null);

  // DOM Refs for high-res 1080x1350 canvas elements
  const activeSlideRef = useRef<HTMLDivElement | null>(null);
  const exportSlideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const slides = carousel?.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0];
  const isGerman = language === 'de';

  const effectiveTheme: CarouselTheme =
    themeOverride || currentSlide?.theme || carousel?.theme || 'dark';

  const handlePrev = () => {
    setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNext = () => {
    setActiveSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handleCopyCaption = () => {
    const fullText = `${carousel.captionText || ''}\n\n${(carousel.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Context-driven photorealistic image generation for active slide
  const handleGenerateImage = async () => {
    if (!currentSlide) return;
    setGeneratingImage(true);
    setImageError(null);
    try {
      const res = await generateSlideImage({
        prompt: currentSlide.imagePrompt || currentSlide.headline,
        aspectRatio: '4:5',
        headline: currentSlide.headline,
        category: carousel.detectedCategory,
        articleTitle: slides[0]?.headline,
        lead: currentSlide.bodyText,
        slideSummary: currentSlide.bodyText,
        bustCache: true,
        model: 'imagen-3.0-generate-002',
      });
      currentSlide.imageUrl = res.imageUrl;
      currentSlide.hasImage = true;
      if (onUpdateSlide) {
        onUpdateSlide({ ...currentSlide, imageUrl: res.imageUrl, hasImage: true });
      }
    } catch (err: any) {
      console.error('Failed to generate slide image:', err);
      setImageError(err.message || 'Image generation unavailable');
    } finally {
      setGeneratingImage(false);
    }
  };

  // Batch deck image generation for all visual slides (defaults to balanced 1, 3, 5 if none set)
  const handleGenerateAllImages = async () => {
    if (!slides.length) return;
    const visualSlides = slides.filter((s) => s.hasImage !== false);
    const targetSlides = visualSlides.length ? visualSlides : slides.filter((_, i) => i === 0 || i === 2 || i === 4);
    if (!targetSlides.length) {
      setImageError(isGerman ? 'Keine visuellen Folien vorhanden.' : 'No visual slides require generation.');
      return;
    }

    setGeneratingAllImages(true);
    setImageError(null);
    setDeckProgress(
      isGerman
        ? `Generiere ${targetSlides.length} fotorealistische Folien...`
        : `Generating ${targetSlides.length} photorealistic slides...`
    );

    try {
      const res = await generateDeckImagesApi({
        slides: targetSlides.map((s) => ({
          slideNumber: s.slideNumber,
          headline: s.headline,
          imagePrompt: s.imagePrompt,
          hasImage: true,
        })),
        headline: slides[0]?.headline,
        category: carousel.detectedCategory,
        lead: slides[0]?.bodyText,
        bustCache: true,
      });

      slides.forEach((s) => {
        if (res[s.slideNumber]?.imageUrl) {
          s.imageUrl = res[s.slideNumber].imageUrl;
          s.hasImage = true;
          if (onUpdateSlide) {
            onUpdateSlide({
              ...s,
              imageUrl: res[s.slideNumber].imageUrl,
              hasImage: true,
            });
          }
        }
      });
      setDeckProgress(
        isGerman
          ? `✓ ${targetSlides.length} Visual-Folien erfolgreich aktualisiert`
          : `✓ ${targetSlides.length} visual slides successfully updated`
      );
      setTimeout(() => setDeckProgress(null), 3500);
    } catch (err: any) {
      console.error('Failed to generate deck images:', err);
      setImageError(err.message || 'Deck photo generation unavailable');
    } finally {
      setGeneratingAllImages(false);
    }
  };

  // Export single slide to high-res 1080x1350 PNG
  const handleDownloadSingleSlide = async (slideIndex: number) => {
    const el = exportSlideRefs.current[slideIndex] || activeSlideRef.current;
    if (!el) {
      console.error('Slide DOM element not ready for export');
      return;
    }
    setIsExportingSingle(slideIndex);
    try {
      await downloadSlidePng(el, `slide_${slideIndex + 1}.png`);
    } catch (err: any) {
      console.error('PNG export error:', err);
      setImageError(isGerman ? 'PNG Export fehlgeschlagen' : 'PNG export failed');
    } finally {
      setIsExportingSingle(null);
    }
  };

  // Headless background export of all 7 slides into a single ZIP archive
  const handleDownloadZip = async () => {
    const validElements: HTMLDivElement[] = [];
    for (let i = 0; i < slides.length; i++) {
      const el = exportSlideRefs.current[i];
      if (el) validElements.push(el);
    }

    if (!validElements.length) {
      setImageError(isGerman ? 'Export-Elemente nicht bereit' : 'Export elements not ready');
      return;
    }

    setIsExportingZip(true);
    setExportProgressText(isGerman ? 'Vorbereitung...' : 'Preparing export...');
    try {
      const safeTitle = (slides[0]?.headline || 'nzz-carousel')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 30);
      const zipName = `${safeTitle}-instagram-carousel.zip`;

      await downloadAllSlidesAsZip(validElements, zipName, (current, total) => {
        setExportProgressText(
          isGerman
            ? `Rendere Folie ${current} von ${total}...`
            : `Rendering slide ${current} of ${total}...`
        );
      });
    } catch (err: any) {
      console.error('ZIP export error:', err);
      setImageError(isGerman ? 'ZIP Export fehlgeschlagen' : 'ZIP export failed');
    } finally {
      setIsExportingZip(false);
      setExportProgressText(null);
    }
  };

  if (!currentSlide) {
    return (
      <div className="p-8 text-center text-stone-500 font-serif">
        {isGerman ? 'Keine Karussell-Folien generiert.' : 'No carousel slides generated.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto animate-fade-in">
      {/* Offscreen 1080x1350 Canvas Instances for High-Res ZIP & PNG Export */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -99999,
          top: 0,
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {slides.map((s, idx) => (
          <SlideCanvas1080
            key={`export-slide-${idx}-${s.headline}`}
            ref={(el) => {
              exportSlideRefs.current[idx] = el;
            }}
            slide={s}
            slideIndex={idx}
            totalSlides={slides.length}
            theme={effectiveTheme}
            isGerman={isGerman}
          />
        ))}
      </div>

      {/* Top Toolbar: Theme Archetype Switcher & Production Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-[432px] px-1">
        {/* Theme Palette Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-900/90 border border-stone-800 p-1 rounded-xl shadow-inner">
          <Palette className="w-3.5 h-3.5 text-stone-400 ml-1" />
          {(['dark', 'sand', 'lavender', 'grey', 'white'] as CarouselTheme[]).map((thm) => (
            <button
              key={thm}
              onClick={() => setThemeOverride(thm)}
              className={`px-2.5 py-1 text-[11px] font-sans font-semibold rounded-lg capitalize transition-all ${
                effectiveTheme === thm
                  ? 'bg-red-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}
            >
              {thm}
            </button>
          ))}
        </div>

        {/* Headless Production ZIP Download Button */}
        <button
          onClick={handleDownloadZip}
          disabled={isExportingZip || !slides.length}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-60 cursor-pointer"
        >
          {isExportingZip ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="truncate">{exportProgressText || 'Exporting...'}</span>
            </>
          ) : (
            <>
              <FileArchive className="w-3.5 h-3.5" />
              <span>Download (.ZIP)</span>
            </>
          )}
        </button>
      </div>

      {/* Main 4:5 Portrait Viewport Canvas (Strict 1080x1350 scaled to 432x540) */}
      <div className="relative group">
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl border border-stone-800/80 bg-stone-950 select-none"
          style={{
            width: 432,
            height: 540,
          }}
        >
          {/* Scaled 1080x1350 Slide Canvas for 100% WYSIWYG Fidelity */}
          <div
            style={{
              width: 1080,
              height: 1350,
              transform: 'scale(0.4)',
              transformOrigin: 'top left',
            }}
          >
            <SlideCanvas1080
              ref={activeSlideRef}
              slide={currentSlide}
              slideIndex={activeSlideIndex}
              totalSlides={slides.length}
              theme={effectiveTheme}
              isGerman={isGerman}
            />
          </div>

          {/* Quick-Action Single Slide PNG Export Overlay on Canvas */}
          <button
            onClick={() => handleDownloadSingleSlide(activeSlideIndex)}
            disabled={isExportingSingle === activeSlideIndex}
            title={isGerman ? 'Diese Folie als PNG (1080x1350) herunterladen' : 'Download this slide as PNG (1080x1350)'}
            className="absolute top-3 right-3 z-30 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 backdrop-blur-sm shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[11px] font-sans font-semibold cursor-pointer"
          >
            {isExportingSingle === activeSlideIndex ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>PNG</span>
          </button>

          {/* Arrow Navigation Overlays */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-stone-700 shadow-md cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-stone-700 shadow-md cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Real-time Slide Image Generation Action Bar */}
      <div className="flex flex-col items-center gap-2 w-full max-w-[432px]">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          {/* Individual Slide Photo Generation (can add photo to any slide) */}
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage || generatingAllImages}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 disabled:opacity-50"
          >
            {generatingImage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                <span>{isGerman ? 'Synthetisiere...' : 'Generating...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>
                  {currentSlide.imageUrl
                    ? isGerman ? 'Folie erneuern (Imagen 3)' : 'Regenerate Photo (Imagen 3)'
                    : isGerman ? 'Foto hinzufügen / generieren' : 'Generate / Add Photo (AI)'}
                </span>
              </>
            )}
          </button>

          {/* Batch Deck Photo Generation (selectively triggers visual slides only) */}
          <button
            onClick={handleGenerateAllImages}
            disabled={generatingImage || generatingAllImages}
            className="flex-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-800/80 shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {generatingAllImages ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                <span className="truncate">{deckProgress || (isGerman ? 'Generiere Deck...' : 'Generating Deck...')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>{isGerman ? 'Visual-Fotos generieren (AI)' : 'Generate Visual Photos (AI)'}</span>
              </>
            )}
          </button>
        </div>

        {deckProgress && !generatingAllImages && (
          <div className="w-full text-center py-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
            {deckProgress}
          </div>
        )}

        {imageError && (
          <div className="w-full p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-[11px] text-red-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">{isGerman ? 'Bildgenerierungsfehler:' : 'Image Generation Error:'}</span>
              <span className="font-mono text-[10px] break-words">{imageError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Slide Navigation Thumbnails Strip with Individual PNG Download Buttons */}
      <div className="flex items-center gap-2.5 overflow-x-auto max-w-full pb-2 px-1">
        {slides.map((s, idx) => {
          const isSelected = idx === activeSlideIndex;
          const slideTheme = s.theme || effectiveTheme;
          return (
            <div
              key={idx}
              className={`group/thumb relative rounded-lg overflow-hidden border-2 transition-all flex flex-col justify-between p-1.5 text-[9px] cursor-pointer ${
                isSelected
                  ? 'border-red-600 scale-105 shadow-md ring-2 ring-red-600/30'
                  : 'border-stone-800 opacity-60 hover:opacity-100'
              }`}
              style={{
                width: 60,
                height: 75,
                backgroundColor:
                  slideTheme === 'sand'
                    ? '#E3C068'
                    : slideTheme === 'lavender'
                    ? '#E1DCE6'
                    : slideTheme === 'white'
                    ? '#FFFFFF'
                    : '#18181b',
              }}
              onClick={() => setActiveSlideIndex(idx)}
            >
              {s.imageUrl && (
                <img
                  src={s.imageUrl}
                  alt=""
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none"
                />
              )}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className="font-mono text-[8px] text-white bg-black/70 px-1 rounded">
                  {idx + 1}
                </span>

                {/* Individual Download PNG Action Icon on Thumbnail */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSingleSlide(idx);
                  }}
                  disabled={isExportingSingle === idx}
                  title={isGerman ? `Folie ${idx + 1} herunterladen` : `Download slide ${idx + 1}`}
                  className="p-1 rounded bg-black/80 hover:bg-red-600 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                >
                  {isExportingSingle === idx ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Download className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>

              <span
                className={`relative z-10 font-nzz-serif text-[7.5px] line-clamp-2 leading-tight font-bold ${
                  slideTheme === 'sand' || slideTheme === 'lavender' || slideTheme === 'white'
                    ? 'text-black'
                    : 'text-stone-200'
                }`}
              >
                {s.headline}
              </span>
            </div>
          );
        })}
      </div>

      {/* Copy Caption & Hashtags Bar */}
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="text-left w-full sm:w-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            {isGerman ? 'Instagram Legende & Tags' : 'Instagram Caption & Tags'}
          </div>
          <div className="text-xs text-stone-300 font-nzz-serif line-clamp-1 mt-0.5">
            {carousel.captionText || (isGerman ? 'NZZ Dossier Analyse' : 'NZZ In-Depth Dossier')}
          </div>
        </div>
        <button
          onClick={handleCopyCaption}
          className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-stone-700 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">{isGerman ? 'Kopiert' : 'Copied to Clipboard'}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-stone-400" />
              <span>{isGerman ? 'Legende kopieren' : 'Copy Caption & Hashtags'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
