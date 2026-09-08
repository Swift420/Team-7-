import React, { createContext, useContext, useState, useEffect } from 'react';
import { Article, ArticleStatus } from '../types';
import { INITIAL_ARTICLES } from '../data/mockArticles';
import { useAuth } from './AuthContext';

interface ArticleContextType {
  articles: Article[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
  editingArticle: Article | null;
  setEditingArticle: (article: Article | null) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  
  createArticle: (
    data: {
      title: string;
      subtitle?: string;
      excerpt: string;
      content: string;
      category: string;
      coverImage: string;
      tags: string[];
      readTimeMinutes: number;
    },
    status: ArticleStatus
  ) => Article;
  
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  togglePublish: (id: string) => void;
  likeArticle: (id: string) => void;
  resetDefaultArticles: () => void;
}

const STORAGE_KEY = 'article_hub_articles_v1';

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isEditor } = useAuth();

  const [articles, setArticles] = useState<Article[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse articles from localStorage', e);
    }
    return INITIAL_ARTICLES;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch (e) {
      console.warn('Failed to save articles to localStorage', e);
    }
  }, [articles]);

  const createArticle = (
    data: {
      title: string;
      subtitle?: string;
      excerpt: string;
      content: string;
      category: string;
      coverImage: string;
      tags: string[];
      readTimeMinutes: number;
    },
    status: ArticleStatus
  ): Article => {
    const today = new Date().toISOString().split('T')[0];
    const newArticle: Article = {
      id: `art-${Date.now()}`,
      title: data.title.trim(),
      subtitle: data.subtitle?.trim() || undefined,
      excerpt: data.excerpt.trim(),
      content: data.content,
      category: data.category,
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      tags: data.tags.filter(Boolean),
      readTimeMinutes: data.readTimeMinutes || 5,
      status: status,
      publishedAt: today,
      views: 1,
      likes: 0,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.title || 'Editor',
      },
    };

    setArticles((prev) => [newArticle, ...prev]);
    return newArticle;
  };

  const updateArticle = (id: string, updates: Partial<Article>) => {
    if (!isEditor) return;
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : art))
    );
    if (selectedArticle?.id === id) {
      setSelectedArticle((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteArticle = (id: string) => {
    if (!isEditor) return;
    setArticles((prev) => prev.filter((art) => art.id !== id));
    if (selectedArticle?.id === id) {
      setSelectedArticle(null);
    }
  };

  const togglePublish = (id: string) => {
    if (!isEditor) return;
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id === id) {
          const nextStatus: ArticleStatus = art.status === 'published' ? 'draft' : 'published';
          return { ...art, status: nextStatus };
        }
        return art;
      })
    );
    if (selectedArticle?.id === id) {
      setSelectedArticle((prev) =>
        prev ? { ...prev, status: prev.status === 'published' ? 'draft' : 'published' } : null
      );
    }
  };

  const likeArticle = (id: string) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, likes: art.likes + 1 } : art))
    );
    if (selectedArticle?.id === id) {
      setSelectedArticle((prev) => (prev ? { ...prev, likes: prev.likes + 1 } : null));
    }
  };

  const resetDefaultArticles = () => {
    setArticles(INITIAL_ARTICLES);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ArticleContext.Provider
      value={{
        articles,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedArticle,
        setSelectedArticle,
        editingArticle,
        setEditingArticle,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        createArticle,
        updateArticle,
        deleteArticle,
        togglePublish,
        likeArticle,
        resetDefaultArticles,
      }}
    >
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticles = (): ArticleContextType => {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
};
