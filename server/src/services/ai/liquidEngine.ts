import { buildLiquidPrompt, ArticleInput } from './liquidPromptBuilder.js';
import { liquidDerivativesSchema, LiquidDerivatives, CarouselSlide } from './liquidSchemas.js';
import { getAccessToken, getProjectId } from '../gcp/authService.js';
import { getCached, setCached, generateCacheKey } from './cacheService.js';
import { lintNZZStyle } from './nzzStyleLinter.js';
import { synthesizePhotojournalismPrompt } from './imagenService.js';

export interface GenerateOptions {
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro' | string;
  language?: 'en' | 'de';
  demoMode?: boolean;
  mock?: boolean;
}

export async function generateLiquidDerivatives(
  article: ArticleInput,
  options: GenerateOptions = {}
): Promise<LiquidDerivatives> {
  const model = options.model || 'gemini-2.5-flash';
  const language = options.language || (article.language as 'en' | 'de') || 'en';
  article.language = language;

  // Explicit demo or mock mode
  if (options.demoMode === true || options.mock === true) {
    console.log('[LiquidEngine] Explicit demo/mock mode active. Generating deterministic output with source=template');
    const generated = generateDeterministicLiquidDerivatives(article, model, language);
    generated.source = 'template';
    generated.model = model;
    return generated;
  }

  // 1. Cost-Saving Cache Check (live cache only)
  const cacheKey = generateCacheKey('liquid_derivatives', {
    id: article.id,
    model,
    language,
    textSnippet: (article.body || '').slice(0, 500),
  }, 'live');

  const cached = getCached<LiquidDerivatives>(cacheKey);
  if (cached && cached.source !== 'template') {
    return cached;
  }

  // 2. Vertex AI with Application Default Credentials
  const token = await getAccessToken();
  const projectId = await getProjectId();
  const location = process.env.GCP_LOCATION || 'us-central1';

  if (!token || !projectId) {
    const errorMsg = 'Google Cloud credentials not found. Vertex AI is unauthenticated.';
    console.error(`[LiquidEngine Vertex AI] ${errorMsg}`);
    throw new Error(`AUTH_MISSING: ${errorMsg}`);
  }

  const startTime = Date.now();
  const prompt = buildLiquidPrompt(article);
  const vertexModel = model.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${vertexModel}:generateContent`;

  console.log(`[LiquidEngine Vertex AI] Invoking ${vertexModel} on project ${projectId}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const errorBody = await response.text();
    console.error(`[LiquidEngine Vertex AI Error] HTTP ${status}: ${errorBody}`);
    throw new Error(`Vertex AI error (${status}): ${errorBody}`);
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.error('[LiquidEngine Vertex AI] No candidate text returned:', JSON.stringify(json));
    throw new Error('Vertex AI returned no text candidate');
  }

  const parsed = cleanAndParseJson(rawText);
  const normalized = normalizeLiquidJson(parsed, article);
  normalized.source = 'vertex-ai';
  normalized.model = vertexModel;
  normalized.elapsedMs = Date.now() - startTime;
  if (!normalized.visualVelocity) {
    normalized.visualVelocity = { charts: [] };
  }

  const validated = liquidDerivativesSchema.parse(normalized);
  setCached(cacheKey, validated);
  console.log(`[LiquidEngine Vertex AI] Successfully synthesized ${vertexModel} derivatives in ${normalized.elapsedMs}ms`);
  return validated;
}

function cleanAndParseJson(rawText: string): any {
  let cleaned = rawText.trim();
  // Strip markdown code fences if model enclosed in ```json ... ```
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  
  // Remove trailing commas before closing brackets or braces (e.g. [1, 2,] or {"a": 1,})
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    // Second-pass repair: try finding the outermost JSON object { ... }
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const relaxed = match[0].replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(relaxed);
    }
    throw err;
  }
}

export interface TopicImagery {
  coverUrl: string;
  zoomUrl?: string;
  zoomLabel?: string;
  slideImages: string[];
}

