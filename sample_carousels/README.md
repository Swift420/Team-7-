# NZZ Multimodal Carousel Gallery & Reusable Sample Library

> **Directory:** `/Users/teofilusshaduka/nzz_hack/sample_carousels/`  
> **Target Audience:** Editorial Staff, Jury Evaluators, Full-Stack Engineers  
> **Status:** Production Reference & Reusable Ingestion Payloads  
> **Design Ratio:** 1080×1350px (4:5 Vertical Portrait)  
> **Visual Rhythm:** 43% Photography (Slides 1, 3, 5 with documentary imagery; 2, 4, 6, 7 pure typography/data)

---

## Overview

This directory provides **production-ready sample carousel posts** across diverse editorial verticals. Each sample demonstrates the exact narrative architecture, typographical scale, quantitative chart schemas, and photorealistic 35mm image generation prompts used by the NZZ Multimodal Platform.

All samples adhere to:
1. **The NZZ Voice Invariant:** Sovereign, independent, understated Swiss prestige, analytical depth.
2. **Safe Zone Protection:** 160px top margin, 220px bottom margin, 90px side margins (`900×970px` usable canvas).
3. **WCAG AAA Legibility:** Multi-stop dark gradient overlay (`rgba(0,0,0,0.92)` to `rgba(0,0,0,0.10)`) ensuring white serif headlines remain readable over photography.
4. **Fact-Checking Anchors:** Every data point links back to a verbatim `sourceSentence`.
5. **Authentic 35mm Art Direction:** Zero CGI, zero plastic sheen, natural European daylight or moody ambient lighting, optical depth of field (Leica M11, Hasselblad X2D 100C).

---

## Catalog of Sample Posts

| File | Vertical / Topic | Color Theme | Key Data / Metric | Photojournalism Subject |
| :--- | :--- | :--- | :--- | :--- |
| [`01_football_champions_league.json`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/01_football_champions_league.json)<br>[`01_football_champions_league.md`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/01_football_champions_league.md) | **Sports & Economics**<br>The Billion-Euro Transfer Economy | `sand` (`#E3C068`) | **€4.8 Billion**<br>Wage-to-Turnover ratio | Floodlit stadium turf in rain, tunnel tension, tactical whiteboard, match ball on penalty spot. |
| [`02_red_sea_geopolitics.json`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/02_red_sea_geopolitics.json)<br>[`02_red_sea_geopolitics.md`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/02_red_sea_geopolitics.md) | **Geopolitics & Defense**<br>The Red Sea Chokepoint & Global Trade | `dark` (`#111111`) | **+280%**<br>Freight Spot Rates | Container ship navigating choppy gray waters at dusk, naval tactical sonar bridge, port cranes. |
| [`03_swiss_franc_economy.json`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/03_swiss_franc_economy.json)<br>[`03_swiss_franc_economy.md`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/03_swiss_franc_economy.md) | **Macroeconomics & Finance**<br>The Strong Franc Paradox | `sand` (`#E3C068`) | **1.2%**<br>Swiss Inflation Baseline | Zurich Paradeplatz in morning drizzle, Swiss National Bank vaults, export manufacturing floor. |
| [`04_sovereign_ai_technology.json`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/04_sovereign_ai_technology.json)<br>[`04_sovereign_ai_technology.md`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/04_sovereign_ai_technology.md) | **Technology & Policy**<br>The Sovereign AI Runtime Shift | `grey` (`#F4F4F6`) | **42,000**<br>High-Security H100 Nodes | Cleanroom semiconductor lithography, server corridors with status LEDs, ETH Zurich audit lab. |
| [`05_luxury_watchmaking_culture.json`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/05_luxury_watchmaking_culture.json)<br>[`05_luxury_watchmaking_culture.md`](file:///Users/teofilusshaduka/nzz_hack/sample_carousels/05_luxury_watchmaking_culture.md) | **Culture & Craftsmanship**<br>The Horological Sanctuary | `white` (`#FFFFFF`) | **CHF 26.7 Mrd.**<br>Swiss Watch Exports | Master watchmaker with loupe hand-polishing tourbillon balance wheel under warm incandescent lamp. |

---

## How to Reuse These Samples

### In the Multimodal Studio (Client UI)
1. Open the Multimodal Studio in your browser (`http://localhost:5173`).
2. Go to the **Draft Studio** or **Article Studio**.
3. Copy any JSON payload from this folder and paste it into the state or import using the API.
4. The studio will instantly render the full 7-slide carousel, audio brief, executive newsletter, video storyboard, dialectical FAQ, and Visual Velocity charts.

### Via Backend API
To publish or inspect any of these payloads directly:
```bash
curl -X POST http://localhost:5000/api/liquid/publish \
  -H "Content-Type: application/json" \
  -d @sample_carousels/01_football_champions_league.json
```
