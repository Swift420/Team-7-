import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useArticles } from "../hooks/useArticles";
import { useArticleRoute } from "../hooks/useArticleRoute";
import { useLanguage } from "../hooks/useLanguage";
import { Navbar } from "./Navbar";
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
  const { t } = useLanguage();
  const articleId = useArticleRoute({
    selectedArticleId: selectedArticle?.id,
    openArticle,
  });

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="main-content">
        {/* Article Feed / Categories / Sections / Analytics Hub */}
        {articleId ? (
          <ArticleDetailPage
            article={selectedArticle}
            loading={!selectedArticle}
          />
        ) : (
          <ArticleFeed />
        )}
      </main>

      {/* Modals */}
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

      {/* Site Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div>
            <strong>{t("footer.title")}</strong> • {t("footer.collab")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>
              {t("footer.active")} <strong>{currentUser.name}</strong> (
              {isEditor ? t("footer.role_editor") : t("footer.role_reader")})
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
