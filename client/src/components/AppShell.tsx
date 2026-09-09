import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useArticles } from "../hooks/useArticles";
import { useArticleRoute } from "../hooks/useArticleRoute";
import { Navbar } from "./Navbar";
import { RoleContextBanner } from "./RoleContextBanner";
import { ArticleFeed } from "./ArticleFeed";
import { CreateArticleModal } from "./CreateArticleModal";
import { ArticleDetailPage } from "./ArticleDetailPage";
import { DummyAccountsModal } from "./DummyAccountsModal";

/** Composes application chrome; feature state stays in providers and child screens. */
export const AppShell: React.FC = () => {
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
  const articleId = useArticleRoute({
    selectedArticleId: selectedArticle?.id,
    openArticle,
  });

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <RoleContextBanner />
        {articleId ? (
          <ArticleDetailPage
            article={selectedArticle}
            loading={!selectedArticle}
          />
        ) : (
          <ArticleFeed />
        )}
      </main>
      <CreateArticleModal
        key={`${isCreateModalOpen ? "open" : "closed"}-${createArticleMode}`}
        isOpen={isCreateModalOpen}
        mode={createArticleMode}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <DummyAccountsModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <footer className="app-footer">
        <div className="footer-inner">
          <div>
            <strong>NZZ Pulse • Multimodal &amp; Visual Studio</strong> • Neue
            Zürcher Zeitung &amp; Google Cloud Hackathon
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>
              Active: <strong>{currentUser.name}</strong> (
              {isEditor ? "Editor" : "Reader"})
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
