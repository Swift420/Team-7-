import { createContext } from 'react';

export type Language = 'en' | 'de';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatSection: (section?: string | null) => string;
  formatDate: (date?: string | Date | null, style?: 'short' | 'medium' | 'long' | 'weekday') => string;
  formatRelativeDate: (date?: string | Date | null) => string;
  formatReadTime: (minutes: number) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
