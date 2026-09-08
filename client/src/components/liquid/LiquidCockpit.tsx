import React, { useState } from 'react';
import { Library, PenTool } from 'lucide-react';
import { DraftStudio } from './DraftStudio';
import { ArticleFeed } from './ArticleFeed';
import { ArticleStudio } from './ArticleStudio';

export interface LiquidCockpitProps {
  language?: 'en' | 'de';
  onLanguageChange?: (lang: 'en' | 'de') => void;
}

export const LiquidCockpit: React.FC<LiquidCockpitProps> = ({
  language = 'en',
  onLanguageChange,
}) => {
  // Defect 5: Make 'draft' view the default cockpit landing screen
  const [activeTab, setActiveTab] = useState<'draft' | 'feed'>('draft');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const isGerman = language === 'de';

  return (
    <div className="w-full space-y-4">
      {/* View Switcher: Draft vs Archive */}
      {!selectedArticleId && (
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('draft')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'draft'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isGerman ? '✍️ Neuer Entwurf (Live-KI)' : '✍️ Live Draft (Vertex AI)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>{isGerman ? '📂 Archiv-Dossiers' : '📂 Dossier Archive'}</span>
            </button>
          </div>

          <div className="text-xs text-stone-500 font-mono hidden sm:block">
            {activeTab === 'draft'
              ? (isGerman ? 'Direkte Texteingabe • Keine Schein-Daten' : 'Direct Text Input • Zero Pre-Cached Mock')
              : (isGerman ? 'Gespeicherte redaktionelle Dossiers' : 'Pre-published Editorial Dossiers')}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {selectedArticleId ? (
        <ArticleStudio
          articleId={selectedArticleId}
          language={language}
          onBack={() => setSelectedArticleId(null)}
        />
      ) : activeTab === 'draft' ? (
        <DraftStudio
          language={language}
          onLanguageChange={onLanguageChange}
        />
      ) : (
        <ArticleFeed
          language={language}
          onLanguageChange={onLanguageChange || (() => {})}
          onSelectArticle={(id) => setSelectedArticleId(id)}
        />
      )}
    </div>
  );
};
