import type {
  ArticleSummary,
  ArticleDetail,
  LiquidDerivativesPayload,
} from "../types/liquid";

interface CacheStats {
  hits?: number;
  misses?: number;
  entries?: number;
  [key: string]: unknown;
}

interface StoredArticleSummary {
  id?: string;
}

const messageFromError = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown client error";

const BASE_URL = "/api/liquid";

// Liquid endpoints generate expensive derivatives, so this client prefers server/cache results before generation.
export async function fetchConfigStatus(): Promise<{
  configured: boolean;
  type: "adc" | "api-key" | "none";
  projectId: string | null;
  costSavedPercentage?: number;
  cacheStats?: CacheStats;
}> {
  try {
    const res = await fetch(`${BASE_URL}/config-status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch config status:", err);
  }
  return {
    configured: false,
    type: "none",
    projectId: null,
  };
}

export async function fetchArticles(
  lang: "en" | "de" = "en",
  category?: string,
  query?: string,
): Promise<ArticleSummary[]> {
  try {
    const params = new URLSearchParams({ lang });
    if (category && category !== "ALL" && category !== "ALLE")
      params.append("category", category);
    if (query) params.append("query", query);

    const res = await fetch(`${BASE_URL}/articles?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.articles || [];
    }
  } catch (err) {
    console.error("Failed to fetch articles:", err);
  }
  return [];
}

export async function fetchCategoriesAndTags(): Promise<{
  categories: string[];
  tags: string[];
}> {
  try {
    const res = await fetch(`${BASE_URL}/categories`);
    if (res.ok) {
      const data = await res.json();
      return { categories: data.categories || [], tags: data.tags || [] };
    }
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }
  return { categories: [], tags: [] };
}

export async function fetchArticleDetail(
  id: string,
  lang: "en" | "de" = "en",
): Promise<ArticleDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/articles/${id}?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      return data.article || null;
    }
  } catch (err) {
    console.error(`Failed to fetch article ${id}:`, err);
  }
  return null;
}

export async function generateLiquidFormats(
  params: {
    articleId?: string;
    headline?: string;
    lead?: string;
    body?: string;
    author?: string;
    section?: string;
    language?: "en" | "de";
    model?: string;
  },
  demoMode: boolean = false,
): Promise<LiquidDerivativesPayload> {
  const endpoint = `${BASE_URL}/generate${demoMode ? "?demo=1" : ""}`;
  console.log(`[Liquid API] Calling ${endpoint} (demoMode=${demoMode})`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errorMsg = `Server error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    console.error(`[Liquid API Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (!data.success || !data.data) {
    throw new Error(data.error || "Failed to generate liquid derivatives");
  }

  return data.data;
}

export async function generateSlideImage(params: {
  prompt: string;
  aspectRatio?: string;
  headline?: string;
  category?: string;
  articleTitle?: string;
  lead?: string;
  slideSummary?: string;
  bustCache?: boolean;
  model?: string;
}): Promise<{
  imageUrl: string;
  source: string;
  aspectRatio: string;
  prompt: string;
}> {
  console.log(
    `[Liquid API] Generating image for prompt: "${params.prompt.slice(0, 50)}..."`,
  );
  const res = await fetch(`${BASE_URL}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errorMsg = `Image generation error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    console.error(`[Liquid API Image Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data.data;
}

export async function generateDeckImagesApi(params: {
  slides: Array<{
    slideNumber: number;
    headline: string;
    imagePrompt?: string;
    hasImage?: boolean;
  }>;
  headline?: string;
  category?: string;
  lead?: string;
  bustCache?: boolean;
}): Promise<
  Record<
    number,
    { imageUrl: string; source: string; aspectRatio: string; prompt: string }
  >
> {
  console.log(
    `[Liquid API] Generating batch images for ${params.slides.length} slides...`,
  );
  const res = await fetch(`${BASE_URL}/generate-deck-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errorMsg = `Batch image generation error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    console.error(`[Liquid API Deck Images Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data.data;
}

export async function synthesizeAudio(params: {
  script: string;
  author?: string;
  language?: string;
  voiceName?: string;
}): Promise<{
  audioUrl: string;
  durationSeconds: number;
  format: string;
  source: string;
}> {
  console.log(
    `[Liquid API] Synthesizing audio brief (${params.language || "en"})...`,
  );
  const res = await fetch(`${BASE_URL}/synthesize-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let errorMsg = `Audio synthesis error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    console.error(`[Liquid API Audio Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data.data;
}

export async function lintText(params: {
  text: string;
  language?: "en" | "de";
  isHeadline?: boolean;
  isSubhead?: boolean;
}): Promise<{ valid: boolean; warnings: string[] }> {
  try {
    const res = await fetch(`${BASE_URL}/lint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || data.report;
    }
  } catch {
    // fallback
  }

  const warnings: string[] = [];
  if (
    params.text.includes('"') ||
    params.text.includes("“") ||
    params.text.includes("”")
  ) {
    warnings.push(
      "NZZ Invariant: Swiss guillemets « » required instead of US quotes.",
    );
  }
  if (params.isHeadline && /[.!?]$/.test(params.text.trim())) {
    warnings.push(
      "NZZ Invariant: Headlines must not end with a terminal period.",
    );
  }
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export async function publishFormats(params: {
  articleId: string;
  payload: LiquidDerivativesPayload;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPublishedFormats(
  articleId: string,
): Promise<LiquidDerivativesPayload | null> {
  try {
    const res = await fetch(`${BASE_URL}/published/${articleId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.error(`Failed to fetch published formats for ${articleId}:`, err);
  }
  return null;
}

export async function createArticleApi(articleData: {
  id?: string;
  headline: string;
  lead?: string;
  body: string;
  author?: string;
  section?: string;
  category?: string;
  tags?: string[];
  language?: "en" | "de";
  status?: "draft" | "published";
}): Promise<{ success: boolean; article?: ArticleDetail; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/articles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleData),
    });
    return await res.json();
  } catch (error: unknown) {
    return { success: false, error: messageFromError(error) };
  }
}

export function saveCustomArticle(article: ArticleDetail): void {
  // 1. Offline local storage caching
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(
        localStorage.getItem("nzz_custom_articles") || "[]",
      );
      const filtered = (existing as StoredArticleSummary[]).filter(
        (item) => item.id !== article.id,
      );
      filtered.unshift(article);
      localStorage.setItem("nzz_custom_articles", JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }

  // 2. Persistent server-side database save
  fetch(`${BASE_URL}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: article.id,
      headline: article.headline,
      lead: article.lead,
      body: article.body,
      author: article.author,
      section: article.section,
      category: article.category || article.section,
      tags: article.tags || ["#NZZ"],
      language: article.language || "en",
      status: article.status || "draft",
    }),
  }).catch((err) => {
    console.error("Failed to persist custom article to server db:", err);
  });
}
