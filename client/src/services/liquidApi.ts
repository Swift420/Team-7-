import type {
  ArticleSummary,
  ArticleDetail,
  LiquidDerivativesPayload,
} from '../types/liquid';

const BASE_URL = '/api/liquid';

export async function fetchArticles(): Promise<ArticleSummary[]> {
  const res = await fetch(`${BASE_URL}/articles`);
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.statusText}`);
  const data = await res.json();
  return data.articles;
}

export async function fetchArticleDetail(id: string): Promise<ArticleDetail> {
  const res = await fetch(`${BASE_URL}/articles/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch article ${id}: ${res.statusText}`);
  const data = await res.json();
  return data.article;
}

export async function generateLiquidFormats(params: {
  articleId: string;
  headline?: string;
  lead?: string;
  body?: string;
  author?: string;
  section?: string;
  language?: string;
  model?: 'gemini-3.8-flash' | 'gemini-3.8-pro';
  mock?: boolean;
}): Promise<LiquidDerivativesPayload> {
  const res = await fetch(`${BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Generation failed: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function synthesizeAudio(params: {
  script: string;
  author?: string;
  language?: string;
  voiceName?: string;
  mock?: boolean;
}): Promise<{ audioUrl: string; durationSeconds: number; wordCount: number }> {
  const res = await fetch(`${BASE_URL}/synthesize-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Audio synthesis failed: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function lintText(params: {
  text: string;
  isHeadline?: boolean;
  isSubhead?: boolean;
  language?: string;
}): Promise<{ hasErrors: boolean; hasWarnings: boolean; errors: string[]; warnings: string[] }> {
  const res = await fetch(`${BASE_URL}/lint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Lint failed: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function publishFormats(params: {
  articleId: string;
  payload: LiquidDerivativesPayload;
}): Promise<void> {
  const res = await fetch(`${BASE_URL}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Publish failed: ${res.statusText}`);
}

export async function fetchPublishedFormats(articleId: string): Promise<LiquidDerivativesPayload | null> {
  try {
    const res = await fetch(`${BASE_URL}/published/${articleId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}