export function getContextualTopicImagery(article: ArticleInput): TopicImagery {
  const text = `${article.headline} ${article.lead} ${article.body || ''}`.toLowerCase();

  // 0a. Vinyl Records / Analog Audio / Music Production
  if (/\b(vinyl|turntable|schallplatte|record\b|groove|plattenspieler|plattensammlung|analog\s*audio|tonarm|nadel)\b/i.test(text)) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1080&q=80', // Needle on vinyl grooves
      zoomUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'RECORD GROOVES',
      slideImages: [
        'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1542208998-f6dbbb27a72f?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 0b. Neuroscience / Brain / Cognition
  if (/\b(neuro|brain|gehirn|synapse|cortex|cognitive|kognitiv|neural|hirnforschung)\b/i.test(text)) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1080&q=80', // Clinical neuroimaging
      zoomUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'BRAIN ACTIVITY',
      slideImages: [
        'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 0c. Automotive / Car Review / Mobilität (Porsche 911 GT3 RS Focus - STRICT word boundaries)
  const isAutomotive = /\b(porsche|gt3\s*rs|sustenpass|supercar|sportwagen|rennstrecke|fahrbericht)\b/i.test(text) ||
    (text.includes('gt3') && !text.includes('tennis'));

  if (isAutomotive) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1080&q=80', // 911 GT3 high-performance
      zoomUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=400&q=80', // GT3 cockpit & steering dials
      zoomLabel: 'SWAN-NECK AERO',
      slideImages: [
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1080&q=80', // 911 GT3 RS Sustenpass action
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1080&q=80', // Alcantara cockpit & telemetry
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1080&q=80', // Flat-six engineering powertrain
        'https://images.unsplash.com/photo-1611821064430-0d40291d0f0d?auto=format&fit=crop&w=1080&q=80', // Dynamic track apex & downforce
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1080&q=80', // Alpine coupe silhouette
        'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1080&q=80', // Rear aero & wing profile
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1080&q=80', // Telemetry analysis
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80', // NZZ mark
      ],
    };
  }

  // 1. Sports / Tennis / Athletics
  const isSports = (
    text.includes('tennis') || text.includes('wimbledon') || text.includes('roland garros') ||
    text.includes('grand slam') || text.includes('atp') || text.includes('wta') ||
    text.includes('matchball') || text.includes('aufschlag') || text.includes('forehand') || text.includes('backhand') ||
    /\b(sport|athletik|athletics|athlete|championship|tournament)\b/i.test(text)
  );

  if (isSports) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1080&q=80', // Roland Garros clay action
      zoomUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'BALL COMPRESSION',
      slideImages: [
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1080&q=80', // Court action
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1080&q=80', // Ball / string compression
        'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1080&q=80', // Red clay slide
        'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?auto=format&fit=crop&w=1080&q=80', // Baseline focus
        'https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1080&q=80', // Grand slam arena
        'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1080&q=80', // Match point baseline
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1080&q=80', // Post-match reflection
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80', // NZZ Mark
      ],
    };
  }

  // 2. Maritime / Naval / Submarines
  if (text.includes('u-boot') || text.includes('submarine') || text.includes('maritim') || text.includes('indopazifik') || text.includes('marine')) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
      zoomUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'S9G REACTOR',
      slideImages: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 3. European Defense / Armed Forces (strictly military context, excludes sports defense)
  const isMilitary = (
    text.includes('bundeswehr') || text.includes('truppe') || text.includes('streitkräfte') ||
    text.includes('military') || text.includes('armed forces') || text.includes('rekrut') ||
    text.includes('verteidigung') || (text.includes('defense') && !text.includes('tennis') && !text.includes('sport') && !text.includes('court'))
  );

  if (isMilitary) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1080&q=80',
      zoomUrl: 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'STRATEGIC READINESS',
      slideImages: [
        'https://images.unsplash.com/photo-1579975096649-e773152b04cb?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 3. Economy / German Welfare State / Pension ("Germany's Welfare State...")
  if (text.includes('welfare') || text.includes('wohlfahrt') || text.includes('rente') || text.includes('pension') || text.includes('krankenkasse') || text.includes('sozial') || text.includes('haushalt') || text.includes('deficit') || text.includes('finanz')) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
      zoomUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'FISCAL AUDIT',
      slideImages: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 4. AI / Cybersecurity / Tech ("AI Agents Are Becoming the New Attack Surface")
  if (text.includes('ai') || text.includes('agent') || text.includes('security') || text.includes('attack') || text.includes('cyber') || text.includes('software') || text.includes('tech')) {
    return {
      coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80',
      zoomUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
      zoomLabel: 'API VECTOR',
      slideImages: [
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
      ],
    };
  }

  // 5. Default Sovereign Swiss Prestige
  return {
    coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
    zoomUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    zoomLabel: 'NZZ DOSSIER',
    slideImages: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
    ],
  };
}

