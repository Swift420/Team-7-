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

const ARTICLES_DIR = path.resolve(process.cwd(), 'LiquidStoryEngine/input/articles');

// 1. List available NZZ articles from the challenge dataset
liquidRouter.get('/articles', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) {
      return res.json({ success: true, articles: [] });
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'));
    const articles = files.map(filename => {
      const fullPath = path.join(ARTICLES_DIR, filename);
      try {
        const raw = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          id: parsed.nzz_id || filename.replace('.json', ''),
          document_id: parsed.document_id,
          headline: parsed.headline || parsed.seo_title,
          lead: parsed.lead,
          author: parsed.author_line,
          section: parsed.section,
          wordCount: parsed.word_count,
          readingTimeSeconds: parsed.reading_time_seconds,
          publishedAt: parsed.published_at,
          filename,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json({ success: true, articles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Fetch specific article content (JSON + Markdown body)
liquidRouter.get('/articles/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    if (!fs.existsSync(ARTICLES_DIR)) {
      return res.status(404).json({ success: false, error: 'Articles directory not found' });
    }

    const files = fs.readdirSync(ARTICLES_DIR);
    const jsonFile = files.find(f => f.includes(id) && f.endsWith('.json'));
    const mdFile = files.find(f => f.includes(id) && f.endsWith('.md'));

    if (!jsonFile) {
      return res.status(404).json({ success: false, error: `Article ${id} not found` });
    }

    const jsonData = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, jsonFile), 'utf8'));
    let bodyText = '';
    if (mdFile) {
      bodyText = fs.readFileSync(path.join(ARTICLES_DIR, mdFile), 'utf8');
    }

    res.json({
      success: true,
      article: {
        id: jsonData.nzz_id || id,
        headline: jsonData.headline,
        lead: jsonData.lead,
        author: jsonData.author_line,
        section: jsonData.section,
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
    if ((!headline || !body) && articleId && fs.existsSync(ARTICLES_DIR)) {
      const files = fs.readdirSync(ARTICLES_DIR);
      const jsonFile = files.find(f => f.includes(articleId) && f.endsWith('.json'));
      const mdFile = files.find(f => f.includes(articleId) && f.endsWith('.md'));
      if (jsonFile) {
        const parsed = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, jsonFile), 'utf8'));
        const md = mdFile ? fs.readFileSync(path.join(ARTICLES_DIR, mdFile), 'utf8') : '';
        articleInput = {
          id: articleId,
          headline: parsed.headline || headline,
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
