import { Router } from 'express';
import multer from 'multer';
import { deleteArticle, getArticle, listArticles, publishArticle } from '../repositories/articleRepository.js';
import { ArticleValidationError } from '../services/articleParser.js';
import { importArticleContent } from '../services/articleService.js';
import { analyzeArticleVisualizations } from '../services/visualizationService.js';
import { loadExistingVisualizations } from '../services/existingVisualService.js';
import { listArticleVisualizations, listVisualizationApprovals, replaceArticleVisualizations } from '../repositories/visualizationRepository.js';
import { parseVisualizationAnalysis } from '../services/visualizationService.js';
import { hasValidEditorToken, requireEditor } from '../auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get('/', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await listArticles(hasValidEditorToken(_req)) });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    const article = await getArticle(String(req.params.id));
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    if (article.publicationStatus === 'draft' && !hasValidEditorToken(req)) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
});

router.post('/import', requireEditor, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new ArticleValidationError('No article file supplied', ['Select a .json or .md file']);
    const outcome = await importArticleContent(req.file.originalname, req.file.buffer, req.query.draft === 'true' ? 'draft' : 'published');
    res.status(outcome.status === 'imported' ? 201 : 200).json({ success: true, data: outcome });
  } catch (error) { next(error); }
});

router.post('/:id/visualizations/analyze', requireEditor, async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    const article = await getArticle(String(req.params.id));
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    const requestedMaximum = Number(req.body?.maxOpportunities ?? 4);
    const maxOpportunities = Number.isInteger(requestedMaximum)
      ? Math.min(6, Math.max(1, requestedMaximum))
      : 4;
    res.json({ success: true, data: await analyzeArticleVisualizations(article, maxOpportunities) });
  } catch (error) { next(error); }
});

router.post('/:id/publish', requireEditor, async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) { res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } }); return; }
    const article = await publishArticle(String(req.params.id));
    if (!article) { res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } }); return; }
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
});

router.get('/:id/existing-visualizations', async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    const article = await getArticle(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: await loadExistingVisualizations(article) });
  } catch (error) { next(error); }
});

router.get('/:id/visualizations', async (req, res, next) => {
  try {
    if (!uuidPattern.test(req.params.id)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    if (!(await getArticle(String(req.params.id)))) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: await listArticleVisualizations(String(req.params.id)) });
  } catch (error) { next(error); }
});

router.get('/:id/visualizations/history', async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) { res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } }); return; }
    if (!(await getArticle(String(req.params.id)))) { res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } }); return; }
    res.json({ success: true, data: await listVisualizationApprovals(String(req.params.id)) });
  } catch (error) { next(error); }
});

router.get('/:id/visualizations/embed', async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) { res.status(400).send('Invalid article ID'); return; }
    const article = await getArticle(String(req.params.id));
    if (!article) { res.status(404).send('Article not found'); return; }
    const visuals = await listArticleVisualizations(article.id);
    const escaped = JSON.stringify(visuals.map((visual) => visual.specification)).replace(/</g, '\\u003c');
    res.type('html').send(`<!doctype html><meta charset="utf-8"><title>${article.headline} · Visual Velocity</title><style>body{font:16px system-ui;max-width:760px;margin:2rem auto;color:#172033}figure{border:1px solid #dbe3ef;border-radius:10px;padding:1rem;margin:1rem 0}table{border-collapse:collapse;width:100%}td,th{padding:.4rem;border-bottom:1px solid #e5e7eb;text-align:left}</style><main><h1>${article.headline}</h1><div id="visuals"></div></main><script>const visuals=${escaped};const root=document.querySelector('#visuals');visuals.forEach(v=>{const f=document.createElement('figure');f.innerHTML='<h2>'+v.title+'</h2><p>'+v.subtitle+'</p><table><thead><tr><th>Label</th>'+v.series.map(s=>'<th>'+s.label+'</th>').join('')+'</tr></thead><tbody>'+v.data.map(p=>'<tr><td>'+p.label+'</td>'+p.values.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table>';root.appendChild(f)});</script>`);
  } catch (error) { next(error); }
});

router.put('/:id/visualizations', requireEditor, async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    const article = await getArticle(String(req.params.id));
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    const visualizations = Array.isArray(req.body?.visualizations) ? req.body.visualizations : [];
    const validated = parseVisualizationAnalysis(
      JSON.stringify({ summary: 'Editor-approved visualizations', opportunities: visualizations }),
      article,
      'editor',
    ).opportunities;
    res.json({ success: true, data: await replaceArticleVisualizations(article.id, validated) });
  } catch (error) { next(error); }
});

router.delete('/:id', requireEditor, async (req, res, next) => {
  try {
    if (!uuidPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    if (!(await deleteArticle(String(req.params.id)))) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.status(204).send();
  } catch (error) { next(error); }
});

export { router as articleRouter };
