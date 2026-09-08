import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ArticleBodyElement, NormalizedArticle, SourceFormat } from '../types/article.js';

export class ArticleValidationError extends Error {
  constructor(message: string, public readonly details: string[] = []) {
    super(message);
    this.name = 'ArticleValidationError';
  }
}

const optionalText = z.union([z.string(), z.number()]).nullish();
const nzzArticleSchema = z.object({
  nzz_id: optionalText,
  document_id: optionalText,
  headline: z.string().trim().min(1, 'headline is required'),
  lead: optionalText,
  author_line: optionalText,
  section: optionalText,
  language: optionalText,
  url: optionalText,
  published_at: optionalText,
  body: z.array(z.record(z.string(), z.unknown())).min(1, 'body must contain at least one element'),
  teaser_image: z.record(z.string(), z.unknown()).nullish(),
  tags: z.array(z.string()).optional().default([]),
}).passthrough();

const textOrNull = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
};

const dateOrNull = (value: unknown, fieldName: string): Date | null => {
  const text = textOrNull(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new ArticleValidationError(`Invalid ${fieldName}`, [`${fieldName} must be a valid date`]);
  }
  return date;
};

const documentIdOrNull = (value: unknown): string | null => {
  const documentId = textOrNull(value);
  if (documentId && !/^\d+$/.test(documentId)) {
    throw new ArticleValidationError('Invalid document_id', ['document_id must contain digits only']);
  }
  return documentId;
};

const httpUrlOrUndefined = (value: unknown): string | undefined => {
  const text = textOrNull(value);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? text : undefined;
  } catch {
    return undefined;
  }
};

const elementId = (index: number) => `element-${String(index + 1).padStart(4, '0')}`;

function normalizeNzzElement(element: Record<string, unknown>, index: number): ArticleBodyElement {
  const rawType = textOrNull(element.type)?.toLowerCase() || 'unknown';
  const base = { id: elementId(index) };

  if (rawType === 'paragraph') {
    return { ...base, type: 'paragraph', text: textOrNull(element.text) || '' };
  }
  if (rawType === 'heading') {
    return {
      ...base,
      type: 'heading',
      text: textOrNull(element.text) || '',
      level: typeof element.level === 'number' ? element.level : 2,
    };
  }
  if (rawType === 'image') {
    const image = (element.image && typeof element.image === 'object' ? element.image : element) as Record<string, unknown>;
    return {
      ...base,
      type: 'image',
      url: httpUrlOrUndefined(image.url),
      caption: textOrNull(image.caption) || undefined,
      credit: textOrNull(image.credit) || undefined,
      rawType,
      raw: element,
    };
  }
  if (rawType === 'embed') {
    const service = textOrNull(element.service) || undefined;
    return {
      ...base,
      type: service?.toLowerCase().includes('q-tool') ? 'q_tool_embed' : 'embed',
      service,
      externalId: textOrNull(element.id) || undefined,
      rawType,
      raw: element,
    };
  }

  return {
    ...base,
    type: 'other',
    text: textOrNull(element.text) || undefined,
    rawType,
    raw: element,
  };
}

export function parseNzzJson(rawText: string): NormalizedArticle {
  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    throw new ArticleValidationError('Invalid JSON file', ['The uploaded file is not valid JSON']);
  }

  const parsed = nzzArticleSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ArticleValidationError(
      'Invalid NZZ article JSON',
      parsed.error.issues.map((issue) => `${issue.path.join('.') || 'document'}: ${issue.message}`),
    );
  }

  const value = parsed.data;
  const nzzId = textOrNull(value.nzz_id);
  const body = value.body.map(normalizeNzzElement);
  if (!body.some((element) => element.type === 'paragraph' && element.text?.trim())) {
    throw new ArticleValidationError('Invalid NZZ article JSON', ['body must contain article text']);
  }
  return {
    importKey: nzzId ? `nzz:${nzzId}` : `manual-json:${randomUUID()}`,
    nzzId,
    documentId: documentIdOrNull(value.document_id),
    headline: value.headline.trim(),
    lead: textOrNull(value.lead),
    authorLine: textOrNull(value.author_line),
    section: textOrNull(value.section),
    language: textOrNull(value.language),
    sourceUrl: textOrNull(value.url),
    publishedAt: dateOrNull(value.published_at, 'published_at'),
    body,
    rawContent: raw,
    sourceFormat: 'NZZ_JSON',
    teaserImage: value.teaser_image || null,
    tags: value.tags,
  };
}

function parseFrontMatter(text: string): { metadata: Record<string, string>; content: string } {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) return { metadata: {}, content: text };
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new ArticleValidationError('Invalid Markdown front matter', ['Missing closing --- marker']);

  const metadata: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) metadata[key] = value;
  }
  return { metadata, content: text.slice(match[0].length) };
}

