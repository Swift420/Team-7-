import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LiquidDerivatives } from "../services/ai/liquidSchemas.js";

/** Local development store used when PostgreSQL is unavailable; writes are atomic JSON replacements. */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ArticleRecord {
  id: string;
  headline: string;
  lead: string;
  body: string;
  author: string;
  section: string;
  category?: string;
  tags?: string[];
  wordCount: number;
  readingTimeSeconds: number;
  language: "en" | "de";
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  summaryBullets?: string[];
  teaserImage?: {
    url: string;
    caption: string;
    credit: string;
  };
}

export class JsonDatabase {
  private dbDir: string;
  private articlesFile: string;
  private derivativesFile: string;
  private articles: Map<string, ArticleRecord> = new Map();
  private derivatives: Map<string, LiquidDerivatives> = new Map();
  private initialized = false;

  constructor(customDir?: string) {
    if (customDir) {
      this.dbDir = customDir;
    } else {
      // Find suitable data/db dir relative to current working directory
      if (path.basename(process.cwd()) === "server") {
        this.dbDir = path.resolve(process.cwd(), "data/db");
      } else if (fs.existsSync(path.resolve(process.cwd(), "server"))) {
        this.dbDir = path.resolve(process.cwd(), "server/data/db");
      } else {
        this.dbDir = path.resolve(process.cwd(), "data/db");
      }
    }

    this.articlesFile = path.join(this.dbDir, "articles.json");
    this.derivativesFile = path.join(this.dbDir, "derivatives.json");
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }

