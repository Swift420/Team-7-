import React from 'react';
import { BarChart3, RefreshCw, Server, CheckCircle2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';

export type AppViewMode = 'cockpit' | 'reader' | 'analytics';

interface NavbarProps {
  currentView: AppViewMode;
  onViewChange: (mode: AppViewMode) => void;
  range: '3m' | '6m' | '12m';
  onRangeChange: (range: '3m' | '6m' | '12m') => void;
  onRefresh: () => void;
  loading: boolean;
  backendConnected: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  range,
  onRangeChange,
  onRefresh,
  loading,
  backendConnected,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-serif font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-red-950/40">
          NZZ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="navbar-title">NZZ Pulse</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
              Liquid Engine
            </span>
          </div>
          <p className="navbar-subtitle">Multimodal Intelligence & Visual Velocity</p>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => onViewChange('cockpit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'cockpit'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Liquid Cockpit</span>
        </button>

        <button
          onClick={() => onViewChange('reader')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'reader'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Reader Mode</span>
        </button>

        <button
          onClick={() => onViewChange('analytics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'analytics'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Visual Velocity</span>
        </button>
      </div>

      <div className="navbar-actions">
        {/* Backend Status indicator */}
        <div
          className={`status-badge ${
            backendConnected === true
              ? 'status-online'
              : backendConnected === false
              ? 'status-offline'
              : 'status-checking'
          }`}
        >
          <Server size={14} />
          {backendConnected === true && (
            <>
              <CheckCircle2 size={12} className="status-icon" />
              <span>Backend Online</span>
            </>
          )}
          {backendConnected === false && (
            <>
              <AlertCircle size={12} className="status-icon" />
              <span>Backend Offline</span>
            </>
          )}
          {backendConnected === null && <span>Checking API...</span>}
        </div>

        {/* Time range selector (relevant for analytics) */}
        {currentView === 'analytics' && (
          <div className="range-selector">
            {(['3m', '6m', '12m'] as const).map((r) => (
              <button
                key={r}
                className={`range-btn ${range === r ? 'active' : ''}`}
                onClick={() => onRangeChange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <button
          className={`btn-refresh ${loading ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
