import React from 'react';
import {
  RefreshCw,
  Sparkles,
  BookOpen,
  Globe2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type AppViewMode = 'cockpit' | 'reader';

interface NavbarProps {
  currentView: AppViewMode;
  onViewChange: (mode: AppViewMode) => void;
  language: 'en' | 'de';
  onLanguageChange: (lang: 'en' | 'de') => void;
  onRefresh: () => void;
  loading: boolean;
  configStatus?: {
    configured: boolean;
    type: 'adc' | 'api-key' | 'none';
    projectId: string | null;
    costSavedPercentage?: number;
    cacheStats?: any;
  } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  language,
  onLanguageChange,
  onRefresh,
  loading,
  configStatus,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Editorial Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-serif font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-red-950/40">
          NZZ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">NZZ Pulse</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
              Liquid Media
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {language === 'de'
              ? 'Multimodale Redaktion & Visuelle Formate'
              : 'Multimodal Intelligence & Visual Deliverables'}
          </p>
        </div>
      </div>

      {/* Main View Mode Tabs */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => onViewChange('cockpit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'cockpit'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'de' ? 'Studio & Entwurf' : 'Studio & Draft'}</span>
        </button>

        <button
          onClick={() => onViewChange('reader')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'reader'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{language === 'de' ? 'Leseransicht' : 'Reader View'}</span>
        </button>
      </div>

      {/* Language Toggle & GCP Status */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs" title="Switch Language">
          <div className="pl-2 pr-1 text-slate-400">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
          <button
            onClick={() => onLanguageChange('en')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              language === 'en'
                ? 'bg-red-600/30 border border-red-500/50 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇬🇧</span>
            <span>English</span>
          </button>
          <button
            onClick={() => onLanguageChange('de')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              language === 'de'
                ? 'bg-red-600/30 border border-red-500/50 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🇩🇪</span>
            <span>Deutsch</span>
          </button>
        </div>

        {/* GCP Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            configStatus?.configured
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
          title={
            configStatus?.configured
              ? `Live Vertex AI Connected (Project: ${configStatus.projectId || 'Default'})`
              : 'GCP Credentials not detected'
          }
        >
          {configStatus?.configured ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{configStatus.projectId ? `Vertex AI: ${configStatus.projectId}` : 'Vertex AI Connected'}</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>GCP Disconnected</span>
            </>
          )}

          {configStatus?.costSavedPercentage !== undefined && configStatus.costSavedPercentage > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-700/50">
              {configStatus.costSavedPercentage}% Saved
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-500' : ''}`} />
        </button>
      </div>
    </header>
  );
};
