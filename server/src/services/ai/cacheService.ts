import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env.js";

const CACHE_DIR = path.resolve(process.cwd(), ".cache");

// Memory is fastest; disk survives restarts. Template/demo output is deliberately excluded from both.
const memoryCache = new Map<string, unknown>();

const isTemplateResult = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  "source" in value &&
  (value as { source?: unknown }).source === "template";

let cacheHits = 0;
let cacheMisses = 0;

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch {
      // ignore
    }
  }
}

export function generateCacheKey(
  prefix: string,
  content: string | object,
  mode: string = "live",
): string {
  const serialized =
    typeof content === "string" ? content : JSON.stringify(content);
  const hash = crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
    .slice(0, 16);
  return `${prefix}_${mode}_${hash}`;
}

export function getCached<T>(key: string): T | null {
  if (!env.cacheEnabled) return null;

  // 1. Check memory
  if (memoryCache.has(key)) {
    const val = memoryCache.get(key);
    if (isTemplateResult(val)) {
      memoryCache.delete(key);
      return null;
    }
    cacheHits++;
    return val as T;
  }

  // 2. Check disk
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (data?.source === "template") {
        fs.unlinkSync(filePath);
        return null;
      }
      memoryCache.set(key, data);
      cacheHits++;
      return data as T;
    } catch {
      return null;
    }
  }

  cacheMisses++;
  return null;
}

export function setCached<T>(key: string, data: T): void {
  if (!env.cacheEnabled) return;

  // NEVER cache template output
  if (isTemplateResult(data)) return;

  memoryCache.set(key, data);
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), "utf8");
  } catch {
    // ignore
  }
}

export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    itemsInMem: memoryCache.size,
    costSavedPercentage:
      cacheHits + cacheMisses > 0
        ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100)
        : 100,
  };
}
