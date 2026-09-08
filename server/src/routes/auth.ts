import { Router } from 'express';
import { authenticateEditor, createAuthToken } from '../auth.js';

const router = Router();
router.post('/login', async (req, res, next) => {
  try {
    const user = await authenticateEditor(String(req.body?.username || ''), String(req.body?.password || ''));
  if (!user) { res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid editor username or password' } }); return; }
  res.json({ success: true, data: { token: createAuthToken(user), user } });
  } catch (error) { next(error); }
});
export { router as authRouter };
