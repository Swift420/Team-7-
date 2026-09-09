# NZZ Carousel Spec: The Billion-Euro Football Divide

> **Vertical:** Sport & Ökonomie  
> **Theme:** `sand` (`#E3C068`) with Dark Photography Slides  
> **Source Article:** *"The Billion-Euro Football Divide: Wage Inflation and Competitive Imbalance"*  
> **Visual Rhythm:** 43% Photography (Slides 1, 3, 5 with images; Slides 2, 4, 6, 7 pure data/typography)  
> **Target Dimensions:** 1080×1350px (4:5 vertical portrait)

---

## 1. Problem Analysis & The Football "Record" Bug

### What Went Wrong Before
When an article about football contained phrases like:
* *"Broke the transfer record..."*
* *"Unbeaten European record..."*
* *"Track record of continental success..."*

The brittle legacy regex in `server/src/services/ai/imagenService.ts`:
```typescript
/\b(vinyl|turntable|schallplatte|record\b|groove|plattenspieler|needle|analog\s*audio|tonarm)\b/i
```
matched `record\b`, causing the system to classify a Champions League football story as **Vinyl / Audio**, returning:
> *"Extreme close-up of a vintage vinyl turntable needle on spinning black vinyl grooves..."*

Furthermore, `liquidEngine.ts` injected an Unsplash stock photo of a vinyl turntable needle instead of generating bespoke sports photojournalism!

### How It Works Now (The Real System Standard)
In the new architecture:
1. **Semantic Topic Classification:** Gemini 2.5 Pro analyzes the story contextually, identifying `Sport & Ökonomie`. The keyword `record` in a sports context is correctly recognized as an athletic or financial milestone, never audio hardware.
2. **Contextual Photojournalism Prompt:** Vertex AI Imagen 3 / Flux receives rich, authentic 35mm optical sports reportage prompts (stadium pitch under rain, match ball on penalty chalk mark, players tunnel anticipation).
3. **Zero Stock Photos:** No hardcoded Unsplash fallbacks. Real AI generation via Vertex AI Imagen 3 (`imagen-3.0-generate-002`) and Flux.1 photorealism.

---

## 2. Slide-by-Slide Design & Prompt Breakdown

### Slide 1: Cover Hook (`hook_hero`)
* **Layout:** Full-bleed documentary photography with dark legibility gradient.
* **Top Safe Zone (160px):** Official NZZ SVG wordmark (`140px` width) top-left; Category badge top-right: `SPORT & ÖKONOMIE` (tracking `+3px`, bold uppercase).
* **Headline:** *"The Billion-Euro Football Divide"* (GT Sectra / Playfair Bold 74px, line-height 1.15, white, no terminal period).
* **Subhead:** *"Why record revenue cannot heal the structural fractures of European football"* (Inter Regular 36px, stone-200).
* **Usable Content Envelope:** 900×970px centered between 160px top and 220px bottom margins.
* **Prompt Dispatched to Imagen 3 / Flux:**
  ```text
  Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait. Subject: Low-angle dramatic telephoto perspective of modern European football stadium pitch under evening rain and stadium floodlights. Wet emerald turf, pristine white touchline chalk, distant empty goal net in soft focus, authentic stadium atmosphere, cinematic reportage, zero CGI, zero 3D render.
  ```

---

### Slide 2: Quantitative Data / Comparative Bars (`chart_data`)
* **Layout:** Pure editorial typography and graphic layout (No photo backdrop).
* **Background:** Warm Sand (`#E3C068`), Text: `#111111` (Obsidian Black).
* **Header:** Category metadata `SPORT & ÖKONOMIE • 2 / 7`; Serif title: *"Squad Compensation vs. Revenue"*.
* **Graphic Elements:**
  * Comparative horizontal bars with hairline dividers.
  * Benchmark Bar: *"UEFA Statutory Ceiling (70.0%)"* highlighted in NZZ Signal Red (`#D80000`).
  * Club Comparisons: Bayern Munich (58.2%), Real Madrid (62.4%), Paris SG (79.5%), FC Barcelona (83.7%).
* **Fact-Checking Footnote:** *"Source: UEFA Financial Benchmarking Report & NZZ Analysis"*.

