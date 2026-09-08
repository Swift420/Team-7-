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

// PostgreSQL-backed article types
export type SourceFormat = 'NZZ_JSON' | 'MARKDOWN';
export type ArticleElementType = 'paragraph' | 'heading' | 'image' | 'q_tool_embed' | 'embed' | 'other';

export interface ArticleBodyElement {
  id: string;
  type: ArticleElementType;
  text?: string;
  level?: number;
  url?: string;
  caption?: string;
  credit?: string;
  service?: string;
  externalId?: string;
  rawType?: string;
}

export interface Article {
  id: string;
  importKey: string;
  nzzId: string | null;
  documentId: string | null;
  headline: string;
  lead: string | null;
  authorLine: string | null;
  section: string | null;
  language: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  body?: ArticleBodyElement[];
  rawContent?: unknown;
  sourceFormat: SourceFormat;
  teaserImage: { url?: string; caption?: string; credit?: string } | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImportOutcome {
  status: 'imported' | 'skipped';
  article: Article;
  reason?: string;
}

export type VisualizationChartType = 'bar' | 'line' | 'area' | 'stacked_bar' | 'dot_plot' | 'donut' | 'timeline' | 'map';
export type VisualizationDataStatus = 'ready' | 'needs_review';

export interface TimelineEvent {
  dateLabel: string;
  title: string;
  description: string;
  sourceParagraphIds: string[];
}

export interface VisualizationOpportunity {
  id: string;
  type?: 'CHART' | 'TIMELINE';
  title: string;
  subtitle: string;
  rationale: string;
  reason?: string;
  chartType: VisualizationChartType;
  confidence: number;
  dataStatus: VisualizationDataStatus;
  relatedElementIds: string[];
  suggestedPlacementAfter: string;
  xAxisLabel: string;
  yAxisLabel: string;
  unit: string;
  series: Array<{ key: string; label: string }>;
  data: Array<{ label: string; values: number[]; sourceElementIds: string[] }>;
  events?: TimelineEvent[];
  sourceNote: string;
  caveats: string[];
  accessibilitySummary: string;
}

export interface VisualizationAnalysis {
  model: string;
  analyzedAt: string;
  summary: string;
  opportunities: VisualizationOpportunity[];
}

export interface SavedVisualization {
  id: string;
  articleId: string;
  status: 'approved';
  placementAfterElementId: string;
  specification: VisualizationOpportunity;
  createdAt: string;
  updatedAt: string;
}

export interface VisualizationApproval {
  id: string;
  articleId: string;
  actor: string;
  action: 'saved' | 'cleared';
  visualizations: VisualizationOpportunity[];
  createdAt: string;
}

export interface ExistingVisualization {
  elementId: string;
  externalId: string;
  tool: string;
  title: string;
  subtitle: string;
  notes: string;
  sources: Array<{ text: string; url: string }>;
  chartType: VisualizationChartType | null;
  series: Array<{ key: string; label: string }>;
  data: Array<{ label: string; values: number[]; sourceElementIds: string[] }>;
  table: string[][];
  assetUrls: string[];
  mapData?: Array<{ label: string; value: string }>;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  restrictedToEditors?: boolean;
}

export type { CountryCoverage, CountryStorySummary } from './country';
