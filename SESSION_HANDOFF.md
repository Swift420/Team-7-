# NZZ Liquid Story Suite — Comprehensive Session Handoff

> **Last Updated**: 2026-09-09T01:26:00+02:00  
> **Workspace**: `/Users/teofilusshaduka/nzz_hack`  
> **Repository**: `Swift420/Team-7-`  
> **Branch**: `implementation-1`  
> **Audience**: Incoming AI Agent / Developer continuing the project in a fresh conversation.

---

## 1. Project Mission & System Architecture

### The Problem
High-impact journalism at the *Neue Zürcher Zeitung* (NZZ) is predominantly trapped in static text. Adapting investigative journalism into vertical video, social carousels, audio briefs, and executive summaries is traditionally manual, slow, and prone to dilution of editorial quality.

### The Solution: The NZZ Multimodal Editorial Cockpit
An intelligent editorial engine that ingests static NZZ articles and synthesizes **6 liquid derivative formats** while rigorously enforcing the **NZZ Voice Invariant** (uncompromised intellectual rigor, liberal-conservative European perspective, zero clickbait, Swiss typographical standards):

1. **Instagram / LinkedIn Editorial Carousel** (`4:5` vertical, 1080×1350px, 7 slides) — Completely overhauled according to the official NZZ Design Brief.
2. **60-Second Vertical Video Storyboard** (`9:16` for TikTok, Instagram Reels, YouTube Shorts) — 5 structured scenes (Hook, Quantified Inflection, Core Mechanism, Strategic Friction, Editorial Verdict).
3. **Commuter Audio Brief** (60 seconds, ~120–150 words) synthesized via Google Cloud Text-to-Speech (Neural2/Journey voices) with SSML prosody, phonetic expansions, and sign-off cadence.
4. **Executive 3-Bullet Newsletter** (< 100 words total, extreme intellectual density).
5. **Key Metrics Fact Box** (Verified data points with deltas, directions, and institutional context).
6. **Dialectical FAQ** (3 structured inquiries: Consensus View, Liberal Counterargument, Structural Outlook).

---

## 2. Runtime State & Build Health

### Servers
- **Backend**: Express + TypeScript (`server`), running on `http://localhost:5001`
  - Command: `npm --prefix server run dev` (via `tsx watch src/index.ts`)
- **Frontend**: React 18 + Vite + Tailwind CSS (`client`), running on `http://localhost:5173`
  - Command: `npm --prefix client run dev`

### Build & Test Health
- `npm --prefix client run build`: **Passing (0 errors, Vite build in ~410ms)**
- `npm --prefix server test`: **Passing (36 tests in 9 suites, 0 failures, 100% pass rate)**

---

## 3. Major Features & Systems Implemented

### A. Persistent Article & Derivatives Database Layer
- **Persistent JSON Store** in `server/src/db/articleDatabase.ts`:
  - Storage files: `server/data/articles.json` and `server/data/derivatives.json`.
  - Dynamic taxonomy engine: Automatically categorizes stories and extracts dynamic tags (`getCategories()`, `getTags()`).
  - Pre-seeded with 29 real articles from the challenge dataset, plus custom articles (Porsche 911 GT3 RS review, Roland Garros / Wimbledon tennis, healthcare workforce automation, vinyl resurgence).
  - Full CRUD REST endpoints: `GET /articles`, `GET /articles/:id`, `POST /articles`, `PUT /articles/:id`, `DELETE /articles/:id`, `GET /categories`, `GET /tags`.
  - Writer UI components: `ArticleComposer.tsx`, `ArticleFeed.tsx`, `DraftStudio.tsx`, `ArticleStudio.tsx`.

### B. Complete Overhaul of NZZ Instagram Carousel Pipeline
Following the user's explicit mission directive, the entire carousel engine was overhauled across template rendering, image generation, and export:

