import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Article } from "../types";
import { ArticleContext } from "./ArticleContextValue";
import {
  fetchArticle,
  fetchArticles,
  importArticle as uploadArticle,
  publishArticle as publishArticleRequest,
  removeArticle,
} from "../services/api";

/** Owns article collection state and mutations shared by feed and detail views. */
export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createArticleMode, setCreateArticleMode] = useState<
    "import" | "create"
  >("import");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setArticles(await fetchArticles());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load articles",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetching here keeps loading and error state consistent across every screen.
  useEffect(() => {
    void refreshArticles();
  }, [refreshArticles]);

  const openArticle = useCallback(async (id: string) => {
    setError(null);
    if (window.location.pathname !== `/articles/${id}`) {
      window.history.pushState({}, "", `/articles/${id}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    try {
      setSelectedArticle(await fetchArticle(id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to open article",
      );
    }
  }, []);

  const importArticle = useCallback(
    async (file: File, draft = false) => {
      const outcome = await uploadArticle(file, draft);
      await refreshArticles();
      setSelectedArticle(outcome.article);
      return outcome;
    },
    [refreshArticles],
  );

  const deleteArticle = useCallback(
    async (id: string) => {
      await removeArticle(id);
      setArticles((current) => current.filter((article) => article.id !== id));
      if (selectedArticle?.id === id) setSelectedArticle(null);
    },
    [selectedArticle?.id],
  );

  const publishArticle = useCallback(
    async (id: string) => {
      const published = await publishArticleRequest(id);
      setArticles((current) =>
        current.some((article) => article.id === id)
          ? current.map((article) => (article.id === id ? published : article))
          : [...current, published],
      );
      if (selectedArticle?.id === id) setSelectedArticle(published);
    },
    [selectedArticle?.id],
  );

  const closeArticle = useCallback(() => {
    setSelectedArticle(null);
    if (window.location.pathname.startsWith("/articles/")) {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, []);

  const openCreateArticle = useCallback((mode: "import" | "create") => {
    setCreateArticleMode(mode);
    setIsCreateModalOpen(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      articles,
      loading,
      error,
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      selectedArticle,
      openArticle,
      closeArticle,
      isCreateModalOpen,
      setIsCreateModalOpen,
      createArticleMode,
      openCreateArticle,
      isAuthModalOpen,
      setIsAuthModalOpen,
      importArticle,
      deleteArticle,
      publishArticle,
      refreshArticles,
    }),
    [
      articles,
      loading,
      error,
      selectedCategory,
      searchQuery,
      selectedArticle,
      openArticle,
      closeArticle,
      isCreateModalOpen,
      createArticleMode,
      openCreateArticle,
      isAuthModalOpen,
      importArticle,
      deleteArticle,
      publishArticle,
      refreshArticles,
    ],
  );

  return (
    <ArticleContext.Provider value={contextValue}>
      {children}
    </ArticleContext.Provider>
  );
};
