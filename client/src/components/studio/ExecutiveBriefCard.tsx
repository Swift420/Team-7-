import React, { useState } from 'react';
import {
  FileText,
  Edit3,
  ExternalLink,
  Eye,
} from 'lucide-react';
import type { ExecutiveNewsletterFormat } from '../../types/liquid';
import { AssetStatus } from './types';

interface ExecutiveBriefCardProps {
  executiveBrief?: ExecutiveNewsletterFormat;
  status: AssetStatus;
  isIncludedInArticle: boolean;
  onInclusionChange: (included: boolean) => void;
  onOpenEdit: () => void;
  onOpenViewFull: () => void;
  onToast: (msg: string) => void;
  language?: 'en' | 'de';
}

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({
  executiveBrief,
  status,
  isIncludedInArticle,
  onInclusionChange,
  onOpenEdit,
  onOpenViewFull,
  onToast,
  language = 'en',
}) => {
  const isDe = language === 'de';
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Bullet items from prop or high-quality default matching mockup
  const bullets = executiveBrief?.bullets && executiveBrief.bullets.length > 0
    ? executiveBrief.bullets
    : [
        'First experimental evidence of a quantum effect of gravity using ultracold atoms.',
        'Could help bridge the gap between general relativity and quantum mechanics.',
        'May open new research directions in fundamental physics and cosmology.',
        'Implications for future technologies and our understanding of the universe.',
      ];

  const handleToggleArticle = () => {
    const nextVal = !isIncludedInArticle;
    onInclusionChange(nextVal);
    onToast(
      nextVal
        ? (isDe ? 'Executive Brief zum Artikel hinzugefügt' : 'Executive Brief added to article')
        : (isDe ? 'Executive Brief aus dem Artikel entfernt' : 'Executive Brief removed from article')
    );
  };

  const handleTabClick = (tab: 'preview' | 'edit') => {
    setActiveTab(tab);
    if (tab === 'edit') {
      onOpenEdit();
    }
  };

  return (
    <article className="nzz-asset-card" aria-label="Executive Brief format">
      {/* Header */}
      <div className="nzz-asset-card-header">
        <div className="nzz-asset-card-header-left">
          <div className="nzz-asset-icon-box" style={{ color: '#d80000' }}>
            <FileText size={18} />
          </div>
          <div className="nzz-asset-card-titles">
            <h3 className="nzz-asset-card-title">Executive Brief</h3>
            <span className="nzz-asset-card-desc">
              {isDe
                ? 'Eine prägnante, strukturierte Zusammenfassung mit Kernanalysen.'
                : 'A concise, structured summary with key insights.'}
            </span>
          </div>
        </div>

        <div className={`nzz-asset-status-pill ${status}`}>
          <span className="nzz-status-dot" />
          <span>{status === 'ready' ? (isDe ? 'Bereit' : 'Ready') : status === 'generating' ? (isDe ? 'Erstellt...' : 'Generating...') : 'Ready'}</span>
        </div>
      </div>

      {/* Tabs / Subnavigation & Full Brief Link */}
      <div className="nzz-exec-subnav-row">
        <div className="nzz-exec-tabs" role="tablist">
          <button
            type="button"
            className={`nzz-exec-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => handleTabClick('preview')}
            role="tab"
            aria-selected={activeTab === 'preview'}
          >
            <Eye size={12} />
            <span>{isDe ? 'Vorschau' : 'Preview'}</span>
          </button>

          <button
            type="button"
            className={`nzz-exec-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => handleTabClick('edit')}
            role="tab"
            aria-selected={activeTab === 'edit'}
          >
            <Edit3 size={12} />
            <span>{isDe ? 'Bearbeiten' : 'Edit'}</span>
          </button>
        </div>

        <button
          type="button"
          className="nzz-exec-full-link"
          onClick={onOpenViewFull}
        >
          <span>{isDe ? 'Vollständiges Briefing anzeigen' : 'View full brief'}</span>
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Preview Container: Key Takeaways */}
      <div className="nzz-exec-preview-box">
        <h4 className="nzz-exec-takeaways-heading">
          {executiveBrief?.subhead || (isDe ? 'Zentrale Thesen' : 'Key Takeaways')}
        </h4>

        <ul className="nzz-exec-bullet-list">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="nzz-exec-bullet-item">
              <span className="nzz-bullet-symbol">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Article Inclusion Toggle Switch */}
      <div className="nzz-inclusion-toggle-row">
        <button
          type="button"
          role="switch"
          aria-checked={isIncludedInArticle}
          className={`nzz-switch-btn ${isIncludedInArticle ? 'active' : ''}`}
          onClick={handleToggleArticle}
        >
          <span className="nzz-switch-thumb" />
        </button>

        <div className="nzz-inclusion-text-group">
          <span className="nzz-inclusion-label">
            {isDe ? 'Zum Artikel hinzufügen' : 'Add to article'}
          </span>
          <span className="nzz-inclusion-desc">
            {isIncludedInArticle
              ? (isDe ? 'Leser sehen dieses Briefing im veröffentlichten Artikel.' : 'Readers will see this brief in the published article.')
              : (isDe ? 'Diesen Executive Brief innerhalb des Artikels anzeigen.' : 'Display this executive brief within the article.')}
          </span>
        </div>
      </div>
    </article>
  );
};
