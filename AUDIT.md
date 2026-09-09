# Post-Merge Audit — NZZ Platform (Visual Velocity + Liquid Story Engine)

## Context

The two hackathon halves were merged on `implementation-1` (`1824d10` → `84ae602`). The server compiles and 43 tests pass, which is why the damage isn't obvious: the tests only exercise the template path, and every broken route degrades quietly rather than crashing.

I audited the merged tree, then attacked the running server (`PORT=5099 tsx src/index.ts`) to see what actually breaks. Findings are marked:

- **VERIFIED** — reproduced against the running server; the command and response are shown.
- **CODE** — read from source with the failure path traced, not executed (mostly because executing it would have written to your database).

**Plan:** write this document to `AUDIT.md` in the repo root, then apply the P0 fixes in the order given at the end.

---

## The short version

Six things break the demo. Everything else is secondary.

1. **The merged app cannot render a single chart.** Both chart paths are dead — the Visual Velocity API rejects its own article ids, and the Liquid prompt never asks for chart data.
2. **Clicking any article in the Visual Velocity feed returns HTTP 400.** The list endpoint hands out ids the detail endpoint refuses.
3. **`npm run build` fails on the client** over one unused import.
4. **Anyone can forge an editor session** — I did it — because `AUTH_SECRET` is unset and the code falls back to a hardcoded string.
5. **`/api/liquid/proxy-image` will fetch any URL you give it**, including internal ones. I proved it against `localhost`.
6. **`npm start` runs the pre-merge server.** `dist/` is stale CommonJS with no `app.js` and no `routes/articles.js`.
7. **The two halves agree on article ids only because Postgres is down.** Connecting the database — the fix for the story globe — will break the Multimodal Studio on every article. Fix C1 *before* you set `DATABASE_URL`.

---

## Severity table

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | Neither chart path works — the merge is wired at the type level only | P0 | VERIFIED |
| 2 | `/api/articles/:id` rejects the ids `/api/articles` returns (34 of 39) | P0 | VERIFIED |
| 3 | Client production build fails | P0 | VERIFIED |
| 4 | Forgeable editor sessions (default `AUTH_SECRET`) | P0 | VERIFIED — exploit run |
| 5 | Open image proxy = SSRF | P0 | VERIFIED — exploit run |
| 6 | Liquid article CRUD is unauthenticated | P0 | CODE |
| 7 | Stored XSS in the visualization embed page | P0 | CODE |
| 8 | `npm start` serves the stale pre-merge build | P0 | VERIFIED |
| 9 | Chart analysis always 503s — wrong env var name | P1 | VERIFIED |
| 10 | Default Gemini model `gemini-3.8-flash` does not exist | P1 | VERIFIED |
| 11 | Story globe + visualization save/load 500 without Postgres | P1 | VERIFIED |
| 12 | Postgres port mismatch: compose 5434, client 5432 | P1 | VERIFIED |
| 13 | Universal `editor123` password for DB accounts | P1 | CODE |
| 14 | Live AI output still gets keyword-matched stock photos | P1 | CODE |
| 15 | `server/.env` predates the merge — 7 keys missing | P1 | VERIFIED |
| 16 | Import writes the article, then 500s, then duplicates on retry | P1 | CODE |
| 17 | `q_data` visuals can never match any seeded article | P1 | VERIFIED |
| 18 | Runtime DB state committed to git | P1 | VERIFIED |
| 19 | Six bare `catch {}` blocks hide real database errors | P2 | CODE |
| 20 | Malformed JSON returns 500 not 400 | P2 | VERIFIED |
| 21 | Mass assignment + id desync in `updateArticle` | P2 | CODE |
| 22 | No pg pool error handler → process crash | P2 | CODE |
| 23 | No timeouts on either AI call; 8192-token output cap | P2 | CODE |
| 24 | Prompt injection reachable via article upload | P2 | CODE |
| 25 | One bad element id discards the whole chart analysis | P2 | CODE |
| 26 | Thousands-separator commas corrupt numbers by 1000× | P2 | CODE |
| 27 | `q_data` served publicly with no auth | P2 | CODE |
| 28 | Id normalisation collisions in the JSON store | P2 | CODE |
| 29 | `backfillCountries` script aborts on unhandled rejection | P2 | CODE |
| 30 | JSON store: sync whole-file writes, no locking, no error handling | P2 | CODE |
| C1 | Article ids agree only by accident — connecting Postgres breaks the Studio | P0 | VERIFIED |
| C2 | 18 dead component files (38%); no Publish button exists at all | P1 | CODE |
| C3 | Carousel bar widths come from the array index, not the data | P1 | CODE |
| C4 | UI can badge template output as "Live Vertex AI" | P1 | CODE |
| C5 | Editor actions fail silently; articles can load forever | P1 | CODE |
| C6 | ZIP export can hang forever or ship blank slides | P1 | CODE |
| C7 | Assorted client defects (see section) | P2 | CODE |
| C8 | Master password printed on screen | P1 | CODE |

---

# P0 — fix before anything else

