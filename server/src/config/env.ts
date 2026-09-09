const integer = (
  value: string | undefined,
  fallback: number,
  minimum = 0,
): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : fallback;
};

/** One read-only view of runtime settings; feature code should not parse environment variables itself. */
export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: integer(process.env.PORT, 5001, 1),
  databaseUrl: process.env.DATABASE_URL,
  databasePoolSize: integer(process.env.PG_POOL_SIZE, 10, 1),
  authSecret: process.env.AUTH_SECRET,
  googleCloudProject:
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID,
  googleCloudLocation:
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.GCP_LOCATION ||
    "us-central1",
  qDataDir: process.env.Q_DATA_DIR,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-pro",
  cacheEnabled: process.env.ENABLE_CACHE !== "false",
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  hasGeminiApiKey: Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  ),
  aiRequestTimeoutMs: integer(process.env.AI_REQUEST_TIMEOUT_MS, 30_000, 1_000),
});

export const isProduction = env.nodeEnv === "production";