    // Load articles
    if (fs.existsSync(this.articlesFile)) {
      try {
        const raw = fs.readFileSync(this.articlesFile, "utf8");
        const list: ArticleRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.articles.set(item.id, item);
        }
      } catch (err) {
        console.error(
          "[DB] Failed to parse articles.json, resetting map:",
          err,
        );
      }
    }

    // Load derivatives
    if (fs.existsSync(this.derivativesFile)) {
      try {
        const raw = fs.readFileSync(this.derivativesFile, "utf8");
        const list: { articleId: string; payload: LiquidDerivatives }[] =
          JSON.parse(raw);
        for (const item of list) {
          this.derivatives.set(item.articleId, item.payload);
        }
      } catch (err) {
        console.error("[DB] Failed to parse derivatives.json:", err);
      }
    }

    // If empty, auto-seed from bundled seed files if available
    const seedCandidates = [
      path.resolve(__dirname, "seed"),
      path.resolve(__dirname, "../db/seed"),
      path.resolve(__dirname, "../../src/db/seed"),
      path.resolve(process.cwd(), "src/db/seed"),
      path.resolve(process.cwd(), "server/src/db/seed"),
    ];
    const seedDir = seedCandidates.find((d) => fs.existsSync(d));

    if (seedDir) {
      const articlesSeed = path.join(seedDir, "articles.seed.json");
      const derivativesSeed = path.join(seedDir, "derivatives.seed.json");

      if (this.articles.size === 0 && fs.existsSync(articlesSeed)) {
        try {
          const raw = fs.readFileSync(articlesSeed, "utf8");
          const list: ArticleRecord[] = JSON.parse(raw);
          for (const item of list) {
            this.articles.set(item.id, item);
          }
          this.persistArticles();
          console.log(
            `[DB] Seeded ${this.articles.size} articles from seed file.`,
          );
        } catch (err) {
          console.error("[DB] Failed to parse articles.seed.json:", err);
        }
      }

      if (this.derivatives.size === 0 && fs.existsSync(derivativesSeed)) {
        try {
          const raw = fs.readFileSync(derivativesSeed, "utf8");
          const list: { articleId: string; payload: LiquidDerivatives }[] =
            JSON.parse(raw);
          for (const item of list) {
            this.derivatives.set(item.articleId, item.payload);
          }
          this.persistDerivatives();
          console.log(
            `[DB] Seeded ${this.derivatives.size} derivatives from seed file.`,
          );
        } catch (err) {
          console.error("[DB] Failed to parse derivatives.seed.json:", err);
        }
      }
    }

    // Auto-seed challenge articles if missing
    this.seedInitialArticles();

    this.initialized = true;
    console.log(
      `[DB] Initialized persistent store with ${this.articles.size} articles and ${this.derivatives.size} derivatives.`,
    );
  }

  private seedInitialArticles(): void {
    const candidates = [
      path.resolve(process.cwd(), "LiquidStoryEngine/input/articles"),
      path.resolve(process.cwd(), "../LiquidStoryEngine/input/articles"),
      path.resolve(process.cwd(), "../../LiquidStoryEngine/input/articles"),
    ];
    const articlesDir = candidates.find((c) => fs.existsSync(c));
    if (!articlesDir) return;

    try {
      const files = fs.readdirSync(articlesDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      for (const jsonFile of jsonFiles) {
        const fullJsonPath = path.join(articlesDir, jsonFile);
        const data = JSON.parse(fs.readFileSync(fullJsonPath, "utf8"));
        const baseId = jsonFile.replace(".json", "");
        const mdFile = files.find(
          (f) => f.startsWith(baseId) && f.endsWith(".md"),
        );
        const bodyText = mdFile
          ? fs.readFileSync(path.join(articlesDir, mdFile), "utf8")
          : data.lead || "";

        const section = data.section || "Wirtschaft";
        const words =
          (bodyText || "").split(/\s+/).filter(Boolean).length || 500;

        const defaultTags: string[] = ["#NZZ"];
        if (
          section.toLowerCase().includes("wirt") ||
          section.toLowerCase().includes("econ")
        )
          defaultTags.push("#Wirtschaft", "#Finanzen");
        if (
          section.toLowerCase().includes("tech") ||
          section.toLowerCase().includes("ai")
        )
          defaultTags.push("#Technologie", "#KI");
        if (
          section.toLowerCase().includes("inter") ||
          section.toLowerCase().includes("welt")
        )
          defaultTags.push("#International", "#Sicherheit");

        const record: ArticleRecord = {
          id: data.id || baseId,
          headline: data.headline || "NZZ Hintergrund",
          lead: data.lead || "",
          body: bodyText,
          author: data.author_line || "NZZ Redaktion",
          section: section,
          category: section,
          tags: defaultTags,
          wordCount: words,
          readingTimeSeconds: Math.ceil(words / 3.5),
          language: data.language === "de" ? "de" : "en",
          status: "published",
          createdAt: data.publication_date || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          summaryBullets: data.summary_bullets_en,
          teaserImage: data.teaser_image,
        };

        if (!this.articles.has(record.id)) {
          this.articles.set(record.id, record);
        }
      }

      this.persistArticles();
      console.log(
        `[DB] Pre-seeded ${this.articles.size} challenge articles into persistent database.`,
      );
    } catch (err) {
      console.error("[DB] Seeding error:", err);
    }
  }

  private persistArticles(): void {
    const list = Array.from(this.articles.values());
    const tmp = `${this.articlesFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
    fs.renameSync(tmp, this.articlesFile);
  }

  private persistDerivatives(): void {
    const list = Array.from(this.derivatives.entries()).map(
      ([articleId, payload]) => ({
        articleId,
        payload,
      }),
    );
    const tmp = `${this.derivativesFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
    fs.renameSync(tmp, this.derivativesFile);
  }

  public getAllArticles(
    options: { lang?: "en" | "de"; category?: string; query?: string } = {},
  ): ArticleRecord[] {
    let result = Array.from(this.articles.values());

    if (
      options.category &&
      options.category !== "ALL" &&
      options.category !== "ALLE"
    ) {
      const cat = options.category.toLowerCase();
      result = result.filter(
        (a) =>
          (a.category && a.category.toLowerCase().includes(cat)) ||
          (a.section && a.section.toLowerCase().includes(cat)),
      );
    }

    if (options.query) {
      const q = options.query.toLowerCase();
      result = result.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.lead.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))),
      );
    }

    // Sort by createdAt desc
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return result;
  }

  public getArticleById(id: string): ArticleRecord | null {
    if (!id) return null;
    if (this.articles.has(id)) return this.articles.get(id)!;

    // Fallback: match normalized ID
    const clean = id.replace(/[^a-zA-Z0-9]/g, "");
    for (const [key, val] of this.articles.entries()) {
      if (key.replace(/[^a-zA-Z0-9]/g, "") === clean) {
        return val;
      }
    }
    return null;
  }

  public saveArticle(input: {
    id?: string;
    headline: string;
    lead?: string;
    body: string;
    author?: string;
    section?: string;
    category?: string;
    tags?: string[];
    language?: "en" | "de";
    status?: "draft" | "published";
  }): ArticleRecord {
    // Check by input.id first, or by matching headline to prevent duplicate articles
    let existing: ArticleRecord | null = null;
    if (input.id) {
      existing = this.getArticleById(input.id);
    }
    if (!existing) {
      const cleanHeadline = input.headline.trim().toLowerCase();
      for (const a of this.articles.values()) {
        if (a.headline.trim().toLowerCase() === cleanHeadline) {
          existing = a;
          break;
        }
      }
    }

    const id = existing
      ? existing.id
      : input.id ||
        `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const words = input.body.split(/\s+/).filter(Boolean).length;
    const now = new Date().toISOString();

    const record: ArticleRecord = {
      id,
      headline: input.headline.trim(),
      lead: input.lead?.trim() || "",
      body: input.body.trim(),
      author:
        input.author?.trim() ||
        (input.language === "de" ? "NZZ Redaktion" : "NZZ Editorial"),
      section: input.section || input.category || "Wirtschaft",
      category: input.category || input.section || "Wirtschaft",
      tags: input.tags || ["#NZZ"],
      wordCount: words,
      readingTimeSeconds: Math.ceil(words / 3.5),
      language: input.language || "en",
      status: input.status || "draft",
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.articles.set(record.id, record);
    this.persistArticles();
    console.log(
      `[DB] Saved article ${record.id} ("${record.headline.slice(0, 35)}...")`,
    );
    return record;
  }

  public updateArticle(
    id: string,
    updates: Partial<ArticleRecord>,
  ): ArticleRecord | null {
    const existing = this.getArticleById(id);
    if (!existing) return null;

    const updated: ArticleRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.body) {
      updated.wordCount = updates.body.split(/\s+/).filter(Boolean).length;
      updated.readingTimeSeconds = Math.ceil(updated.wordCount / 3.5);
    }

    this.articles.set(existing.id, updated);
    this.persistArticles();
    return updated;
  }

  public deleteArticle(id: string): boolean {
    const existing = this.getArticleById(id);
    if (!existing) return false;

    this.articles.delete(existing.id);
    this.derivatives.delete(existing.id);
    this.persistArticles();
    this.persistDerivatives();
    return true;
  }

  public saveDerivatives(articleId: string, payload: LiquidDerivatives): void {
    this.derivatives.set(articleId, payload);
    this.persistDerivatives();
  }

  public getDerivatives(articleId: string): LiquidDerivatives | null {
    if (this.derivatives.has(articleId))
      return this.derivatives.get(articleId)!;

    // Check normalized key
    const clean = articleId.replace(/[^a-zA-Z0-9]/g, "");
    for (const [key, val] of this.derivatives.entries()) {
      if (key.replace(/[^a-zA-Z0-9]/g, "") === clean) {
        return val;
      }
    }
    return null;
  }

  public getCategories(): string[] {
    const cats = new Set<string>();
    for (const art of this.articles.values()) {
      if (art.category) cats.add(art.category);
      if (art.section) cats.add(art.section);
    }
    return Array.from(cats);
  }

  public getAllTags(): string[] {
    const tags = new Set<string>();
    for (const art of this.articles.values()) {
      if (art.tags && Array.isArray(art.tags)) {
        for (const t of art.tags) tags.add(t);
      }
    }
    return Array.from(tags);
  }
}

// Global Singleton Database Instance
export const db = new JsonDatabase();
