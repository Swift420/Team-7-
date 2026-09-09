import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { db } from "../../db/database.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../http.js";
import { generateLiquidDerivatives } from "../../services/ai/liquidEngine.js";
import {
  generateDeckImages,
  generateImagen3Image,
} from "../../services/ai/imagenService.js";
import { lintNZZStyle } from "../../services/ai/nzzStyleLinter.js";
import { synthesizeAudioBrief } from "../../services/gcp/ttsService.js";
import {
  errorMessage,
  getArticlesDir,
  getLocalizedSection,
  isCredentialError,
  isSafeImageUrl,
  publishedStore,
} from "./common.js";
import type { ArticleFilePayload } from "./common.js";

export const liquidGenerationRouter = Router();

interface GenerationArticleInput {
  id: string;
  headline: string;
  lead: string;
  body: string;
  author: string;
  section: string;
  language: "en" | "de";
}

function defaultArticleInput(
  language: "en" | "de",
  input: Record<string, unknown>,
): GenerationArticleInput {
  return {
    id:
      typeof input.articleId === "string" && input.articleId
        ? input.articleId
        : `draft-${Date.now()}`,
    headline:
      typeof input.headline === "string" && input.headline
        ? input.headline
        : language === "de"
          ? "NZZ Hintergrundanalyse"
          : "NZZ In-Depth Analysis",
    lead: typeof input.lead === "string" ? input.lead : "",
    body: typeof input.body === "string" ? input.body : "",
    author:
      typeof input.author === "string" && input.author
        ? input.author
        : language === "de"
          ? "NZZ Redaktion"
          : "NZZ Editorial",
    section: getLocalizedSection(
      typeof input.section === "string" ? input.section : undefined,
      language,
    ),
    language,
  };
}

async function loadArticleFromFiles(
  articleId: string,
  language: "en" | "de",
  current: GenerationArticleInput,
): Promise<GenerationArticleInput> {
  const articlesDir = getArticlesDir();
  if (!fs.existsSync(articlesDir)) return current;

  const files = await fs.promises.readdir(articlesDir);
  const normalizedId = articleId.replace(/[^a-zA-Z0-9]/g, "");
  const matches = (file: string) =>
    file.includes(articleId) ||
    file.replace(/[^a-zA-Z0-9]/g, "").includes(normalizedId);
  const jsonFile = files.find(
    (file) => matches(file) && file.endsWith(".json"),
  );
  const markdownFile = files.find(
    (file) => matches(file) && file.endsWith(".md"),
  );

  if (!jsonFile) return current;

  const parsed = JSON.parse(
    await fs.promises.readFile(path.join(articlesDir, jsonFile), "utf8"),
  ) as ArticleFilePayload;
  const markdown = markdownFile
    ? await fs.promises.readFile(path.join(articlesDir, markdownFile), "utf8")
    : "";
  const headline =
    language === "de"
      ? parsed.original_de?.headline || parsed.headline || current.headline
      : parsed.headline || current.headline;
  const lead =
    language === "de"
      ? parsed.original_de?.lead || parsed.lead || current.lead
      : parsed.lead || current.lead;

  return {
    id: articleId,
    headline,
    lead,
    body: markdown || parsed.lead || current.body,
    author: parsed.author_line || current.author,
    section: getLocalizedSection(parsed.section, language),
    language,
  };
}

