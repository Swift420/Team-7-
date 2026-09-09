import express, { ErrorRequestHandler } from "express";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import multer from "multer";
import {
  mockCategories,
  mockOverview,
  mockPerformance,
  mockRegional,
  mockTimeSeries,
  mockTrafficSources,
} from "./data/mockData.js";
import { articleRouter } from "./routes/articles.js";
import { ArticleValidationError } from "./services/articleParser.js";
import { VisualizationAnalysisError } from "./services/visualizationService.js";
import { storyMapRouter } from "./routes/storyMap.js";
import { authRouter } from "./routes/auth.js";
import { liquidRouter } from "./routes/liquidRoutes.js";
import { sendError } from "./http.js";
import { env } from "./config/env.js";

export const app = express();

// Middleware order is intentional: request metadata/body parsing precede routers, error handling is last.
app.use(cors());
app.use((req, res, next) => {
  const requestId = req.header("x-request-id") || randomUUID();
  res.setHeader("x-request-id", requestId);
  next();
});
app.use(express.json({ limit: "10mb" }));
const qDataDir =
  env.qDataDir || path.resolve(process.cwd(), "../VisualVelocity/input/q_data");
app.use("/api/visual-assets", express.static(qDataDir));
const videosDir = path.resolve(process.cwd(), "data/videos");
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
app.use(
  "/api/videos",
  express.static(videosDir, {
    setHeaders: (res) => {
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Access-Control-Allow-Origin", "*");
    },
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "nzz-pulse-server",
  }),
);
app.use("/api/auth", authRouter);
app.use("/api/articles", articleRouter);
app.use("/api/liquid", liquidRouter);
app.use("/api/story-map", storyMapRouter);
app.get("/api/metrics/overview", (_req, res) =>
  res.json({ success: true, data: mockOverview }),
);
app.get("/api/metrics/timeseries", (req, res) => {
  const range = (req.query.range as string) || "12m";
  let data = [...mockTimeSeries];
  if (range === "6m") data = data.slice(6);
  else if (range === "3m") data = data.slice(9);
  res.json({ success: true, range, data });
});
app.get("/api/metrics/categories", (_req, res) =>
  res.json({ success: true, data: mockCategories }),
);
app.get("/api/metrics/regional", (_req, res) =>
  res.json({ success: true, data: mockRegional }),
);
app.get("/api/metrics/performance", (_req, res) =>
  res.json({ success: true, data: mockPerformance }),
);
app.get("/api/metrics/traffic", (_req, res) =>
  res.json({ success: true, data: mockTrafficSources }),
);

// In production the same Cloud Run service serves the compiled React app and API.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: "1h" }));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((_req, res) => {
  sendError(res, 404, "NOT_FOUND", "Endpoint not found");
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    sendError(res, 400, "INVALID_JSON", "Malformed JSON payload");
    return;
  }
  if (error instanceof ArticleValidationError) {
    sendError(
      res,
      400,
      "ARTICLE_VALIDATION_ERROR",
      error.message,
      error.details,
    );
    return;
  }
  if (error instanceof multer.MulterError) {
    sendError(
      res,
      400,
      "UPLOAD_ERROR",
      error.code === "LIMIT_FILE_SIZE"
        ? "Article file exceeds the 5 MB limit"
        : error.message,
    );
    return;
  }
  if (error instanceof VisualizationAnalysisError) {
    const status = error.code === "AI_NOT_CONFIGURED" ? 503 : 502;
    sendError(res, status, error.code, error.message);
    return;
  }
  console.error("[HTTP] Unhandled request error", {
    requestId: res.getHeader("x-request-id"),
    method: req.method,
    path: req.originalUrl,
    error,
  });
  sendError(res, 500, "INTERNAL_ERROR", "Unable to process the request");
};
app.use(errorHandler);
