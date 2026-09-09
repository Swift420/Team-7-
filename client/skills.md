# Frontend Engineering Skill & Architecture Guide (Visual Velocity & Liquid Story Engine)

This document is the engineering reference for the frontend client application. It covers architecture, state management, multimodal UI components, design systems, API integration, and quality standards.

---

## 1. System Architecture

The frontend is a **React 19 + TypeScript + Vite** single-page application built for high-performance editorial publishing, interactive data visualization, and AI-assisted multimodal transformation.

```
client/src/
├── App.tsx                    # Root routing, view routing & modal management
├── main.tsx                   # Application entrypoint & React DOM mounting
├── App.css                    # Design system tokens, typography, dark/light themes
├── index.css                  # Global utility classes & reset
├── types/
│   ├── index.ts               # Core domain models (Article, Visualizations, Auth)
│   ├── liquid.ts              # 6 Liquid format schemas & generation options
│   └── country.ts             # Geographic story map & coverage types
├── context/
│   ├── AuthContext.tsx        # Role-based auth (viewer vs editor) & account switching
│   ├── AuthContextValue.ts    # Typed auth context interface
│   ├── ArticleContext.tsx     # Global article state, filtering & publishing
│   └── ArticleContextValue.ts # Typed article context interface
├── hooks/
│   ├── useAuth.ts             # Hook for accessing user role & authentication actions
│   ├── useArticles.ts         # Hook for accessing article feeds, filters & active selection
│   └── useArticleRoute.ts     # URL hash & query-parameter routing synchronization
├── services/
│   ├── httpClient.ts          # Centralized fetch wrapper (token injection & error envelope)
│   ├── api.ts                 # Articles, metrics & visualization approvals API
│   └── liquidApi.ts           # Multimodal AI generation, audio synthesis & style linting
├── components/
│   ├── Navbar.tsx             # Sticky header with search, role switcher & "+ Create Article"
│   ├── RoleContextBanner.tsx  # Sticky notification indicating current viewer/editor privileges
│   ├── ArticleFeed.tsx        # Responsive grid of editorial article cards
│   ├── ArticleCard.tsx        # Article teaser card with photojournalism image & read time
│   ├── ArticleContent.tsx     # Full article reader with inline charts & existing visuals
│   ├── ArticleDetailModal.tsx # Fullscreen modal for deep article reading
│   ├── ArticleDetailPage.tsx  # Dedicated standalone article page view
│   ├── CreateArticleModal.tsx # Editor modal for writing & publishing new articles
│   ├── DummyAccountsModal.tsx # 1-click test account switcher (3 editors, 2 viewers)
│   ├── StoryGlobeExplorer.tsx # Interactive 3D geographical story globe (Three.js/Mapbox)
│   ├── AnalyticsView.tsx      # Editorial analytics dashboard (traffic, categories, regional)
│   ├── VisualizationChart.tsx # Recharts renderer (Bar, Line, Area, Donut, Timeline)
│   ├── ArticleVisualizer.tsx  # AI chart workbench for previewing, tweaking & saving
│   ├── ErrorBoundary.tsx      # React error boundary catching rendering exceptions
│   ├── reader/                # Reader components for multimodal liquid formats
│   │   ├── ReaderView.tsx             # Composite view embedding all generated derivatives
│   │   ├── AudioBriefPlayer.tsx       # SSML audio brief player with scrub bar & speed toggle
│   │   ├── DialecticalAccordion.tsx   # Multi-perspective thesis/antithesis/synthesis card
│   │   ├── ExecutiveBriefCard.tsx     # 3-bullet executive summary card with key metrics
│   │   └── FactBoxStrip.tsx           # Contextual key facts and background points
│   └── liquid/                # Liquid Story Engine workbench (Editor mode)
│       ├── ArticleStudio.tsx          # Transformation workspace for generating 6 formats
│       ├── DraftStudio.tsx            # Editor review & revision cockpit
│       ├── SlideCanvas1080.tsx        # 1080x1080 high-res Instagram carousel slide renderer
│       ├── CarouselPreview.tsx        # Interactive slide carousel viewer with export
│       ├── StoryboardPreview.tsx      # Video scene-by-scene storyboard director
│       ├── FormatTabs.tsx             # Tab selector for the 6 liquid formats
│       ├── GenerationProgressBar.tsx  # Multi-phase generation progress indicator
│       └── BudgetBar.tsx              # Model latency & thinking token budget display
└── utils/
    ├── exportCarousel.ts      # HTML5 Canvas / image rasterization & ZIP exporter
    └── sectionTranslation.ts  # NZZ section translations (German/English)
```

---

## 2. State Management & Contexts

### `AuthContext` (`src/context/AuthContext.tsx`)
- Manages current user state: `user`, `role` (`'viewer'` | `'editor'`), and `token`.
- Automatically persists active session token to `localStorage.getItem('nzz_auth_token')`.
- Provides built-in 1-click switching between dummy accounts:
  - **Editors**: Sarah Jenkins, Marcus Vance, Elena Rostova, Teofilus Shaduka.
  - **Viewers**: Alex Morgan, Clara Oswald.
