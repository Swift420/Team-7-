import fs from "node:fs";
import path from "node:path";
import { Router } from "express";
import { requireEditor } from "../../auth.js";
import { db } from "../../db/database.js";
import { asyncHandler } from "../../http.js";
import { getArticlesDir, getLocalizedSection } from "./common.js";
import type { ArticleFilePayload } from "./common.js";

export const liquidContentRouter = Router();

liquidContentRouter.get("/articles", (req, res) => {
  const lang = req.query.lang === "de" ? "de" : "en";
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;
  const query =
    typeof req.query.query === "string" ? req.query.query : undefined;
  const dbArticles = db.getAllArticles({ lang, category, query });
  const articles = dbArticles.map((article) => ({
    id: article.id,
    headline: article.headline,
    lead: article.lead,
    author:
      article.author || (lang === "de" ? "NZZ Redaktion" : "NZZ Editorial"),
    section: getLocalizedSection(article.section || article.category, lang),
    category: article.category || article.section || "Wirtschaft",
    tags: article.tags || ["#NZZ"],
    wordCount: article.wordCount,
    readingTimeSeconds: article.readingTimeSeconds,
    publishedAt: article.createdAt,
    createdAt: article.createdAt,
    status: article.status,
    language: article.language || lang,
  }));

  res.json({
    success: true,
    articles,
    categories: db.getCategories(),
    tags: db.getAllTags(),
  });
});

liquidContentRouter.get("/categories", (_req, res) => {
  res.json({
    success: true,
    categories: db.getCategories(),
    tags: db.getAllTags(),
  });
});

liquidContentRouter.post("/articles", requireEditor, (req, res) => {
  const {
    headline,
    lead,
    body,
    author,
    section,
    category,
    tags,
    language,
    status,
    id,
  } = req.body;
  if (!headline || !body) {
    return res
      .status(400)
      .json({ success: false, error: "Headline and body are required" });
  }

  const saved = db.saveArticle({
    id,
    headline,
    lead,
    body,
    author,
    section,
    category,
    tags,
    language: language === "de" ? "de" : "en",
    status: status || "draft",
  });

  return res.json({ success: true, article: saved });
});

liquidContentRouter.put("/articles/:id", requireEditor, (req, res) => {
  const articleId = String(req.params.id);
  const {
    headline,
    lead,
    body,
    author,
    section,
    category,
    tags,
    status,
    summaryBullets,
    teaserImage,
  } = req.body;
  const updated = db.updateArticle(articleId, {
    headline,
    lead,
    body,
    author,
    section,
    category,
    tags,
    status,
    summaryBullets,
    teaserImage,
  });

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, error: `Article ${articleId} not found` });
  }

  return res.json({ success: true, article: updated });
});

liquidContentRouter.delete("/articles/:id", requireEditor, (req, res) => {
  const deleted = db.deleteArticle(String(req.params.id));
  return res.json({ success: true, deleted });
});

liquidContentRouter.get(
  "/articles/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const lang = req.query.lang === "de" ? "de" : "en";
    const stored = db.getArticleById(id);
    if (stored) {
      res.json({
        success: true,
        article: {
          id: stored.id,
          headline: stored.headline,
          lead: stored.lead,
          author: stored.author,
          section: getLocalizedSection(stored.section || stored.category, lang),
          category: stored.category || stored.section,
          tags: stored.tags,
          status: stored.status,
          wordCount: stored.wordCount,
          body: stored.body,
          summaryBullets: stored.summaryBullets,
          teaserImage: stored.teaserImage,
          language: stored.language || lang,
        },
      });
      return;
    }

    // Imported challenge files remain a read-only fallback when the JSON store has no record.
    const articlesDir = getArticlesDir();
    if (!fs.existsSync(articlesDir)) {
      res
        .status(404)
        .json({ success: false, error: "Articles directory not found" });
      return;
    }

    const files = await fs.promises.readdir(articlesDir);
    const jsonFile = files.find(
      (file) => file.includes(id) && file.endsWith(".json"),
    );
    const mdFile = files.find(
      (file) => file.includes(id) && file.endsWith(".md"),
    );

    if (!jsonFile) {
      res
        .status(404)
        .json({ success: false, error: `Article ${id} not found` });
      return;
    }

    const jsonData = JSON.parse(
      await fs.promises.readFile(path.join(articlesDir, jsonFile), "utf8"),
    ) as ArticleFilePayload;
    const body = mdFile
      ? await fs.promises.readFile(path.join(articlesDir, mdFile), "utf8")
      : "";
    const headline =
      lang === "de"
        ? jsonData.original_de?.headline || jsonData.headline
        : jsonData.headline;
    const lead =
      lang === "de"
        ? jsonData.original_de?.lead || jsonData.lead
        : jsonData.lead;

    res.json({
      success: true,
      article: {
        id: jsonData.nzz_id || id,
        headline,
        lead,
        author:
          jsonData.author_line ||
          (lang === "de" ? "NZZ Redaktion" : "NZZ Editorial"),
        section: getLocalizedSection(jsonData.section, lang),
        category: jsonData.section,
        wordCount: jsonData.word_count || 1200,
        body: body || lead,
        summaryBullets: jsonData.summary_bullets_en,
        teaserImage: jsonData.teaser_image,
        language: lang,
      },
    });
  }),
);
