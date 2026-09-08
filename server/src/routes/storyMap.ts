import { Router } from 'express';
import { listCountryCoverage, listCountryStories } from '../repositories/countryRepository.js';

const router = Router();
const countryCode = /^[A-Z]{2}$/i;

router.get('/countries', async (_req, res, next) => {
  try { res.json({ success: true, data: await listCountryCoverage() }); } catch (error) { next(error); }
});

router.get('/countries/:code/articles', async (req, res, next) => {
  try {
    if (!countryCode.test(req.params.code)) { res.status(400).json({ success: false, error: { code: 'INVALID_COUNTRY_CODE', message: 'Country code must be two letters' } }); return; }
    res.json({ success: true, data: await listCountryStories(req.params.code) });
  } catch (error) { next(error); }
});

export { router as storyMapRouter };
