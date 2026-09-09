import { randomUUID } from "node:crypto";
import { query } from "../config/database.js";
import { db } from "../db/database.js";
import {
  ArticleBodyElement,
  ArticleRecord,
  ArticleSummary,
  NormalizedArticle,
  SourceFormat,
} from "../types/article.js";

// PostgreSQL is authoritative when available; the JSON store keeps local/demo mode functional.
type JsonArticleLike = {
  id: string;
  headline: string;
  body?: string | ArticleBodyElement[];
  lead?: string | null;
  section?: string | null;
  category?: string | null;
  language?: string | null;
  tags?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  author?: string;
  status?: "draft" | "published";
  teaserImage?: Record<string, unknown> | string | null;
  teaser_image?: Record<string, unknown> | null;
};

interface ArticleRow {
  id: string;
  import_key: string;
  nzz_id: string | null;
  document_id: string | null;
  headline: string;
  lead: string | null;
  author_line: string | null;
  section: string | null;
  language: string | null;
  source_url: string | null;
  published_at: Date | null;
  body: ArticleBodyElement[];
  raw_content: unknown;
  source_format: SourceFormat;
  teaser_image: Record<string, unknown> | null;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  publication_status: "draft" | "published";
}

const columns = `
  id, import_key, nzz_id, document_id, headline, lead, author_line, section, language,
  source_url, published_at, body, raw_content, source_format, teaser_image, tags, publication_status,
  created_at, updated_at
`;
const summaryColumns = `
  id, import_key, nzz_id, document_id, headline, lead, author_line, section, language,
  source_url, published_at, source_format, teaser_image, tags, publication_status, created_at, updated_at
`;

const FALLBACK_EDITORIAL_IMAGES: Record<string, string> = {
  technology:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  economy:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  finance:
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  sports:
    "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
  mobility:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  science:
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80",
  default:
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
};

const resolveTeaserImage = (a: JsonArticleLike): Record<string, unknown> => {
  if (a.teaserImage && typeof a.teaserImage !== "string" && a.teaserImage.url)
    return a.teaserImage;
  if (a.teaser_image?.url) return a.teaser_image;
  if (typeof a.teaserImage === "string" && a.teaserImage.startsWith("http")) {
    return { url: a.teaserImage, caption: a.headline, credit: "NZZ Editorial" };
  }
  try {
    const deriv = a.id ? db.getDerivatives(a.id) : null;
    const derivImage = deriv?.instagramCarousel?.slides?.[0]?.imageUrl;
    if (derivImage) {
      return { url: derivImage, caption: a.headline, credit: "NZZ Editorial" };
    }
  } catch {}

  const text =
    `${a.headline || ""} ${a.section || ""} ${a.category || ""}`.toLowerCase();
  let url = FALLBACK_EDITORIAL_IMAGES.default;
  if (
    /tech|smartphone|battery|ai|chip|software|cyber|pocket|computer/i.test(text)
  )
    url = FALLBACK_EDITORIAL_IMAGES.technology;
  else if (/wirtschaft|economy|market|trade|tariff|inflation/i.test(text))
    url = FALLBACK_EDITORIAL_IMAGES.economy;
  else if (/finanz|finance|bank|credit|stock|invest/i.test(text))
    url = FALLBACK_EDITORIAL_IMAGES.finance;
  else if (/sport|football|ski|olympic/i.test(text))
    url = FALLBACK_EDITORIAL_IMAGES.sports;
  else if (/mobil|car|porsche|auto|traffic|plane|sustenpass/i.test(text))
    url = FALLBACK_EDITORIAL_IMAGES.mobility;
  else if (/science|climate|energy|physics|space/i.test(text))
    url = FALLBACK_EDITORIAL_IMAGES.science;

  return { url, caption: a.headline, credit: "NZZ Editorial" };
};

const mapRow = (row: ArticleRow): ArticleRecord => ({
  id: row.id,
  importKey: row.import_key,
  nzzId: row.nzz_id,
  documentId: row.document_id,
  headline: row.headline,
  lead: row.lead,
  authorLine: row.author_line,
  section: row.section,
  language: row.language,
  sourceUrl: row.source_url,
  publishedAt: row.published_at,
  body: row.body,
  rawContent: row.raw_content,
  sourceFormat: row.source_format,
  teaserImage: resolveTeaserImage(row),
  tags: row.tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publicationStatus: row.publication_status,
});

const mapJsonToSummary = (a: JsonArticleLike): ArticleSummary => ({
  id: a.id,
  importKey: a.id,
  nzzId: a.id,
  documentId: a.id,
  headline: a.headline,
  lead: a.lead || null,
  authorLine: a.author || null,
  section: a.section || a.category || "News",
  language: a.language || "en",
  sourceUrl: null,
  publishedAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  sourceFormat: "MARKDOWN",
  teaserImage: resolveTeaserImage(a),
  tags: a.tags || ["#NZZ"],
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
  publicationStatus: a.status || "published",
});

