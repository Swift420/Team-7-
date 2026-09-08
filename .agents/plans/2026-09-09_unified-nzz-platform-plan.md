# Unified NZZ Editorial & Multimodal Platform: Implementation Plan

**Goal:** Merge Apollos David's PostgreSQL-backed visual journalism platform (`origin/main`) with Teofilus Shaduka's Liquid Story Engine (`implementation-1`) into a single, cohesive NZZ editorial workbench and interactive multimodal reader experience.

**Architecture:** A unified fullstack TypeScript platform combining Express and PostgreSQL on the backend with React (Vite) on the frontend. The system unites Gemini-driven visual discovery and editable data tables with Vertex AI multimodal generation (Instagram Carousels, 60s Video Storyboards, GCP TTS Audio Briefs, and Executive Briefs), governed by role-based access control (RBAC) and styled with David's clean editorial design language.

**Tech Stack:** React 19, TypeScript 5.7+, Express 4.21, PostgreSQL 16 (`pg`), Recharts 3.10, Lucide React, Google Cloud Vertex AI / Gemini 2.5 (`@google/genai`), Google Cloud Text-to-Speech API, Zod 4.5, Tailwind CSS / Vanilla CSS (`App.css`).

---

## 1. Executive Summary & Comparative Breakdown

```
+----------------------------------------------------------------------------------------------------+
|                                    NZZ UNIFIED CONTENT PLATFORM                                    |
+-------------------------------------------------+--------------------------------------------------+
|      APOLLOS DAVID'S BUILD (origin/main)        |     TEOFILUS SHADUKA'S BUILD (implementation-1)    |
+-------------------------------------------------+--------------------------------------------------+
| • PostgreSQL Database + Migrations (001-006)    | • Liquid Story Engine (6 Derivative Formats)     |
|   - articles, article_visualizations,           |   - Social Carousel (5-slide Instagram deck)      |
|     visualization_approval_history,             |   - 60s Video Storyboard (cue & voiceover)        |
|     article_countries, editor_users             |   - Audio Brief (Broadcast script + GCP TTS)      |
| • Auth & RBAC (HMAC bearer token, editor roles) |   - Executive Brief (60s TL;DR + Impact analysis) |
| • Clean Dark Editorial Shell (App.css, modals)  |   - Dialectical Debate (Thesis/Antithesis)        |
| • Visual Velocity (Gemini chart detection):     |   - Fact Box Strip (Verified data chips)          |
|   - Bar, Line, Area, Stacked Bar, Donut, Map    | • NZZ Voice Linter (English Style Guide auditor)   |
|   - Editable interactive data table             | • High-res 1080x1350 canvas generation & ZIP      |
|   - Inline paragraph placement                  | • Interactive 60s Storyboard Video Player          |
| • 3D Story Globe Explorer (WebGL + Arcs)        | • AudioBriefPlayer (Interactive scrub/audio)      |
+-------------------------------------------------+--------------------------------------------------+
                                        │
                                        ▼
+----------------------------------------------------------------------------------------------------+
|                                      THE MERGED EXPERIENCE                                         |
+-------------------------------------------------+--------------------------------------------------+
|                   EDITOR SIDE                   |                   READER SIDE                    |
+-------------------------------------------------+--------------------------------------------------+
| 1. Draft article / import Markdown / JSON       | 1. Feed Cards with Horizontal Carousel:          |
| 2. Run NZZ Style Linter (tone & guidelines)     |    - Swipe/scroll 5 slides on the card without   |
| 3. Run Visual Velocity (Gemini data extraction, |      opening the article!                        |
|    live data table editing & chart selection)   | 2. Prominent 60-second Executive Brief Card      |
| 4. Generate Liquid Formats (Carousel, Audio     | 3. Read Aloud / Audio Brief Mini-Player          |
|    TTS, Video Storyboard, Dialectical Debate)   | 4. Inline Editor-Approved Data Visualizations    |
| 5. Save & Publish to PostgreSQL database        | 5. 3D Global Story Explorer & Video Overlay      |
+-------------------------------------------------+--------------------------------------------------+
```

### Detailed Component Inventory:

