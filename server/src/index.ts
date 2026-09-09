import "dotenv/config";
import { app } from "./app.js";
import { env, isProduction } from "./config/env.js";
import { closeDatabase } from "./config/database.js";

const PORT = env.port;

process.on("unhandledRejection", (reason) => {
  console.error("[Process] Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught Exception:", err);
  if (isProduction) process.exit(1);
});

if (env.nodeEnv !== "test") {
  const server = app.listen(PORT, () => {
    console.log(
      `🚀 NZZ Platform Server is running on http://localhost:${PORT}`,
    );
    const missingKeys = [
      "DATABASE_URL",
      "AUTH_SECRET",
      "GOOGLE_CLOUD_PROJECT",
    ].filter((key) => {
      if (key === "GOOGLE_CLOUD_PROJECT") return !env.googleCloudProject;
      return !process.env[key];
    });
    if (missingKeys.length > 0) {
      console.warn(
        `⚠️ [Config Notice] The following environment keys are not configured: ${missingKeys.join(", ")}`,
      );
    }
  });

  const shutdown = (signal: string) => {
    console.log(`[Process] ${signal} received; closing HTTP server.`);
    server.close(() => void closeDatabase().finally(() => process.exit(0)));
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

export { app };
