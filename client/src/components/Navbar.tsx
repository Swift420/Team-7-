import React from 'react';
import { BarChart3, RefreshCw, Server, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  range: '3m' | '6m' | '12m';
  onRangeChange: (range: '3m' | '6m' | '12m') => void;
  onRefresh: () => void;
  loading: boolean;
  backendConnected: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  range,
  onRangeChange,
  onRefresh,
  loading,
  backendConnected,
}) => {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="logo-icon">
          <BarChart3 size={24} />
        </div>
        <div>
          <h1 className="navbar-title">Data Visualisation Hub</h1>
          <p className="navbar-subtitle">Node.js + React Analytics Platform</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Backend Status indicator */}
        <div className={`status-badge ${backendConnected === true ? 'status-online' : backendConnected === false ? 'status-offline' : 'status-checking'}`}>
          <Server size={14} />
          {backendConnected === true && (
            <>
              <CheckCircle2 size={12} className="status-icon" />
              <span>Backend Online (Port 5001)</span>
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

        {/* Time range selector */}
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