function markdownBodyElements(content: string): ArticleBodyElement[] {
  const blocks = content.trim().split(/\r?\n\s*\r?\n/).filter(Boolean);
  return blocks.map((block, index): ArticleBodyElement => {
    const id = elementId(index);
    const heading = block.match(/^(#{2,6})\s+(.+)$/s);
    if (heading) return { id, type: 'heading', level: heading[1].length, text: heading[2].trim() };

    const image = block.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+["']([^"']*)["'])?\)$/s);
    if (image) return { id, type: 'image', caption: image[1] || undefined, url: image[2] };

    const embed = block.match(/^>\s*\[embed:\s*([^\]]+?)\s+([^\]\s]+)\]\s*$/i);
    if (embed) {
      const service = embed[1].trim();
      return {
        id,
        type: service.toLowerCase().includes('q-tool') ? 'q_tool_embed' : 'embed',
        service,
        externalId: embed[2],
      };
    }

    return { id, type: 'paragraph', text: block.replace(/\r?\n/g, '\n').trim() };
  });
}

const metadataValue = (metadata: Record<string, string>, ...keys: string[]) => {
  for (const key of keys) if (metadata[key]) return metadata[key];
  return null;
};

export function parseMarkdown(rawText: string): NormalizedArticle {
  if (!rawText.trim()) throw new ArticleValidationError('Invalid Markdown article', ['Article text is required']);
  const { metadata, content: withHeader } = parseFrontMatter(rawText.replace(/^\uFEFF/, ''));
  const lines = withHeader.split(/\r?\n/);
  const headlineIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const headline = metadataValue(metadata, 'headline', 'title') ||
    (headlineIndex >= 0 ? lines[headlineIndex].replace(/^#\s+/, '').trim() : null);
  if (!headline) {
    throw new ArticleValidationError('Invalid Markdown article', ['A level-one heading (# Headline) or title front-matter field is required']);
  }

  if (headlineIndex >= 0) lines.splice(headlineIndex, 1);
  while (lines[0]?.trim() === '') lines.shift();

  let lead = metadataValue(metadata, 'lead', 'subtitle', 'description');
  if (!lead && /^\*[^*].*\*\s*$/.test(lines[0] || '')) {
    lead = lines.shift()!.trim().replace(/^\*|\*$/g, '').trim();
    while (lines[0]?.trim() === '') lines.shift();
  }

  let authorLine = metadataValue(metadata, 'author_line', 'author', 'byline');
  let section = metadataValue(metadata, 'section');
  let publishedText = metadataValue(metadata, 'published_at', 'date', 'publication_date');
  let sourceUrl = metadataValue(metadata, 'source_url', 'url');
  let nzzId = metadataValue(metadata, 'nzz_id');

  const nzzMeta = (lines[0] || '').match(/^\*\*(.+?)\*\*\s*·\s*([^·]+)\s*·\s*(\d{4}-\d{2}-\d{2})(?:\s*·[^[]*)?(?:\[([^\]]+)\]\(([^)]+)\))?\s*$/);
  if (nzzMeta) {
    authorLine ||= nzzMeta[1].trim();
    section ||= nzzMeta[2].trim();
    publishedText ||= nzzMeta[3];
    if (nzzMeta[4]?.startsWith('ld.')) nzzId ||= nzzMeta[4];
    sourceUrl ||= nzzMeta[5] || null;
    lines.shift();
  }

  const bodyText = lines.join('\n').trim();
  if (!bodyText) throw new ArticleValidationError('Invalid Markdown article', ['Article body text is required']);
  const body = markdownBodyElements(bodyText);
  const hasArticleText = body.some((element) => element.type === 'paragraph' && element.text?.trim());
  if (!hasArticleText) throw new ArticleValidationError('Invalid Markdown article', ['Article body must contain text']);

  const contentHash = createHash('sha256').update(rawText).digest('hex');
  return {
    importKey: nzzId ? `nzz:${nzzId}` : `markdown:${contentHash}`,
    nzzId,
    documentId: documentIdOrNull(metadataValue(metadata, 'document_id')),
    headline,
    lead,
    authorLine,
    section,
    language: metadataValue(metadata, 'language', 'lang'),
    sourceUrl,
    publishedAt: dateOrNull(publishedText, 'publication date'),
    body,
    rawContent: { text: rawText },
    sourceFormat: 'MARKDOWN',
    teaserImage: null,
    tags: metadataValue(metadata, 'tags')?.split(',').map((tag) => tag.trim()).filter(Boolean) || [],
  };
}

export function parseArticle(rawText: string, sourceFormat: SourceFormat): NormalizedArticle {
  return sourceFormat === 'NZZ_JSON' ? parseNzzJson(rawText) : parseMarkdown(rawText);
}