## 1. Neither chart path works · VERIFIED

Charts are the reason the two projects were merged, and the merged product currently cannot produce one. There are two paths and both are dead.

**Path A — Visual Velocity's own pipeline is unreachable.** All eight article sub-routes gate on `uuidPattern` (`server/src/routes/articles.ts:14`, used at lines 24, 51, 70, 79, 94, 108, 116, 127, 148), and the list endpoint hands out non-UUID import keys. So `POST /:id/visualizations/analyze`, `GET /:id/visualizations`, `/history`, `/embed` and `/existing-visualizations` all return 400 for every article that exists. See finding 2.

**Path B — the Liquid engine never asks for charts.**

```
$ grep -c "visualVelocity" server/src/services/ai/liquidPromptBuilder.ts
0
```

`liquidSchemas.ts:219-224` defines `visualVelocitySchema` with a proper numeric `charts` array; `liquidEngine.ts:97-99` defaults it to `{ charts: [] }`; `client/src/components/liquid/DraftStudio.tsx:505,678` renders the tab only when `charts?.length > 0`. The prompt never mentions it, so the model never returns it, so the array is always empty and the tab is always blank. The contract exists in the types and the UI; nothing fills it.

Worse, the prompt *does* ask for a different, decorative `chartData` object nested in carousel slide 2 (`liquidPromptBuilder.ts:68, 236-244`) whose values are strings like `"18.5°C"` — not the numeric `series`/`points` shape `chartConfigSchema` expects. Two incompatible chart concepts now live in one payload.

**Fix, in order:**
1. Remove the UUID guard (finding 2) — that alone revives Path A.
2. Add a `visualVelocity` block to `buildLiquidPrompt` asking for the exact `chartConfigSchema` shape: `chartType`, `series[].points[]` with numeric `y`, and a `sourceSentence` quoting the article verbatim so an editor can verify the number.
3. Decide which path owns charts. Recommended: Path B produces charts in the same Gemini call as the derivatives; keep Path A's `visualizationService` for the import/approve workflow. Rename the slide-level `chartData` so it is clearly a decorative bar, not data.

## 2. `/api/articles/:id` rejects the ids `/api/articles` returns · VERIFIED

```
$ curl -s localhost:5099/api/articles | jq -r '.data[0].id'
2026-08-22_wissenschaft_when-crude-oil-enters-sea-off-oman_ld10019954

$ curl -s -o /dev/null -w "%{http_code}\n" \
  "localhost:5099/api/articles/2026-08-22_wissenschaft_when-crude-oil-enters-sea-off-oman_ld10019954"
400   {"code":"INVALID_ARTICLE_ID","message":"Article ID must be a valid UUID"}
```

Same 400 on `/visualizations`, `/existing-visualizations`, `/history`, `/embed`, `/publish`, `/analyze` and `DELETE`. **34 of the 39 articles have non-UUID ids**, so the feed renders and nothing opens.

Root cause: the guard was written when articles lived in Postgres with UUID primary keys. With `DATABASE_URL` unset, `listArticles()` falls through to the JSON store (`articleRepository.ts:136-142`) and `mapJsonToSummary:62` sets `id: a.id` — the filename stem assigned by `db/database.ts:126`. The guard is not an injection defence; every query below it is parameterised.

**Fix:** relax `uuidPattern` at `routes/articles.ts:14` to `/^[\w.:-]{1,200}$/`. `getArticle()` already handles both id shapes. Ship this together with finding 7 — see the warning there.

## 3. The client production build fails · VERIFIED

```
$ cd client && npx tsc -b
src/components/DummyAccountsModal.tsx(2,25): error TS6133: 'UserCheck' is declared but its value is never read.
```

`build` is `tsc -b && vite build` with `noUnusedLocals` on, so one unused import fails the production build. `npm run dev` still works, which is why nobody noticed.

**Fix:** remove `UserCheck` from the import at `client/src/components/DummyAccountsModal.tsx:2`, and put `npm --prefix client run build` in the pre-demo checklist.

## 4. Editor sessions can be forged · VERIFIED (exploit executed)

`server/src/auth.ts:16`: `process.env.AUTH_SECRET || 'visual-velocity-local-dev-secret'` — and `AUTH_SECRET` is not in `server/.env`. Anyone who reads this repo can mint a valid editor token.

```
$ node -e "…HMAC-SHA256 over a self-made payload with the hardcoded default secret…"   # no login
$ curl -s localhost:5099/api/articles | jq '.data|length'                              # 29 (public)
$ curl -s -H "Authorization: Bearer $FORGED" localhost:5099/api/articles | jq '.data|length'
39   # drafts included — the forged token is accepted
```

That token satisfies `requireEditor`, so it also unlocks `POST /articles/import`, `POST /:id/publish`, `PUT /:id/visualizations` and `DELETE /:id`.

**Fix:** throw at boot when `AUTH_SECRET` is unset outside development; set a real secret in the deployed environment; compare signatures with `crypto.timingSafeEqual` (`auth.ts:99` and `:113` use `!==`).

