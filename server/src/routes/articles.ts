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
// Relaxed pattern to support both UUIDs and slug-based IDs safely
const articleIdPattern = /^[\w.:-]{1,200}$/;

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

router.get('/', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await listArticles(hasValidEditorToken(_req)) });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
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
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
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
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
      return;
    }
    const article = await publishArticle(String(req.params.id));
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
});

router.get('/:id/existing-visualizations', async (req, res, next) => {
  try {
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
      return;
    }
    const article = await getArticle(String(req.params.id));
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: await loadExistingVisualizations(article) });
  } catch (error) { next(error); }
});

router.get('/:id/visualizations', async (req, res, next) => {
  try {
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
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
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
      return;
    }
    if (!(await getArticle(String(req.params.id)))) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: await listVisualizationApprovals(String(req.params.id)) });
  } catch (error) { next(error); }
});

router.get('/:id/visualizations/embed', async (req, res, next) => {
  try {
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).type('html').send('<!doctype html><p>Invalid article ID</p>');
      return;
    }
    const article = await getArticle(String(req.params.id));
    if (!article) {
      res.status(404).type('html').send('<!doctype html><p>Article not found</p>');
      return;
    }
    const visuals = await listArticleVisualizations(article.id);
    const escapedData = JSON.stringify(visuals.map((visual) => visual.specification)).replace(/</g, '\\u003c');
    const safeHeadline = escapeHtml(article.headline);

    res.type('html').send(`<!doctype html>
<meta charset="utf-8">
<title>${safeHeadline} · Visual Velocity</title>
<style>
  body{font:16px system-ui;max-width:760px;margin:2rem auto;color:#172033;padding:0 1rem}
  figure{border:1px solid #dbe3ef;border-radius:10px;padding:1rem;margin:1rem 0}
  table{border-collapse:collapse;width:100%}
  td,th{padding:.4rem;border-bottom:1px solid #e5e7eb;text-align:left}
</style>
<main>
  <h1>${safeHeadline}</h1>
  <div id="visuals"></div>
</main>
<script>
  const visuals = ${escapedData};
  const root = document.querySelector('#visuals');
  visuals.forEach(v => {
    const f = document.createElement('figure');
    const h2 = document.createElement('h2');
    h2.textContent = v.title || '';
    f.appendChild(h2);
    if (v.subtitle) {
      const p = document.createElement('p');
      p.textContent = v.subtitle;
      f.appendChild(p);
    }
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const thLabel = document.createElement('th');
    thLabel.textContent = 'Label';
    trHead.appendChild(thLabel);
    (v.series || []).forEach(s => {
      const th = document.createElement('th');
      th.textContent = s.label || '';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    (v.data || []).forEach(p => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.textContent = p.label || '';
      tr.appendChild(tdLabel);
      (p.values || []).forEach(x => {
        const td = document.createElement('td');
        td.textContent = String(x ?? '');
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    f.appendChild(table);
    root.appendChild(f);
  });
</script>`);
  } catch (error) { next(error); }
});

router.put('/:id/visualizations', requireEditor, async (req, res, next) => {
  try {
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
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
    if (!articleIdPattern.test(String(req.params.id))) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID is invalid' } });
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
