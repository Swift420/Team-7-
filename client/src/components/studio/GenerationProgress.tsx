import React from 'react';
import { RotateCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlobalGenerationState } from './types';

interface GenerationProgressProps {
  status: GlobalGenerationState;
  progressPercent: number;
  currentStepText?: string;
  onCancel?: () => void;
  onRegenerate?: () => void;
  language?: 'en' | 'de';
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  status,
  progressPercent,
  currentStepText,
  onCancel,
  onRegenerate,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const isGenerating = status === 'generating';
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';

  // Determine Title & Subtitle
  let title = isDe ? 'Inhalte werden generiert...' : 'Generating content...';
  let subtitle = currentStepText || (isDe ? 'Erstelle 4 von 4 Derivaten' : 'Creating 4 of 4 assets');

  if (isComplete) {
    title = isDe ? 'Inhalte bereit' : 'Content ready';
    subtitle = isDe ? 'Alle 4 Derivate wurden erfolgreich erstellt' : '4 of 4 assets ready';
  } else if (isFailed) {
    title = isDe ? 'Generierung fehlgeschlagen' : 'Generation failed';
    subtitle = isDe ? 'Bitte erneut versuchen' : 'Please try again';
  } else if (isCancelled) {
    title = isDe ? 'Generierung abgebrochen' : 'Generation cancelled';
    subtitle = isDe ? 'Vorgang wurde gestoppt' : 'Operation stopped';
  } else if (status === 'idle') {
    title = isDe ? 'Derivate bereit' : 'Derivatives ready';
    subtitle = isDe ? '4 von 4 Formaten bereit' : '4 of 4 assets ready';
  }

  return (
    <div className="nzz-progress-strip" role="region" aria-label="Generation progress">
      <div className="nzz-progress-left">
        {isGenerating ? (
          <div className="nzz-spinner-ring" aria-label="Loading spinner" />
        ) : isFailed ? (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#24734d] flex-shrink-0" />
        )}
        <div className="nzz-progress-text-stack">
          <span className="nzz-progress-title">{title}</span>
          <span className="nzz-progress-sub">{subtitle}</span>
        </div>
      </div>

      <div className="nzz-progress-center">
        <div className="nzz-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="nzz-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        <span className="nzz-progress-percent">{Math.round(progressPercent)}%</span>
      </div>

      <div className="nzz-progress-right">
        {isGenerating ? (
          <button
            type="button"
            className="nzz-btn-cancel"
            onClick={onCancel}
            aria-label={isDe ? 'Abbrechen' : 'Cancel generation'}
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>
        ) : (
          <button
            type="button"
            className="nzz-btn-regenerate"
            onClick={onRegenerate}
            aria-label={isDe ? 'Neu generieren' : 'Regenerate'}
          >
            <RotateCw size={12} />
            <span>{isDe ? 'Neu generieren' : 'Regenerate'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
