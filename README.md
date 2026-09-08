# Visual Velocity article foundation

React 19/Vite frontend with an Express/TypeScript API, PostgreSQL-backed article ingestion, and Gemini-powered visualization opportunity detection on Vertex AI.

## Setup

Requirements: Node.js, npm, and Docker.

```bash
npm run install:all
cp server/.env.example server/.env
npm run db:up
npm run db:migrate
npm run import:articles
npm --prefix server run backfill:countries
npm run dev
```

Local Gemini access uses Google Application Default Credentials (ADC):

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
```

Configure the Vertex project and model in `server/.env`:

```dotenv
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-3.8-flash
```

The frontend runs at `http://localhost:3000`, the API at `http://localhost:5001`, and the repository PostgreSQL container is exposed on port `5434` to avoid common local conflicts on 5432.

The default importer reads only `VisualVelocity/input/articles/*.json`. Matching Markdown files are deliberately ignored. A different directory of JSON files can be supplied with:

```bash
npm --prefix server run import:articles -- /absolute/path/to/articles
```

Each file is validated and imported independently. Reruns report existing NZZ IDs as skipped rather than duplicating them.

## Article API

- `GET /api/articles` — metadata-only article list
- `GET /api/articles/:id` — full article metadata and ordered structured body
- `POST /api/articles/import` — multipart upload under the `file` field (`.json` or `.md`, maximum 5 MB)
- `POST /api/articles/:id/visualizations/analyze` — return validated, evidence-linked visualization opportunities from Gemini
- `GET /api/articles/:id/existing-visualizations` — return q-tool visuals already embedded in the article, including map-region data
- `GET /api/articles/:id/visualizations` — return editor-approved generated visuals
- `GET /api/articles/:id/visualizations/history` — return the approval snapshots for audit/review
- `PUT /api/articles/:id/visualizations` — replace the article's approved generated visuals (including placement and edited data)
- `GET /api/articles/:id/visualizations/embed` — return a standalone HTML publication/embed artifact
- `GET /api/story-map/countries` — lightweight country coverage counts for the home-screen globe
- `GET /api/story-map/countries/:code/articles` — lightweight article summaries for a selected country
- `DELETE /api/articles/:id` — delete an article (the demo role restriction is currently enforced in the UI)

NZZ JSON uploads require a headline and a non-empty body array. Markdown requires a level-one headline (or `title`/`headline` front matter) and article body text. Supported optional front-matter keys include `lead`, `subtitle`, `author`, `author_line`, `section`, `language`, `date`, `published_at`, `source_url`, `url`, `nzz_id`, `document_id`, and comma-separated `tags`.

Example Markdown:

```markdown
---
title: Example headline
lead: Optional standfirst
author: Example Author
section: International
date: 2026-09-08
---

Article text is required.

## A structured section

More article text.
```

## Data model

The `articles` table stores identifiers and metadata in typed PostgreSQL columns. `body`, `raw_content`, `teaser_image`, and `tags` use `jsonb`. Body elements retain source order and receive stable positional IDs such as `element-0001`, allowing later analysis results to reference exact paragraphs, headings, images, embeds, and other source elements.

## Verification

```bash
npm --prefix server test
npm run build
```

Parser tests cover every supplied VisualVelocity JSON file, Markdown metadata/body parsing, q-tool normalization, malformed input, and body ordering. Visualization tests cover schema enforcement, series/data consistency, and rejection of references to nonexistent article elements.

## Visualize Article workflow

Editors open an article on its own shareable `/articles/:id` page. The **Visualize Article** action at the end of the article asks Gemini to analyze only quantitative and chronological evidence present in that article and returns a strict, evidence-linked chart contract. The editor can select recommendations, change the chart family (bar, line, area, stacked bar, dot plot, donut, or timeline), edit the title and data table, inspect confidence and caveats, jump to the supporting paragraphs, and save approved visuals. Saved visuals are persisted and rendered inline after Gemini's suggested source element.

Gemini never generates executable chart code. The client renders validated specifications with reusable Recharts components. Existing q-tool visuals are loaded from `q_data` and shown in the article instead of being replaced or duplicated; when a proprietary map renderer is unavailable, the article still shows its available image/table/metadata fallback.

## Current scope

Included: PostgreSQL schema/migrations, dataset import, JSON/Markdown manual uploads, article list/detail UI, q-tool visualization reuse, native map-style regional views, timeline rendering, deletion, Vertex AI analysis, provenance validation, chart-family recommendations, editor selection, editable chart data, plain-language visual summaries, persisted approvals, true inline placement, and interactive chart previews.

Deferred: richer proprietary q-tool renderers, external-data lookup, API authentication enforcement, collaborative approval history, and publication/embed export.
