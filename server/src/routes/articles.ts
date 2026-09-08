import { Router } from 'express';
import multer from 'multer';
import { deleteArticle, getArticle, listArticles } from '../repositories/articleRepository.js';
import { ArticleValidationError } from '../services/articleParser.js';
import { importArticleContent } from '../services/articleService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get('/', async (_req, res, next) => {
  try {
    res.json({ success: true, data: await listArticles() });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!uuidPattern.test(req.params.id)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    const article = await getArticle(req.params.id);
    if (!article) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ success: true, data: article });
  } catch (error) { next(error); }
});

router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new ArticleValidationError('No article file supplied', ['Select a .json or .md file']);
    const outcome = await importArticleContent(req.file.originalname, req.file.buffer);
    res.status(outcome.status === 'imported' ? 201 : 200).json({ success: true, data: outcome });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!uuidPattern.test(req.params.id)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ARTICLE_ID', message: 'Article ID must be a valid UUID' } });
      return;
    }
    if (!(await deleteArticle(req.params.id))) {
      res.status(404).json({ success: false, error: { code: 'ARTICLE_NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.status(204).send();
  } catch (error) { next(error); }
});

export { router as articleRouter };
