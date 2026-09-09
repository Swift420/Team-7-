import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/database.js";
import { importArticleDirectory } from "../services/articleService.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const directory = path.resolve(
  process.argv[2] || path.join(repoRoot, "VisualVelocity/input/articles"),
);

// This script is intentionally explicit: failed files are reported while valid files continue importing.
async function run() {
  console.log(`Importing JSON articles from ${directory}`);
  const report = await importArticleDirectory(directory);
  console.log(
    `Import complete: ${report.imported.length} imported, ${report.skipped.length} skipped, ${report.failed.length} failed`,
  );
  if (report.failed.length) process.exitCode = 1;
}

run()
  .catch((error) => {
    console.error("article import failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
