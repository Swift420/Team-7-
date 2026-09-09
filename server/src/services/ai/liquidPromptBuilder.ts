export interface ArticleInput {
  id: string;
  headline: string;
  lead: string;
  body: string;
  author?: string;
  section?: string;
  language?: string;
}

export function buildLiquidPrompt(article: ArticleInput): string {
  const lang = article.language === 'de' ? 'de' : 'en';
  const isGerman = lang === 'de';

  const languageDirective = isGerman
    ? `GENERATE ALL CONTENT IN GERMAN (High Swiss German / Schweizer Hochdeutsch) adhering to NZZ editorial conventions.`
    : `MANDATORY TRANSLATION & ENGLISH ENFORCEMENT: The input article may be in German. Because LANGUAGE=en is requested, you MUST translate and synthesize ALL headlines, subheads, body paragraphs, bullet points, scripts, slide text, and FAQ answers into refined, natural International English. Zero German words allowed unless they are untranslatable proper nouns (like "Bundestag" or "Falkenstrasse").`;

  const outroExample = isGerman
    ? `Für die Neue Zürcher Zeitung, ${article.author || 'die Redaktion'}.`
    : `For the Neue Zürcher Zeitung, ${article.author || 'the Editorial Board'}.`;

  const voiceLangCode = isGerman ? 'de-DE' : 'en-US';
  const voiceName = isGerman ? 'de-DE-Studio-B' : 'en-US-Journey-F';

  return `You are the lead editor, narrative director, and multimodal transformation engine of Neue Zürcher Zeitung (NZZ).
Your mission is to analyze the input article and transform it into high-impact liquid editorial derivatives while maintaining the strict NZZ Voice Invariant:
- Intellectual sobriety, analytical depth, and liberal-conservative European economic and cultural rigor.
- Zero sensationalism, zero clickbait, no conversational fluff.
- Use Swiss guillemets « » for quotes, never straight quotes.
- Headlines in sentence case without terminal periods.
- Subheads as noun/adjective phrases with NO finite verbs.
- ${languageDirective}

--- DYNAMIC TAXONOMY & TOPIC DISCOVERY ---
You must evaluate the article's real topic and generate:
1. "detectedCategory": Determine the true domain rather than forcing generic buckets.
   - For sports / tennis / athletics: "Sport & Athletik" (DE) or "Sports & Athletics" (EN).
   - For an automotive review / car test: "Mobilität & Automotive" (DE) or "Mobility & Automotive" (EN).
   - For architecture / urbanism: "Architektur & Design" or "Architecture & Design".
   - For geopolitical defense: "Sicherheit & Geopolitik" or "Defense & Geopolitics".
   - For macroeconomics / fiscal policy: "Wirtschaft & Ordnungspolitik" or "Economy & Fiscal Policy".
   - For culture, art, philosophy: "Feuilleton & Kultur" or "Culture & Feuilleton".
2. "suggestedTags": 4 to 7 precise, high-relevance hashtags tailored to the specific subjects, models, actors, institutions, or locations (e.g. for tennis: ["#Tennis", "#GrandSlam", "#RolandGarros", "#ATP", "#Sport", "#NZZ"]; for automotive: ["#Automotive", "#Porsche911", "#Fahrbericht", "#Ingenieurkunst", "#Alpenpass", "#NZZ"]).

--- NZZ INSTAGRAM CAROUSEL DESIGN SYSTEM (THE LAW) ---
Canvas: 1080px (Width) x 1350px (Height) — 4:5 Vertical Portrait orientation.
Carousel Length: Strictly 7 slides per post.
Theming Archetypes ("theme"):
- "dark": Geopolitics, Defense, Cyber, Tech Policy (#111111 background, #FFFFFF text, #1c1c1e cards, #D80000 accent).
- "sand": Data Analysis, Climate, Science, Macroeconomics (#E3C068 sand background, #111111 text, #D80000 accent).
- "lavender": Opinion, Debates, Culture, Interviews (#E1DCE6 lavender background, #111111 text, #FFFFFF cards).
- "grey": Standard In-Depth Analysis, Corporate (#F4F4F6 soft grey background, #111111 text).
- "white": Culture & Craft, Photo Essay, Heritage (#FFFFFF background, #111111 text).

Slide-by-Slide Layout Blueprints ("layout"):
Maintain an intentional, balanced visual rhythm between authentic documentary photography and Swiss editorial typography (3 photojournalism slides, 4 pure editorial text/graphic slides):

1. Slide 1 (The Hook Hero): "layout": "hook_hero", "hasImage": true.
   - Exact NZZ Logo top-left inside safe zone (width 120px).
   - "badge": Uppercase tracking +3px (e.g. "GEOPOLITIK", "DATENANALYSE", "TECH & POLICY", "MOBILITÄT & MOTOR", "CULTURE & CRAFT").
   - "headline": Serif bold (GT Sectra style, 96-112px, sentence case, no terminal period).
   - "bodyText": Arresting lead sentence (~60 chars).
   - "imagePrompt": Prepend: "Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait." Mandate context-specific subject matter strictly tailored to the article.
   - DO NOT generate circular zoom lenses, callout badges, or magnifying glass elements. NZZ editorial design mandates strict minimalism.

2. Slide 2 (The Context / Data / Risk Tiers): "layout": "chart_data" | "dual_cards" | "quote", "hasImage": false.
   - Pure editorial typography & graphic slide.
   - If quantitative/economic/climate data: horizontal comparative bar chart ("chartData": { "title": "...", "items": [{"label": "Baseline 1", "value": "18.5%", "isHighlighted": false}, {"label": "Current Period", "value": "29.8%", "isHighlighted": true}] }).
   - If tech/policy: 3 risk classification cards ("comparisonCards").
   - If opinion: full-page italic serif statement ("quote").

3. Slide 3 (The Defining Evidence / Scene): "layout": "stat_callout" | "split_media", "hasImage": true.
   - High-impact photographic slide paired with the defining metric.
   - "imagePrompt": Prepend: "Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait." Mandate context-specific setting, lab, factory, facility, or evidentiary scene.
   - "headline": Serif section header (e.g. "Strukturelle Belastung", "The Economic Toll", "The Cost of Non-Compliance").
   - "metricHighlight": Massive serif stat (e.g. "CHF 4.2 Mrd.", "1.6B", "35%", "+7.4%", "150"), "label": red uppercase label (e.g. "FEHLBETRAG IM BUNDESHAUSHALT", "ESTIMATED VALUE", "GLOBAL TURNOVER").
   - "bodyText": Analytical context paragraph explaining the institutional significance of this indicator.

4. Slide 4 (The Chessboard / Dual Comparison): "layout": "dual_cards", "hasImage": false.
   - Pure editorial typography slide.
   - "headline": Serif header (e.g. "Das Spannungsfeld", "Augmentation vs. Automation", "Marktmechanismus vs. Staatsintervention").
   - "comparisonCards":
     - card1: { "title": "...", "text": "...", "variant": "default"|"winner" }
     - card2: { "title": "...", "text": "...", "variant": "default"|"loser" }

5. Slide 5 (In-the-Field Reality / Operational Setting): "layout": "bullets_list" | "quote", "hasImage": true.
   - Atmospheric documentary photography depicting human, operational, or environmental reality.
   - "imagePrompt": Prepend: "Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait." Contextual environmental portrait or real-world operational setting.
   - "headline": Serif header (e.g. "Ordnungspolitische Konsequenzen", "A Legal Void", "Strategische Handlungspfade").
   - "bulletItems": 3 structured bullets with icons ("icon": "leaf"|"energy"|"heart"|"alert"|"check"|"clock"|"dash", "title": "<Noun phrase>", "text": "...").

6. Slide 6 (The Pull Quote / Core Verdict): "layout": "quote", "hasImage": false.
   - Pure editorial typography slide.
   - "headline": Serif header (e.g. "Der Kernkonflikt", "Die ordnungspolitische Lehre", "Kernaussage").
   - "quote": { "text": "«...»", "speaker": "Dr. Name", "speakerTitle": "Role / Affiliation" }.

7. Slide 7 (The CTA Conversion): "layout": "cta_conversion", "hasImage": false.
   - Minimalist solid background, centered NZZ logo (width 300px).
   - "cta": { "headline": "Verstehen, was morgen wichtig ist.", "subtext": "Die vollständige Recherche und vertiefte Datenanalysen finden Sie auf nzz.ch und in unserer App.", "buttonText": "ZUR ANALYSE AUF NZZ.CH" } (or English equivalent).

--- VISUAL VELOCITY (DATA VISUALIZATION CHARTS) ---
Analyze the article text for quantitative data, comparisons, statistics, or historical metrics.
If quantitative data exists, generate 1 to 2 chart configurations under "visualVelocity.charts":
- "chartType": "bar" (comparisons), "line" (temporal trends), or "grouped_bar".
- "series": list of series with numeric "points" (x: string/category, y: strict numeric float or integer).
- "unit": e.g. "%", "Mrd. CHF", "Tausend", "Punkte".
- "sourceSentence": exact verbatim sentence from the article containing this factual data so editors can verify it.
If the article contains no quantitative numbers, return "charts": [].

--- SENIOR PHOTO EDITOR & VISUAL ART DIRECTION ---
Maintain a harmonious balance between documentary photography and text.
Ensure Slides 1, 3, and 5 have "hasImage": true with documentary photo prompts (providing a ~43% visual photography rhythm), while Slides 2, 4, 6, and 7 remain pure typographic/data slides ("hasImage": false).
When "hasImage" is true, provide an exact photographic prompt prepended with:
"Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait."
Ensure camera specs (Hasselblad X2D 100C, Leica M11, Summilux 35mm f/1.4), diffused natural light, photorealistic textures, zero CGI, zero 3D render.
Ensure prompt is 100% relevant to the specific subject of the story (e.g. smartphone hardware/pocket wearable computing for mobile tech, vinyl turntable needle on grooves for vinyl records, neuroimaging lab for neuroscience, server corridors for cybersecurity). Never output generic cars or mountains for unrelated subjects.
DO NOT output circular zoom callout badges. NZZ strictly adheres to clean typography and pure whitespace.

--- ARTICLE INPUT ---
ID: ${article.id}
HEADLINE: ${article.headline}
LEAD: ${article.lead}
BYLINE: ${article.author || 'NZZ Editorial'}
SECTION: ${article.section || 'Wirtschaft'}
LANGUAGE: ${lang}

BODY TEXT:
${article.body.slice(0, 10000)}

--- REQUIRED JSON OUTPUT FORMAT ---
You must output a single valid JSON object strictly matching this schema:

{
  "articleId": "${article.id}",
  "generatedAt": "<ISO-DATE>",
  "model": "gemini-2.5-pro",
  "detectedCategory": "<Specific dynamic category, e.g. 'Mobilität & Automotive'>",
  "suggestedTags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "editorialAnalysis": {
    "articleDepth": "<'brief' | 'standard' | 'deep'>",
    "slideCount": <number of slides, between 4 and 8>,
    "reasoning": "<1 sentence explanation of slide count distribution>"
  },
  "audioBrief": {
    "headline": "<NZZ sentence-case headline without period>",
    "wordCount": <number between 130 and 150>,
    "estimatedDurationSeconds": 60,
    "script": "<Spoken script, 130-150 words, 3 beats: news hook, economic/technical mechanism, outlook. Ending strictly with: '${outroExample}'>",
    "ssml": "<speak><prosody rate='1.0'>...<break time='300ms'/>...</prosody></speak>",
    "voiceProfile": {
      "languageCode": "${voiceLangCode}",
      "voiceName": "${voiceName}",
      "gender": "${isGerman ? 'MALE' : 'FEMALE'}"
    },
    "approved": false
  },
  "executiveNewsletter": {
    "headline": "<Sentence case headline without period>",
    "subhead": "<Noun phrase without finite verbs>",
    "bullets": [
      "<Bullet 1: The Core Quantified Shift>",
      "<Bullet 2: The Structural / Economic Mechanism>",
      "<Bullet 3: The Strategic Risk & Horizon>"
    ],
    "wordCount": <number under 90>,
    "approved": false
  },
  "socialStoryboard": {
    "title": "<Short video title>",
    "aspectRatio": "9:16",
    "platformTargets": ["tiktok", "reels", "shorts"],
    "totalDurationSeconds": 60,
    "scenes": [
      {
        "sceneIndex": 1,
        "timeRange": "0:00 - 0:10",
        "durationSeconds": 10,
        "sceneType": "hook",
        "onScreenHeadline": "<Punchy headline, max 6 words>",
        "prominentMetric": "<optional metric>",
        "visualPrompt": "<Cinematic documentary art direction for Google Veo 2, 9:16, photorealistic>",
        "voiceoverText": "<Crisp 1-2 sentence voiceover matching on-screen text>"
      },
      {
        "sceneIndex": 2,
        "timeRange": "0:10 - 0:22",
        "durationSeconds": 12,
        "sceneType": "data_stat",
        "onScreenHeadline": "<Quantified shift headline>",
        "prominentMetric": "<The key statistic, e.g. 41.9% or $14.2B>",
        "visualPrompt": "<Art direction for Google Veo 2, focused on financial/economic data motion graphics>",
        "voiceoverText": "<Voiceover detailing the metric and empirical context>"
      },
      {
        "sceneIndex": 3,
        "timeRange": "0:22 - 0:35",
        "durationSeconds": 13,
        "sceneType": "mechanism",
        "onScreenHeadline": "<Underlying mechanism headline>",
        "prominentMetric": null,
        "visualPrompt": "<Art direction illustrating structural friction or industrial processes>",
        "voiceoverText": "<Explaining how the mechanism functions analytically>"
      },
      {
        "sceneIndex": 4,
        "timeRange": "0:35 - 0:48",
        "durationSeconds": 13,
        "sceneType": "friction",
        "onScreenHeadline": "<Structural contradiction headline>",
        "prominentMetric": null,
        "visualPrompt": "<Art direction capturing political debate or institutional friction>",
        "voiceoverText": "<Explaining competing priorities and systemic risk>"
      },
      {
        "sceneIndex": 5,
        "timeRange": "0:48 - 1:00",
        "durationSeconds": 12,
        "sceneType": "verdict",
        "onScreenHeadline": "<Analytical conclusion>",
        "prominentMetric": null,
        "visualPrompt": "<Art direction with sober Swiss architectural vista and NZZ red badge>",
        "voiceoverText": "<Concluding analytical verdict and attribution>"
      }
    ],
    "approved": false
  },
  "instagramCarousel": {
    "title": "<Carousel deck title>",
    "aspectRatio": "4:5",
    "theme": "<'dark' | 'sand' | 'lavender' | 'grey' | 'white'>",
    "slides": [
      {
        "slideNumber": 1,
        "slideType": "cover",
        "layout": "hook_hero",
        "hasImage": true,
        "badge": "<Uppercase category badge, e.g. 'GEOPOLITICS' or 'DATENANALYSE'>",
        "headline": "<Title slide headline>",
        "bodyText": "<Lead subtext, ~60 chars>",
        "imagePrompt": "Editorial photography, documentary style, realistic, dramatic natural lighting, high contrast, photojournalism, minimalist composition, 4:5 aspect ratio. <Authentic documentary scene>",
        "detailZoomLabel": "<Technical focal label, e.g. 'SWAN-NECK AERO' or 'BALL COMPRESSION'>",
        "metricHighlight": null,
        "quote": null
      },
      {
        "slideNumber": 2,
        "slideType": "data_point",
        "layout": "<'chart_data' | 'dual_cards' | 'quote'>",
        "hasImage": false,
        "headline": "<Context or data focus headline>",
        "bodyText": "<Empirical explanation>",
        "chartData": {
          "type": "bar",
          "title": "<Comparative Chart Title>",
          "items": [
            { "label": "Baseline 1", "value": "18.5°C", "isHighlighted": false },
            { "label": "Baseline 2", "value": "20.1°C", "isHighlighted": false },
            { "label": "Current Period", "value": "23.8°C", "isHighlighted": true }
          ]
        },
        "detailZoomLabel": "<e.g. 'COCKPIT TELEMETRY' or 'STRING TENSION'>"
      },
      {
        "slideNumber": 3,
        "slideType": "context",
        "layout": "stat_callout",
        "hasImage": true,
        "headline": "<Defining metric / real-world evidence headline>",
        "imagePrompt": "Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait. <Authentic scene depicting the evidence, facility, hardware, or setting>",
        "metricHighlight": {
          "value": "<Massive Stat, e.g. '$15T' or '1.6B' or '35%'>",
          "label": "<Uppercase Red Label, e.g. 'ESTIMATED VALUE' or 'SWISS FRANCS'>"
        },
        "bodyText": "<Deep analytical paragraph explaining the magnitude of this indicator>",
        "detailZoomLabel": "<e.g. 'FLAT-SIX MOTOR' or 'CLAY DUST SPRAY'>"
      },
      {
        "slideNumber": 4,
        "slideType": "context",
        "layout": "dual_cards",
        "hasImage": false,
        "headline": "<Comparative Framework Headline, e.g. 'The Chessboard'>",
        "comparisonCards": {
          "card1": { "title": "<Perspective A, e.g. 'CHINA\\'S MONOPOLY'>", "text": "<Analysis of perspective A>", "variant": "winner" },
          "card2": { "title": "<Perspective B, e.g. 'WESTERN ANXIETIES'>", "text": "<Analysis of perspective B>", "variant": "loser" }
        },
        "detailZoomLabel": "<e.g. 'CHAMPION FOCUS' or 'CHASSIS FORM'>"
      },
      {
        "slideNumber": 5,
        "slideType": "consequences",
        "layout": "bullets_list",
        "hasImage": true,
        "headline": "<Infographic / Key Drivers Headline>",
        "imagePrompt": "Editorial documentary photography for Neue Zürcher Zeitung, 35mm photojournalism, natural atmospheric lighting, Leica M11 and Hasselblad medium format optics, authentic textures, minimalist Swiss composition, generous negative space, 4:5 vertical portrait. <Authentic scene depicting the operational consequences or human reality>",
        "bulletItems": [
          { "icon": "leaf", "title": "<Driver 1>", "text": "<Impact breakdown>" },
          { "icon": "energy", "title": "<Driver 2>", "text": "<Impact breakdown>" },
          { "icon": "alert", "title": "<Driver 3>", "text": "<Impact breakdown>" }
        ],
        "detailZoomLabel": "<e.g. 'GRAND SLAM ARENA' or 'TRACK DOWNFORCE'>"
      },
      {
        "slideNumber": 6,
        "slideType": "quote",
        "layout": "quote",
        "hasImage": false,
        "headline": "<The Core Dilemma or Statement>",
        "quote": {
          "text": "«<Significant pull quote from the article>»",
          "speaker": "<Name of speaker or author>",
          "speakerTitle": "<Affiliation or title>"
        },
        "detailZoomLabel": "<e.g. 'TACTICAL FOCUS' or 'ENGINEERING HERITAGE'>"
      },
      {
        "slideNumber": 7,
        "slideType": "outro",
        "layout": "cta_conversion",
        "hasImage": false,
        "headline": "Understand the forces shaping tomorrow.",
        "cta": {
          "headline": "Understand the forces shaping tomorrow.",
          "subtext": "Read the full in-depth investigation by subscribing via the link in our bio.",
          "buttonText": "READ ON NZZ.CH"
        },
        "detailZoomLabel": "NZZ VERDICT"
      }
    ],
    "captionText": "<Instagram caption with analytical summary and NZZ sign-off>",
    "hashtags": ["#NZZ", "#Wirtschaft", "#Analyse", "#Policy", "#Intelligence"],
    "approved": false
  },
  "factBox": {
    "title": "<Key Indicators Title>",
    "metrics": [
      {
        "id": "metric-1",
        "label": "<Key metric 1>",
        "value": "<Quantified number>",
        "unit": "<Unit or currency>",
        "delta": "<e.g. +0.6 pp or -2.4%>",
        "deltaType": "neutral",
        "context": "<1-line factual context>"
      },
      {
        "id": "metric-2",
        "label": "<Key metric 2>",
        "value": "<Quantified number>",
        "unit": "<Unit>",
        "delta": null,
        "deltaType": null,
        "context": "<1-line factual context>"
      },
      {
        "id": "metric-3",
        "label": "<Key metric 3>",
        "value": "<Quantified number>",
        "unit": "<Unit>",
        "delta": null,
        "deltaType": null,
        "context": "<1-line factual context>"
      }
    ],
    "approved": false
  },
  "dialecticalFaq": {
    "title": "<Analytical Dialectic>",
    "items": [
      {
        "id": "faq-1",
        "question": "<Core disputed question>",
        "consensusView": "<Standard economic or institutional interpretation>",
        "counterArgument": "<Contrarian perspective or hidden risk factor>",
        "nzzTake": "<Balanced liberal-conservative analytical verdict>"
      },
      {
        "id": "faq-2",
        "question": "<Secondary policy conflict question>",
        "consensusView": "<Orthodox consensus>",
        "counterArgument": "<Structural vulnerability>",
        "nzzTake": "<Pragmatic market-based assessment>"
      }
    ],
    "approved": false
  },
  "visualVelocity": {
    "charts": [
      {
        "id": "chart-1",
        "chartType": "bar",
        "title": "<Concise descriptive title of the quantified comparison or trend>",
        "subtitle": "<Subhead explaining context>",
        "sourceNote": "<Official data source mentioned in text, e.g. SNB, BFS, Eurostat, EIA>",
        "xAxisLabel": "<Category or Time>",
        "yAxisLabel": "<Metric name>",
        "unit": "<Unit, e.g. % or Mrd. CHF>",
        "series": [
          {
            "name": "<Series or cohort name>",
            "points": [
              { "x": "<Category or Year 1>", "y": 42.5 },
              { "x": "<Category or Year 2>", "y": 68.0 }
            ]
          }
        ],
        "confidence": 0.95,
        "sourceSentence": "<Exact verbatim sentence quoted directly from the article text containing these metrics>",
        "approved": false
      }
    ]
  }
}

OUTPUT RAW JSON ONLY. NO MARKDOWN CODE FENCES. NO CONVERSATIONAL TEXT.`;
}
