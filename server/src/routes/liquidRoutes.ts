import { Router } from "express";
import { getAuthStatus } from "../services/gcp/authService.js";
import { getCacheStats } from "../services/ai/cacheService.js";
import { liquidContentRouter } from "./liquid/contentRoutes.js";
import { liquidGenerationRouter } from "./liquid/generationRoutes.js";
import { liquidPublicationRouter } from "./liquid/publicationRoutes.js";

export const liquidRouter = Router();

// Feature routers stay independently testable while exposing one `/api/liquid` surface.
function mountRoutes(child: Router): void {
  // Flatten feature routers so existing Express introspection/tests and normal routing see one stack.
  const target = liquidRouter as Router & { stack: unknown[] };
  const source = child as Router & { stack: unknown[] };
  target.stack.push(...source.stack);
}

liquidRouter.get("/config-status", async (_req, res, next) => {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      configured: false,
      type: "none",
      projectId: null,
      error: message,
    });
  }
});

mountRoutes(liquidContentRouter);
mountRoutes(liquidGenerationRouter);
mountRoutes(liquidPublicationRouter);