liquidGenerationRouter.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const input = req.body as Record<string, unknown>;
    const language = input.language === "de" ? "de" : "en";
    const demoMode = req.query.demo === "1";
    let article = defaultArticleInput(language, input);

    // Drafts may be generated directly; otherwise recover the article from the local dataset.
    if (!article.body.trim() && article.id) {
      const stored = db.getArticleById(article.id);
      if (stored?.body) {
        article = {
          id: stored.id,
          headline: stored.headline || article.headline,
          lead: stored.lead || article.lead,
          body: stored.body,
          author: stored.author || article.author,
          section: getLocalizedSection(
            stored.section || stored.category,
            language,
          ),
          language,
        };
      } else {
        article = await loadArticleFromFiles(article.id, language, article);
      }
    }

    if (!article.body.trim()) {
      res
        .status(400)
        .json({ success: false, error: "Article body text is required" });
      return;
    }

    try {
      const derivatives = await generateLiquidDerivatives(article, {
        demoMode,
        mock: input.mock === true,
        model:
          typeof input.model === "string" && input.model
            ? input.model
            : env.geminiModel,
        language,
      });

      publishedStore.set(derivatives.articleId, derivatives);
      db.saveDerivatives(derivatives.articleId, derivatives);

      if (derivatives.detectedCategory || derivatives.suggestedTags) {
        db.updateArticle(derivatives.articleId, {
          category: derivatives.detectedCategory,
          tags: derivatives.suggestedTags,
        });
      }

      res.json({ success: true, data: derivatives });
    } catch (error) {
      console.error("[LiquidRoutes Generate Error]:", errorMessage(error));
      res.status(isCredentialError(error) ? 503 : 500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.post(
  "/generate-image",
  asyncHandler(async (req, res) => {
    const {
      prompt,
      aspectRatio,
      headline,
      category,
      articleTitle,
      lead,
      slideSummary,
      bustCache,
    } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }

    try {
      const result = await generateImagen3Image(prompt, {
        aspectRatio,
        headline,
        category,
        articleTitle,
        lead,
        slideSummary,
        bustCache: bustCache ?? true,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(
        "[LiquidRoutes Generate-Image Error]:",
        errorMessage(error),
      );
      res.status(isCredentialError(error) ? 503 : 500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.post(
  "/generate-deck-images",
  asyncHandler(async (req, res) => {
    const { slides, headline, category, lead } = req.body;
    if (!Array.isArray(slides)) {
      res
        .status(400)
        .json({ success: false, error: "Slides array is required" });
      return;
    }

    try {
      const results = await generateDeckImages(slides, {
        headline,
        category,
        lead,
      });
      res.json({ success: true, data: results });
    } catch (error) {
      console.error(
        "[LiquidRoutes Generate-Deck-Images Error]:",
        errorMessage(error),
      );
      res.status(isCredentialError(error) ? 503 : 500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.get(
  "/proxy-image",
  asyncHandler(async (req, res) => {
    const imageUrl = typeof req.query.url === "string" ? req.query.url : "";
    if (!imageUrl || !isSafeImageUrl(imageUrl)) {
      res.status(400).send("Invalid, missing, or forbidden image URL");
      return;
    }

    try {
      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        res.status(response.status).send("Failed to fetch image");
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().startsWith("image/")) {
        res.status(400).send("URL does not resolve to an image");
        return;
      }

      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 10 * 1024 * 1024) {
        res.status(413).send("Image exceeds 10MB limit");
        return;
      }

      res
        .set({
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400",
        })
        .send(Buffer.from(bytes));
    } catch (error) {
      res.status(500).send(errorMessage(error));
    }
  }),
);

liquidGenerationRouter.post(
  "/synthesize-audio",
  asyncHandler(async (req, res) => {
    const { script, author, language, voiceName, mock } = req.body;
    if (!script) {
      res
        .status(400)
        .json({ success: false, error: "Script text is required" });
      return;
    }

    try {
      const result = await synthesizeAudioBrief(script, {
        author,
        language,
        voiceName,
        mock: mock || false,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(
        "[LiquidRoutes Synthesize-Audio Error]:",
        errorMessage(error),
      );
      res.status(isCredentialError(error) ? 503 : 500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.post("/lint", (req, res) => {
  const { text, isHeadline, isSubhead, language } = req.body;
  const report = lintNZZStyle(text || "", { isHeadline, isSubhead, language });
  res.json({ success: true, data: report });
});