## 5. `/api/liquid/proxy-image` is an open SSRF relay · VERIFIED (exploit executed)

`server/src/routes/liquidRoutes.ts:382-401` fetches any URL a caller supplies and returns the body verbatim:

```
$ curl -s "localhost:5099/api/liquid/proxy-image?url=http://localhost:5099/api/health"
{"status":"healthy","timestamp":"…","service":"nzz-pulse-server"}
```

Deployed on Cloud Run or GCE this makes the public app a probe for anything the container can reach. The GCE metadata token path needs a `Metadata-Flavor: Google` header the proxy doesn't forward, so credential theft isn't one hop away; internal service access and port scanning are.

**Fix:** allowlist the hosts you actually load from, reject URLs resolving to private/loopback/link-local addresses, require `http(s):`, cap the response size, add a timeout.

## 6. Liquid article CRUD is unauthenticated · CODE

`liquidRouter.post('/articles')` (`liquidRoutes.ts:126`), `put('/articles/:id')` (`:153`) and `delete('/articles/:id')` (`:167`) have no guard, while the equivalent Visual Velocity routes require an editor token. An unauthenticated request can rewrite or delete any of the 39 seeded NZZ articles.

**Fix:** add `requireEditor` to all three, matching `routes/articles.ts`.

## 7. Stored XSS in the visualization embed page · CODE

`routes/articles.ts:115-124` builds HTML by string interpolation — `<title>${article.headline}</title>`, `<h1>${article.headline}</h1>` — with no escaping, and the inline script fills the table with `innerHTML` from `v.title`, `v.subtitle` and every series label. The `.replace(/</g,'\\u003c')` on line 120 only protects the `<script>` context, not the later `innerHTML` sink.

Chained with finding 6, an attacker posts an article whose headline is `</title><script>…</script>` and gets stored XSS on the page designed to be iframed into articles. The AI-generated chart titles reach the same sink, so finding 24 chains here too.

⚠️ **The UUID guard currently masks this** — the embed route 400s before rendering. **Fixing finding 2 activates this vulnerability.** Ship both together.

**Fix:** HTML-escape `article.headline`; build the table with `textContent`/`createElement` instead of `innerHTML`.

## 8. `npm start` serves the pre-merge server · VERIFIED

```
$ ls server/dist
data  index.js  routes  services  types      # no app.js, no routes/articles.js
$ head -c 30 server/dist/index.js
"use strict";                               # CommonJS — the merged source is ESM
```

`dist/` predates the merge: it mounts only `/api/liquid` and `/api/health`. Anyone running `npm start` instead of `npm run dev` gets 404s on every Visual Velocity endpoint, and it looks like a routing bug.

**Fix:** delete `dist/`, add it to `.gitignore`, and make `start` depend on `build`.

---

# P1 — will be visible during the demo

## 9. Chart analysis always returns 503 — wrong environment variable · VERIFIED

`server/src/services/visualizationService.ts:146` reads `process.env.GOOGLE_CLOUD_PROJECT`, throwing `AI_NOT_CONFIGURED` when it's missing (line 149) → `app.ts:46` → **503 on every call to `POST /api/articles/:id/visualizations/analyze`**. But `server/.env` only defines `GCP_PROJECT_ID` (the name the Liquid half's `authService.ts` uses). The two halves read different variable names for the same value.

**Fix:** `const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;` and the same for location (line 147).

## 10. The default Gemini model does not exist · VERIFIED

`visualizationService.ts:237`: `process.env.GEMINI_MODEL || 'gemini-3.8-flash'`. `GEMINI_MODEL` is unset, so once finding 9 is fixed this default is what runs — and Vertex returns 404, wrapped as `AI_REQUEST_FAILED` → 502. `.env.example` correctly says `gemini-2.5-flash`.

**Fix:** change the default to `gemini-2.5-flash`.

## 11. Story globe and visualization save/load 500 without Postgres · VERIFIED

```
$ curl -s -o /dev/null -w "%{http_code}\n" localhost:5099/api/story-map/countries
500
# log: Error: connect ECONNREFUSED 127.0.0.1:5432
#   at listCountryCoverage (src/repositories/countryRepository.ts:16)
```

`countryRepository.ts` (all four functions) and `visualizationRepository.ts` (all three) are Postgres-only with no JSON fallback, unlike `articleRepository`. Dead endpoints right now: all three `/api/story-map/*`, plus `GET/PUT /api/articles/:id/visualizations`, `/history` and `/embed`.

**Fix:** give both repositories the same try/catch-to-JSON fallback `articleRepository` has, or gate them behind a config check returning a clear 503 instead of a generic `INTERNAL_ERROR`. For the HTML embed route, return HTML on failure — right now an `<iframe>` renders a raw JSON error body.

## 12. Postgres port mismatch · VERIFIED

`docker-compose.yml` publishes Postgres on host port **5434**. With `DATABASE_URL` unset, `pg` falls back to libpq defaults — `localhost:5432`, user and database named after the OS user. So `npm run db:up` followed by a restart still fails, and the error message is empty because `pg` reports `ECONNREFUSED` with a blank `message`.

