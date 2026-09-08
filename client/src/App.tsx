import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArticleProvider, useArticles } from './context/ArticleContext';
import { Navbar } from './components/Navbar';
import { RoleContextBanner } from './components/RoleContextBanner';
import { ArticleFeed } from './components/ArticleFeed';
import { CreateArticleModal } from './components/CreateArticleModal';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { DummyAccountsModal } from './components/DummyAccountsModal';
import { RotateCcw } from 'lucide-react';
import './App.css';

const MainApp: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedArticle,
    setSelectedArticle,
    editingArticle,
    isAuthModalOpen,
    setIsAuthModalOpen,
    resetDefaultArticles,
  } = useArticles();
  const { currentUser, isEditor } = useAuth();

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="main-content">
        {/* Role & Privileges Context Banner */}
        <RoleContextBanner />

        {/* Article Feed / Categories / Sections / Analytics Hub */}
        <ArticleFeed />
      </main>

      {/* Modals */}
      <CreateArticleModal
        key={editingArticle?.id || (isCreateModalOpen ? 'create-open' : 'create-closed')}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <DummyAccountsModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Site Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div>
            <strong>Chronicle Insights & Data</strong> • Role-based Article Publication Platform (React 19 + TypeScript)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>
              Active: <strong>{currentUser.name}</strong> ({isEditor ? 'Editor' : 'Viewer'})
            </span>
            <button
              className="btn-reset-demo"
              onClick={() => {
                if (window.confirm('Reset articles and drafts to default seed data?')) {
                  resetDefaultArticles();
                }
              }}
              title="Reset initial dummy articles"
            >
              <RotateCcw size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Reset Demo Articles
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ArticleProvider>
        <MainApp />
      </ArticleProvider>
    </AuthProvider>
  );
};

export default App;
