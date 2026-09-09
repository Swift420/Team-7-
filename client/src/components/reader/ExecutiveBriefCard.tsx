import React from 'react';
import { Mail } from 'lucide-react';
import type { ExecutiveNewsletterFormat } from '../../types/liquid';
import { useLanguage } from '../../context/LanguageContext';

interface ExecutiveBriefCardProps {
  brief: ExecutiveNewsletterFormat;
  language?: 'en' | 'de';
}

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({
  brief,
  language: propLanguage,
}) => {
  const { language: ctxLanguage, t } = useLanguage();
  const activeLanguage = propLanguage || ctxLanguage;
  const isGerman = activeLanguage === 'de';

  return (
    <aside className="nzz-executive-card">
      <div className="nzz-executive-header">
        <div className="nzz-executive-title-group">
          <Mail className="w-4 h-4 text-red-600" />
          <span className="nzz-executive-kicker">
            {t('exec.kicker')}
          </span>
        </div>
        <span className="nzz-executive-meta">
          {t('exec.meta')}
        </span>
      </div>

      {brief.subhead && <h4 className="nzz-executive-subhead">{brief.subhead}</h4>}

      <ul className="nzz-executive-list">
        {brief.bullets.map((bullet, idx) => (
          <li key={idx} className="nzz-executive-item">
            <span className="nzz-executive-num">{idx + 1}</span>
            <span className="nzz-executive-text">{bullet}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