| Layer | Apollos David's Build (`origin/main`) | Teofilus Shaduka's Build (`implementation-1`) | Unified Target Architecture |
|---|---|---|---|
| **Database** | PostgreSQL (`articles`, `article_visualizations`, `visualization_approval_history`, `article_countries`, `editor_users`) | Local JSON store (`database.ts`) / markdown files | **PostgreSQL** with migration `007_create_article_liquid_formats.sql` |
| **Authentication** | HMAC token auth (`auth.ts`), seed editor accounts, `requireEditor` middleware | Prototype auth status check (`authService.ts`) | **David's HMAC token auth & RBAC** protecting all editor routes |
| **AI Extraction** | `@google/genai` (SDK 2.21) for chart opportunity discovery (`visualizationService.ts`) | Vertex AI / Gemini 2.5 + Zod schemas for multimodal generation (`liquidEngine.ts`) | **Dual Gemini Services**: Visual discovery + Multimodal derivative synthesis |
| **Voice / Tone** | Standard editorial labels | `nzzStyleLinter.ts` (NZZ English Style Guide score & rules) | **Integrated NZZ Style Linter** in editorial studio |
| **TTS / Audio** | None | Google Cloud TTS (`ttsService.ts`) for neural audio | **GCP Cloud TTS** wired into backend `/api/liquid/tts` |
| **Feed UI** | `ArticleFeed.tsx` + `ArticleCard.tsx` + `StoryGlobeExplorer.tsx` | `ArticleFeed.tsx` (card list with tags) | **Enhanced `ArticleCard`** with horizontal carousel swipe & pagination |
| **Article View** | `ArticleDetailPage.tsx` + `ArticleContent.tsx` with inline charts | `ReaderView.tsx` with `AudioBriefPlayer`, `ExecutiveBriefCard`, `DialecticalAccordion` | **Unified `ArticleDetailPage`** containing Read Aloud player, Executive Brief, inline visualizations, and dialectical deep dive |
| **Editor UI** | `CreateArticleModal.tsx` + `ArticleVisualizer.tsx` | `LiquidCockpit.tsx` + `DraftStudio.tsx` + `CarouselPreview.tsx` | **Unified Editorial Cockpit**: Create/Edit modal with tabs for Drafting/Linting, Visual Velocity charts, and Liquid Formats |

---

## 2. Access Control & Authorization (RBAC)

### User Roles:
1. **`Editor` (Authenticated)**:
   - Credentials authenticated against `editor_users` via `/api/auth/login`.
   - Seed accounts: Sarah Jenkins (`sarah`), Marcus Vance (`marcus`), Elena Rostova (`elena`). Password: `editor123`.
   - Privileges:
     - Create, import, edit, delete articles.
     - View draft articles in feed and detail views.
     - Run Gemini Visual Velocity analysis & edit data tables.
     - Generate, update, and persist Liquid derivative formats (Carousels, Audio scripts, Video storyboards).
     - Run the NZZ Style Linter.
     - Synthesize GCP Text-to-Speech audio and generate Imagen 3 slide imagery.
     - Publish drafts to the public reader view.
2. **`Reader / Viewer` (Public / Unauthenticated)**:
   - Privileges:
     - Browse all published articles in the feed.
     - Paginate horizontally through carousels on feed cards to preview stories.
     - Open published articles, view inline charts, read the 60s Executive Brief.
     - Listen to the audio read-aloud / podcast summary.
     - Explore the 3D Story Globe.
   - Prohibited (HTTP 401/404):
     - Cannot see draft articles in feed or via direct ID URL.
     - Cannot trigger visual analysis, format generation, or TTS synthesis.
     - Cannot delete or publish content.

---

## 3. Reader Experience (UX Architecture)

### 3.1 Article Cards with Horizontal Carousel Pagination
In `client/src/components/ArticleCard.tsx`:
- Each card detects whether an approved `social_carousel` exists for the article.
- When available, the card renders a segmented dot/step indicator at the top: `[ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]`.
- Users can click/tap arrows or swipe horizontally across slides:
  - **Slide 1**: Hook & headline with category badge.
  - **Slide 2**: Context & problem statement.
  - **Slide 3**: Key data insight / chart highlight.
  - **Slide 4**: Quotation / strategic consequence.
  - **Slide 5**: Key takeaway / call to action.
- A "Read Full Article →" action remains available at all times.
- If no carousel is generated yet, the card smoothly falls back to the hero image or article lead excerpt.

```
+--------------------------------------------------------------+
| [●][○][○][○][○] Slide 1/5                WIRTSCHAFT • 3m ago |
|--------------------------------------------------------------|
|                                                              |
|   "European Defense Spending Surges Past €380 Billion"       |
|                                                              |
|   A structural breakdown reveals massive capital             |
|   reallocation towards domestic munitions & air defense.     |
|                                                              |
| [ < Prev ]                                      [ Next > ]   |
|--------------------------------------------------------------|
| Beat Gygi • Zurich                     [ Read Full Article →]|
+--------------------------------------------------------------+
```

