import { Router } from "express";
import {
  listCountryConnections,
  listCountryCoverage,
  listCountryStories,
} from "../repositories/countryRepository.js";
import { asyncHandler, sendError, sendSuccess } from "../http.js";

const router = Router();
const countryCode = /^[A-Z]{2}$/i;

// Story-map endpoints return lightweight metadata; article bodies are fetched only after selection.
router.get(
  "/countries",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listCountryCoverage());
  }),
);

router.get(
  "/countries/:code/articles",
  asyncHandler(async (req, res) => {
    const code = String(req.params.code);
    if (!countryCode.test(code)) {
      sendError(
        res,
        400,
        "INVALID_COUNTRY_CODE",
        "Country code must be two letters",
      );
      return;
    }
    sendSuccess(res, await listCountryStories(code));
  }),
);

router.get(
  "/connections",
  asyncHandler(async (req, res) => {
    const requestedLimit = Number(req.query.limit || 120);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(200, Math.max(1, Math.floor(requestedLimit)))
      : 120;
    sendSuccess(res, await listCountryConnections(limit));
  }),
);

export { router as storyMapRouter };