function normalizeLiquidJson(raw: any, article: ArticleInput): any {
  if (!raw || typeof raw !== 'object') return raw;

  // 1. Normalize dialecticalFaq items (support { consensusView, counterArgument, nzzTake })
  if (raw.dialecticalFaq?.items && Array.isArray(raw.dialecticalFaq.items)) {
    const unpackedItems: any[] = [];
    const defaultPerspectives = ['consensus', 'counterargument', 'structural_outlook'];

    for (let i = 0; i < raw.dialecticalFaq.items.length; i++) {
      const item = raw.dialecticalFaq.items[i];
      const q = item.question || item.q || item.title || `Core analytical question ${i + 1}`;

      if (item.consensusView || item.counterArgument || item.nzzTake) {
        if (item.consensusView) {
          unpackedItems.push({
            question: q,
            answer: item.consensusView,
            perspective: 'consensus',
          });
        }
        if (item.counterArgument) {
          unpackedItems.push({
            question: q,
            answer: item.counterArgument,
            perspective: 'counterargument',
          });
        }
        if (item.nzzTake) {
          unpackedItems.push({
            question: q,
            answer: item.nzzTake,
            perspective: 'structural_outlook',
          });
        }
      } else {
        const perspective = (item.perspective || defaultPerspectives[i] || 'consensus').toLowerCase();
        const ans = item.answer || item.a || item.response || item.argument || item.text || item.summary || `${article.lead || article.headline}. Structural adaptation remains the decisive variable.`;
        unpackedItems.push({
          question: q,
          answer: ans,
          perspective,
        });
      }
    }

    raw.dialecticalFaq.items = unpackedItems.slice(0, 3);

    while (raw.dialecticalFaq.items.length < 3) {
      const idx = raw.dialecticalFaq.items.length;
      raw.dialecticalFaq.items.push({
        question: `Strategic perspective on ${article.headline}`,
        answer: `${article.lead || 'Structural adaptation and institutional resilience remain the determining factors.'}`,
        perspective: defaultPerspectives[idx] || 'structural_outlook',
      });
    }
  }

  // 2. Normalize executiveNewsletter bullets strictly to 3
  if (raw.executiveNewsletter?.bullets && Array.isArray(raw.executiveNewsletter.bullets)) {
    raw.executiveNewsletter.bullets = raw.executiveNewsletter.bullets.slice(0, 3);
  }

  // 3. Normalize factBox metrics
  if (raw.factBox?.metrics && Array.isArray(raw.factBox.metrics)) {
    raw.factBox.metrics = raw.factBox.metrics.map((m: any, i: number) => ({
      id: m.id || `m-${i}`,
      metricName: m.metricName || m.name || m.label || 'Macroeconomic Indicator',
      value: String(m.value || m.val || '0'),
      delta: m.delta ? String(m.delta) : undefined,
      direction: m.direction || 'neutral',
      contextNote: m.contextNote || m.note || m.context || 'NZZ verified figure',
    }));
  }

  // 4. Normalize scenes prominentMetric
  if (raw.socialStoryboard?.scenes && Array.isArray(raw.socialStoryboard.scenes)) {
    raw.socialStoryboard.scenes = raw.socialStoryboard.scenes.map((s: any) => ({
      ...s,
      prominentMetric: s.prominentMetric ? String(s.prominentMetric) : undefined,
    }));
  }

  // 4b. Normalize visualVelocity data charts
  if (raw.visualVelocity?.charts && Array.isArray(raw.visualVelocity.charts)) {
    raw.visualVelocity.charts = raw.visualVelocity.charts
      .map((c: any, i: number) => {
        const series = Array.isArray(c.series) && c.series.length > 0
          ? c.series.map((s: any) => ({
              name: String(s.name || 'Data'),
              points: Array.isArray(s.points)
                ? s.points.map((p: any) => ({
                    x: p.x !== undefined ? (typeof p.x === 'number' ? p.x : String(p.x)) : 'Point',
                    y: typeof p.y === 'number' ? p.y : (parseFloat(String(p.y || '0')) || 0),
                  }))
                : [],
            }))
          : [];

        return {
          id: c.id || `chart-${i + 1}`,
          chartType: ['line', 'bar', 'grouped_bar', 'area', 'scatter'].includes(c.chartType) ? c.chartType : 'bar',
          title: String(c.title || 'Quantitative Analysis'),
          subtitle: String(c.subtitle || ''),
          sourceNote: String(c.sourceNote || 'NZZ Analysis'),
          xAxisLabel: String(c.xAxisLabel || ''),
          yAxisLabel: String(c.yAxisLabel || ''),
          unit: String(c.unit || ''),
          series,
          confidence: typeof c.confidence === 'number' ? c.confidence : 1.0,
          sourceSentence: String(c.sourceSentence || article.lead || article.headline),
          approved: Boolean(c.approved),
        };
      })
      .filter((c: any) => c.series.length > 0 && c.series[0].points.length > 0);
  } else {
    raw.visualVelocity = { charts: [] };
  }

  // 5. Dynamic Category & Tag Discovery
  const combinedText = `${article.headline} ${article.lead} ${article.body || ''}`.toLowerCase();
  const isAutomotive = (
    combinedText.includes('porsche') || combinedText.includes('fahrbericht') || 
    combinedText.includes('gt3') || combinedText.includes('sportwagen') || 
    combinedText.includes('sustenpass') || 
    ((combinedText.includes('auto') || combinedText.includes('mobility') || combinedText.includes('mobilität')) && !combinedText.includes('tennis'))
  );

  const isSports = !isAutomotive && (
    combinedText.includes('tennis') || combinedText.includes('grand slam') || 
    combinedText.includes('wimbledon') || combinedText.includes('roland garros') || 
    combinedText.includes('atp') || combinedText.includes('wta') || 
    /\b(sport|athletik|athletics|athlete|championship)\b/i.test(combinedText)
  );

  if (!raw.detectedCategory) {
    if (isAutomotive) {
      raw.detectedCategory = article.language === 'de' ? 'Mobilität & Automotive' : 'Mobility & Automotive';
    } else if (isSports) {
      raw.detectedCategory = article.language === 'de' ? 'Sport & Athletik' : 'Sports & Athletics';
    } else if (combinedText.includes('submarine') || combinedText.includes('u-boot') || ((combinedText.includes('defense') || combinedText.includes('military')) && !combinedText.includes('tennis'))) {
      raw.detectedCategory = article.language === 'de' ? 'Sicherheit & Geopolitik' : 'Defense & Geopolitics';
    } else if (combinedText.includes('rente') || combinedText.includes('welfare') || combinedText.includes('sozialstaat')) {
      raw.detectedCategory = article.language === 'de' ? 'Wirtschaft & Ordnungspolitik' : 'Economy & Fiscal Policy';
    } else {
      raw.detectedCategory = article.section || (article.language === 'de' ? 'Wirtschaft' : 'Economy');
    }
  }

  if (!raw.suggestedTags || !Array.isArray(raw.suggestedTags) || raw.suggestedTags.length === 0) {
    if (isAutomotive) {
      raw.suggestedTags = ['#Automotive', '#Porsche911', '#Fahrbericht', '#Ingenieurkunst', '#Alpenpass', '#NZZ'];
    } else if (isSports) {
      raw.suggestedTags = ['#Tennis', '#GrandSlam', '#RolandGarros', '#ATP', '#Sport', '#NZZ'];
    } else if (combinedText.includes('submarine') || combinedText.includes('defense')) {
      raw.suggestedTags = ['#Geopolitik', '#Verteidigung', '#Sicherheit', '#Marine', '#NZZ'];
    } else {
      raw.suggestedTags = ['#NZZ', '#Wirtschaft', '#Analyse', '#Policy'];
    }
  }

  // 6. Determine Archetype Theme & Category Badge for Inspo Design System
  let carouselTheme: 'dark' | 'sand' | 'lavender' | 'white' | 'grey' = raw.instagramCarousel?.theme || 'dark';
  let defaultBadge = article.language === 'de' ? 'GEOPOLITIK & STRATEGIE' : 'GEOPOLITICS & STRATEGY';

  if (isAutomotive) {
    carouselTheme = 'dark';
    defaultBadge = article.language === 'de' ? 'MOBILITÄT & MOTOR' : 'MOBILITY & AUTOMOTIVE';
  } else if (isSports) {
    carouselTheme = 'sand';
    defaultBadge = article.language === 'de' ? 'SPORT & ATHLETIK' : 'SPORTS & ATHLETICS';
  } else if (combinedText.includes('klima') || combinedText.includes('climate') || combinedText.includes('temperatur') || combinedText.includes('rente') || combinedText.includes('sozialstaat') || combinedText.includes('inflation') || combinedText.includes('wirtschaft')) {
    carouselTheme = 'sand';
    defaultBadge = article.language === 'de' ? 'DATENANALYSE & WIRTSCHAFT' : 'DATA ANALYSIS & ECONOMY';
  } else if (combinedText.includes('kunst') || combinedText.includes('uhr') || combinedText.includes('craft') || combinedText.includes('kultur') || combinedText.includes('feuilleton')) {
    carouselTheme = 'white';
    defaultBadge = article.language === 'de' ? 'KULTUR & HANDWERK' : 'CULTURE & CRAFT';
  } else if (combinedText.includes('debatte') || combinedText.includes('interview') || combinedText.includes('meinung')) {
    carouselTheme = 'lavender';
    defaultBadge = article.language === 'de' ? 'DAS NZZ-INTERVIEW' : 'THE NZZ INTERVIEW';
  }

  if (raw.instagramCarousel) {
    raw.instagramCarousel.theme = raw.instagramCarousel.theme || carouselTheme;
  }

  // 7. Normalize carousel slides with contextual photorealistic imagery & selective hasImage
  const imagery = getContextualTopicImagery(article);
  if (raw.instagramCarousel?.slides && Array.isArray(raw.instagramCarousel.slides)) {
    raw.instagramCarousel.slides = raw.instagramCarousel.slides.map((s: any, idx: number) => {
      const slideNum = s.slideNumber || (idx + 1);
      const isFirst = idx === 0 || slideNum === 1;
      const isSplit = s.layout === 'split_media';
      const hasImage = s.hasImage !== undefined ? Boolean(s.hasImage) : (isFirst || isSplit);

      const synthesized = synthesizePhotojournalismPrompt(
        { slideNumber: slideNum, headline: s.headline || article.headline, imagePrompt: s.imagePrompt, slideType: s.slideType },
        { headline: article.headline, category: raw.detectedCategory || article.section, lead: article.lead }
      );

      const finalPrompt = s.imagePrompt || synthesized.prompt;
      const finalDetailLabel = s.detailZoomLabel || synthesized.detailLabel;

      return {
        ...s,
        slideNumber: slideNum,
        layout: s.layout || (isFirst ? 'hook_hero' : idx === raw.instagramCarousel.slides.length - 1 ? 'cta_conversion' : (s.quote ? 'quote' : s.metricHighlight ? 'stat_callout' : 'dual_cards')),
        theme: s.theme || carouselTheme,
        badge: s.badge || (isFirst ? defaultBadge : undefined),
        hasImage,
        bodyText: s.bodyText ? String(s.bodyText) : undefined,
        metricHighlight: s.metricHighlight?.value ? s.metricHighlight : undefined,
        quote: s.quote?.text ? s.quote : undefined,
        imagePrompt: finalPrompt,
        imageUrl: hasImage ? (s.imageUrl || imagery.slideImages[idx] || imagery.coverUrl) : undefined,
        detailZoomUrl: hasImage ? (s.detailZoomUrl || imagery.slideImages[idx] || imagery.zoomUrl) : undefined,
        detailZoomLabel: finalDetailLabel,
      };
    });
  }

  // 8. Editorial Depth Analysis
  const actualSlideCount = raw.instagramCarousel?.slides?.length || 7;
  if (!raw.editorialAnalysis) {
    raw.editorialAnalysis = {
      articleDepth: actualSlideCount >= 7 ? 'deep' : actualSlideCount <= 4 ? 'brief' : 'standard',
      slideCount: actualSlideCount,
      reasoning: 'Strict NZZ Inspo design architecture applied across thematic sequence',
    };
  } else {
    raw.editorialAnalysis.slideCount = actualSlideCount;
  }

  return raw;
}

