import { Router, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { generateLiquidDerivatives } from '../services/ai/liquidEngine.js';
import { synthesizeAudioBrief } from '../services/gcp/ttsService.js';
import { lintNZZStyle } from '../services/ai/nzzStyleLinter.js';
import { LiquidDerivatives } from '../services/ai/liquidSchemas.js';

export const liquidRouter = Router();

// In-memory store for generated & published liquid formats (keyed by articleId)
const publishedStore = new Map<string, LiquidDerivatives>();

const ARTICLES_DIRS = [
  path.resolve(process.cwd(), 'LiquidStoryEngine/input/articles'),
  path.resolve(process.cwd(), 'VisualVelocity/input/articles'),
];

// Helper to find file in any of the article directories
function findArticleFiles(articleId: string) {
  for (const dir of ARTICLES_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    const jsonFile = files.find(f => f.includes(articleId) && f.endsWith('.json'));
    const mdFile = files.find(f => f.includes(articleId) && f.endsWith('.md'));
    if (jsonFile) {
      return { dir, jsonFile, mdFile };
    }
  }
  return null;
}

// 1. List available NZZ articles from ALL challenge datasets
liquidRouter.get('/articles', (req: Request, res: Response) => {
  try {
    const seenIds = new Set<string>();
    const allArticles: any[] = [];

    for (const dir of ARTICLES_DIRS) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

      for (const filename of files) {
        try {
          const raw = fs.readFileSync(path.join(dir, filename), 'utf8');
          const parsed = JSON.parse(raw);
          const id = parsed.nzz_id || filename.replace('.json', '');
          if (seenIds.has(id)) continue;
          seenIds.add(id);

          allArticles.push({
            id,
            document_id: parsed.document_id,
            headline: parsed.headline || parsed.seo_title || filename,
            lead: parsed.lead || '',
            author: parsed.author_line || 'NZZ Redaktion',
            section: parsed.section || 'NZZ',
            wordCount: parsed.word_count || 0,
            readingTimeSeconds: parsed.reading_time_seconds || 0,
            publishedAt: parsed.published_at || '',
            filename,
            sourceDir: path.basename(path.dirname(dir)),
          });
        } catch {
          // ignore unparseable
        }
      }
    }

    // Sort by publication date or headline
    allArticles.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

    res.json({ success: true, count: allArticles.length, articles: allArticles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch specific article content (JSON + Markdown body)
liquidRouter.get('/articles/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    const found = findArticleFiles(id);
    if (!found) {
      return res.status(404).json({ success: false, error: `Article ${id} not found across workspace` });
    }

    const { dir, jsonFile, mdFile } = found;
    const jsonData = JSON.parse(fs.readFileSync(path.join(dir, jsonFile), 'utf8'));
    let bodyText = '';
    if (mdFile) {
      bodyText = fs.readFileSync(path.join(dir, mdFile), 'utf8');
    }

    res.json({
      success: true,
      article: {
        id: jsonData.nzz_id || id,
        headline: jsonData.headline || jsonData.seo_title,
        lead: jsonData.lead,
        author: jsonData.author_line || 'NZZ Redaktion',
        section: jsonData.section || 'Wirtschaft',
        wordCount: jsonData.word_count,
        body: bodyText || jsonData.lead,
        summaryBullets: jsonData.summary_bullets_en,
        teaserImage: jsonData.teaser_image,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Generate all 6 liquid formats for an article
liquidRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { articleId, headline, lead, body, author, section, language, model, mock } = req.body;

    let articleInput = {
      id: articleId || 'article-default',
      headline: headline || 'Artikel-Titel',
      lead: lead || '',
      body: body || lead || '',
      author: author || 'NZZ Redaktion',
      section: section || 'Wirtschaft',
      language: language || 'de',
    };

    // If only articleId was sent, try to load article from disk
    if ((!headline || !body) && articleId) {
      const found = findArticleFiles(articleId);
      if (found) {
        const parsed = JSON.parse(fs.readFileSync(path.join(found.dir, found.jsonFile), 'utf8'));
        const md = found.mdFile ? fs.readFileSync(path.join(found.dir, found.mdFile), 'utf8') : '';
        articleInput = {
          id: articleId,
          headline: parsed.headline || parsed.seo_title || headline,
          lead: parsed.lead || lead,
          body: md || parsed.lead || '',
          author: parsed.author_line || author,
          section: parsed.section || section,
          language: parsed.language || language,
        };
      }
    }

    const derivatives = await generateLiquidDerivatives(articleInput, {
      mock: mock ?? true,
      model: model || 'gemini-3.8-flash',
    });

    publishedStore.set(derivatives.articleId, derivatives);
    res.json({ success: true, data: derivatives });
  } catch (err: any) {
    console.error('Error generating liquid formats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Synthesize Audio Brief with Google Cloud TTS
liquidRouter.post('/synthesize-audio', async (req: Request, res: Response) => {
  try {
    const { script, author, language, voiceName, mock } = req.body;
    if (!script) {
      return res.status(400).json({ success: false, error: 'Script text is required' });
    }

    const result = await synthesizeAudioBrief(script, {
      mock: mock ?? true,
      author,
      language,
      voiceName,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Lint text for NZZ Style adherence
liquidRouter.post('/lint', (req: Request, res: Response) => {
  const { text, isHeadline, isSubhead, language } = req.body;
  const report = lintNZZStyle(text || '', { isHeadline, isSubhead, language });
  res.json({ success: true, data: report });
});

// 6. Publish / Save approved formats
liquidRouter.post('/publish', (req: Request, res: Response) => {
  const { articleId, payload } = req.body;
  if (!articleId || !payload) {
    return res.status(400).json({ success: false, error: 'articleId and payload required' });
  }

  publishedStore.set(articleId, payload);
  res.json({ success: true, message: `Published liquid formats for ${articleId}` });
});

// 7. Get published formats for reader view
liquidRouter.get('/published/:articleId', (req: Request, res: Response) => {
  const articleId = String(req.params.articleId);
  const found = publishedStore.get(articleId);
  if (!found) {
    return res.status(404).json({ success: false, error: `No published formats found for ${articleId}` });
  }
  res.json({ success: true, data: found });
});
