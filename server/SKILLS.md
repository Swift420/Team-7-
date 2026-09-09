# Backend Engineering Skill & Architecture Guide (Visual Velocity & Liquid Story Engine)

This document is the engineering reference for the backend system. It covers architecture, persistence patterns, AI pipelines, API design, authentication, and quality standards.

---

## 1. System Architecture

The backend is an Express + TypeScript application designed to operate in cloud environments (Google Cloud Platform & PostgreSQL) while providing seamless zero-config fallback to an in-memory/JSON store for local development.

```
server/
├── src/
│   ├── app.ts                 # Express setup, middleware order, global error handling
│   ├── index.ts               # Server startup, signal trapping (SIGTERM, SIGINT)
│   ├── auth.ts                # HMAC-SHA256 session tokens, timing-safe auth guards
│   ├── http.ts                # HTTP response envelopes (sendSuccess, sendError, asyncHandler)
│   ├── config/
│   │   ├── env.ts             # Immutable, strongly-typed environment configuration
│   │   └── database.ts        # PostgreSQL pg.Pool connection & withTransaction helper
│   ├── db/
│   │   ├── database.ts        # JsonDatabase persistent fallback store with atomic writes
│   │   ├── migrate.ts         # SQL migration executor
│   │   └── seed/              # Pre-seeded articles & multimodal derivatives
│   ├── repositories/
│   │   ├── articleRepository.ts       # Article queries with dual-store resolution
│   │   ├── countryRepository.ts       # Geographic tag & story-map queries
│   │   └── visualizationRepository.ts # Approved charts & timeline specifications
│   ├── routes/
│   │   ├── articles.ts        # Article CRUD, import, analysis, visualization embed
│   │   ├── auth.ts            # Editor authentication & session inspection
│   │   ├── storyMap.ts        # Story globe coverage & country stories
│   │   ├── liquidRoutes.ts    # Flattened Liquid Story Engine parent router
│   │   └── liquid/
│   │       ├── common.ts           # Shared liquid route helpers
│   │       ├── contentRoutes.ts    # Article querying, audio & image proxying
│   │       ├── generationRoutes.ts # AI multimodal derivation generation
│   │       └── publicationRoutes.ts# Published derivative storage
│   ├── services/
│   │   ├── articleParser.ts   # NZZ JSON and Markdown parser
│   │   ├── articleService.ts  # Ingestion & storage coordinator
│   │   ├── visualizationService.ts # Gemini chart & timeline detector
│   │   ├── existingVisualService.ts# Q-Tool visual asset loader
│   │   ├── countryClassifier.ts    # Rule-based geographical entity extractor
│   │   ├── ai/
│   │   │   ├── liquidEngine.ts        # Multimodal derivatives generator
│   │   │   ├── liquidPromptBuilder.ts # Contextual prompt synthesis
│   │   │   ├── liquidSchemas.ts       # Zod schemas for all 6 liquid formats
│   │   │   ├── nzzStyleLinter.ts      # Swiss editorial voice validator
│   │   │   ├── imagenService.ts       # Photorealistic prompt & Flux image generator
│   │   │   └── cacheService.ts        # Cost-saving generation cache
│   │   └── gcp/
│   │       ├── authService.ts # ADC token resolution
│   │       └── ttsService.ts  # Google Cloud Text-to-Speech & SSML builder
│   └── types/
│       ├── article.ts         # Article domain types
│       ├── visualization.ts   # Chart & timeline opportunity types
│       ├── country.ts         # Story map & geographic types
│       └── liquid.ts          # Derivative format types
```

---

## 2. API Design & Response Contracts

All endpoints return a standardized JSON envelope:

### Success Envelopes
Always use `sendSuccess(res, data, status = 200)`:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Envelopes
Always use `sendError(res, status, code, message, details?)`:
```json
{
  "success": false,
  "error": {
    "code": "ARTICLE_NOT_FOUND",
    "message": "Article not found",
    "details": ["Optional array of granular validation issues"]
  }
}
```

### Async Handlers
All asynchronous route handlers must be wrapped in `asyncHandler(async (req, res) => { ... })` from `src/http.ts` to ensure unhandled promise rejections are forwarded to the global Express error middleware.

---

## 3. Persistence: The Dual-Store Pattern

The backend supports two persistence tiers simultaneously:
1. **PostgreSQL** is the primary, authoritative database when `DATABASE_URL` is set.
2. **`JsonDatabase` (`src/db/database.ts`)** is the fallback persistent store for offline development, automated tests, and local demos.

### Guidelines for Repositories
- Query PostgreSQL first via `query(...)`.
- If PostgreSQL is unavailable or throws a connection error, gracefully fall back to `db` (`JsonDatabase`) without crashing the HTTP request.
- Convert `snake_case` database columns (`published_at`, `teaser_image`, `publication_status`) to `camelCase` domain properties (`publishedAt`, `teaserImage`, `publicationStatus`).
- Support both pre-structured `ArticleBodyElement[]` arrays and raw string markdown bodies when hydrating articles.

### Atomic File Writes
When mutating JSON state in `JsonDatabase`:
- Never write directly to `articles.json` or `derivatives.json`.
- Write to a `.tmp` file first and execute an atomic `fs.renameSync` to eliminate race conditions and partial file corruption during concurrent reads.

---

## 4. AI & Multimodal LLM Pipelines

### Model Invocations
- **Fast / Classification tasks**: `gemini-2.5-flash` for low-latency categorization, quick summarization, and tag generation.
- **Deep reasoning / Generation**: `gemini-2.5-pro` with thinking budget (e.g., 2048 tokens) for multi-perspective dialectics, carousel storyboards, and editorial fact synthesis.
- Always use `responseMimeType: "application/json"` with structured OpenAPI / JSON schemas.

### Schema Validation & Second-Pass Repair
- Enforce strict validation using Zod schemas (`liquidSchemas.ts`, `visualizationService.ts`).
- Clean markdown code fences (````json ... ````) and remove trailing commas before parsing.
- Provide deterministic fallback templates when mock mode (`demoMode: true` or `mock: true`) is requested or when offline.

### Strict NZZ Swiss Editorial Voice
- Require Swiss typography: guillemets `« ... »` instead of English curly quotes `" ... "`.
- Headlines must never end with terminal periods.
- Subheads must avoid finite conjugated verbs where possible.
- Filter out sensationalist or clickbait terminology via `nzzStyleLinter.ts`.

---

## 5. Security & Authentication

### HMAC-SHA256 Session Tokens
- Tokens follow `{payload}.{signature}` using URL-safe Base64 encoding.
- Always verify token signatures and passwords using `crypto.timingSafeEqual` to prevent timing attacks.
- Enforce a high-entropy `AUTH_SECRET` in production via `src/config/env.ts`.

### Authorization Guards
- Protect all write and AI generation endpoints with `requireEditor` middleware.
- Never expose unpublished `draft` articles to unauthorized viewers.
- Sanitize HTML embeds using `escapeHtml` and payload string replacement (`.replace(/</g, "\\u003c")`) to protect against XSS.

---

## 6. Testing & Quality Assurance

Run the test suite with Node's native test runner:
```bash
npm --prefix server run test
```
Compile and verify TypeScript types:
```bash
npm --prefix server run build
```
Verify that all 43 tests pass and TypeScript emits zero errors.