**Fix:** put `DATABASE_URL=postgres://visual_velocity:visual_velocity@localhost:5434/visual_velocity` in `server/.env`, then `npm run db:migrate`. Also add `connectionTimeoutMillis: 3000` to the pool (`config/database.ts:10`) — the default is *wait forever*, so pointing `DATABASE_URL` at a firewalled host at demo time hangs requests with no response.

## 13. `editor123` unlocks any database account · CODE

`auth.ts:78` and `:88`: `(e.passwordHash === passwordHash || password === 'editor123')`. The literal is accepted for both the built-in profiles and the Postgres `editor_users` table, so every real account will share one universal password. Latent today because Postgres is offline; it activates the moment the DB connects.

**Fix:** delete both `|| password === 'editor123'` clauses. Keep the demo accounts with that string as their actual hash if you want the convenience.

## 14. Live AI output still gets keyword-matched stock photos · CODE

`liquidEngine.ts:463` calls `getContextualTopicImagery(article)` inside `normalizeLiquidJson`, which runs on the **live Vertex path**, not just the template path. Line 489: `imageUrl: hasImage ? (s.imageUrl || imagery.slideImages[idx] || imagery.coverUrl) : undefined`. The model never returns `imageUrl`, so every slide falls back to one of the **77 hardcoded Unsplash URLs** in that file, chosen by substring match on the headline. This is the same failure that put bread rolls on the European-defence carousel; the lookup table just got bigger.

Imagen *is* genuinely wired now (`CarouselPreview.tsx:83,124` → `/generate-image`, `/generate-deck-images`), but only on an explicit click; the default render is stock.

**Fix:** stop injecting `imageUrl` in `normalizeLiquidJson`. Leave it undefined, let the carousel call the deck-image endpoint on mount, show a per-slide loading state, and show an honest error if Imagen fails.

## 15. `server/.env` predates the merge · VERIFIED