---

### Slide 3: Defining Metric Callout (`stat_callout`)
* **Layout:** Full-bleed documentary photography with dark legibility gradient.
* **Badge:** `SCHLÜSSELKENNZAHL` (NZZ Red tag, uppercase tracking `+3px`).
* **Metric Highlight:** **€4.8B** (Playfair Bold 150px, white numeral, tight line-height `1.0`).
* **Metric Label:** `RECORD UEFA TURNOVER` (Inter SemiBold 24px, red uppercase).
* **Body Text:** *"Over 64% of all broadcast and commercial distributions are captured by the twelve wealthiest clubs, locking out historical mid-tier European leagues."*
* **Prompt Dispatched to Imagen 3 / Flux:**
  ```text
  Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait. Subject: Macro close-up of a FIFA official match football resting precisely on the white penalty spot chalk mark on wet natural turf. Fine water droplets clinging to the synthetic hexagonal panels, shallow depth of field, dramatic stadium floodlights in background, authentic sports journalism, zero CGI.
  ```

---

### Slide 4: Strategic Dichotomy (`dual_cards`)
* **Layout:** Pure editorial typography and dual-column structural analysis.
* **Background:** Warm Sand (`#E3C068`), Text: Obsidian Black.
* **Headline:** *"The Structural Dichotomy"* (GT Sectra Bold 64px).
* **Cards Structure:**
  * **Card 1 (Commercial Ascent):** *"SOVEREIGN WEALTH & EQUITY"* — Private capital and state funds infuse billions, elevating technical quality at the cost of financial sovereignty.
  * **Card 2 (Systemic Risk):** *"DOMESTIC MONOPOLIZATION"* — Traditional domestic leagues in the Netherlands, Portugal, and Switzerland lose economic viability, reduced to feeder leagues.
* **Separators:** Muted hairline borders (`border-stone-400/40`), zero cartoonish boxes.

---

### Slide 5: Operational Reality / Three Horizons (`bullets_list`)
* **Layout:** Full-bleed atmospheric photography with dark contrast overlay.
* **Header:** *"Three Accelerators of Polarization"* (Playfair Bold 62px, white).
* **Structured Bullets:**
  1. `01` **Swiss Model Expansion:** The revamped 36-team single-table Champions League format guarantees additional high-yield fixtures for elite contenders.
  2. `02` **Wages Outpacing Turnover:** Player agents leverage free agency and buyout clauses to capture nearly 80% of incremental club revenue gains.
  3. `03` **Legal Challenges to Caps:** EU competition rulings constrain UEFA's authority to impose hard salary ceilings without collective bargaining.
* **Prompt Dispatched to Imagen 3 / Flux:**
  ```text
  Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait. Subject: Candid backstage documentary scene inside the stadium players tunnel. Athletic coaching staff with tactical tablet and clipboards conferring in quiet intensity, concrete walls with painted team crests, overhead fluorescent corridor lighting, authentic sports documentary reportage.
  ```

---

### Slide 6: The Core Pull Quote (`quote`)
* **Layout:** Pure typography and sovereign editorial statement.
* **Background:** Warm Sand (`#E3C068`), Text: Obsidian Black.
* **Typographic Guillemet:** Oversized Swiss opening guillemet `«` (Playfair 120px in NZZ Signal Red `#D80000`).
* **Quote Text:** *"«A sport that permits capital concentration to predetermine competitive outcomes will inevitably alienate its foundational audience.»"* (GT Sectra Italic 54px, line-height 1.25).
* **Byline:** Stefan Osterhaus, Senior Sports & Economics Correspondent, NZZ.

---

### Slide 7: Conversion Outro (`cta_conversion`)
* **Layout:** Minimalist brand conclusion.
* **Background:** Warm Sand (`#E3C068`).
* **Logo:** Centered official NZZ wordmark (`260px` width).
* **Headline:** *"Understand the forces shaping global sport."* (GT Sectra Bold 56px).
* **Subtitle:** *"Read the complete investigative dossier on European football governance and financial analysis on nzz.ch."*
* **Button:** Stroked pill button with red border: `READ ON NZZ.CH →`.
