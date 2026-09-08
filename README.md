# Visual Velocity article foundation

React 19/Vite frontend with an Express/TypeScript API and PostgreSQL-backed article ingestion. This phase imports and browses structured articles; it intentionally contains no Gemini or visualization-generation implementation.

## Setup

Requirements: Node.js, npm, and Docker.

```bash
npm run install:all
cp server/.env.example server/.env
npm run db:up
npm run db:migrate
npm run import:articles
npm run dev
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

Parser tests cover every supplied VisualVelocity JSON file, Markdown metadata/body parsing, q-tool normalization, malformed input, and body ordering.

## Current scope

Included: PostgreSQL schema/migrations, dataset import, JSON/Markdown manual uploads, article list/detail UI, q-tool placeholders, and deletion.

Deferred: Gemini, opportunity detection, generated charts/maps, q-tool recreation, `q_data`, BigQuery, external-data lookup, and AI enrichment.