1. **Visual Bug Fixes & Redundant UI Removal:**
   - **Deleted Floating Circular Callout Component:** Completely removed `.callout-badge`, `.zoom-circle`, and circular magnifying glass elements with red borders (`detailZoomUrl`, `detailZoomLabel`, `ZoomIn`).
   - **Stripped Baked-in Instagram Pagination Dots:** Removed all dots from the canvas to allow Instagram's native carousel dots to display without duplication.
   - **Removed Faux Footer Text:** Removed `"NZZ • Zurich"` and bottom slide numbers from the bottom 250px danger zone.
   - **Eliminated Low-Budget Card Badges:** Replaced generic UI cards and colored pill badges (e.g., green `"ADVANTAGE"`, red `"EXPOSURE"`) with pure whitespace, hairline divider rules (`1px solid ${divider}`), and standard hierarchical text.

2. **Layout, Vertical Rhythm & Safe Zones (Strict 1080×1350px):**
   - Implemented in `client/src/components/liquid/SlideCanvas1080.tsx`.
   - Strictly `1080px` × `1350px` (4:5 portrait ratio).
   - Safe zone margins:
     - **Top padding:** `160px` (clears Instagram header / account handles).
     - **Bottom padding:** `220px` (clears Instagram native dots, caption drawer, and engagement buttons).
     - **Horizontal margins:** `90px` on both left and right.
     - **Usable Content Area:** `900px` × `970px`.
   - Dynamic headline sizing: `clamp(56px, 5.5vw, 84px)`, `line-height: 1.15`, `margin-bottom: 40px` to guarantee zero collisions with body text.
   - Proportional distribution for text and data across Slides 2–6, eliminating awkward whitespace voids.

3. **Typography & NZZ Brand Strictness:**
   - Serif Headlines & Quotes: `font-nzz-serif` (Playfair Display / GT Sectra / Georgia), bold (700), line-height `1.15em`, letter-spacing `-0.5px`.
   - Sans-Serif Body & Badges: `font-nzz-sans` (Inter / Helvetica Neue). Body text: `36px`–`38px`, line-height `1.5em`, regular (400).
   - Category Badges: `24px`, bold (700), all-caps with letter-spacing `+3px`. Placed above the headline on Slide 1 or top-left on Slides 2–6.
   - Official NZZ SVG Logo:
     - **Slide 1 (Hook):** Official NZZ SVG wordmark top-left (`140px` width).
     - **Slide 7 (CTA):** Official NZZ SVG wordmark centered at `260px` width, paired with a minimal serif CTA and stroked pill button (`AUF NZZ.CH LESEN` / `READ ON NZZ.CH`).

4. **Dynamic AI Image Generation Pipeline (Porsche Leaks Fixed):**
   - **Root Cause & Fix:** In `liquidEngine.ts` and `imagenService.ts`, `text.includes('auto')` was catching words like "automation", "automated", and "author", causing vinyl and neuroscience articles to display Porsche 911 images. Replaced with strict word-boundary regex: `/\b(porsche|gt3\s*rs|sustenpass|supercar|sportwagen|rennstrecke|fahrbericht)\b/i`.
   - **Context-Driven Photo Prompts:** `generateContextualPhotographyPrompt` invokes Gemini 2.5 Flash on Vertex AI with an NZZ Photo Editor persona to create tailored 35mm documentary photography prompts based on article title, lead, and slide summary.
   - **Vinyl Records Mandate:** Explicitly mandates:
     > *"Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves, warm retro moody lighting, editorial documentary photography, 4:5 aspect ratio, analog film grain."*
   - **Cache-Busting on Demand:** Added `bustCache: true` support to `generateImagen3Image`. Regenerating images bypasses static local cache.
   - **Legibility Gradient on Cover:** Slide 1 cover photos automatically apply:
     `linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 45%, rgba(0,0,0,0.10) 100%)`.

