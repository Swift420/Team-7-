import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';
import type { ExecutiveNewsletterFormat } from '../../types/liquid';

interface ViewFullBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  executiveBrief?: ExecutiveNewsletterFormat;
  language?: 'en' | 'de';
}

export const ViewFullBriefModal: React.FC<ViewFullBriefModalProps> = ({
  isOpen,
  onClose,
  executiveBrief,
  language = 'en',
}) => {
  const isDe = language === 'de';

  if (!isOpen) return null;

  const bullets = executiveBrief?.bullets && executiveBrief.bullets.length > 0
    ? executiveBrief.bullets
    : [
        'First experimental evidence of a quantum effect of gravity using ultracold atoms.',
        'Could help bridge the gap between general relativity and quantum mechanics.',
        'May open new research directions in fundamental physics and cosmology.',
        'Implications for future technologies and our understanding of the universe.',
      ];

  return (
    <div className="nzz-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="view-brief-title">
      <div className="nzz-modal-card">
        <div className="nzz-modal-header">
          <div className="flex items-center gap-2">
            <div className="nzz-asset-icon-box" style={{ color: '#d80000', width: 28, height: 28 }}>
              <FileText size={16} />
            </div>
            <h3 id="view-brief-title" className="nzz-modal-title">
              {isDe ? 'NZZ Executive Briefing' : 'NZZ Executive Brief'}
            </h3>
          </div>
          <button
            type="button"
            className="nzz-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="nzz-modal-body">
          <div className="border-b border-[#e8e8e4] pb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 block mb-1">
              {isDe ? 'STRATEGISCHES BRIEFING' : 'STRATEGIC DOSSIER'}
            </span>
            <h2 className="font-serif text-lg font-bold text-[#111111] leading-tight">
              {executiveBrief?.headline || 'Scientists May Have Just Caught Gravity Behaving Quantum Mechanically'}
            </h2>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wide mb-3">
              {executiveBrief?.subhead || (isDe ? 'Zentrale Thesen & Analysen' : 'Key Takeaways & Strategic Analysis')}
            </h4>

            <ul className="flex flex-col gap-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-[#222222]">
                  <CheckCircle2 size={14} className="text-[#24734d] flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#f9f9f8] border border-[#e8e8e4] rounded-md p-3 mt-2">
            <span className="text-[11px] font-semibold text-[#555555] block mb-1">
              {isDe ? 'Redaktioneller Hinweis' : 'Editorial Context'}
            </span>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              {isDe
                ? 'Dieses Executive Briefing fasst die wesentlichen Forschungsergebnisse der NZZ-Fachredaktion zusammen. Es richtet sich an Entscheidungsträger und Leser mit begrenzter Lesezeit.'
                : 'This Executive Brief summarizes key investigative insights by the NZZ editorial desk, optimized for decision-makers and high-velocity reading.'}
            </p>
          </div>
        </div>

        <div className="nzz-modal-footer">
          <button
            type="button"
            className="nzz-btn-export-primary"
            style={{ flex: 'initial', minWidth: 90 }}
            onClick={onClose}
          >
            {isDe ? 'Schliessen' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
