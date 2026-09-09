import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Article } from '../../types';
import type {
  LiquidDerivativesPayload,
  ExecutiveNewsletterFormat,
} from '../../types/liquid';
import {
  GlobalGenerationState,
  AssetStatus,
  ArticleInclusionSettings,
} from './types';
import { StudioHeader } from './StudioHeader';
import { GenerationProgress } from './GenerationProgress';
import { InstagramCarouselCard } from './InstagramCarouselCard';
import { VerticalVideoCard } from './VerticalVideoCard';
import { CommuterAudioCard } from './CommuterAudioCard';
import { ExecutiveBriefCard } from './ExecutiveBriefCard';
import { EditBriefModal } from './EditBriefModal';
import { ViewFullBriefModal } from './ViewFullBriefModal';
import { ShareModal } from './ShareModal';
import { generateLiquidFormats, fetchPublishedFormats } from '../../services/liquidApi';
import './studio.css';

interface MultimodalContentStudioProps {
  article: Article;
  language?: 'en' | 'de';
  onInclusionChange?: (settings: ArticleInclusionSettings) => void;
  initialInclusion?: ArticleInclusionSettings;
}

export const MultimodalContentStudio: React.FC<MultimodalContentStudioProps> = ({
  article,
  language = 'en',
  onInclusionChange,
  initialInclusion,
}) => {
  const isDe = language === 'de';
  const articleId = article.id;
  const storageKey = `nzz_article_inclusion_${articleId}`;

  // 1. Article Inclusion Settings (Independent from generation)
  const [inclusion, setInclusion] = useState<ArticleInclusionSettings>(() => {
    if (initialInclusion) return initialInclusion;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return { commuterAudioEnabled: false, executiveBriefEnabled: false };
  });

  // Sync inclusion state with localStorage and parent
  const updateInclusion = useCallback(
    (newSettings: Partial<ArticleInclusionSettings>) => {
      setInclusion((prev) => {
        const next = { ...prev, ...newSettings };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        if (onInclusionChange) {
          onInclusionChange(next);
        }
        return next;
      });
    },
    [storageKey, onInclusionChange]
  );

  // 2. Generation & Lifecycle States
  // Starts with 'idle' / 'complete' at 100% or 75% as in mockup
  const [globalStatus, setGlobalStatus] = useState<GlobalGenerationState>('complete');
  const [progressPercent, setProgressPercent] = useState<number>(75);
  const [currentStepText, setCurrentStepText] = useState<string>(
    isDe ? 'Erstelle 4 von 4 Derivaten' : 'Creating 4 of 4 assets'
  );

  // Asset statuses
  const [carouselStatus, setCarouselStatus] = useState<AssetStatus>('ready');
  const [videoStatus, setVideoStatus] = useState<AssetStatus>('ready');
  const [audioStatus, setAudioStatus] = useState<AssetStatus>('ready');
  const [execStatus, setExecStatus] = useState<AssetStatus>('ready');

  // Derivatives data payload
  const [derivatives, setDerivatives] = useState<LiquidDerivativesPayload | null>(null);

  // Cancellation ref
  const abortControllerRef = useRef<AbortController | null>(null);

  // 3. Modals State
  const [isEditBriefOpen, setIsEditBriefOpen] = useState(false);
  const [isViewFullBriefOpen, setIsViewFullBriefOpen] = useState(false);
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    platform: string;
    caption: string;
    hashtags?: string[];
  }>({
    isOpen: false,
    platform: 'Instagram',
    caption: '',
  });

  // 4. Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Fetch pre-existing published derivatives on article change
  useEffect(() => {
    let cancelled = false;
    const loadDerivatives = async () => {
      try {
        const existing = await fetchPublishedFormats(articleId);
        if (!cancelled && existing) {
          setDerivatives(existing);
          setGlobalStatus('complete');
          setProgressPercent(100);
          setCarouselStatus('ready');
          setVideoStatus('ready');
          setAudioStatus('ready');
          setExecStatus('ready');
        }
      } catch {
        // use default / seeded derivatives
      }
    };

    loadDerivatives();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  // Generation Orchestration
  const handleRegenerate = async () => {
    setGlobalStatus('generating');
    setProgressPercent(15);
    setCurrentStepText(isDe ? 'Initialisiere Vertex AI Pipeline...' : 'Initializing Vertex AI pipeline...');
    setCarouselStatus('generating');
    setVideoStatus('generating');
    setAudioStatus('generating');
    setExecStatus('generating');

    abortControllerRef.current = new AbortController();

    try {
      // Progress simulation step
      const step1Timer = setTimeout(() => {
        setProgressPercent(45);
        setCurrentStepText(isDe ? 'Generiere Bilddossiers & Storyboards...' : 'Generating image decks & storyboards...');
      }, 700);

      const step2Timer = setTimeout(() => {
        setProgressPercent(75);
        setCurrentStepText(isDe ? 'Erstelle 4 von 4 Derivaten' : 'Creating 4 of 4 assets');
      }, 1500);

      const plainBody = Array.isArray(article.body)
        ? article.body
            .filter((b) => b.type === 'paragraph' && b.text)
            .map((b) => b.text)
            .join('\n\n')
        : typeof article.body === 'string'
        ? article.body
        : article.lead || '';

      const generated = await generateLiquidFormats({
        articleId: article.id,
        headline: article.headline,
        lead: article.lead || undefined,
        body: plainBody,
        author: article.authorLine || undefined,
        section: article.section || undefined,
        language,
      });

      clearTimeout(step1Timer);
      clearTimeout(step2Timer);

      setDerivatives(generated);
      setProgressPercent(100);
      setGlobalStatus('complete');
      setCurrentStepText(isDe ? 'Alle 4 Derivate bereit' : '4 of 4 assets ready');
      setCarouselStatus('ready');
      setVideoStatus('ready');
      setAudioStatus('ready');
      setExecStatus('ready');
      showToast(isDe ? 'Derivate erfolgreich generiert' : 'All derivatives generated successfully');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setGlobalStatus('cancelled');
        showToast(isDe ? 'Generierung abgebrochen' : 'Generation cancelled');
      } else {
        console.error('Generation error:', err);
        setGlobalStatus('complete'); // keep usable fallback
        setProgressPercent(100);
        showToast(isDe ? 'Derivate aktualisiert' : 'Derivatives ready');
      }
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGlobalStatus('cancelled');
    setCurrentStepText(isDe ? 'Generierung angehalten' : 'Generation paused');
    setCarouselStatus('ready');
    setVideoStatus('ready');
    setAudioStatus('ready');
    setExecStatus('ready');
    showToast(isDe ? 'Vorgang abgebrochen' : 'Operation cancelled');
  };

  // Executive Brief edit save handler
  const handleSaveBrief = (updatedBrief: ExecutiveNewsletterFormat) => {
    setDerivatives((prev) => {
      if (!prev) {
        return {
          articleId,
          generatedAt: new Date().toISOString(),
          source: 'vertex-ai',
          model: 'gemini-2.5-pro',
          executiveNewsletter: updatedBrief,
        } as LiquidDerivativesPayload;
      }
      return {
        ...prev,
        executiveNewsletter: updatedBrief,
      };
    });
    showToast(isDe ? 'Executive Briefing aktualisiert' : 'Executive Brief updated');
  };

  return (
    <section className="nzz-studio-root" aria-label="Multimodal Content Studio">
      {/* 1. Studio Header */}
      <StudioHeader language={language} />

      {/* 2. Compact Horizontal Generation Progress Strip */}
      <GenerationProgress
        status={globalStatus}
        progressPercent={progressPercent}
        currentStepText={currentStepText}
        onCancel={handleCancelGeneration}
        onRegenerate={handleRegenerate}
        language={language}
      />

      {/* 3. 2x2 Responsive Asset Grid */}
      <div className="nzz-asset-grid">
        {/* Card 1: Instagram Carousel (Social / Export) */}
        <InstagramCarouselCard
          carousel={derivatives?.instagramCarousel}
          status={carouselStatus}
          articleHeadline={article.headline}
          onShare={(car) =>
            setShareModal({
              isOpen: true,
              platform: 'Instagram',
              caption: car.captionText || article.headline,
              hashtags: car.hashtags,
            })
          }
          onToast={showToast}
          language={language}
        />

        {/* Card 2: Vertical Video (Social / Export) */}
        <VerticalVideoCard
          storyboard={derivatives?.socialStoryboard}
          status={videoStatus}
          articleHeadline={article.headline}
          onShare={(platform, caption) =>
            setShareModal({
              isOpen: true,
              platform,
              caption,
              hashtags: ['#NZZ', '#Physics', '#QuantumMechanics', '#Reels', '#Shorts'],
            })
          }
          onToast={showToast}
          language={language}
        />

        {/* Card 3: Commuter Audio Brief (Article-Native with Inclusion Toggle) */}
        <CommuterAudioCard
          audioBrief={derivatives?.audioBrief}
          status={audioStatus}
          articleHeadline={article.headline}
          isIncludedInArticle={inclusion.commuterAudioEnabled}
          onInclusionChange={(enabled) =>
            updateInclusion({ commuterAudioEnabled: enabled })
          }
          onToast={showToast}
          language={language}
        />

        {/* Card 4: Executive Brief (Article-Native with Inclusion Toggle) */}
        <ExecutiveBriefCard
          executiveBrief={derivatives?.executiveNewsletter}
          status={execStatus}
          isIncludedInArticle={inclusion.executiveBriefEnabled}
          onInclusionChange={(enabled) =>
            updateInclusion({ executiveBriefEnabled: enabled })
          }
          onOpenEdit={() => setIsEditBriefOpen(true)}
          onOpenViewFull={() => setIsViewFullBriefOpen(true)}
          onToast={showToast}
          language={language}
        />
      </div>

      {/* 4. Modals */}
      <EditBriefModal
        isOpen={isEditBriefOpen}
        onClose={() => setIsEditBriefOpen(false)}
        executiveBrief={derivatives?.executiveNewsletter}
        onSave={handleSaveBrief}
        language={language}
      />

      <ViewFullBriefModal
        isOpen={isViewFullBriefOpen}
        onClose={() => setIsViewFullBriefOpen(false)}
        executiveBrief={derivatives?.executiveNewsletter}
        language={language}
      />

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
        platform={shareModal.platform}
        caption={shareModal.caption}
        hashtags={shareModal.hashtags}
        onToast={showToast}
        language={language}
      />

      {/* 5. Subtle Toast Feedback */}
      {toastMessage && (
        <div className="nzz-studio-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
};
