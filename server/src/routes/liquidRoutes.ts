import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { generateLiquidDerivatives } from '../services/ai/liquidEngine.js';
import { synthesizeAudioBrief } from '../services/gcp/ttsService.js';
import { generateImagen3Image, generateDeckImages } from '../services/ai/imagenService.js';
import { lintNZZStyle } from '../services/ai/nzzStyleLinter.js';
import { LiquidDerivatives } from '../services/ai/liquidSchemas.js';
import { getAuthStatus } from '../services/gcp/authService.js';
import { getCacheStats } from '../services/ai/cacheService.js';
import { db } from '../db/database.js';
import { requireEditor } from '../auth.js';

function isSafeImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    
    // Disallow loopback, private IPs, and cloud metadata endpoints
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }

    // Disallow private RFC1918 IPv4 ranges
    const ipv4Match = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4Match) {
      const [, o1, o2] = ipv4Match.map(Number);
      if (o1 === 10) return false;
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
      if (o1 === 192 && o2 === 168) return false;
      if (o1 === 127 || o1 === 0) return false;
      if (o1 === 169 && o2 === 254) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export const liquidRouter = Router();

// In-memory store for fast fallback
const publishedStore = new Map<string, LiquidDerivatives>();

// 0. Configuration & Auth Status
liquidRouter.get('/config-status', async (_req: Request, res: Response) => {
  try {
    const auth = await getAuthStatus();
    const cache = getCacheStats();
    res.json({
      configured: auth.configured,
      type: auth.type,
      projectId: auth.projectId,
      costSavedPercentage: cache.costSavedPercentage,
      cacheStats: cache,
    });
  } catch (err: any) {
    res.status(500).json({
      configured: false,
      type: 'none',
      projectId: null,
      error: err.message,
    });
  }
});

const ARTICLES_DIR = path.resolve(process.cwd(), 'LiquidStoryEngine/input/articles');
function getArticlesDir(): string {
  const candidate1 = path.resolve(process.cwd(), 'LiquidStoryEngine/input/articles');
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.resolve(process.cwd(), '../LiquidStoryEngine/input/articles');
  if (fs.existsSync(candidate2)) return candidate2;
  return candidate1;
}

// 1. List available NZZ articles from the challenge dataset and persistent database
const SECTION_TRANSLATIONS: Record<string, { en: string; de: string }> = {
  wirtschaft: { en: 'Economy', de: 'Wirtschaft' },
  finanzen: { en: 'Finance', de: 'Finanzen' },
  international: { en: 'World', de: 'International' },
  schweiz: { en: 'Switzerland', de: 'Schweiz' },
  wissenschaft: { en: 'Science', de: 'Wissenschaft' },
  technologie: { en: 'Technology', de: 'Technologie' },
  feuilleton: { en: 'Culture', de: 'Feuilleton' },
  kultur: { en: 'Culture', de: 'Kultur' },
  meinung: { en: 'Opinion', de: 'Meinung' },
  sport: { en: 'Sports', de: 'Sport' },
  gesellschaft: { en: 'Society', de: 'Gesellschaft' },
  panorama: { en: 'Panorama', de: 'Panorama' },
  mobilität: { en: 'Mobility & Automotive', de: 'Mobilität & Automotive' },
  automotive: { en: 'Mobility & Automotive', de: 'Mobilität & Automotive' },
};

function getLocalizedSection(rawSection: string, lang: 'en' | 'de'): string {
  const key = (rawSection || '').toLowerCase().trim();
  const match = SECTION_TRANSLATIONS[key];
  if (match) return match[lang];
  return lang === 'de' ? (rawSection || 'Wirtschaft') : (rawSection || 'Economy');
}

// 1. List available NZZ articles with category filtering & search
liquidRouter.get('/articles', (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang === 'de' ? 'de' : 'en') as 'en' | 'de';
    const category = req.query.category as string | undefined;
    const query = req.query.query as string | undefined;

    const dbArticles = db.getAllArticles({ lang, category, query });
    const categories = db.getCategories();
    const tags = db.getAllTags();

    const articles = dbArticles.map(a => ({
      id: a.id,
      headline: a.headline,
      lead: a.lead,
      author: a.author || (lang === 'de' ? 'NZZ Redaktion' : 'NZZ Editorial'),
      section: getLocalizedSection(a.section || a.category || 'Wirtschaft', lang),
      category: a.category || a.section || 'Wirtschaft',
      tags: a.tags || ['#NZZ'],
      wordCount: a.wordCount,
      readingTimeSeconds: a.readingTimeSeconds,
      publishedAt: a.createdAt,
      createdAt: a.createdAt,
      status: a.status,
      language: a.language || lang,
    }));

    res.json({
      success: true,
      articles,
      categories,
      tags,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Get distinct categories and tags
liquidRouter.get('/categories', (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      categories: db.getCategories(),
      tags: db.getAllTags(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Create new article draft or publication
liquidRouter.post('/articles', requireEditor, (req: Request, res: Response) => {
  try {
    const { headline, lead, body, author, section, category, tags, language, status, id } = req.body;
    if (!headline || !body) {
      return res.status(400).json({ success: false, error: 'Headline and body are required' });
    }

    const saved = db.saveArticle({
      id,
      headline,
      lead,
      body,
      author,
      section,
      category,
      tags,
      language: language === 'de' ? 'de' : 'en',
      status: status || 'draft',
    });

    res.json({ success: true, article: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1d. Update article
liquidRouter.put('/articles/:id', requireEditor, (req: Request, res: Response) => {
  try {
    const articleId = String(req.params.id);
    const { headline, lead, body, author, section, category, tags, status, summaryBullets, teaserImage } = req.body;
    const updated = db.updateArticle(articleId, {
      headline,
      lead,
      body,
      author,
      section,
      category,
      tags,
      status,
      summaryBullets,
      teaserImage,
    });
    if (!updated) {
      return res.status(404).json({ success: false, error: `Article ${articleId} not found` });
    }
    res.json({ success: true, article: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1e. Delete article
liquidRouter.delete('/articles/:id', requireEditor, (req: Request, res: Response) => {
  try {
    const articleId = String(req.params.id);
    const deleted = db.deleteArticle(articleId);
    res.json({ success: true, deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch specific article content (JSON + Markdown body localized)
liquidRouter.get('/articles/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const lang = (req.query.lang === 'de' ? 'de' : 'en') as 'en' | 'de';

  try {
    const fromDb = db.getArticleById(id);
    if (fromDb) {
      return res.json({
        success: true,
        article: {
          id: fromDb.id,
          headline: fromDb.headline,
          lead: fromDb.lead,
          author: fromDb.author,
          section: getLocalizedSection(fromDb.section || fromDb.category || 'Wirtschaft', lang),
          category: fromDb.category || fromDb.section,
          tags: fromDb.tags,
          status: fromDb.status,
          wordCount: fromDb.wordCount,
          body: fromDb.body,
          summaryBullets: fromDb.summaryBullets,
          teaserImage: fromDb.teaserImage,
          language: fromDb.language || lang,
        },
      });
    }

    const articlesDir = getArticlesDir();
    if (!fs.existsSync(articlesDir)) {
      return res.status(404).json({ success: false, error: 'Articles directory not found' });
    }

    const files = fs.readdirSync(articlesDir);
    const jsonFile = files.find(f => f.includes(id) && f.endsWith('.json'));
    const mdFile = files.find(f => f.includes(id) && f.endsWith('.md'));

    if (!jsonFile) {
      return res.status(404).json({ success: false, error: `Article ${id} not found` });
    }

    const jsonData = JSON.parse(fs.readFileSync(path.join(articlesDir, jsonFile), 'utf8'));
    let bodyText = '';
    if (mdFile) {
      bodyText = fs.readFileSync(path.join(articlesDir, mdFile), 'utf8');
    }

    const headline = lang === 'de'
      ? (jsonData.original_de?.headline || jsonData.headline)
      : jsonData.headline;

    const lead = lang === 'de'
      ? (jsonData.original_de?.lead || jsonData.lead)
      : jsonData.lead;

    res.json({
      success: true,
      article: {
        id: jsonData.nzz_id || id,
        headline,
        lead,
        author: jsonData.author_line || (lang === 'de' ? 'NZZ Redaktion' : 'NZZ Editorial'),
        section: getLocalizedSection(jsonData.section, lang),
        category: jsonData.section,
        wordCount: jsonData.word_count || 1200,
        body: bodyText || lead,
        summaryBullets: jsonData.summary_bullets_en,
        teaserImage: jsonData.teaser_image,
        language: lang,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Generate liquid formats for an article (on-demand only)
liquidRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { articleId, headline, lead, body, author, section, language, model, mock } = req.body;
    const targetLang = (language === 'de' ? 'de' : 'en') as 'en' | 'de';
    const demoMode = req.query.demo === '1';

    let articleInput = {
      id: articleId || `draft-${Date.now()}`,
      headline: headline || (targetLang === 'de' ? 'NZZ Hintergrundanalyse' : 'NZZ In-Depth Analysis'),
      lead: lead || '',
      body: body || '',
      author: author || (targetLang === 'de' ? 'NZZ Redaktion' : 'NZZ Editorial'),
      section: getLocalizedSection(section, targetLang),
      language: targetLang,
    };

    // If no body was submitted directly, try to load article from database or disk
    if (!articleInput.body || articleInput.body.trim().length === 0) {
      const fromDb = articleId ? db.getArticleById(articleId) : null;
      if (fromDb && fromDb.body) {
        articleInput = {
          id: fromDb.id,
          headline: fromDb.headline || articleInput.headline,
          lead: fromDb.lead || articleInput.lead,
          body: fromDb.body,
          author: fromDb.author || articleInput.author,
          section: getLocalizedSection(fromDb.section || fromDb.category || 'Wirtschaft', targetLang),
          language: targetLang,
        };
      } else {
        const articlesDir = getArticlesDir();
        if (articleId && fs.existsSync(articlesDir)) {
          const files = fs.readdirSync(articlesDir);
          const cleanId = articleId.replace(/[^a-zA-Z0-9]/g, '');
          const jsonFile = files.find(f => (f.includes(articleId) || f.replace(/[^a-zA-Z0-9]/g, '').includes(cleanId)) && f.endsWith('.json'));
          const mdFile = files.find(f => (f.includes(articleId) || f.replace(/[^a-zA-Z0-9]/g, '').includes(cleanId)) && f.endsWith('.md'));
          if (jsonFile) {
            const parsed = JSON.parse(fs.readFileSync(path.join(articlesDir, jsonFile), 'utf8'));
            const md = mdFile ? fs.readFileSync(path.join(articlesDir, mdFile), 'utf8') : '';
            articleInput = {
              id: articleId,
              headline: targetLang === 'de'
                ? (parsed.original_de?.headline || parsed.headline || articleInput.headline)
                : (parsed.headline || articleInput.headline),
              lead: targetLang === 'de'
                ? (parsed.original_de?.lead || parsed.lead || articleInput.lead)
                : (parsed.lead || articleInput.lead),
              body: md || parsed.lead || articleInput.body,
              author: parsed.author_line || articleInput.author,
              section: getLocalizedSection(parsed.section, targetLang),
              language: targetLang,
            };
          }
        }
      }
    }

    if (!articleInput.body || articleInput.body.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Article body text is required' });
    }

    console.log(`[LiquidRoutes] Generating derivatives for "${articleInput.headline.slice(0, 40)}" (demoMode=${demoMode}, mock=${mock})...`);

    const derivatives = await generateLiquidDerivatives(articleInput, {
      demoMode,
      mock: mock || false,
      model: model || 'gemini-2.5-flash',
      language: targetLang,
    });

    publishedStore.set(derivatives.articleId, derivatives);
    db.saveDerivatives(derivatives.articleId, derivatives);
    if (derivatives.detectedCategory || derivatives.suggestedTags) {
      db.updateArticle(derivatives.articleId, {
        category: derivatives.detectedCategory,
        tags: derivatives.suggestedTags,
      });
    }

    res.json({ success: true, data: derivatives });
  } catch (err: any) {
    console.error('[LiquidRoutes Generate Error]:', err);
    const isAuth = err.message?.includes('AUTH_MISSING') || err.message?.includes('credentials not found');
    res.status(isAuth ? 503 : 500).json({ success: false, error: err.message });
  }
});

// 4. Generate photorealistic / documentary slide image
liquidRouter.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio, headline, category, articleTitle, lead, slideSummary, bustCache } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    const result = await generateImagen3Image(prompt, {
      aspectRatio,
      headline,
      category,
      articleTitle,
      lead,
      slideSummary,
      bustCache: bustCache ?? true,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[LiquidRoutes Generate-Image Error]:', err);
    const isAuth = err.message?.includes('AUTH_MISSING') || err.message?.includes('credentials not found');
    res.status(isAuth ? 503 : 500).json({ success: false, error: err.message });
  }
});

// 4b. Batch-generate photorealistic editorial images for an entire carousel deck
liquidRouter.post('/generate-deck-images', async (req: Request, res: Response) => {
  try {
    const { slides, headline, category, lead, bustCache } = req.body;
    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({ success: false, error: 'Slides array is required' });
    }
    const results = await generateDeckImages(slides, { headline, category, lead });
    res.json({ success: true, data: results });
  } catch (err: any) {
    console.error('[LiquidRoutes Generate-Deck-Images Error]:', err);
    const isAuth = err.message?.includes('AUTH_MISSING') || err.message?.includes('credentials not found');
    res.status(isAuth ? 503 : 500).json({ success: false, error: err.message });
  }
});

// 4c. High-fidelity Image Proxy for CORS-safe Canvas/PNG Export
liquidRouter.get('/proxy-image', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl || !isSafeImageUrl(imageUrl)) {
      return res.status(400).send('Invalid, missing, or forbidden image URL');
    }
    const fetchRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(8000),
    });
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Failed to fetch image');
    }
    const contentType = fetchRes.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(400).send('URL does not resolve to an image');
    }
    const arrayBuffer = await fetchRes.arrayBuffer();
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      return res.status(413).send('Image exceeds 10MB limit');
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// 5. Synthesize Audio Brief with Google Cloud TTS
liquidRouter.post('/synthesize-audio', async (req: Request, res: Response) => {
  try {
    const { script, author, language, voiceName, mock } = req.body;
    if (!script) {
      return res.status(400).json({ success: false, error: 'Script text is required' });
    }

    const result = await synthesizeAudioBrief(script, {
      author,
      language,
      voiceName,
      mock: mock || false,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[LiquidRoutes Synthesize-Audio Error]:', err);
    const isAuth = err.message?.includes('AUTH_MISSING') || err.message?.includes('credentials not found');
    res.status(isAuth ? 503 : 500).json({ success: false, error: err.message });
  }
});

// 5. Lint text for NZZ Style adherence
// 6. Lint text for NZZ Style adherence
liquidRouter.post('/lint', (req: Request, res: Response) => {
  const { text, isHeadline, isSubhead, language } = req.body;
  const report = lintNZZStyle(text || '', { isHeadline, isSubhead, language });
  res.json({ success: true, data: report });
});

// 6. Publish / Save approved formats
// 7. Publish / Save approved formats
liquidRouter.post('/publish', (req: Request, res: Response) => {
  const { articleId, payload } = req.body;
  if (!articleId || !payload) {
    return res.status(400).json({ success: false, error: 'articleId and payload required' });
  }

  publishedStore.set(articleId, payload);
  db.saveDerivatives(articleId, payload);
  db.updateArticle(articleId, { status: 'published' });

  res.json({ success: true, message: `Published liquid formats for ${articleId}` });
});

// 8. Get published formats for reader view
liquidRouter.get('/published/:articleId', (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  const found = db.getDerivatives(articleId) || publishedStore.get(articleId);
  if (!found) {
    return res.status(404).json({ success: false, error: `No published formats found for ${articleId}` });
  }
  res.json({ success: true, data: found });
});
