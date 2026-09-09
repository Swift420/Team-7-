import React from 'react';
import { Sparkles, Info } from 'lucide-react';

interface StudioHeaderProps {
  language?: 'en' | 'de';
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({ language = 'en' }) => {
  const isDe = language === 'de';

  return (
    <header className="nzz-studio-header">
      <div className="nzz-studio-header-left">
        <Sparkles className="nzz-studio-header-icon" strokeWidth={1.75} />
        <div className="nzz-studio-header-titles">
          <div className="nzz-studio-header-title-row">
            <h2 className="nzz-studio-title">
              {isDe ? 'Multimodales Content Studio' : 'Multimodal Content Studio'}
            </h2>
            <span className="nzz-vertex-pill">
              {isDe ? 'POWERED BY VERTEX AI' : 'POWERED BY VERTEX AI'}
            </span>
          </div>
          <p className="nzz-studio-subtitle">
            {isDe
              ? 'Erstellen und verwalten Sie KI-gestützte Inhalte für diesen Artikel. Prüfen, bearbeiten und plattformübergreifend veröffentlichen.'
              : 'Generate and manage AI-powered content for this article. Review, edit, and publish across platforms.'}
          </p>
        </div>
      </div>

      <div className="nzz-studio-header-right">
        <Info className="nzz-studio-info-icon" />
        <span>
          {isDe
            ? 'Inhalte werden aus Ihrem Artikel generiert und für jedes Format optimiert.'
            : 'Content is generated from your article and tailored for each format.'}
        </span>
      </div>
    </header>
  );
};