Present: `GOOGLE_APPLICATION_CREDENTIALS`, `GCP_PROJECT_ID`, `GCP_LOCATION`, `ENABLE_CACHE`, `PORT`.
Documented in `.env.example` but **missing**: `DATABASE_URL`, `AUTH_SECRET`, `Q_DATA_DIR`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GEMINI_MODEL`, `GEMINI_API_KEY`.

This one file is the root cause of findings 4, 9, 11 and 12. Good news from the same check: ADC works — `GET /api/liquid/config-status` returns `{"configured":true,"type":"adc","projectId":"nzz-sbx-hckthn07"}`.

**Fix:** copy the missing keys in, and have `app.ts` log a startup banner naming every unset key.

## 16. Import persists, then 500s, then duplicates on retry · CODE

`services/articleService.ts:19-22`: `insertArticle` succeeds via the JSON fallback, then `replaceArticleCountries` (line 21) throws because `countryRepository` has no fallback. The user sees `500 INTERNAL_ERROR` and re-uploads — but the article was already saved, and the JSON fallback assigns a fresh `randomUUID` (`articleRepository.ts:172`) without checking `importKey`, so the `ON CONFLICT DO NOTHING` dedup is lost. **Every retry adds another duplicate.**

**Fix:** wrap line 21 in try/catch with a warning, and make the JSON fallback look up by import key before inserting.

## 17. `q_data` visuals can never match a seeded article · VERIFIED

`existingVisualService.ts:19-22` derives a directory name by stripping non-alphanumerics from `nzzId`, which `mapJsonToRecord:83` sets to the full slug — producing `20240917wissenschaftrussianscientistld1844050`, which will never match a directory named `ld1844050`. And independently: the 20 `q_data` directories have **zero id overlap** with the 39 seeded articles, because seeding reads `LiquidStoryEngine/input/articles` while `q_data` belongs to `VisualVelocity/input/articles`.

Consequence: `/existing-visualizations` returns `[]` for every article, and the AI prompt's "EXISTING VISUALS" block is always `- None`, so the model's de-duplication rule is dead code.

**Fix:** extract the trailing `ld\d+` token in `articleDirectory`, and seed from `VisualVelocity/input/articles` (or both corpora) so ids line up.

## 18. Runtime database state is committed to git · VERIFIED

`server/data/db/articles.json` and `derivatives.json` are tracked and rewritten on every save. `git status` is dirty after every demo, and two teammates running the app produce conflicting 39-article blobs — which is exactly the kind of churn that corrupts a working tree mid-demo.

**Fix:** `git rm --cached server/data/db/*.json`, add `server/data/db/` to `.gitignore`, keep a `seed/` copy if the corpus must be in the repo.

---

# P2 — correctness, robustness, hygiene

**19. Six bare `catch {}` blocks hide real database errors** — `articleRepository.ts:135, 149, 164, 201, 230, 243`. They catch not just "DB unavailable" but genuine bugs (invalid UUID syntax, FK violations, typo'd columns), silently diverting writes to the JSON store. *Fix: inspect `error.code`; fall back only on connection-class errors, rethrow the rest.*

**20. Malformed JSON returns 500** — `curl -X POST …/api/auth/login -d '{"username":'` → 500. `express.json()` throws a `SyntaxError` that `app.ts:36` doesn't special-case. *Fix: add an `error instanceof SyntaxError && 'body' in error` branch returning 400.*

**21. Mass assignment and id desync** — `liquidRoutes.ts:155` passes `req.body` straight into `db.updateArticle`, which spreads it over the record (`db/database.ts:257`). A caller can overwrite `id`, `createdAt` or `wordCount`; changing `id` desyncs the record from its map key, so the article becomes unreachable and persists corrupted. *Fix: whitelist updatable fields; force `id` back to `existing.id`.*

**22. No pg pool error handler** — no `pool.on('error')` and no `process.on('unhandledRejection'|'uncaughtException')` anywhere in `src/`. An error on an idle pg client emits an unhandled `'error'` event, which **kills the Node process** — a mid-demo death from a docker restart or a laptop sleep. *Fix: add all three handlers.*

**23. No timeouts on either AI call** — `liquidEngine.ts:61-76` has `maxOutputTokens: 8192` for a prompt requesting all six formats and no `AbortSignal`; a long article truncates the JSON → 500. `visualizationService.ts:240-248` has no `abortSignal`, no `maxOutputTokens`, and `thinkingLevel: MEDIUM`, so one request can hold an Express connection for 60–120 s. *Fix: raise the Liquid cap to 16k–32k, add `AbortSignal.timeout(45_000–90_000)` to both, split Liquid generation per format.*

**24. Prompt injection reachable via article upload** — `visualizationService.ts:158` filters with a regex denylist clearly written to strip one specific newsletter widget, and line 201 concatenates article text straight after the instructions with no delimiter. An uploaded `.md` containing "ignore prior instructions…" steers the model. It can't fabricate element ids (blocked at 225-228) but it controls every free-text field — which then reaches the `innerHTML` sink in finding 7. *Fix: pass the article as a separate `contents` part inside `<article_untrusted>` delimiters with a "data, never instructions" system instruction.*

**25. One bad element id discards the whole analysis** — the `throw` at `visualizationService.ts:226-228` sits inside `.map()`, so a single hallucinated reference in opportunity #4 also discards #1–#3. The strict `series.key` regex `/^[a-z][a-z0-9_]*$/` (line 9) rejects a model returning `"Rent"` or `"gdp-growth"`, producing `502 AI_RESPONSE_INVALID` and a blank screen when three charts were fine. *Fix: `.flatMap`, drop invalid opportunities individually, return survivors plus a `warnings` array.*

**26. Thousands separators corrupt numbers by 1000×** — `existingVisualService.ts:37` does `.replace(',', '.')` (single, non-global), turning `"1,234"` into `1.234`; `"1,234,567"` fails the regex entirely and discards the whole series (line 72). Wrong numbers rendered with no error. *Fix: strip `,` when followed by exactly three digits before the decimal replacement.* Related: line 61's `if (table.length < 3)` silently discards any legitimate two-row chart.

**27. `q_data` is served publicly with no auth** — `app.ts:17` mounts the whole tree at `/api/visual-assets`. Licensed NZZ chart data, CSVs and images are readable by anyone who can reach the port. *Fix: put it behind `requireEditor`, or restrict to image extensions.*

**28. Id normalisation collides** — `db/database.ts:203-209` and `:290-296` fall back to matching with all non-alphanumerics stripped, so `art-123` and `art123` resolve to the same record; a delete can hit the wrong article. *Fix: exact match only.*

**29. `backfillCountries` aborts on an unhandled rejection** — `scripts/backfillCountries.ts:7-15` has top-level `await` with no try/catch; the first `replaceArticleCountries` throws, the process aborts, and `pool.end()` on line 15 never runs. *Fix: try/catch per article, top-level `.catch`, `pool.end()` in a `finally`.*

**30. JSON store write hygiene** — `db/database.ts:154-169` rewrites the entire 619 KB `articles.json` synchronously on the event loop, with no error handling and no locking, so `ENOSPC`/`EACCES` throws out of `saveArticle` and two concurrent writers lose an update. The tmp-file + rename keeps the file from corrupting. Also: `init()` runs in a module-level singleton constructor (line 323), so an unwritable data dir crashes the server at import time; and a corrupt `articles.json` is logged, ignored, re-seeded, and then **overwritten** on the first save, destroying whatever was recoverable (line 70-72). *Fix: try/catch both persist methods, serialise writes behind a promise queue, and rename a corrupt file to `.corrupt-<ts>` instead of overwriting it.*

**Also worth a line each:** `cors()` is unrestricted (`app.ts:14`); `?draft=true&draft=true` publishes an article the user asked to keep as a draft (`articles.ts:44`); the `'u.s.'` alias in `countryClassifier.ts:6` can never match because of a trailing `\b` after a literal `.`; `countryClassifier` compiles ~600 regexes per import on the request path; `articleParser.test.ts:14` hard-asserts exactly 20 files and will fail the suite the moment anyone adds an article; migration `006_add_publication_status.sql:2` is the only non-idempotent `ADD CONSTRAINT` and will abort a re-run; a stray empty `server/server/data/` directory exists on disk from a cwd-resolution bug (`db/database.ts:41-47`, `test/database.test.ts:8`).

**Two things that are genuinely fine:** every repository query is properly parameterised — no SQL injection anywhere. And path traversal on `q_data` isn't exploitable, though only because `existingVisualService.ts:21` strips non-alphanumerics before joining.

## 18b. The two halves talk to the server over two different transports · VERIFIED

`client/src/services/api.ts:21` uses a relative `API_BASE = '/api'`, so the Visual Velocity half goes through the Vite proxy (`vite.config.ts` → `http://127.0.0.1:5001`). `client/src/services/liquidApi.ts:7-10` hardcodes `http://localhost:5001/api/liquid` whenever the hostname is localhost, bypassing the proxy entirely.

Consequences: the Liquid half makes cross-origin requests that only work because `cors()` is unrestricted — tightening CORS (P2) breaks it; and changing `PORT` breaks the Liquid half while the Visual Velocity half keeps working, which is a confusing failure to debug live.

**Fix:** delete the hostname branch in `liquidApi.ts` and use `/api/liquid` relative, like `api.ts`. One transport, proxy-managed.

---

# Client

## C1. The two halves agree on article ids only by accident — connecting Postgres breaks the Studio · VERIFIED

This is a trap, and it is worth understanding before you fix anything else.

`ArticleDetailPage.tsx:215` passes `articleId={article.id}` into `<ArticleStudio>`, which fetches `GET /api/liquid/articles/:id` from the **JSON store**, whose keys are slugs like `2026-08-22_wissenschaft_…_ld10019954`. Meanwhile `article.id` comes from `/api/articles`, which is backed by **Postgres**, whose `articles.id` is a `uuid` primary key (`db/migrations/001_create_articles.sql:4`).

Right now that mismatch is invisible, because Postgres is down and `/api/articles` silently falls back to the same JSON store:

```
$ curl -s -o /dev/null -w "%{http_code}\n" \
  "localhost:5099/api/liquid/articles/2026-08-22_wissenschaft_when-crude-oil-enters-sea-off-oman_ld10019954"
200
```

**The moment you set `DATABASE_URL` — which is the fix for the story globe (findings 11 and 12) — `/api/articles` starts returning UUIDs, the Liquid lookup misses, and the Multimodal Studio renders "Article could not be found." for every article.** `liquidApi.ts:73-81` swallows the 404 and returns `null`; `ArticleStudio.tsx:122-136` renders the dead panel.

The two corpora reinforce this: `VisualVelocity/input/articles` (20 files) and `LiquidStoryEngine/input/articles` (29 files) have **zero overlap**, and the JSON store is seeded only from the latter.

**Fix:** stop re-fetching. `ArticleDetailPage` already holds the fully loaded article — pass it down as a prop and map it to `ArticleDetail` locally (`ArticleStudio.tsx:47-65`). That removes both the redundant request and the entire class of failure. If you keep the fetch, key it on `article.nzzId`, and seed the JSON store from both corpora.

## C2. Dead code is 38% of the client · CODE

19 of 37 component files are reachable from `App.tsx`. **18 are dead, roughly 2,700 lines.** The largest: `liquid/DraftStudio.tsx` (748), `liquid/ArticleComposer.tsx` (629), `liquid/ArticleFeed.tsx` (270), `reader/ReaderView.tsx` (254), `AnalyticsView.tsx` (170), plus `liquid/LiquidCockpit.tsx`, `FormatTabs`, `BudgetBar`, `FactBoxStrip`, `DialecticalAccordion`, `AccessControlNotice`, `ArticleDetailModal`, and the five old dashboard charts.

Three consequences that matter:

- **There is no way to publish a generated artifact.** `publishFormats` in `liquidApi.ts:252` has no call sites, so `POST /api/liquid/publish` is unreachable from the UI. The editor-approves-then-publishes story — the core of the pitch — has no button.
- **`dialecticalFaq` and `visualVelocity` are generated, paid for, stored, and never rendered**, because `FactBoxStrip` and `DialecticalAccordion` are dead. `factBox` survives only through an inline copy at `ArticleStudio.tsx:466-478`.
- Two live `ArticleFeed` files exist with the same name. The next person will edit the wrong one.

**Fix:** move the 18 dead files to `_archive/` in one commit so the tree is honest, and wire `publishFormats` to a Publish button.

## C3. Fabricated data rendered as NZZ journalism · CODE

`liquid/SlideCanvas1080.tsx` fills empty fields with invented editorial content, and these slides are what the ZIP export ships:

- `:394` — **bar widths are computed from the array index, not the data**: `width: ${Math.min(95, 35 + idx * 28)}%`. The `percent` field exists on the type (`types/liquid.ts:80`) and is never read. Every chart slide draws the same ascending 35/63/91% staircase regardless of the numbers printed next to it. Exported and posted, that is a fabricated data visualisation with NZZ branding on it.
- `:356-359` — fallback rows `"Baseline Average 18.5%"`, `"European Benchmark 22.4%"`, `"Current Empirical Measure 29.8%"`.
- `:465,478` — `metricHighlight?.value || '$15T'` at 150px, labelled `'ESTIMATED VALUE'`.
- `:543-620, 645-648` — invented analysis text (*"Long-term competitive advantage demands immediate institutional realignment."*).
- `:752` — `slide.quote?.speaker || 'NZZ Leitartikel'` attributes an unattributed quote to the NZZ editorial board.

**Fix:** render a visible "no data" state instead of fallbacks, and drive bar widths from `percent`. Fix `:394` first — it is the one that produces a wrong chart rather than a placeholder.

## C4. The UI can claim "Live Vertex AI" for template output · CODE

`ArticleStudio.tsx:259`: `derivatives.source === 'vertex-ai' ? '● Live Vertex AI' : (derivatives.source || 'vertex-ai')` — if the server omits `source`, the badge **prints "vertex-ai" anyway**. Line 262 defaults the model label to `gemini-2.5-flash` the same way. The badge exists specifically to tell you whether generation was real; defaulting it defeats its only purpose.

**Fix:** render "unknown source" when `source` is absent.

## C5. Editor actions fail silently; articles can load forever · CODE

- **Silent failures:** `ArticleCard.tsx:79-84` and `ArticleDetailPage.tsx:106-115` await `deleteArticle`/`publishArticle` with no try/catch, called as `void handleDelete()`. `AuthContext.tsx:26-32` never checks token expiry, and server tokens last 8h. After expiry the UI still shows editor controls; the user confirms "Delete article?", the dialog closes, and nothing happens.
- **Permanent loading state:** `App.tsx:45` derives `loading={!selectedArticle}` from absence of data rather than request state, and `ArticleDetailPage` never consumes the context's `error`. A failed open renders "Loading article…" forever — reachable via a shared link to a deleted article, or a draft opened while signed out.
- **Double fetch:** `ArticleContext.tsx:53-56` pushes history and dispatches a synthetic `popstate`, which re-triggers the effect at `App.tsx:26-31` — 2 requests per open, 4 under StrictMode.

## C6. Export can hang forever and can ship blank slides · CODE

- `utils/exportCarousel.ts:20-27` waits on `img.onload`/`onerror` with **no timeout**, and overwrites React's handlers. One image that neither loads nor errors leaves `Promise.all` pending; `CarouselPreview.tsx:182-217` clears its spinner only in `finally`, which never runs. **The Download (.ZIP) button spins forever with no cancel.**
- `html-to-image` substitutes an empty placeholder on fetch failure and only `console.warn`s, so a failed proxy fetch produces a *successful* ZIP containing slides with missing hero images.
- `exportCarousel.ts:36` `cacheBust: true` appends a timestamp that defeats the proxy's own `max-age=86400`, so every export re-downloads all 7 full-resolution images. It would also break signed URLs if you ever move to GCS.
- `exportCarousel.ts:72-80` names files by position in a *filtered* array, so a null ref silently renumbers the deck.

**Fix:** add a 5s per-image timeout, set an `imagePlaceholder`, and name files from `slide.slideNumber`.

## C7. Smaller client issues worth one line each · CODE

`CarouselPreview.tsx:94,139` mutate props directly (works only by accident of re-render timing; `onUpdateSlide` is never passed). `CarouselPreview.tsx:458` puts `crossOrigin="anonymous"` on a raw external URL, bypassing the proxy, so thumbnails go blank while the main canvas is fine. `CarouselPreview.tsx:71` calls `navigator.clipboard` without await or catch and flips to "Copied" even when it threw — which it will on `http://192.168.x.x:5173`, i.e. any phone or second-laptop demo. Seven 1080×1350 offscreen canvases mount permanently (`:230-254`), and `ArticleContext.tsx:80-89` rebuilds its value object every render, so typing in the search box re-renders all of them. `ExecutiveBriefCard.tsx:16,20` is hardcoded German on every article including English ones. `ArticleStudio.tsx:178` renders a hardcoded `2025-05-29` for every article. `GenerationProgressBar` announces "Synthesizing 6-slide narrative" while you are generating an audio brief. `StoryGlobeExplorer.tsx:118` pulls ~2MB of globe textures from unpkg at click time — a black sphere on conference wifi. `AudioBriefPlayer.tsx:58` discards the server's real `durationSeconds` and always shows `0:00 / 1:00`. `VisualizationChart.tsx:28` has 3 colours indexed without modulo, so a 4-series chart renders invisible bars. `ArticleFeed.tsx:15` spreads `article.tags` unguarded — one null and the feed unmounts to a blank page. `animate-fade-in` is used in five files and defined nowhere.

## C8. Credentials printed on screen · CODE

`DummyAccountsModal.tsx:50` pre-fills the password field with `editor123`, and `:136` renders `User: {username} · Pass: editor123` on four cards. `:15-19` puts your personal name and a first-person **"Your Account"** badge in the product UI. Combined with the server-side `|| password === 'editor123'` backdoor (finding 13), the app displays a working master password to anyone watching the screen — including the audience during a pitch.

---

# What I attacked and what happened

| Attack | Result |
|---|---|
| Login with a wrong password | Correctly rejected (401) |
| Login as an unknown user with `editor123` | Correctly rejected (401) |
| Forge a token with the hardcoded default secret | **Accepted** — full editor access, 29 → 39 articles |
| `proxy-image` → `http://localhost:5099/api/health` | **Internal response returned verbatim** |
| `proxy-image` → `169.254.169.254` metadata | Timed out (no metadata server on this Mac; would resolve on GCE) |
| `proxy-image` → `file:///etc/passwd` | Rejected — `fetch` refuses the scheme (500) |
| `proxy-image` with no `url` | Correctly rejected (400) |
| Malformed JSON body | **500 instead of 400** |
| Article detail with a real id from the list | **400 INVALID_ARTICLE_ID** |
| `/api/story-map/countries` with no Postgres | **500 ECONNREFUSED** |
| `/api/liquid/articles` listing | 200, 39 articles (10 of which the other half can't open) |

Not executed because plan mode forbids writes: unauthenticated `DELETE /api/liquid/articles/:id`, the mass-assignment id rewrite, and the concurrent-write lost-update race. All three are unambiguous from the source.

---

# Fix order

**Before anything else (about 30 minutes):**
1. Remove `UserCheck` from `DummyAccountsModal.tsx:2` → the build passes.
2. Relax `uuidPattern` in `routes/articles.ts:14` **and** escape the embed HTML in the same commit → articles open, without opening the XSS hole.
3. `GOOGLE_CLOUD_PROJECT || GCP_PROJECT_ID` in `visualizationService.ts:146-147`, and change the model default to `gemini-2.5-flash` on line 237 → chart analysis can actually run.
4. Delete `server/dist/`, add it to `.gitignore`.

**Same session (about an hour):**
5. **Fix C1 first, then** fill in `server/.env` from `.env.example` — `AUTH_SECRET`, `DATABASE_URL` on port 5434, `Q_DATA_DIR`, `GEMINI_MODEL`. Setting `DATABASE_URL` before C1 breaks the Multimodal Studio.
6. Add `requireEditor` to the three mutating liquid routes; delete the `|| password === 'editor123'` clauses.
7. Allowlist hosts in `proxy-image`.
8. `git rm --cached server/data/db/*.json` and gitignore the directory.

**Then, for the pitch to land:**
9. Add the `visualVelocity` chart block to `buildLiquidPrompt` — this is what makes the merged product one product instead of two.
10. Stop injecting Unsplash URLs in `normalizeLiquidJson`; let Imagen fill the slides.

---

# Verification

After the P0 fixes:

1. `npm --prefix client run build` exits 0.
2. `npm --prefix server test` still passes 43/43.
3. `curl -s -o /dev/null -w "%{http_code}" localhost:5001/api/articles/<id-from-the-list-endpoint>` → **200**.
4. `POST /api/articles/<id>/visualizations/analyze` with a valid token → 200 with chart opportunities, not 503.
5. The forged-token script → 401 once `AUTH_SECRET` is set.
6. `curl "localhost:5001/api/liquid/proxy-image?url=http://localhost:5001/api/health"` → 400, not the health payload.
7. `curl -X DELETE localhost:5001/api/liquid/articles/<id>` with no token → 401.
8. An article headline of `<script>alert(1)</script>` renders as text on `/embed`, not as script.
9. With `DATABASE_URL` on port 5434 and migrations run, `/api/story-map/countries` → 200; with Postgres stopped → an empty list or a 503, not a 500.
10. Generate derivatives for a draft with numbers in it → `visualVelocity.charts` is non-empty and the charts tab renders.
11. Open any article → the Multimodal Studio loads, **with `DATABASE_URL` set**, not just without it.

---

# Deliverables

Two files, written on approval:

**1. `AUDIT.md`** (repo root) — everything above, unchanged. This is the document to share with your teammate: it names every finding with file and line, separates what I proved from what I traced, and orders the fixes.

**2. `ANTIGRAVITY_FIX_PROMPT.md`** (repo root) — a prompt in your voice, in the same shape as the one that worked last time: numbered defects with exact file:line references, the fix for each, explicit "do not add another fallback" rules, and a definition-of-done Antigravity must prove with command output rather than claims. It will cover the P0 block plus C1, C3 and C4, and it will state the C1-before-`DATABASE_URL` ordering trap explicitly, because that is the one an agent will otherwise walk straight into.

Also on approval: stop the audit server I left running on port 5099 (`PORT=5099 tsx src/index.ts`), which I started to run the attacks and could not shut down while planning.
