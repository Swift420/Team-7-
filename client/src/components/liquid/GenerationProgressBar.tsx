import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface GenerationProgressBarProps {
  isLoading: boolean;
  formatName?: string;
  onComplete?: () => void;
}

const STAGES = [
  { threshold: 15, label: 'Reading article & extracting core editorial thesis...' },
  { threshold: 38, label: 'Synthesizing 6-slide narrative in Style A (Swiss Prestige)...' },
  { threshold: 65, label: 'Sourcing authentic 35mm photojournalism & detail zoom...' },
  { threshold: 88, label: 'Applying Swiss typography, optical kerning & kickers...' },
  { threshold: 100, label: 'Carousel generation complete! Rendering preview...' },
];

export const GenerationProgressBar: React.FC<GenerationProgressBarProps> = ({
  isLoading,
  formatName = 'Instagram Carousel',
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (progress > 0) {
        setProgress(100);
        const timer = setTimeout(() => setProgress(0), 1200);
        return () => clearTimeout(timer);
      }
      return;
    }

    setProgress(5);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        // Asymptotic progression so it never gets stuck or finishes prematurely
        const step = Math.max(1, Math.floor((95 - prev) / 6));
        return prev + step;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading && progress === 0) return null;

  const currentStage =
    STAGES.find((s) => progress <= s.threshold) || STAGES[STAGES.length - 1];

  return (
    <div className="w-full bg-stone-900/90 border border-stone-800 rounded-xl p-5 my-4 shadow-xl backdrop-blur-sm animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {progress < 100 ? (
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <Sparkles className="w-4 h-4 text-red-500 animate-spin" />
            </div>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <span className="text-sm font-semibold tracking-wide text-stone-200">
            Generating {formatName}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/50">
          {Math.min(100, Math.round(progress))}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(220,38,38,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Dynamic Status Text */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-stone-400">
        <span className="italic font-serif tracking-wide text-stone-300 animate-pulse">
          {currentStage.label}
        </span>
        <span className="text-[11px] text-stone-500">NZZ AI Engine</span>
      </div>
    </div>
  );
};

