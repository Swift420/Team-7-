import { randomUUID } from 'node:crypto';
import { query } from '../config/database.js';
import { ArticleBodyElement, ArticleRecord, ArticleSummary, NormalizedArticle, SourceFormat } from '../types/article.js';

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
  publication_status: 'draft' | 'published';
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

const mapRow = (row: ArticleRow): ArticleRecord => ({
  id: row.id, importKey: row.import_key, nzzId: row.nzz_id, documentId: row.document_id,
  headline: row.headline, lead: row.lead, authorLine: row.author_line, section: row.section,
  language: row.language, sourceUrl: row.source_url, publishedAt: row.published_at,
  body: row.body, rawContent: row.raw_content, sourceFormat: row.source_format,
  teaserImage: row.teaser_image, tags: row.tags, createdAt: row.created_at, updatedAt: row.updated_at,
  publicationStatus: row.publication_status,
});

export async function listArticles(includeDrafts = false): Promise<ArticleSummary[]> {
  const result = await query<Omit<ArticleRow, 'body' | 'raw_content'>>(
    `SELECT ${summaryColumns} FROM articles ${includeDrafts ? '' : "WHERE publication_status = 'published'"} ORDER BY published_at DESC NULLS LAST, created_at DESC`,
  );
  return result.rows.map((row) => ({
    id: row.id, importKey: row.import_key, nzzId: row.nzz_id, documentId: row.document_id,
    headline: row.headline, lead: row.lead, authorLine: row.author_line, section: row.section,
    language: row.language, sourceUrl: row.source_url, publishedAt: row.published_at,
    sourceFormat: row.source_format, teaserImage: row.teaser_image, tags: row.tags,
    createdAt: row.created_at, updatedAt: row.updated_at, publicationStatus: row.publication_status,
  }));
}

export async function getArticle(id: string): Promise<ArticleRecord | null> {
  const result = await query<ArticleRow>(`SELECT ${columns} FROM articles WHERE id = $1`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function getArticleByImportKey(importKey: string): Promise<ArticleRecord | null> {
  const result = await query<ArticleRow>(`SELECT ${columns} FROM articles WHERE import_key = $1`, [importKey]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function insertArticle(article: NormalizedArticle): Promise<ArticleRecord | null> {
  const result = await query<ArticleRow>(
    `INSERT INTO articles (
       id, import_key, nzz_id, document_id, headline, lead, author_line, section, language,
       source_url, published_at, body, raw_content, source_format, teaser_image, tags, publication_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (import_key) DO NOTHING RETURNING ${columns}`,
    [randomUUID(), article.importKey, article.nzzId, article.documentId, article.headline,
      article.lead, article.authorLine, article.section, article.language, article.sourceUrl,
      article.publishedAt, JSON.stringify(article.body), JSON.stringify(article.rawContent), article.sourceFormat,
      article.teaserImage ? JSON.stringify(article.teaserImage) : null, JSON.stringify(article.tags), article.publicationStatus || 'published'],
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function publishArticle(id: string): Promise<ArticleRecord | null> {
  const result = await query<ArticleRow>(`UPDATE articles SET publication_status = 'published', published_at = COALESCE(published_at, now()) WHERE id = $1 RETURNING ${columns}`, [id]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const result = await query('DELETE FROM articles WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}