5. **Automated Production-Ready Image Export:**
   - Built `client/src/utils/exportCarousel.ts` using `html-to-image` and `jszip` to render full 1080×1350 pixel canvases at 95% quality.
   - Pre-decodes web fonts and images before capture.
   - Added `GET /api/liquid/proxy-image?url=...` endpoint with `Access-Control-Allow-Origin: *` in `server/src/routes/liquidRoutes.ts` to prevent browser CORS tainted-canvas errors.
   - Primary UI button: **`Download Carousel (.ZIP)`** renders all 7 slides in the background, packages them into `slide_1.png` through `slide_7.png`, and downloads the archive with live progress indicators.
   - Individual PNG download icons on the preview canvas and on each slide thumbnail in the navigation strip.

---

## 4. GCP & Model Integration Status

- **Authentication**: Application Default Credentials (ADC) on the host machine.
  - Project ID: `nzz-sbx-hckthn07`
  - Location: `us-central1`
  - Handled by: `server/src/services/gcp/authService.ts`
- **Vertex AI Gemini**: Operational via ADC token (`gemini-2.5-flash`).
- **Google Cloud TTS (`texttospeech.googleapis.com`)**: Operational via ADC (`de-DE-Neural2-B` and `en-US-Journey-F`).
- **Image Generation Engine**:
  - Vertex AI Imagen 3 (`imagen-3.0-generate-002`) with fallback to Flux.1 photorealistic generation (`image.pollinations.ai/?model=flux`) delivering 1080×1350 4:5 vertical photojournalism.
  - High-res curated photojournalism archive with topic isolation (Vinyl, Neuroscience, Automotive, Tennis, Naval, Defense, Economy, AI/Security).

---

## 5. Critical Files & Locations

| Component | File Path | Responsibilities |
|---|---|---|
| **1080x1350 Canvas** | `client/src/components/liquid/SlideCanvas1080.tsx` | Strict 1080×1350 NZZ slide renderer (safe zones, typography, layouts) |
| **Carousel Visualizer** | `client/src/components/liquid/CarouselPreview.tsx` | Carousel cockpit, scaled preview, ZIP/PNG export controls, prompt regeneration |
| **Export Engine** | `client/src/utils/exportCarousel.ts` | Headless 1080×1350 PNG export and ZIP bundling via `html-to-image` & `jszip` |
| **Cockpit UI** | `client/src/components/liquid/LiquidCockpit.tsx` | Main editorial cockpit, article gallery, search/filter, model toggles |
| **Storyboard Visualizer** | `client/src/components/liquid/StoryboardPreview.tsx` | 9:16 vertical video storyboard preview (scenes, pacing, visual prompts) |
| **Database Store** | `server/src/db/articleDatabase.ts` | Persistent JSON database with dynamic taxonomy and CRUD operations |
| **Server Routes** | `server/src/routes/liquidRoutes.ts` | Express routes (`/articles`, `/generate`, `/generate-image`, `/proxy-image`, `/synthesize-audio`) |
| **Liquid Engine** | `server/src/services/ai/liquidEngine.ts` | Gemini orchestrator, NZZ editorial prompt formatting, topic imagery router |
| **Imagen Service** | `server/src/services/ai/imagenService.ts` | Contextual prompt generator, Flux/Imagen-3 caller, cache-busting logic |
| **Test Suites** | `server/test/*.test.ts` | 36 unit and integration tests across 9 test suites (all passing 100%) |

---

## 6. Recommended Next Steps for the Incoming Agent

1. **Shortform Vertical Video Rendering (Veo 2 / ffmpeg)**:
   - `socialStoryboard` produces 5 structured 9:16 scenes with visual prompts and audio scripts.
   - If the user requests automated video generation, implement an `ffmpeg` stitching pipeline combining scene visuals with Google Cloud TTS audio briefs, or connect to Vertex AI Veo 2 when enabled.
2. **Additional Editorial Themes**:
   - The theme switcher currently supports `dark`, `sand`, `lavender`, `grey`, and `white`. Add any brand-approved seasonal or section-specific palettes if requested.
3. **LinkedIn Carousel Variant**:
   - If requested, provide a 1:1 or 4:5 PDF multi-page export for native LinkedIn document carousel uploads.

---
*End of Session Handoff. All 36 server tests pass, client build succeeds with 0 errors, and all mission requirements are completely fulfilled.*
