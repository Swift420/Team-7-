import fs from "node:fs";
import path from "node:path";
import type { LiquidDerivatives } from "../../services/ai/liquidSchemas.js";

export const publishedStore = new Map<string, LiquidDerivatives>();

export interface ArticleFilePayload {
  nzz_id?: string;
  headline?: string;
  lead?: string;
  author_line?: string;
  section?: string;
  word_count?: number;
  original_de?: { headline?: string; lead?: string };
  summary_bullets_en?: string[];
  teaser_image?: Record<string, unknown>;
}

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
export const isCredentialError = (error: unknown): boolean => {
  const message = errorMessage(error);
  return (
    message.includes("AUTH_MISSING") ||
    message.includes("credentials not found")
  );
};

export function getArticlesDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "LiquidStoryEngine/input/articles"),
    path.resolve(process.cwd(), "../LiquidStoryEngine/input/articles"),
  ];
  return (
    candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
  );
}

export function isSafeImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "169.254.169.254" ||
      host === "metadata.google.internal" ||
      host.endsWith(".internal") ||
      host.endsWith(".local")
    )
      return false;
    const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!ipv4) return true;
    const [, first, second] = ipv4.map(Number);
    return (
      first !== 0 &&
      first !== 10 &&
      first !== 127 &&
      first !== 169 &&
      !(first === 172 && second >= 16 && second <= 31) &&
      !(first === 192 && second === 168)
    );
  } catch {
    return false;
  }
}

const SECTION_TRANSLATIONS: Record<string, { en: string; de: string }> = {
  wirtschaft: { en: "Economy", de: "Wirtschaft" },
  finanzen: { en: "Finance", de: "Finanzen" },
  international: { en: "World", de: "International" },
  schweiz: { en: "Switzerland", de: "Schweiz" },
  wissenschaft: { en: "Science", de: "Wissenschaft" },
  technologie: { en: "Technology", de: "Technologie" },
  feuilleton: { en: "Culture", de: "Feuilleton" },
  kultur: { en: "Culture", de: "Kultur" },
  meinung: { en: "Opinion", de: "Meinung" },
  sport: { en: "Sports", de: "Sport" },
  gesellschaft: { en: "Society", de: "Gesellschaft" },
  panorama: { en: "Panorama", de: "Panorama" },
  mobilität: { en: "Mobility & Automotive", de: "Mobilität & Automotive" },
  automotive: { en: "Mobility & Automotive", de: "Mobilität & Automotive" },
};

export function getLocalizedSection(
  rawSection: string | undefined,
  lang: "en" | "de",
): string {
  const raw = rawSection || "";
  return (
    SECTION_TRANSLATIONS[raw.toLowerCase().trim()]?.[lang] ||
    (lang === "de" ? raw || "Wirtschaft" : raw || "Economy")
  );
}
