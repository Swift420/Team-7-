import fs from "node:fs/promises";
import path from "node:path";
import {
  getArticleByImportKey,
  insertArticle,
} from "../repositories/articleRepository.js";
import {
  ImportOutcome,
  PublicationStatus,
  SourceFormat,
} from "../types/article.js";
import { ArticleValidationError, parseArticle } from "./articleParser.js";
import { replaceArticleCountries } from "../repositories/countryRepository.js";
import { classifyArticleCountries } from "./countryClassifier.js";

/** Converts uploaded files into normalized records and classifies their country relationships. */
export function sourceFormatForFilename(filename: string): SourceFormat {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".json") return "NZZ_JSON";
  if (extension === ".md" || extension === ".markdown") return "MARKDOWN";
  throw new ArticleValidationError("Unsupported file type", [
    "Only .json and .md files are supported",
  ]);
}

export async function importArticleContent(
  filename: string,
  content: Buffer | string,
  publicationStatus: PublicationStatus = "published",
): Promise<ImportOutcome> {
  const normalized = parseArticle(
    content.toString("utf8"),
    sourceFormatForFilename(filename),
  );
  normalized.publicationStatus = publicationStatus;
  const inserted = await insertArticle(normalized);
  if (inserted) {
    await replaceArticleCountries(
      inserted.id,
      classifyArticleCountries(inserted),
    );
    return { status: "imported", article: inserted };
  }
  const existing = await getArticleByImportKey(normalized.importKey);
  if (!existing)
    throw new Error(
      "Article conflict occurred but the existing record could not be found",
    );
  return {
    status: "skipped",
    article: existing,
    reason: "Article has already been imported",
  };
}

export interface DatasetImportReport {
  imported: string[];
  skipped: string[];
  failed: Array<{ file: string; error: string }>;
}

export async function importArticleDirectory(
  directory: string,
): Promise<DatasetImportReport> {
  const entries = (await fs.readdir(directory, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isFile() && path.extname(entry.name).toLowerCase() === ".json",
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const report: DatasetImportReport = { imported: [], skipped: [], failed: [] };
  for (const entry of entries) {
    try {
      const outcome = await importArticleContent(
        entry.name,
        await fs.readFile(path.join(directory, entry.name)),
      );
      report[outcome.status].push(entry.name);
      console.log(
        `${outcome.status}: ${entry.name} (${outcome.article.headline})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.failed.push({ file: entry.name, error: message });
      console.error(`failed: ${entry.name} (${message})`);
    }
  }
  return report;
}