### 3.2 Article Detail Page Layout
In `client/src/components/ArticleDetailPage.tsx` and `ArticleContent.tsx`:
1. **Top Nav**: Back button, Published Date, Language indicator, and Editor actions (Publish/Delete if editor).
2. **Hero Section**: Headline, Kicker, Lead, Author line, Hero image.
3. **Multimodal Action Bar**:
   - **Read Aloud Bar** (`AudioBriefPlayer`): Sticky or prominent audio bar: "Listen to 60s Brief (1:02 min)", Play/Pause, scrubber, and voice toggle.
   - **Video Storyboard Launcher**: Button to open interactive 60s video player modal.
   - **Carousel Gallery Launcher**: Button to view full-resolution carousel slides.
4. **60-Second Executive Summary** (`ExecutiveBriefCard`):
   - Positioned directly above the main text.
   - Three key bullet points (TL;DR), Market/Strategic Impact badge, and Risk assessment.
5. **Article Body with Native & Generated Visualizations**:
   - Structured paragraphs.
   - Preserved original Q-tool embeds (`ExistingVisual`).
   - Editor-approved Gemini visualizations (`GeneratedVisual` / `VisualizationChart`) inserted inline after specific paragraphs with data source notes and interactive tooltips.
6. **Dialectical Perspective Accordion** (`DialecticalAccordion`):
   - Pro/Con debate analysis at the conclusion of contentious policy/business stories.

---

## 4. Editor Experience (UX Architecture)

### 4.1 Unified Editorial Studio
Integrated into `CreateArticleModal.tsx` and `ArticleVisualizer.tsx`:
- When drafting or reviewing an article, editors have a unified tabbed workbench:
  - **Tab 1: Draft & NZZ Voice Linter**
    - Headline, Lead, Body, Section, Author.
    - Live word count, reading time calculator.
    - **NZZ Style Linter button**: Checks passive voice, sensationalism, Germanisms, and editorial tone against the official NZZ English Style Guide. Gives a score (0-100) and actionable line-by-line recommendations.
  - **Tab 2: Visual Velocity (Data Visualizations)**
    - Gemini scans article text for numbers, dates, comparisons, and time series.
    - Presents chart recommendations (Area, Bar, Line, Stacked Bar, Donut, Timeline).
    - Editors can edit series labels, data point values, and axis labels directly in the live table.
    - Toggle "Save Inline" to pin approved charts after chosen paragraphs.
  - **Tab 3: Liquid Formats (Multimodal Derivatives)**
    - One-click "Generate All Formats" button.
    - **Social Carousel**: Live 5-slide preview, slide copy editor, theme toggle (dark/light/warm/editorial), Imagen 3 slide illustration generation, 1080x1350 PNG/ZIP export.
    - **Audio Brief**: Broadcast script editor + one-click Google Cloud TTS synthesis with live audio preview.
    - **60s Video Storyboard**: Visual prompt, voiceover text, on-screen text, pacing cues, and interactive video playback.
    - **Executive Brief**: Edit TL;DR bullets, market impact, and strategic risks.
  - **Tab 4: Review & Publish**
    - Final publication checklist: Linter passed, visualizations saved, audio synthesized.
    - One-click "Publish Article" turning draft into public release.

---

## 5. Step-by-Step Implementation Tasks

### Phase 1: Git Integration & Database Schema

#### Task 1: Clean Branch Alignment
**Objective:** Merge `origin/main` into working branch without losing `LiquidStoryEngine` files or git history.
- Run: `git fetch origin`
- Branch: create `feat/unified-nzz-platform` from `origin/main`
- Merge: merge `implementation-1` resolving file conflicts in favor of David's clean backend/frontend structure while preserving all liquid services and components.
- Verification: `git status` clean, all `LiquidStoryEngine` files present.

#### Task 2: PostgreSQL Migration for Liquid Formats
**Objective:** Add database table for storing generated liquid formats and publication state.
- Create: `server/db/migrations/007_create_article_liquid_formats.sql`
```sql
CREATE TABLE article_liquid_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  format_type text NOT NULL CHECK (format_type IN (
    'executive_brief', 'audio_brief', 'social_carousel', 
    'storyboard_60s', 'dialectical_debate', 'fact_box_strip'
  )),
  specification jsonb NOT NULL CHECK (jsonb_typeof(specification) = 'object'),
  audio_url text,
  lint_report jsonb,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_article_format UNIQUE (article_id, format_type)
);

CREATE INDEX article_liquid_formats_article_idx ON article_liquid_formats (article_id);
```
- Test: Run migration via `npm --prefix server run db:migrate`.
- Verification: Table `article_liquid_formats` exists in PostgreSQL.

