import React, { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import type { ExecutiveNewsletterFormat } from '../../types/liquid';

interface EditBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  executiveBrief?: ExecutiveNewsletterFormat;
  onSave: (updated: ExecutiveNewsletterFormat) => void;
  language?: 'en' | 'de';
}

export const EditBriefModal: React.FC<EditBriefModalProps> = ({
  isOpen,
  onClose,
  executiveBrief,
  onSave,
  language = 'en',
}) => {
  const isDe = language === 'de';

  const [headline, setHeadline] = useState(
    executiveBrief?.headline || 'Scientists May Have Just Caught Gravity Behaving Quantum Mechanically'
  );
  const [subhead, setSubhead] = useState(
    executiveBrief?.subhead || 'Key Takeaways'
  );
  const [bullets, setBullets] = useState<string[]>(
    executiveBrief?.bullets && executiveBrief.bullets.length > 0
      ? [...executiveBrief.bullets]
      : [
          'First experimental evidence of a quantum effect of gravity using ultracold atoms.',
          'Could help bridge the gap between general relativity and quantum mechanics.',
          'May open new research directions in fundamental physics and cosmology.',
          'Implications for future technologies and our understanding of the universe.',
        ]
  );

  if (!isOpen) return null;

  const handleAddBullet = () => {
    if (bullets.length < 6) {
      setBullets([...bullets, '']);
    }
  };

  const handleUpdateBullet = (index: number, text: string) => {
    const updated = [...bullets];
    updated[index] = text;
    setBullets(updated);
  };

  const handleRemoveBullet = (index: number) => {
    if (bullets.length > 1) {
      setBullets(bullets.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    const validBullets = bullets.map((b) => b.trim()).filter(Boolean);
    const bulletList: string[] = validBullets.length > 0 ? validBullets : ['Core thesis and editorial takeaway.'];
    onSave({
      headline,
      subhead,
      bullets: bulletList,
      wordCount: bulletList.join(' ').split(/\s+/).length,
      approved: true,
    });
    onClose();
  };

  return (
    <div className="nzz-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-brief-title">
      <div className="nzz-modal-card">
        <div className="nzz-modal-header">
          <h3 id="edit-brief-title" className="nzz-modal-title">
            {isDe ? 'Executive Brief bearbeiten' : 'Edit Executive Brief'}
          </h3>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-800">
              {isDe ? 'Titel des Briefings' : 'Briefing Title'}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#dededb] rounded-md focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-800">
              {isDe ? 'Abschnittstitel' : 'Section Subtitle'}
            </label>
            <input
              type="text"
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#dededb] rounded-md focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-800">
                {isDe ? 'Zentrale Thesen (Stichpunkte)' : 'Key Takeaways (Bullets)'}
              </label>
              {bullets.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddBullet}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{isDe ? 'Punkt hinzufügen' : 'Add bullet'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-neutral-400 mt-2 select-none">
                    {idx + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={bullet}
                    onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                    placeholder={isDe ? 'These eingeben...' : 'Enter takeaway...'}
                    className="flex-1 px-3 py-1.5 text-xs border border-[#dededb] rounded-md focus:outline-none focus:border-black resize-none"
                  />
                  {bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBullet(idx)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded cursor-pointer mt-1"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nzz-modal-footer">
          <button
            type="button"
            className="nzz-btn-export-secondary"
            style={{ flex: 'initial' }}
            onClick={onClose}
          >
            {isDe ? 'Abbrechen' : 'Cancel'}
          </button>
          <button
            type="button"
            className="nzz-btn-export-primary"
            style={{ flex: 'initial' }}
            onClick={handleSave}
          >
            <Check size={14} />
            <span>{isDe ? 'Änderungen speichern' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
