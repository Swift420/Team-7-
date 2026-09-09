import { forwardRef } from 'react';
import type { CarouselSlide, CarouselTheme } from '../../types/liquid';
import { NzzLogo } from '../common/NzzLogo';
import { ArrowRight, BarChart3 } from 'lucide-react';

interface SlideCanvas1080Props {
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  theme: CarouselTheme;
  isGerman?: boolean;
}

/**
 * Strict 1080x1350px (4:5) slide canvas component for NZZ Instagram Carousels.
 * 
 * Safe Zone Architecture:
 * - Dimensions: 1080px × 1350px
 * - Top padding: 160px (clears Instagram native header/profile bar)
 * - Bottom padding: 220px (clears Instagram native carousel dots and actions)
 * - Horizontal margins: 90px on both left and right
 * - Usable content box: 900px × 970px
 */
export const SlideCanvas1080 = forwardRef<HTMLDivElement, SlideCanvas1080Props>(
  ({ slide, slideIndex, totalSlides, theme, isGerman = false }, ref) => {
    const isSlide1 = slideIndex === 0;
    const isSlide7 = slideIndex === totalSlides - 1;

    // Strict editorial theme palette adhering to NZZ Design System
    const themeConfigs = {
      dark: {
        bg: '#111111',
        text: '#FFFFFF',
        muted: 'rgba(255, 255, 255, 0.78)',
        subtle: 'rgba(255, 255, 255, 0.55)',
        divider: 'rgba(255, 255, 255, 0.15)',
        logoColor: 'white' as const,
        barBg: 'rgba(255, 255, 255, 0.15)',
        barFill: 'rgba(255, 255, 255, 0.45)',
        barHighlight: '#D80000',
        buttonBorder: '#FFFFFF',
        buttonText: '#FFFFFF',
      },
      sand: {
        bg: '#E3C068',
        text: '#111111',
        muted: 'rgba(0, 0, 0, 0.75)',
        subtle: 'rgba(0, 0, 0, 0.55)',
        divider: 'rgba(0, 0, 0, 0.15)',
        logoColor: 'black' as const,
        barBg: 'rgba(0, 0, 0, 0.15)',
        barFill: 'rgba(0, 0, 0, 0.40)',
        barHighlight: '#D80000',
        buttonBorder: '#111111',
        buttonText: '#111111',
      },
      lavender: {
        bg: '#E1DCE6',
        text: '#111111',
        muted: 'rgba(0, 0, 0, 0.75)',
        subtle: 'rgba(0, 0, 0, 0.55)',
        divider: 'rgba(0, 0, 0, 0.15)',
        logoColor: 'black' as const,
        barBg: 'rgba(0, 0, 0, 0.15)',
        barFill: 'rgba(0, 0, 0, 0.40)',
        barHighlight: '#D80000',
        buttonBorder: '#111111',
        buttonText: '#111111',
      },
      grey: {
        bg: '#F4F4F6',
        text: '#111111',
        muted: 'rgba(0, 0, 0, 0.75)',
        subtle: 'rgba(0, 0, 0, 0.55)',
        divider: 'rgba(0, 0, 0, 0.12)',
        logoColor: 'black' as const,
        barBg: 'rgba(0, 0, 0, 0.12)',
        barFill: 'rgba(0, 0, 0, 0.38)',
        barHighlight: '#D80000',
        buttonBorder: '#111111',
        buttonText: '#111111',
      },
      white: {
        bg: '#FFFFFF',
        text: '#111111',
        muted: 'rgba(0, 0, 0, 0.75)',
        subtle: 'rgba(0, 0, 0, 0.55)',
        divider: 'rgba(0, 0, 0, 0.10)',
        logoColor: 'black' as const,
        barBg: 'rgba(0, 0, 0, 0.10)',
        barFill: 'rgba(0, 0, 0, 0.35)',
        barHighlight: '#D80000',
        buttonBorder: '#111111',
        buttonText: '#111111',
      },
    };

    const hasPhoto = Boolean((isSlide1 || slide.hasImage) && slide.imageUrl);
    // When a slide has a photo with dark gradient overlay, use the dark theme palette for 100% white serif text legibility
    const currentTheme = hasPhoto ? themeConfigs.dark : (themeConfigs[theme] || themeConfigs.dark);

    // Format image URL: external images route through CORS-safe proxy to avoid tainted canvas export
    const getSafeImageUrl = (url?: string) => {
      if (!url) return '';
      if (url.startsWith('data:') || url.startsWith('/')) return url;
      return `/api/liquid/proxy-image?url=${encodeURIComponent(url)}`;
    };

    return (
      <div
        ref={ref}
        data-slide-index={slideIndex}
        style={{
          width: 1080,
          height: 1350,
          backgroundColor: currentTheme.bg,
          color: currentTheme.text,
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
      >
        {/* Full-bleed Photojournalism Image (Slide 1 Hook or Visual Slides) */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <img
              src={getSafeImageUrl(slide.imageUrl)}
              alt={slide.headline}
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {/* Automatic CSS Gradient Overlay mandated for 100% white serif text legibility */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 45%, rgba(0,0,0,0.10) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Safe Zone Bounded Flex Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: 1080,
            height: 1350,
            padding: '160px 90px 220px 90px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isSlide1 ? 'space-between' : isSlide7 ? 'center' : 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {/* ======================================================== */}
          {/* SLIDE 1: HOOK / HERO COVER                               */}
          {/* ======================================================== */}
          {isSlide1 && (
            <>
              {/* Top-Left Official NZZ SVG Wordmark (Width: 140px) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <NzzLogo color="white" width={140} />
              </div>

              {/* Bottom Editorial Text Stack */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Category Badge: small, bold, all-caps, 24px, tracking +3px */}
                <div
                  className="font-nzz-sans"
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.90)',
                    marginBottom: 24,
                  }}
                >
                  {slide.badge || 'NZZ DOSSIER'}
                </div>

                {/* Serif Headline: Playfair Display, bold 700, line-height 1.15, letter-spacing -0.5px, margin-bottom 40px */}
                <h1
                  className="font-nzz-serif"
                  style={{
                    fontSize: 'clamp(58px, 6.2vw, 84px)',
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: '-0.5px',
                    color: '#FFFFFF',
                    marginBottom: 40,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                >
                  {slide.headline}
                </h1>

                {/* Body Text: Inter, 38px, line-height 1.5, regular 400 */}
                {slide.bodyText && (
                  <p
                    className="font-nzz-sans"
                    style={{
                      fontSize: 38,
                      lineHeight: 1.5,
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.92)',
                      margin: 0,
                      textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                    }}
                  >
                    {slide.bodyText}
                  </p>
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* SLIDES 2-6: EDITORIAL ANALYSIS & VISUALIZATION            */}
          {/* ======================================================== */}
          {!isSlide1 && !isSlide7 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between',
              }}
            >
              {/* Top Meta Bar: Category Badge & Slide Counter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 36,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: '#D80000',
                      borderRadius: 2,
                    }}
                  />
                  <span
                    className="font-nzz-sans"
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      color: currentTheme.text,
                      opacity: 0.85,
                    }}
                  >
                    {slide.badge || slide.slideType.replace(/_/g, ' ')}
                  </span>
                </div>

                <span
                  className="font-nzz-sans"
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: currentTheme.text,
                    opacity: 0.5,
                  }}
                >
                  {slideIndex + 1} / {totalSlides}
                </span>
              </div>

              {/* Main Content Area by Archetype */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                {/* ARCHETYPE: Data Chart (Slide 2) */}
                {(slide.layout === 'chart_data' || slide.chartData) && (
                  <div>
                    <h2
                      className="font-nzz-serif"
                      style={{
                        fontSize: 'clamp(54px, 5.5vw, 76px)',
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px',
                        marginBottom: 40,
                        color: currentTheme.text,
                      }}
                    >
                      {slide.headline}
                    </h2>

                    {slide.bodyText && (
                      <p
                        className="font-nzz-sans"
                        style={{
                          fontSize: 36,
                          lineHeight: 1.5,
                          fontWeight: 400,
                          color: currentTheme.muted,
                          marginBottom: 52,
                        }}
                      >
                        {slide.bodyText}
                      </p>
                    )}

                    {/* Clean comparative horizontal bar visualization with hairline dividers */}
                    <div
                      style={{
                        borderTop: `1px solid ${currentTheme.divider}`,
                        paddingTop: 36,
                      }}
                    >
                      <div
                        className="font-nzz-sans"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          color: currentTheme.text,
                          opacity: 0.8,
                          marginBottom: 32,
                        }}
                      >
                        <span>
                          {slide.chartData?.title || (isGerman ? 'Vergleichsindikatoren' : 'Comparative Indicators')}
                        </span>
                        <BarChart3 style={{ width: 28, height: 28, color: '#D80000' }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {(slide.chartData?.items || [
                          { label: 'Baseline Average', value: '18.5%', isHighlighted: false },
                          { label: 'European Benchmark', value: '22.4%', isHighlighted: false },
                          { label: 'Current Empirical Measure', value: '29.8%', isHighlighted: true },
                        ]).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div
                              className="font-nzz-sans"
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 32,
                                fontWeight: item.isHighlighted ? 700 : 500,
                                color: currentTheme.text,
                              }}
                            >
                              <span>{item.label}</span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: item.isHighlighted ? '#D80000' : currentTheme.text,
                                }}
                              >
                                {item.value}
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: currentTheme.barBg,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${
                                    typeof item.percent === 'number' && !isNaN(item.percent)
                                      ? Math.max(5, Math.min(100, item.percent))
                                      : !isNaN(parseFloat(String(item.value || '').replace(/[^0-9.]/g, ''))) && parseFloat(String(item.value || '').replace(/[^0-9.]/g, '')) > 0
                                      ? Math.max(5, Math.min(100, parseFloat(String(item.value || '').replace(/[^0-9.]/g, ''))))
                                      : 50
                                  }%`,
                                  backgroundColor: item.isHighlighted ? currentTheme.barHighlight : currentTheme.barFill,
                                  borderRadius: 8,
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {slide.chartData?.caption && (
                        <div
                          className="font-nzz-sans"
                          style={{
                            fontSize: 24,
                            color: currentTheme.subtle,
                            marginTop: 32,
                            textAlign: 'right',
                          }}
                        >
                          {slide.chartData.caption}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ARCHETYPE: Defining Metric or Split Media (Slide 3) */}
                {(slide.layout === 'stat_callout' || slide.layout === 'split_media') && (
                  <div>
                    <div
                      className="font-nzz-sans"
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        color: '#D80000',
                        marginBottom: 20,
                      }}
                    >
                      {isGerman ? 'SCHLÜSSELKENNZAHL' : 'DEFINING METRIC'}
                    </div>

                    <h2
                      className="font-nzz-serif"
                      style={{
                        fontSize: 'clamp(54px, 5.5vw, 72px)',
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px',
                        marginBottom: 40,
                        color: currentTheme.text,
                      }}
                    >
                      {slide.headline}
                    </h2>

                    <div style={{ marginBottom: 44 }}>
                      <div
                        className="font-nzz-serif"
                        style={{
                          fontSize: 150,
                          fontWeight: 900,
                          lineHeight: 1.0,
                          letterSpacing: '-2px',
                          color: '#D80000',
                          marginBottom: 16,
                        }}
                      >
                        {slide.metricHighlight?.value || '$15T'}
                      </div>
                      <div
                        className="font-nzz-sans"
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          letterSpacing: '3px',
                          textTransform: 'uppercase',
                          color: currentTheme.text,
                          opacity: 0.85,
                        }}
                      >
                        {slide.metricHighlight?.label || (isGerman ? 'GESCHÄTZTER WERT' : 'ESTIMATED VALUE')}
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: `1px solid ${currentTheme.divider}`,
                        paddingTop: 36,
                      }}
                    >
                      <p
                        className="font-nzz-sans"
                        style={{
                          fontSize: 38,
                          lineHeight: 1.5,
                          fontWeight: 400,
                          color: currentTheme.muted,
                          margin: 0,
                        }}
                      >
                        {slide.bodyText ||
                          (isGerman
                            ? 'Ein struktureller Hebel von historischem Ausmass, der weitreichende institutionelle Weichenstellungen erzwingt.'
                            : 'A structural indicator of historical proportions that forces extensive institutional realignments.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* ARCHETYPE: Dual Perspectives (Slide 4 - Pure Typography & Whitespace, No Cards) */}
                {slide.layout === 'dual_cards' && (
                  <div>
                    <h2
                      className="font-nzz-serif"
                      style={{
                        fontSize: 'clamp(54px, 5.5vw, 72px)',
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px',
                        marginBottom: 44,
                        color: currentTheme.text,
                      }}
                    >
                      {slide.headline}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
                      {/* Perspective 1 */}
                      <div
                        style={{
                          borderTop: `1px solid ${currentTheme.divider}`,
                          paddingTop: 28,
                        }}
                      >
                        <div
                          className="font-nzz-sans"
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: '#D80000',
                            marginBottom: 10,
                          }}
                        >
                          {slide.comparisonCards?.card1?.badge || (isGerman ? 'VORREITER' : 'STRATEGIC ADVANTAGE')}
                        </div>
                        <h3
                          className="font-nzz-serif"
                          style={{
                            fontSize: 38,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            color: currentTheme.text,
                            marginBottom: 12,
                          }}
                        >
                          {slide.comparisonCards?.card1?.title || (isGerman ? 'STRATEGISCHE CHANCE' : 'STRATEGIC OPPORTUNITY')}
                        </h3>
                        <p
                          className="font-nzz-sans"
                          style={{
                            fontSize: 32,
                            lineHeight: 1.5,
                            fontWeight: 400,
                            color: currentTheme.muted,
                            margin: 0,
                          }}
                        >
                          {slide.comparisonCards?.card1?.text ||
                            (isGerman
                              ? 'Dominante Marktmacht und Skalenvorteile durch frühzeitige Investitionen.'
                              : 'Dominant market power and economies of scale through disciplined early positioning.')}
                        </p>
                      </div>

                      {/* Perspective 2 */}
                      <div
                        style={{
                          borderTop: `1px solid ${currentTheme.divider}`,
                          paddingTop: 28,
                        }}
                      >
                        <div
                          className="font-nzz-sans"
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            color: currentTheme.text,
                            opacity: 0.7,
                            marginBottom: 10,
                          }}
                        >
                          {slide.comparisonCards?.card2?.badge || (isGerman ? 'RISIKO' : 'SYSTEMIC EXPOSURE')}
                        </div>
                        <h3
                          className="font-nzz-serif"
                          style={{
                            fontSize: 38,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            color: currentTheme.text,
                            marginBottom: 12,
                          }}
                        >
                          {slide.comparisonCards?.card2?.title || (isGerman ? 'SYSTEMISCHE VERWUNDBARKEIT' : 'SYSTEMIC VULNERABILITY')}
                        </h3>
                        <p
                          className="font-nzz-sans"
                          style={{
                            fontSize: 32,
                            lineHeight: 1.5,
                            fontWeight: 400,
                            color: currentTheme.muted,
                            margin: 0,
                          }}
                        >
                          {slide.comparisonCards?.card2?.text ||
                            (isGerman
                              ? 'Geopolitische Abhängigkeiten und regulatorischer Nachholbedarf in kritischen Sektoren.'
                              : 'Geopolitical dependencies and regulatory exposure across critical operating vectors.')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ARCHETYPE: Infographic Bullets / Key Takeaways (Slide 5 - Balanced Vertical Rhythm) */}
                {slide.layout === 'bullets_list' && (
                  <div>
                    <h2
                      className="font-nzz-serif"
                      style={{
                        fontSize: 'clamp(54px, 5.5vw, 72px)',
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px',
                        marginBottom: 44,
                        color: currentTheme.text,
                      }}
                    >
                      {slide.headline}
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                      {(slide.bulletItems || [
                        { title: isGerman ? 'Struktur' : 'Institutional Structure', text: slide.bodyText || '' },
                        { title: isGerman ? 'Dynamik' : 'Market Dynamics', text: 'Accelerating capital velocity requires sovereign regulatory frameworks.' },
                        { title: isGerman ? 'Konsequenz' : 'Strategic Imperative', text: 'Long-term competitive advantage demands immediate institutional realignment.' },
                      ]).map((bullet, idx) => (
                        <div
                          key={idx}
                          style={{
                            borderTop: `1px solid ${currentTheme.divider}`,
                            paddingTop: 24,
                          }}
                        >
                          <div
                            className="font-nzz-sans"
                            style={{
                              fontSize: 22,
                              fontWeight: 700,
                              letterSpacing: '2px',
                              textTransform: 'uppercase',
                              color: '#D80000',
                              marginBottom: 8,
                            }}
                          >
                            0{idx + 1}
                          </div>
                          {bullet.title && (
                            <h3
                              className="font-nzz-sans"
                              style={{
                                fontSize: 34,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                color: currentTheme.text,
                                marginBottom: 10,
                              }}
                            >
                              {bullet.title}
                            </h3>
                          )}
                          <p
                            className="font-nzz-sans"
                            style={{
                              fontSize: 32,
                              lineHeight: 1.5,
                              fontWeight: 400,
                              color: currentTheme.muted,
                              margin: 0,
                            }}
                          >
                            {bullet.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ARCHETYPE: Pull Quote (Slide 6 - Pure Classical Typography) */}
                {slide.layout === 'quote' && (
                  <div
                    style={{
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      className="font-nzz-serif"
                      style={{
                        fontSize: 110,
                        lineHeight: 0.8,
                        color: '#D80000',
                        marginBottom: 28,
                      }}
                    >
                      «
                    </div>

                    <blockquote
                      className="font-nzz-serif"
                      style={{
                        fontStyle: 'italic',
                        fontSize: 54,
                        lineHeight: 1.25,
                        letterSpacing: '-0.5px',
                        color: currentTheme.text,
                        maxWidth: 820,
                        margin: '0 auto 40px auto',
                      }}
                    >
                      {slide.quote?.text ||
                        (slide.bodyText ? slide.bodyText : 'Qualitätsjournalismus verlangt Tiefe und Unabhängigkeit.')}
                    </blockquote>

                    {/* Hairline red separator line */}
                    <div
                      style={{
                        width: 90,
                        height: 3,
                        backgroundColor: '#D80000',
                        margin: '0 auto 36px auto',
                      }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        className="font-nzz-sans"
                        style={{
                          fontSize: 36,
                          fontWeight: 700,
                          color: currentTheme.text,
                        }}
                      >
                        {slide.quote?.speaker || 'NZZ Leitartikel'}
                      </div>
                      {slide.quote?.speakerTitle && (
                        <div
                          className="font-nzz-sans"
                          style={{
                            fontSize: 24,
                            fontWeight: 600,
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                            color: currentTheme.subtle,
                          }}
                        >
                          {slide.quote.speakerTitle}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SLIDE 7: CTA CONVERSION OUTRO                             */}
          {/* ======================================================== */}
          {isSlide7 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                margin: 'auto 0',
              }}
            >
              {/* Centered official NZZ logo at larger scale (260px) */}
              <div style={{ marginBottom: 48 }}>
                <NzzLogo color={currentTheme.logoColor} width={260} />
              </div>

              {/* Minimal serif CTA headline */}
              <h2
                className="font-nzz-serif"
                style={{
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.5px',
                  color: currentTheme.text,
                  maxWidth: 820,
                  marginBottom: 24,
                }}
              >
                {slide.cta?.headline ||
                  (isGerman
                    ? 'Verstehen, was die Welt bewegt.'
                    : 'Understand the forces shaping tomorrow.')}
              </h2>

              {/* Subtext: 36px, line-height 1.5 */}
              <p
                className="font-nzz-sans"
                style={{
                  fontSize: 36,
                  lineHeight: 1.5,
                  fontWeight: 400,
                  color: currentTheme.subtle,
                  maxWidth: 800,
                  marginBottom: 60,
                }}
              >
                {slide.cta?.subtext ||
                  (isGerman
                    ? 'Lesen Sie die vollständige Recherche und interaktive Datenanalysen auf nzz.ch.'
                    : 'Read the full investigation and interactive data analysis on nzz.ch.')}
              </p>

              {/* Minimalist Stroked CTA Pill Button */}
              <div
                className="font-nzz-sans"
                style={{
                  border: `3px solid ${currentTheme.buttonBorder}`,
                  color: currentTheme.buttonText,
                  padding: '22px 56px',
                  borderRadius: 9999,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              >
                <span>{slide.cta?.buttonText || (isGerman ? 'AUF NZZ.CH LESEN' : 'READ ON NZZ.CH')}</span>
                <ArrowRight style={{ width: 28, height: 28 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SlideCanvas1080.displayName = 'SlideCanvas1080';
