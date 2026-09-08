export type SourceFormat = 'NZZ_JSON' | 'MARKDOWN';
export type PublicationStatus = 'draft' | 'published';

export type ArticleElementType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'q_tool_embed'
  | 'embed'
  | 'other';

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
  raw?: unknown;
}

export interface NormalizedArticle {
  id?: string;
  importKey: string;
  nzzId: string | null;
  documentId: string | null;
  headline: string;
  lead: string | null;
  authorLine: string | null;
  section: string | null;
  language: string | null;
  sourceUrl: string | null;
  publishedAt: Date | null;
  body: ArticleBodyElement[];
  rawContent: unknown;
  sourceFormat: SourceFormat;
  teaserImage: Record<string, unknown> | null;
  tags: string[];
  publicationStatus?: PublicationStatus;
}

export interface ArticleRecord extends NormalizedArticle {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  publicationStatus?: PublicationStatus;
}

export type ArticleSummary = Omit<ArticleRecord, 'body' | 'rawContent'>;

export type ImportOutcome =
  | { status: 'imported'; article: ArticleRecord }
  | { status: 'skipped'; article: ArticleRecord; reason: string };
