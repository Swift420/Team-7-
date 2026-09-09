import { Router } from "express";
import { db } from "../../db/database.js";
import { publishedStore } from "./common.js";
import type { LiquidDerivatives } from "../../services/ai/liquidSchemas.js";

export const liquidPublicationRouter = Router();

liquidPublicationRouter.post("/publish", (req, res) => {
  const { articleId, payload } = req.body as {
    articleId?: string;
    payload?: LiquidDerivatives;
  };
  if (!articleId || !payload) {
    return res
      .status(400)
      .json({ success: false, error: "articleId and payload required" });
  }

  // Keep the in-memory copy hot while persisting the same payload for reader requests.
  publishedStore.set(articleId, payload);
  db.saveDerivatives(articleId, payload);
  db.updateArticle(articleId, { status: "published" });
  return res.json({
    success: true,
    message: `Published liquid formats for ${articleId}`,
  });
});

liquidPublicationRouter.get("/published/:articleId", (req, res) => {
  const articleId = String(req.params.articleId);
  const found = db.getDerivatives(articleId) || publishedStore.get(articleId);
  if (!found)
    return res.status(404).json({
      success: false,
      error: `No published formats found for ${articleId}`,
    });
  return res.json({ success: true, data: found });
});
