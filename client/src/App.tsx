import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppViewMode } from './components/Navbar';
import { LiquidCockpit } from './components/liquid/LiquidCockpit';
import { ReaderView } from './components/reader/ReaderView';
import { fetchHealth } from './services/api';
import { fetchConfigStatus } from './services/liquidApi';
import './App.css';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppViewMode>('cockpit');
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'de'>('en');
  const [configStatus, setConfigStatus] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      try {
        await fetchHealth();
      } catch {
        // Backend health ping failed
      }

      // Fetch GCP ADC / API Key config status
      const status = await fetchConfigStatus();
      setConfigStatus(status);
    } catch (err: any) {
      console.error('Error fetching system status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="dashboard-container min-h-screen bg-black text-stone-100 flex flex-col justify-between">
      <div>
        <Navbar
          currentView={currentView}
          onViewChange={(mode) => setCurrentView(mode)}
          language={language}
          onLanguageChange={(newLang) => setLanguage(newLang)}
          onRefresh={loadData}
          loading={loading}
          configStatus={configStatus}
        />

        <main className="dashboard-main max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* VIEW 1: LIQUID COCKPIT (STUDIO & DRAFT) */}
          {currentView === 'cockpit' && (
            <LiquidCockpit language={language} onLanguageChange={setLanguage} />
          )}

          {/* VIEW 2: DYNAMIC READER EXPERIENCE */}
          {currentView === 'reader' && <ReaderView language={language} />}
        </main>
      </div>

      <footer className="dashboard-footer text-center py-6 text-xs text-stone-500 border-t border-stone-900 bg-stone-950">
        <p>
          NZZ Pulse • Liquid Story Engine • Neue Zürcher Zeitung & Google Cloud Hackathon
        </p>
      </footer>
    </div>
  );
};

export default App;
