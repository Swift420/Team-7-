import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  caption: string;
  hashtags?: string[];
  onToast: (msg: string) => void;
  language?: 'en' | 'de';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  platform,
  caption,
  hashtags = ['#NZZ', '#Physics', '#QuantumMechanics', '#Science'],
  onToast,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullText = `${caption}\n\n${hashtags.join(' ')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      onToast(isDe ? 'In die Zwischenablage kopiert' : 'Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast(isDe ? 'Kopieren fehlgeschlagen' : 'Failed to copy');
    }
  };

  return (
    <div className="nzz-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="nzz-modal-card">
        <div className="nzz-modal-header">
          <div className="flex items-center gap-2">
            <div className="nzz-asset-icon-box" style={{ color: '#111111', width: 28, height: 28 }}>
              <Share2 size={16} />
            </div>
            <h3 id="share-title" className="nzz-modal-title">
              {isDe ? `Auf ${platform} teilen` : `Share to ${platform}`}
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
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-neutral-800">
              {isDe ? 'Formatierter Text & Hashtags' : 'Formatted Caption & Hashtags'}
            </label>
            <textarea
              rows={6}
              readOnly
              value={fullText}
              className="w-full px-3 py-2 text-xs border border-[#dededb] rounded-md bg-[#fbfbfa] text-[#222222] font-sans resize-none focus:outline-none"
            />
          </div>

          <div className="bg-[#f9f9f8] border border-[#e8e8e4] rounded-md p-3 text-[11px] text-[#666666] leading-relaxed">
            {isDe
              ? 'Tipp: Kopieren Sie die Bildunterschrift und öffnen Sie Instagram / die Social App, um die vorbereiteten Bilder oder das Video hochzuladen.'
              : 'Tip: Copy this caption, then upload your downloaded slides or video to your social platform.'}
          </div>
        </div>

        <div className="nzz-modal-footer">
          <button
            type="button"
            className="nzz-btn-export-secondary"
            style={{ flex: 'initial' }}
            onClick={onClose}
          >
            {isDe ? 'Schliessen' : 'Close'}
          </button>
          <button
            type="button"
            className="nzz-btn-export-primary"
            style={{ flex: 'initial' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? (isDe ? 'Kopiert!' : 'Copied!') : (isDe ? 'Text kopieren' : 'Copy Caption')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
