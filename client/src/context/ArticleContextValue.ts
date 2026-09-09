import { createContext } from "react";
import type { Article, ImportOutcome } from "../types";

export interface ArticleContextType {
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
  createArticleMode: "import" | "create";
  openCreateArticle: (mode: "import" | "create") => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  importArticle: (file: File, draft?: boolean) => Promise<ImportOutcome>;
  deleteArticle: (id: string) => Promise<void>;
  publishArticle: (id: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  isGlobeOpen: boolean;
  setIsGlobeOpen: (open: boolean) => void;
  toggleGlobe: () => void;
}
export const ArticleContext = createContext<ArticleContextType | undefined>(
  undefined,
);
