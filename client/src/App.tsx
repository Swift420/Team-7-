import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArticleProvider, useArticles } from './context/ArticleContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { RoleContextBanner } from './components/RoleContextBanner';
import { ArticleFeed } from './components/ArticleFeed';
import { CreateArticleModal } from './components/CreateArticleModal';
import { ArticleDetailPage } from './components/ArticleDetailPage';
import { DummyAccountsModal } from './components/DummyAccountsModal';
import './App.css';

const MainApp: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createArticleMode,
    selectedArticle,
    openArticle,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useArticles();
  const { currentUser, isEditor } = useAuth();
  const { t } = useLanguage();
  const [pathname, setPathname] = React.useState(window.location.pathname);
  const articleId = pathname.match(/^\/articles\/([^/]+)$/)?.[1];

  React.useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    if (articleId && selectedArticle?.id !== articleId) void openArticle(articleId);
    return () => window.removeEventListener('popstate', onPopState);
  }, [articleId, openArticle, selectedArticle?.id]);

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="main-content">
        {/* Role & Privileges Context Banner */}
        <RoleContextBanner />

        {/* Article Feed / Categories / Sections / Analytics Hub */}
        {articleId ? (
          <ArticleDetailPage article={selectedArticle} loading={!selectedArticle} />
        ) : (
          <ArticleFeed />
        )}
      </main>

      {/* Modals */}
      <CreateArticleModal
        key={`${isCreateModalOpen ? 'open' : 'closed'}-${createArticleMode}`}
        isOpen={isCreateModalOpen}
        mode={createArticleMode}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <DummyAccountsModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Site Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div>
            <strong>{t('footer.title')}</strong> • {t('footer.collab')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>
              {t('footer.active')} <strong>{currentUser.name}</strong> ({isEditor ? t('footer.role_editor') : t('footer.role_reader')})
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ArticleProvider>
          <MainApp />
        </ArticleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