- Exposes `login()`, `logout()`, `switchUser()`, and `isEditor` boolean helper.

### `ArticleContext` (`src/context/ArticleContext.tsx`)
- Manages the master list of articles, current active article, active filters, and loading states.
- Filtering capabilities:
  - Language: `'ALL'` | `'en'` | `'de'`.
  - Category / Section: Dynamic categories parsed from imported articles.
  - Search Query: Real-time debounced title and content substring match.
- Action handlers: `createArticle()`, `publishArticle()`, `deleteArticle()`, `reloadArticles()`.

---

## 3. Visual Velocity: Editorial Data Journalism & Timelines

### Chart & Timeline Renderer (`VisualizationChart.tsx`)
Renders Recharts data graphics or interactive chronological timelines depending on `chartType`:
- **Bar & Stacked Bar**: Categorical comparisons and part-to-whole segmentations.
- **Line & Area**: Time-series trends and cumulative volume distributions.
- **Dot Plot**: Precise value comparisons across categories without a zero baseline.
- **Donut**: Mutually exclusive part-to-whole proportions.
- **Timeline (`chartType === 'timeline'`)**: Chronological sequence cards with date labels (e.g. `"1960s"`, `"April 2"`), milestone titles, descriptions, and clickable source paragraph jump links.

### AI Visualizer Workbench (`ArticleVisualizer.tsx`)
- Allows editors to invoke Gemini to discover visualization opportunities in the article text.
- Live Data Editor: Allows modifying data point values, labels, units, and timeline events in real time.
- Evidence Tracing: Displays referenced `sourceElementIds` or `sourceParagraphIds`. Clicking an element badge smoothly scrolls the article reader directly to that paragraph with a highlight pulse.
- One-click approval saves the chart/timeline directly into PostgreSQL via `PUT /api/articles/:id/visualizations`.

---

## 4. Liquid Story Engine: Multimodal Transformation

The Liquid Story Engine transforms long-form text into 6 audience-specific formats:
1. **Executive Brief**: Quick-read summary bullets and decision-making takeaways.
2. **Dialectical Accordion**: Thesis, antithesis, and synthesis for controversial topics.
3. **Fact Box Strip**: Essential verified background facts and definitions.
4. **Audio Brief**: Synthesized SSML spoken-word audio with pauses and Swiss phonetic pronunciation.
5. **Instagram Carousel**: High-fidelity 1080x1080 slides rendered on `SlideCanvas1080.tsx` featuring Swiss typography and authentic photojournalism imagery.
6. **Video Storyboard**: Scene-by-scene script with visual cues, camera motion, and voiceover text.

### High-Fidelity Slide Canvas (`SlideCanvas1080.tsx`)
- Renders strictly at 1:1 square aspect ratio (`1080px x 1080px` logical canvas).
- Features dynamic text scaling to prevent clipping on mobile viewports.
- Supports image zoom overlays, gradient scrims, editorial attribution badges, and pagination dots.
- Export utility (`exportCarousel.ts`) captures DOM nodes to high-resolution JPEG/PNG images for social media publishing.

---

## 5. API Client & HTTP Integration

All network requests route through `src/services/httpClient.ts`:
- Automatically injects `Authorization: Bearer <token>` from `AuthContext` on every outbound request.
- Standardizes response handling: unpacks `{ success: true, data }` payloads or throws structured `HttpError` instances containing error codes and validation details.
- Endpoints:
  - `GET /api/articles`: Retrieve list of articles.
  - `GET /api/articles/:id`: Retrieve single article with body elements.
  - `POST /api/liquid/generate`: Invoke Vertex AI Gemini for multimodal derivation.
  - `POST /api/liquid/synthesize-audio`: Generate SSML audio stream.
  - `POST /api/liquid/lint`: Run Swiss NZZ style linter on generated copy.
  - `POST /api/liquid/publish`: Persist approved derivatives to database.

---

## 6. Design System & Editorial Typography

- **Colors**:
  - Backgrounds: Dark slate `#0b0f19`, elevated cards `#111827`, borders `#1e293b`.
  - Accents: NZZ electric blue `#3b82f6` and `#60a5fa`, warm amber `#f59e0b`, emerald `#10b981`.
- **Typography**:
  - Headings: Elegant editorial serif typography matching NZZ print heritage.
  - Body & UI: High-legibility sans-serif (`Inter`, system-ui) with generous line heights (`1.65`).
  - Quotation marks: Always render Swiss guillemets `« ... »` for German copy.
- **Accessibility**:
  - All charts and slide canvas elements include descriptive `aria-label` and `role="img"` attributes.
  - Color contrast ratios strictly meet WCAG 2.1 AA standards.

---

## 7. Build & Quality Verification

Check TypeScript types and compile production bundles:
```bash
npm --prefix client run build
```
Verify:
- Clean compilation with `tsc -b && vite build`.
- No broken imports or unresolved CSS pre-transforms.
- Responsive rendering across desktop (`>1280px`), tablet (`768px-1279px`), and mobile (`<768px`).
