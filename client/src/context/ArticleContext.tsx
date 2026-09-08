import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Article, ImportOutcome } from '../types';
import { fetchArticle, fetchArticles, importArticle as uploadArticle, removeArticle } from '../services/api';

interface ArticleContextType {
  articles: Article[];
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedArticle: Article | null;
  openArticle: (id: string) => Promise<void>;
  closeArticle: () => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  importArticle: (file: File) => Promise<ImportOutcome>;
  deleteArticle: (id: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setArticles(await fetchArticles()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load articles'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refreshArticles(); }, [refreshArticles]);

  const openArticle = useCallback(async (id: string) => {
    setError(null);
    if (window.location.pathname !== `/articles/${id}`) {
      window.history.pushState({}, '', `/articles/${id}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    try { setSelectedArticle(await fetchArticle(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to open article'); }
  }, []);

  const importArticle = async (file: File) => {
    const outcome = await uploadArticle(file);
    await refreshArticles();
    setSelectedArticle(outcome.article);
    return outcome;
  };

  const deleteArticle = async (id: string) => {
    await removeArticle(id);
    setArticles((current) => current.filter((article) => article.id !== id));
    if (selectedArticle?.id === id) setSelectedArticle(null);
  };

  return <ArticleContext.Provider value={{
    articles, loading, error, selectedCategory, setSelectedCategory, searchQuery, setSearchQuery,
    selectedArticle, openArticle, closeArticle: () => {
      setSelectedArticle(null);
      if (window.location.pathname.startsWith('/articles/')) {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }, isCreateModalOpen,
    setIsCreateModalOpen, isAuthModalOpen, setIsAuthModalOpen, importArticle, deleteArticle, refreshArticles,
  }}>{children}</ArticleContext.Provider>;
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (!context) throw new Error('useArticles must be used within an ArticleProvider');
  return context;
};