---

### Phase 2: Backend Repository & Services Unification

#### Task 3: Liquid Formats Repository
**Objective:** Build PostgreSQL data access repository for liquid formats.
- Create: `server/src/repositories/liquidRepository.ts`
  - `saveArticleFormat(articleId: string, formatType: string, spec: object, audioUrl?: string, lintReport?: object)`
  - `getArticleFormats(articleId: string, onlyPublished?: boolean)`
  - `getArticleFormat(articleId: string, formatType: string)`
  - `deleteArticleFormats(articleId: string)`
- Test: Write unit test in `server/src/repositories/liquidRepository.test.ts`.

#### Task 4: Port & Integrate Liquid AI Engine into Express App
**Objective:** Wire Gemini 2.5/Vertex AI multimodal generation, NZZ Style Linter, and GCP TTS into Express backend.
- Move/Adapt:
  - `server/src/services/ai/liquidEngine.ts`
  - `server/src/services/ai/liquidSchemas.ts`
  - `server/src/services/ai/liquidPromptBuilder.ts`
  - `server/src/services/ai/nzzStyleLinter.ts`
  - `server/src/services/gcp/ttsService.ts`
- Modify: `server/src/app.ts` to register:
  - `app.use('/api/liquid', liquidRouter);`
- Test: `curl http://localhost:5001/api/liquid/config-status` -> returns `{ configured: true/false }`.

#### Task 5: Secure Liquid Endpoints with RBAC
**Objective:** Ensure generation and editing endpoints require valid editor credentials while readers have public read access.
- Modify: `server/src/routes/liquidRoutes.ts` and `server/src/routes/articles.ts`
  - Add `requireEditor` to:
    - `POST /api/articles/:id/liquid/generate`
    - `PUT /api/articles/:id/liquid/:formatType`
    - `POST /api/liquid/generate`
    - `POST /api/liquid/tts`
    - `POST /api/liquid/lint`
  - Allow unauthenticated access to:
    - `GET /api/articles/:id/liquid` (returns published formats for readers)
- Test: Run `curl -X POST http://localhost:5001/api/liquid/generate` without Authorization header -> Expect HTTP 401 `AUTH_REQUIRED`.

---

### Phase 3: Reader Side UI & UX Implementation

#### Task 6: Horizontal Carousel Pagination on Article Cards
**Objective:** Allow readers to swipe/paginate through carousel slides directly on the feed card.
- Modify: `client/src/components/ArticleCard.tsx`
  - Fetch/receive `carousel` format data for each article.
  - If carousel data exists, render a horizontal slide view with:
    - Left/Right chevron buttons (prevent card open on click).
    - Dot pagination indicators.
    - Slide headline, kicker, and body snippet.
    - Slide counter (e.g. `2 / 5`).
  - Fallback: Standard article cover image and lead text when no carousel is available.
- Test: Render article card with test carousel; verify arrows change slide and do not trigger modal navigation.

#### Task 7: Read Aloud & Audio Brief Player in Article Detail Page
**Objective:** Give readers a one-click audio experience for published articles.
- Modify: `client/src/components/ArticleDetailPage.tsx`
  - Embed `AudioBriefPlayer` in the article header bar.
  - Display player status: duration, voice name ("NZZ AI Voice"), play/pause button, and audio waveform.
  - Automatically load audio file synthesized via `/api/liquid/tts` or stream directly.
- Test: Click Play on an article with audio; verify audio playback and progress bar movement.

#### Task 8: 60-Second Executive Summary Card
**Objective:** Embed high-impact TL;DR summary at the top of the article text.
- Modify: `client/src/components/ArticleContent.tsx`
  - Load `executive_brief` from `/api/articles/:id/liquid`.
  - Render `ExecutiveBriefCard` above the first article paragraph:
    - 3 core bullet points.
    - Strategic / Market Impact badges.
    - Risk evaluation callout.
- Test: Verify Executive Brief renders cleanly above article body.