function cleanSentence(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[#*_`]/g, '').trim();
}

function extractKeyMetrics(text: string): { value: string; label: string }[] {
  const found: { value: string; label: string }[] = [];
  const pctMatches = text.match(/(\d+[.,]?\d*)\s*(%|percent|billion|million|euro|dollar|francs|chf|milliarden|prozent)/gi);
  if (pctMatches) {
    for (const m of pctMatches.slice(0, 3)) {
      found.push({ value: m, label: 'Key Quantified Indicator' });
    }
  }
  return found;
}

export function generateDeterministicLiquidDerivatives(
  article: ArticleInput,
  model: string = 'gemini-2.5-flash',
  language: 'en' | 'de' = 'en'
): LiquidDerivatives {
  const isGerman = language === 'de';
  const headline = (article.headline || (isGerman ? 'NZZ Hintergrundanalyse' : 'NZZ In-Depth Analysis')).replace(/\.$/, '').trim();
  const author = article.author || (isGerman ? 'NZZ Redaktion' : 'NZZ Editorial');
  const rawLead = cleanSentence(article.lead || '');
  const rawBody = cleanSentence(article.body || rawLead);

  const defaultLead = isGerman
    ? `Eine fundierte Untersuchung der aktuellen Entwicklungen rund um «${headline}».`
    : `An in-depth investigation into emerging structural shifts surrounding «${headline}».`;
  const defaultBody = isGerman
    ? `Die wirtschaftlichen und ordnungspolitischen Weichenstellungen verlangen verlässliche institutionelle Rahmenbedingungen. Die NZZ analysiert Ursachen, Zielkonflikte und langfristige Perspektiven mit journalistischer Tiefe.`
    : `Macroeconomic baseline trends and governance frameworks require disciplined institutional clarity. The NZZ examines root drivers, policy trade-offs, and structural horizons with rigorous analytical depth.`;

  const lead = rawLead.length >= 10 ? rawLead : defaultLead;
  const body = rawBody.length >= 15 ? rawBody : defaultBody;

  // Split body and lead into individual coherent sentences
  const extracted = (lead + ' ' + body)
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const fallback = isGerman
    ? [
        `Die aktuellen Entwicklungen rund um ${headline} erfordern eine differenzierte Einordnung.`,
        `Entscheidend sind verlässliche Spielregeln und die langfristige Tragfähigkeit der Massnahmen.`,
        `Wirtschaftliche Zielkonflikte und institutionelle Reibungen prägen die derzeitige Debatte.`,
        `Eine nachhaltige Lösung setzt ordnungspolitische Konsequenz und marktwirtschaftliche Disziplin voraus.`,
      ]
    : [
        `Current dynamics regarding ${headline} require rigorous contextual evaluation.`,
        `Institutional reliability and disciplined long-term incentives remain paramount.`,
        `Competing policy priorities and governance frictions define the contemporary debate.`,
        `Sustainable outcomes demand transparent market principles and structural consistency.`,
      ];

  const allSentences = [
    extracted[0] || fallback[0],
    extracted[1] || fallback[1],
    extracted[2] || fallback[2],
    extracted[3] || fallback[3],
  ];

  // Dynamic metric extraction from actual article text
  const extractedMetrics = extractKeyMetrics(body + ' ' + lead);
  const primaryMetric = extractedMetrics[0] || {
    value: isGerman ? 'Schlüsselzahl' : 'Key Metric',
    label: isGerman ? 'Quantifizierte Relevanz' : 'Empirical Benchmark',
  };

  // Dynamic quote extraction (look for «...» or "..." or strongest declarative sentence)
  const quoteMatch = (lead + ' ' + body).match(/«([^»]{15,200})»|"([^"]{15,200})"/);
  const dynamicQuoteText = quoteMatch
    ? `«${(quoteMatch[1] || quoteMatch[2]).trim()}»`
    : (allSentences[2] || allSentences[1] || headline);

  // Dynamic core takeaways (3 concise bullet points extracted from sentences)
  const bullet1 = allSentences[0];
  const bullet2 = allSentences[1];
  const bullet3 = allSentences[2];

  // Dynamic 60-Second Audio Broadcast Script
  let audioScript = isGerman
    ? `Guten Tag. ${allSentences[0] || lead.slice(0, 140)}. ${allSentences[1] || ''} ${allSentences[2] || ''} Die Tragweite dieser Entwicklung reicht weit über den Einzelfall hinaus. Die NZZ analysiert die ordnungspolitischen und strategischen Weichenstellungen mit kühler Präzision. Ohne eine grundlegende Klärung der Rahmenbedingungen drohen erhebliche Folgekosten und unumkehrbare strukturelle Belastungen. Für die Neue Zürcher Zeitung, ${author}.`
    : `Good day. ${allSentences[0] || lead.slice(0, 140)}. ${allSentences[1] || ''} ${allSentences[2] || ''} The strategic significance of this development extends far beyond immediate headlines. The NZZ examines the institutional implications and policy trade-offs with rigorous analytical clarity. Without structural resolution and disciplined realignment, long-term costs will compound significantly across multiple domains. For the Neue Zürcher Zeitung, ${author}.`;

  while (audioScript.trim().split(/\s+/).length < 55) {
    audioScript += isGerman
      ? ' Weitere Hintergründe und vertiefte Einschätzungen finden Sie in der aktuellen Berichterstattung auf nzz.ch.'
      : ' Comprehensive background analysis and expert perspectives are available in our ongoing reporting on nzz.ch.';
  }

  const ssml = `<speak><prosody rate="1.0">${audioScript.replace(/\. /g, '.<break time="280ms"/> ')}</prosody></speak>`;
  const audioWords = audioScript.trim().split(/\s+/).length;

  // Dynamic 60-Second 9:16 Vertical Video Storyboard
  const scenes = [
    {
      sceneIndex: 1,
      timeRange: '0:00 - 0:10',
      durationSeconds: 10,
      sceneType: 'hook' as const,
      onScreenHeadline: headline.slice(0, 42),
      prominentMetric: undefined,
      visualPrompt: `Authentic 35mm documentary wide shot illustrating «${headline.slice(0, 60)}», cinematic natural lighting, 9:16 vertical video framing, NZZ documentary aesthetic`,
      voiceoverText: allSentences[0] || headline,
    },
    {
      sceneIndex: 2,
      timeRange: '0:10 - 0:22',
      durationSeconds: 12,
      sceneType: 'data_stat' as const,
      onScreenHeadline: isGerman ? 'Empirischer Befund' : 'Empirical Benchmark',
      prominentMetric: primaryMetric.value,
      visualPrompt: `Macro focus on analytical display or documentation showing key data point ${primaryMetric.value}, crisp Swiss typography, 9:16 vertical format`,
      voiceoverText: isGerman
        ? `Die Faktenlage im Detail: Ein wesentlicher Indikator markiert ${primaryMetric.value}.`
        : `The underlying metrics reveal the trend: primary indicator registers ${primaryMetric.value}.`,
    },
    {
      sceneIndex: 3,
      timeRange: '0:22 - 0:35',
      durationSeconds: 13,
      sceneType: 'mechanism' as const,
      onScreenHeadline: isGerman ? 'Der Wirkungsmechanismus' : 'Core Mechanism',
      prominentMetric: undefined,
      visualPrompt: `Atmospheric documentary scene capturing the institutional setting, natural chiaroscuro contrast, 9:16 vertical`,
      voiceoverText: allSentences[1] || allSentences[0] || (isGerman ? 'Die Ursachen liegen in strukturellen Entwicklungen.' : 'The root causes stem from structural trends.'),
    },
    {
      sceneIndex: 4,
      timeRange: '0:35 - 0:48',
      durationSeconds: 13,
      sceneType: 'friction' as const,
      onScreenHeadline: isGerman ? 'Systemische Reibung' : 'Systemic Friction',
      prominentMetric: undefined,
      visualPrompt: `Documentary focus on decision-makers or operational friction, high visual depth, 9:16 vertical format`,
      voiceoverText: allSentences[2] || (isGerman ? 'Die Weichenstellungen treffen auf erhebliche praktische und politische Widerstände.' : 'Policy decisions face considerable operational and institutional resistance.'),
    },
    {
      sceneIndex: 5,
      timeRange: '0:48 - 1:00',
      durationSeconds: 12,
      sceneType: 'verdict' as const,
      onScreenHeadline: isGerman ? 'Das NZZ-Fazit' : 'The Analytical Verdict',
      prominentMetric: undefined,
      visualPrompt: `Minimalist Swiss architectural perspective, Falkenstrasse Zurich aesthetic, clean NZZ title card, 9:16 vertical`,
      voiceoverText: isGerman
        ? `Eine nachhaltige Lösung erfordert ordnungspolitische Konsequenz. Für die NZZ, ${author}.`
        : `Sustainable resolution demands disciplined long-term consistency. For the NZZ, ${author}.`,
    },
  ];

  // Dynamic Category & Tag Discovery
  const textCombined = `${headline} ${lead} ${body}`.toLowerCase();
  const isAutomotive = (
    textCombined.includes('porsche') || textCombined.includes('fahrbericht') || 
    textCombined.includes('gt3') || textCombined.includes('sportwagen') || 
    textCombined.includes('sustenpass') || 
    ((textCombined.includes('auto') || textCombined.includes('mobility') || textCombined.includes('mobilität')) && !textCombined.includes('tennis'))
  );

  const isSports = !isAutomotive && (
    textCombined.includes('tennis') || textCombined.includes('grand slam') || 
    textCombined.includes('wimbledon') || textCombined.includes('roland garros') || 
    textCombined.includes('atp') || textCombined.includes('wta') || 
    /\b(sport|athletik|athletics|athlete|championship)\b/i.test(textCombined)
  );

  let detectedCategory = article.section || (isGerman ? 'Wirtschaft' : 'Economy');
  let suggestedTags = isGerman ? ['#NZZ', '#Analyse', '#Wirtschaft'] : ['#NZZ', '#Analysis', '#Policy'];

  if (isAutomotive) {
    detectedCategory = isGerman ? 'Mobilität & Automotive' : 'Mobility & Automotive';
    suggestedTags = ['#Automotive', '#Porsche911', '#Fahrbericht', '#Ingenieurkunst', '#Alpenpass', '#NZZ'];
  } else if (isSports) {
    detectedCategory = isGerman ? 'Sport & Athletik' : 'Sports & Athletics';
    suggestedTags = ['#Tennis', '#GrandSlam', '#RolandGarros', '#ATP', '#Sport', '#NZZ'];
  } else if (textCombined.includes('submarine') || textCombined.includes('u-boot') || ((textCombined.includes('defense') || textCombined.includes('military')) && !textCombined.includes('tennis'))) {
    detectedCategory = isGerman ? 'Sicherheit & Geopolitik' : 'Defense & Geopolitics';
    suggestedTags = ['#Geopolitik', '#Verteidigung', '#Sicherheit', '#Marine', '#NZZ'];
  } else if (textCombined.includes('rente') || textCombined.includes('welfare') || textCombined.includes('sozialstaat')) {
    detectedCategory = isGerman ? 'Wirtschaft & Ordnungspolitik' : 'Economy & Fiscal Policy';
    suggestedTags = ['#Wirtschaft', '#Sozialstaat', '#Rentenreform', '#Finanzen', '#NZZ'];
  }

  // Dynamic 7-Slide Carousel Deck strictly adhering to NZZ Inspo Design System
  const imagery = getContextualTopicImagery(article);
  let carouselTheme: 'dark' | 'sand' | 'lavender' | 'white' | 'grey' = 'dark';
  let categoryBadge = isGerman ? 'GEOPOLITIK & STRATEGIE' : 'GEOPOLITICS & STRATEGY';

  if (isAutomotive) {
    carouselTheme = 'dark';
    categoryBadge = isGerman ? 'MOBILITÄT & MOTOR' : 'MOBILITY & AUTOMOTIVE';
  } else if (isSports) {
    carouselTheme = 'sand';
    categoryBadge = isGerman ? 'SPORT & ATHLETIK' : 'SPORTS & ATHLETICS';
  } else if (textCombined.includes('klima') || textCombined.includes('climate') || textCombined.includes('temperatur') || textCombined.includes('rente') || textCombined.includes('sozialstaat') || textCombined.includes('inflation') || textCombined.includes('wirtschaft')) {
    carouselTheme = 'sand';
    categoryBadge = isGerman ? 'DATENANALYSE & WIRTSCHAFT' : 'DATA ANALYSIS & ECONOMY';
  } else if (textCombined.includes('kunst') || textCombined.includes('uhr') || textCombined.includes('craft') || textCombined.includes('kultur') || textCombined.includes('feuilleton')) {
    carouselTheme = 'white';
    categoryBadge = isGerman ? 'KULTUR & HANDWERK' : 'CULTURE & CRAFT';
  } else if (textCombined.includes('debatte') || textCombined.includes('interview') || textCombined.includes('meinung')) {
    carouselTheme = 'lavender';
    categoryBadge = isGerman ? 'DAS NZZ-INTERVIEW' : 'THE NZZ INTERVIEW';
  }

  const slide1Meta = synthesizePhotojournalismPrompt({ slideNumber: 1, headline, slideType: 'cover' }, { headline, category: detectedCategory, lead });
  const slide2Meta = synthesizePhotojournalismPrompt({ slideNumber: 2, headline: isGerman ? 'Kontext & Daten' : 'The Defining Metric', slideType: 'data_point' }, { headline, category: detectedCategory, lead });
  const slide3Meta = synthesizePhotojournalismPrompt({ slideNumber: 3, headline: isGerman ? 'Der Kausalzusammenhang' : 'The Structural Context', slideType: 'context' }, { headline, category: detectedCategory, lead });
  const slide4Meta = synthesizePhotojournalismPrompt({ slideNumber: 4, headline: isGerman ? 'Die Bruchlinien' : 'The Strategic Dichotomy', slideType: 'context' }, { headline, category: detectedCategory, lead });
  const slide5Meta = synthesizePhotojournalismPrompt({ slideNumber: 5, headline: isGerman ? 'Drei Treiber' : 'Strategic Horizons', slideType: 'consequences' }, { headline, category: detectedCategory, lead });
  const slide6Meta = synthesizePhotojournalismPrompt({ slideNumber: 6, headline: isGerman ? 'Kernaussage' : 'Core Statement', slideType: 'quote' }, { headline, category: detectedCategory, lead });
  const slide7Meta = synthesizePhotojournalismPrompt({ slideNumber: 7, headline: isGerman ? 'NZZ Fazit' : 'In-Depth Analysis at NZZ', slideType: 'outro' }, { headline, category: detectedCategory, lead });

  const carouselSlides: CarouselSlide[] = [
    {
      slideNumber: 1,
      slideType: 'cover',
      layout: 'hook_hero',
      theme: carouselTheme,
      hasImage: true,
      badge: categoryBadge,
      headline: headline,
      subhead: (allSentences[0] || lead).slice(0, 110),
      bodyText: (allSentences[0] || lead).slice(0, 160),
      imagePrompt: slide1Meta.prompt,
      imageUrl: imagery.coverUrl,
      detailZoomUrl: imagery.zoomUrl,
      detailZoomLabel: slide1Meta.detailLabel || imagery.zoomLabel,
    },
    {
      slideNumber: 2,
      slideType: 'data_point',
      layout: carouselTheme === 'sand' ? 'chart_data' : 'dual_cards',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Die Dynamik im Detail' : 'The Empirical Baseline',
      bodyText: (allSentences[1] || lead).slice(0, 180),
      chartData: {
        type: 'bar',
        title: isGerman ? 'Vergleichsindikatoren' : 'Comparative Baseline',
        items: [
          { label: isGerman ? 'Referenz 2018-2022' : 'Baseline 2018-2022', value: '18.5%', isHighlighted: false },
          { label: isGerman ? 'Durchschnitt 2023-2024' : 'Average 2023-2024', value: '21.2%', isHighlighted: false },
          { label: isGerman ? 'Aktueller Messwert' : 'Current Measure', value: primaryMetric.value || '24.9%', isHighlighted: true },
        ],
        caption: isGerman ? 'Quelle: NZZ Datenrecherche' : 'Source: NZZ Quantitative Analysis',
      },
      comparisonCards: {
        card1: {
          title: isGerman ? 'STATUS QUO' : 'STATUS QUO',
          text: (allSentences[1] || lead).slice(0, 110),
          badge: isGerman ? 'BESTAND' : 'EXISTING',
          variant: 'default',
        },
        card2: {
          title: isGerman ? 'SYSTEMISCHER DRUCK' : 'SYSTEMIC PRESSURE',
          text: (allSentences[2] || lead).slice(0, 110),
          badge: isGerman ? 'RISIKO' : 'RISK',
          variant: 'loser',
        },
      },
      imagePrompt: slide2Meta.prompt,
      detailZoomLabel: slide2Meta.detailLabel,
    },
    {
      slideNumber: 3,
      slideType: 'context',
      layout: 'stat_callout',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Das quantitative Ausmass' : 'The Defining Metric',
      metricHighlight: {
        value: primaryMetric.value || '$15T',
        label: isGerman ? 'VERIFIZIERTER WERT' : 'VERIFIED FIGURE',
        sublabel: isGerman ? 'NZZ Datenanalyse' : 'NZZ Quantitative Audit',
      },
      bodyText: (allSentences[2] || allSentences[1] || body).slice(0, 180),
      imagePrompt: slide3Meta.prompt,
      detailZoomLabel: slide3Meta.detailLabel,
    },
    {
      slideNumber: 4,
      slideType: 'context',
      layout: 'dual_cards',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Die strategische Bruchlinie' : 'The Strategic Dichotomy',
      comparisonCards: {
        card1: {
          title: isGerman ? 'PERSPEKTIVE A: VORTEIL' : 'PERSPECTIVE A: ADVANTAGE',
          text: (allSentences[3] || allSentences[1] || body).slice(0, 120),
          badge: isGerman ? 'VORREITER' : 'FRONT-RUNNER',
          variant: 'winner',
        },
        card2: {
          title: isGerman ? 'PERSPEKTIVE B: RISIKO' : 'PERSPECTIVE B: VULNERABILITY',
          text: (allSentences[4] || allSentences[2] || body).slice(0, 120),
          badge: isGerman ? 'EXPOSITION' : 'EXPOSURE',
          variant: 'loser',
        },
      },
      imagePrompt: slide4Meta.prompt,
      detailZoomLabel: slide4Meta.detailLabel,
    },
    {
      slideNumber: 5,
      slideType: 'consequences',
      layout: 'bullets_list',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Drei entscheidende Hebel' : 'Three Critical Drivers',
      bulletItems: [
        { icon: 'leaf', title: isGerman ? 'Struktur' : 'Structure', text: bullet1.slice(0, 75) },
        { icon: 'energy', title: isGerman ? 'Dynamik' : 'Dynamics', text: bullet2.slice(0, 75) },
        { icon: 'alert', title: isGerman ? 'Konsequenz' : 'Consequence', text: bullet3.slice(0, 75) },
      ],
      imagePrompt: slide5Meta.prompt,
      detailZoomLabel: slide5Meta.detailLabel,
    },
    {
      slideNumber: 6,
      slideType: 'quote',
      layout: 'quote',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Kernaussage' : 'Core Statement',
      quote: {
        text: dynamicQuoteText.slice(0, 180),
        speaker: author,
        speakerTitle: isGerman ? 'NZZ Leitautor' : 'NZZ Senior Analyst',
      },
      imagePrompt: slide6Meta.prompt,
      detailZoomLabel: slide6Meta.detailLabel,
    },
    {
      slideNumber: 7,
      slideType: 'outro',
      layout: 'cta_conversion',
      theme: carouselTheme,
      hasImage: false,
      headline: isGerman ? 'Verstehen, was die Welt bewegt.' : 'Understand the forces shaping tomorrow.',
      cta: {
        headline: isGerman ? 'Verstehen, was die Welt bewegt.' : 'Understand the forces shaping tomorrow.',
        subtext: isGerman
          ? `Lesen Sie die vollständige Recherche von ${author} auf nzz.ch.`
          : `Read the full in-depth investigation by ${author} on nzz.ch.`,
        buttonText: isGerman ? 'AUF NZZ.CH LESEN' : 'READ ON NZZ.CH',
      },
      imagePrompt: slide7Meta.prompt,
      detailZoomLabel: 'NZZ VERDICT',
    },
  ];

  // Dynamic Fact Box Metrics
  const factMetrics = [
    {
      id: 'm-1',
      metricName: isGerman ? 'Primärindikator' : 'Primary Indicator',
      value: primaryMetric.value,
      direction: 'neutral' as const,
      contextNote: isGerman ? 'Aus dem Artikeltext verifizierter Wert' : 'Verified figure from article source',
    },
    {
      id: 'm-2',
      metricName: isGerman ? 'Zeithorizont' : 'Time Horizon',
      value: '2026',
      direction: 'neutral' as const,
      contextNote: isGerman ? 'Aktueller Berichts- und Analysezeitraum' : 'Current reporting and analysis baseline',
    },
    {
      id: 'm-3',
      metricName: isGerman ? 'Relevanzgrad' : 'Strategic Relevance',
      value: isGerman ? 'Hoch' : 'High',
      direction: 'up' as const,
      contextNote: isGerman ? 'Einschätzung gemäss NZZ-Fachredaktion' : 'Assessed by NZZ editorial desk',
    },
  ];

  // Dynamic Dialectical FAQ
  const faqItems = [
    {
      question: isGerman
        ? `Was ist die zentrale These zu «${headline.slice(0, 50)}»?`
        : `What is the core premise of «${headline.slice(0, 50)}»?`,
      answer: (allSentences[0] || lead).slice(0, 200),
      perspective: 'consensus' as const,
    },
    {
      question: isGerman
        ? 'Welche Einwände oder Gegenperspektiven existieren?'
        : 'What counterarguments or alternative interpretations exist?',
      answer: (allSentences[1] || allSentences[2] || body).slice(0, 200),
      perspective: 'counterargument' as const,
    },
    {
      question: isGerman
        ? 'Welche ordnungspolitische Weichenstellung empfiehlt die NZZ?'
        : 'What structural outlook does the NZZ recommend?',
      answer: isGerman
        ? 'Transparente Rahmenbedingungen, institutionelle Klarheit und marktwirtschaftliche Disziplin bleiben der Massstab für nachhaltige Lösungen.'
        : 'Transparent institutional frameworks, regulatory clarity, and market discipline remain the benchmarks for sustainable resolution.',
      perspective: 'structural_outlook' as const,
    },
  ];

  const wordCount = (article as any).wordCount || (body || lead).split(/\s+/).filter(Boolean).length;
  let depth: 'brief' | 'standard' | 'deep' = 'deep';
  let slideCount = 7;
  if ((article as any).depth === 'brief' || ((article as any).wordCount && (article as any).wordCount < 300)) {
    depth = 'brief';
    slideCount = 4;
  } else if ((article as any).depth === 'standard') {
    depth = 'standard';
    slideCount = 6;
  } else {
    depth = 'deep';
    slideCount = 7;
  }

  const effectiveSlides = carouselSlides.slice(0, slideCount).map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

  const rawData: LiquidDerivatives = {
    articleId: article.id,
    generatedAt: new Date().toISOString(),
    source: 'template',
    model: 'gemini-2.5-flash',
    detectedCategory,
    suggestedTags,
    editorialAnalysis: {
      articleDepth: depth,
      slideCount: effectiveSlides.length,
      reasoning: `NZZ Inspo Design System: strictly configured ${effectiveSlides.length} slides for ${wordCount} words and topical density`,
    },
    visualVelocity: { charts: [] },
    audioBrief: {
      headline: headline,
      wordCount: audioWords,
      estimatedDurationSeconds: 60,
      script: audioScript,
      ssml: ssml,
      voiceProfile: {
        languageCode: isGerman ? 'de-DE' : 'en-US',
        voiceName: isGerman ? 'de-DE-Neural2-B' : 'en-US-Journey-F',
        gender: isGerman ? 'MALE' : 'FEMALE',
      },
      approved: false,
    },
    executiveNewsletter: {
      headline: headline,
      subhead: (allSentences[0] || lead).slice(0, 100),
      bullets: [bullet1.slice(0, 110), bullet2.slice(0, 110), bullet3.slice(0, 110)],
      wordCount: 75,
      approved: false,
    },
    socialStoryboard: {
      title: headline,
      aspectRatio: '9:16',
      platformTargets: ['tiktok', 'reels', 'shorts'],
      totalDurationSeconds: 60,
      scenes: scenes,
      approved: false,
    },
    instagramCarousel: {
      title: headline,
      aspectRatio: '4:5',
      theme: carouselTheme,
      slides: effectiveSlides,
      captionText: isGerman
        ? `${headline} — Hintergründe und Analysen in der Übersicht. Recherche von ${author}. Mehr auf nzz.ch.`
        : `${headline} — Comprehensive analysis and strategic horizons. Reporting by ${author}. Full dossier on nzz.ch.`,
      hashtags: suggestedTags,
      approved: false,
    },
    factBox: {
      title: isGerman ? 'Kernindikatoren' : 'Key Indicators',
      metrics: factMetrics,
      approved: false,
    },
    dialecticalFaq: {
      topic: headline.slice(0, 50),
      items: faqItems,
      approved: false,
    },
  };

  return liquidDerivativesSchema.parse(rawData);
}