const mapJsonToRecord = (a: JsonArticleLike): ArticleRecord => ({
  id: a.id,
  importKey: a.id,
  nzzId: a.id,
  documentId: a.id,
  headline: a.headline,
  lead: a.lead || null,
  authorLine: a.author || null,
  section: a.section || a.category || "News",
  language: a.language || "en",
  sourceUrl: null,
  publishedAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  body: (typeof a.body === "string" ? a.body : "")
    .split(/\n\n+/)
    .filter(Boolean)
    .map((p: string, idx: number) => ({
      id: `p-${idx + 1}`,
      type: "paragraph" as const,
      text: p.trim(),
    })),
  rawContent: a,
  sourceFormat: "MARKDOWN",
  teaserImage: resolveTeaserImage(a),
  tags: a.tags || ["#NZZ"],
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
  publicationStatus: a.status || "published",
});

export async function listArticles(
  includeDrafts = false,
): Promise<ArticleSummary[]> {
  try {
    const result = await query<Omit<ArticleRow, "body" | "raw_content">>(
      `SELECT ${summaryColumns} FROM articles ${includeDrafts ? "" : "WHERE publication_status = 'published'"} ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    );
    if (result.rows && result.rows.length > 0) {
      return result.rows.map((row) => ({
        id: row.id,
        importKey: row.import_key,
        nzzId: row.nzz_id,
        documentId: row.document_id,
        headline: row.headline,
        lead: row.lead,
        authorLine: row.author_line,
        section: row.section,
        language: row.language,
        sourceUrl: row.source_url,
        publishedAt: row.published_at,
        sourceFormat: row.source_format,
        teaserImage: resolveTeaserImage(row),
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publicationStatus: row.publication_status,
      }));
    }
  } catch {
    // Database query failed or unconfigured -> fall back to JSON database
  }

  const jsonArticles = db.getAllArticles();
  return (
    includeDrafts
      ? jsonArticles
      : jsonArticles.filter((a) => a.status === "published")
  ).map(mapJsonToSummary);
}

export async function getArticle(id: string): Promise<ArticleRecord | null> {
  try {
    const result = await query<ArticleRow>(
      `SELECT ${columns} FROM articles WHERE id = $1`,
      [id],
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
  } catch {
    // Database query failed -> fall back to JSON database
  }

  const jsonArticle = db.getArticleById(id);
  return jsonArticle ? mapJsonToRecord(jsonArticle) : null;
}

export async function getArticleByImportKey(
  importKey: string,
): Promise<ArticleRecord | null> {
  try {
    const result = await query<ArticleRow>(
      `SELECT ${columns} FROM articles WHERE import_key = $1`,
      [importKey],
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
  } catch {
    // Database query failed -> fall back to JSON database
  }

  const jsonArticle = db.getArticleById(importKey);
  return jsonArticle ? mapJsonToRecord(jsonArticle) : null;
}

export async function insertArticle(
  article: NormalizedArticle,
): Promise<ArticleRecord | null> {
  const generatedId = randomUUID();
  try {
    const result = await query<ArticleRow>(
      `INSERT INTO articles (
         id, import_key, nzz_id, document_id, headline, lead, author_line, section, language,
         source_url, published_at, body, raw_content, source_format, teaser_image, tags, publication_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (import_key) DO NOTHING RETURNING ${columns}`,
      [
        generatedId,
        article.importKey,
        article.nzzId,
        article.documentId,
        article.headline,
        article.lead,
        article.authorLine,
        article.section,
        article.language,
        article.sourceUrl,
        article.publishedAt,
        JSON.stringify(article.body),
        JSON.stringify(article.rawContent),
        article.sourceFormat,
        article.teaserImage ? JSON.stringify(article.teaserImage) : null,
        JSON.stringify(article.tags),
        article.publicationStatus || "published",
      ],
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
  } catch {
    // Database query failed -> fall back to JSON database
  }

  const saved = db.saveArticle({
    id: generatedId,
    headline: article.headline,
    lead: article.lead || undefined,
    body: Array.isArray(article.body)
      ? article.body
          .map((b) => b.text || "")
          .filter(Boolean)
          .join("\n\n")
      : "",
    author: article.authorLine || undefined,
    section: article.section || undefined,
    category: article.section || undefined,
    tags: article.tags || ["#NZZ"],
    language: article.language?.startsWith("de") ? "de" : "en",
    status: article.publicationStatus || "published",
  });

  return mapJsonToRecord(saved);
}

export async function publishArticle(
  id: string,
): Promise<ArticleRecord | null> {
  try {
    const result = await query<ArticleRow>(
      `UPDATE articles SET publication_status = 'published', published_at = COALESCE(published_at, now()) WHERE id = $1 RETURNING ${columns}`,
      [id],
    );
    if (result.rows[0]) return mapRow(result.rows[0]);
  } catch {
    // Database query failed -> fall back to JSON database
  }

  const updated = db.updateArticle(id, { status: "published" });
  return updated ? mapJsonToRecord(updated) : null;
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const result = await query("DELETE FROM articles WHERE id = $1", [id]);
    if ((result.rowCount || 0) > 0) return true;
  } catch {
    // Database query failed -> fall back to JSON database
  }

  return db.deleteArticle(id);
}
