export interface MetricOverview {
  totalRevenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  avgOrderValue: number;
  aovGrowth: number;
}

export interface TimeSeriesPoint {
  month: string;
  revenue: number;
  profit: number;
  expenses: number;
  target: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface RegionalData {
  region: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
}

export interface PerformanceMetric {
  subject: string;
  score: number;
  benchmark: number;
  fullMark: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  bounceRate: number;
}

// User & Role Types
export type UserRole = 'viewer' | 'editor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  bio?: string;
  password?: string;
}

// Article Types
export type ArticleStatus = 'published' | 'draft';

export interface ArticleAuthor {
  id?: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: ArticleAuthor;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  status: ArticleStatus;
  views: number;
  likes: number;
  featured?: boolean;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  restrictedToEditors?: boolean;
}