#### Task 9: Unified Inline Data Visualizations & Fact Boxes
**Objective:** Ensure both David's approved charts and Teofilus's Fact Box strips render inline after specified paragraphs.
- Modify: `client/src/components/ArticleContent.tsx`
  - Render existing Q-tools (`ExistingVisual`).
  - Render Gemini-generated and editor-approved charts (`GeneratedVisual` using Recharts).
  - Render `FactBoxStrip` components where assigned in the article body.
- Test: Check that charts and fact boxes render at the correct paragraph offsets.

---

### Phase 4: Editor Side UI & Workflow Integration

#### Task 10: NZZ Style Linter in Article Creation / Editing
**Objective:** Empower writers to check their draft against the NZZ English Style Guide before publishing.
- Modify: `client/src/components/CreateArticleModal.tsx`
  - Add "Check NZZ Style" button in the draft creation view.
  - Display linter score badge (e.g., `88/100`) with suggestions popup:
    - Passive voice flags.
    - Sensational words detected.
    - Germanisms identified.
- Test: Enter draft with colloquial words; verify linter returns feedback suggestions.

#### Task 11: Unified Editorial Tabs inside Article Detail Page
**Objective:** Provide editors with a streamlined workbench to manage charts and liquid formats in one place.
- Modify: `client/src/components/ArticleDetailPage.tsx` and `ArticleVisualizer.tsx`
  - In Editor mode, provide workbench tabs:
    - **Visual Velocity (Charts)**: Existing Gemini chart discovery, editable table, inline chart approval.
    - **Liquid Story Engine**: 6 format cards (Carousel, Audio, Video, Executive Summary, Debate, Fact Box) with "Generate Formats" CTA.
  - Allow editor to preview, tweak, and save each format into PostgreSQL.
- Test: Switch between "Visuals" and "Liquid Formats" tabs; verify state is preserved.

#### Task 12: Integrated Publication Pipeline
**Objective:** Enable the editor to publish the article together with approved visuals and liquid derivatives in a single click.
- Modify: `client/src/context/ArticleContext.tsx`
  - Update `publishArticle(id)` to mark both article `publication_status = 'published'` and format records `is_published = true`.
- Test: Click "Publish" as Editor; switch to Viewer account; verify article, carousel on card, 60s summary, and inline charts are all visible to the public.

---

## 6. Verification and Testing Plan

| Test Scenario | Verification Command / Step | Expected Output |
|---|---|---|
| **Database Migrations** | `npm --prefix server run db:migrate` | Migrations 001 through 007 succeed |
| **Backend Test Suite** | `npm --prefix server run test` | All unit & API tests pass |
| **RBAC Security** | `curl -X POST http://localhost:5001/api/articles/123/publish` | HTTP 401 Unauthorized (`AUTH_REQUIRED`) |
| **Editor Sign-in** | `curl -X POST http://localhost:5001/api/auth/login -d '{"username":"sarah","password":"editor123"}'` | Returns JWT bearer token + editor profile |
| **Horizontal Carousel on Feed** | Open `http://localhost:3000`, locate article card | Card displays horizontal slide indicators & arrows; clicking advances slide |
| **Audio Read-Aloud** | Open article detail page, click Play in audio bar | Audio plays synthesized speech with synchronized time counter |
| **Visual Velocity Charts** | As Editor, click "Visualize Article", edit data point, save | Chart updates instantly; saved inline in reader view |
| **Frontend Production Build** | `npm --prefix client run build` | Vite TypeScript build completes with zero errors |

---

## 7. Risks and Mitigations

1. **CSS Collision between Tailwind (Liquid) and Vanilla CSS (`App.css`)**:
   - *Risk*: Teofilus's Liquid components rely on Tailwind classes, while David's app uses scoped vanilla CSS classes in `App.css`.
   - *Mitigation*: Configure Tailwind's `@tailwindcss/vite` plugin or prefix/scope Tailwind utilities so they do not override David's base root variables (`--bg-primary`, `--accent-red`, etc.). Use David's design tokens inside Liquid components.
2. **AI Quota & Offline Fallbacks**:
   - *Risk*: Vertex AI / Gemini API limits or missing credentials during local development or demo.
   - *Mitigation*: Preserve the robust fallback mechanism in both `visualizationService.ts` and `liquidEngine.ts` (deterministic editorial templates and cache service) so the app functions 100% reliably even when offline or unauthenticated.
3. **Database Concurrency & Draft Isolation**:
   - *Risk*: Draft articles or unapproved visual formats leaking into the reader feed.
   - *Mitigation*: Enforce `publication_status = 'published'` in PostgreSQL query conditions in `articleRepository.ts` and `liquidRepository.ts` unless a verified editor bearer token is present.
