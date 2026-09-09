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
  generateVeoVideo,
  getVeoServiceStatus,
} from "../../services/gcp/veoService.js";
import { renderFullVerticalVideo } from "../../services/video/videoStitcher.js";
import type { SocialStoryboardFormat, VideoScene } from "../../types/liquid.js";
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
        signal: AbortSignal.timeout(60000),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.toLowerCase().startsWith("image/")) {
          const bytes = await response.arrayBuffer();
          if (bytes.byteLength <= 15 * 1024 * 1024) {
            res
              .set({
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
              })
              .send(Buffer.from(bytes));
            return;
          }
        }
      }
    } catch (error) {
      console.warn(
        `[Proxy Image] External image fetch failed for "${imageUrl.slice(0, 60)}...":`,
        errorMessage(error),
      );
    }

    // Graceful fallback to authentic Swiss prestige editorial photography so slide canvas never breaks
    const fallbackUrl =
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80";
    try {
      const fallbackRes = await fetch(fallbackUrl, {
        signal: AbortSignal.timeout(10000),
      });
      if (fallbackRes.ok) {
        const bytes = await fallbackRes.arrayBuffer();
        res
          .set({
            "Content-Type": "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=86400",
          })
          .send(Buffer.from(bytes));
        return;
      }
    } catch {
      // ignore
    }

    res.status(502).send("Image temporarily unavailable");
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

liquidGenerationRouter.get(
  "/video-status",
  asyncHandler(async (_req, res) => {
    const status = await getVeoServiceStatus();
    res.json({ success: true, data: status });
  }),
);

liquidGenerationRouter.post(
  "/generate-scene-video",
  asyncHandler(async (req, res) => {
    const {
      articleId,
      sceneIndex,
      visualPrompt,
      onScreenHeadline,
      prominentMetric,
      sceneType,
      durationSeconds,
      bustCache,
      mock,
    } = req.body;

    if (!visualPrompt) {
      res.status(400).json({ success: false, error: "visualPrompt is required" });
      return;
    }

    try {
      const result = await generateVeoVideo(visualPrompt, {
        durationSeconds: durationSeconds || 5,
        aspectRatio: "9:16",
        bustCache: bustCache ?? false,
        mock: mock ?? false,
        headline: onScreenHeadline,
        sceneType,
      });

      // Update in-memory and database derivatives if articleId provided
      if (articleId && typeof sceneIndex === "number") {
        const stored = db.getDerivatives(articleId) || publishedStore.get(articleId);
        if (stored?.socialStoryboard?.scenes?.[sceneIndex - 1]) {
          stored.socialStoryboard.scenes[sceneIndex - 1].videoUrl = result.videoUrl;
          stored.socialStoryboard.scenes[sceneIndex - 1].videoStatus = "ready";
          stored.socialStoryboard.scenes[sceneIndex - 1].modelUsed = result.modelUsed;
          db.saveDerivatives(articleId, stored);
          publishedStore.set(articleId, stored);
        }
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[LiquidRoutes Generate-Scene-Video Error]:", errorMessage(error));
      res.status(isCredentialError(error) ? 503 : 500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.post(
  "/generate-all-scene-videos",
  asyncHandler(async (req, res) => {
    const { articleId, scenes, bustCache, mock } = req.body;
    if (!Array.isArray(scenes)) {
      res.status(400).json({ success: false, error: "scenes array is required" });
      return;
    }

    try {
      const results: VideoScene[] = [];
      for (const scene of scenes) {
        try {
          const videoResult = await generateVeoVideo(scene.visualPrompt, {
            durationSeconds: 5,
            aspectRatio: "9:16",
            bustCache: bustCache ?? false,
            mock: mock ?? false,
            headline: scene.onScreenHeadline,
            sceneType: scene.sceneType,
          });

          results.push({
            ...scene,
            videoUrl: videoResult.videoUrl,
            videoStatus: "ready",
            modelUsed: videoResult.modelUsed,
          });
        } catch (err) {
          console.warn(`[GenerateAllScenes] Scene ${scene.sceneIndex} failed:`, errorMessage(err));
          results.push({
            ...scene,
            videoStatus: "failed",
          });
        }
      }

      // Update derivatives store if articleId is provided
      if (articleId) {
        const stored = db.getDerivatives(articleId) || publishedStore.get(articleId);
        if (stored?.socialStoryboard) {
          stored.socialStoryboard.scenes = results;
          db.saveDerivatives(articleId, stored);
          publishedStore.set(articleId, stored);
        }
      }

      res.json({ success: true, data: results });
    } catch (error) {
      console.error("[LiquidRoutes Generate-All-Scene-Videos Error]:", errorMessage(error));
      res.status(500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

liquidGenerationRouter.post(
  "/render-vertical-video",
  asyncHandler(async (req, res) => {
    const { articleId, storyboard, language, mock } = req.body;
    if (!storyboard || !Array.isArray(storyboard.scenes)) {
      res.status(400).json({ success: false, error: "storyboard with scenes is required" });
      return;
    }

    try {
      const result = await renderFullVerticalVideo(
        storyboard as SocialStoryboardFormat,
        {
          articleId: articleId || `video-${Date.now()}`,
          language: language === "de" ? "de" : "en",
          mock: mock ?? false,
        },
      );

      // Save rendered video URL to article derivatives
      if (articleId) {
        const stored = db.getDerivatives(articleId) || publishedStore.get(articleId);
        if (stored?.socialStoryboard) {
          stored.socialStoryboard.renderedVideoUrl = result.videoUrl;
          stored.socialStoryboard.videoUrl = result.videoUrl;
          stored.socialStoryboard.renderedVideoStatus = "ready";
          stored.socialStoryboard.totalDurationSeconds = result.totalDurationSeconds;
          db.saveDerivatives(articleId, stored);
          publishedStore.set(articleId, stored);
        }
      }

      res.json({ success: true, data: result });
    } catch (error) {
      console.error("[LiquidRoutes Render-Vertical-Video Error]:", errorMessage(error));
      res.status(500).json({
        success: false,
        error: errorMessage(error),
      });
    }
  }),
);

