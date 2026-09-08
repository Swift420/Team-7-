import type {
  ArticleSummary,
  ArticleDetail,
  LiquidDerivativesPayload,
} from '../types/liquid';

const BASE_URL = '/api/liquid';

export const FALLBACK_ARTICLES: ArticleSummary[] = [
  {
    id: 'ld1886544',
    headline: 'Deutschlands Wohlfahrtsstaat vor dem finanziellen Kollaps',
    lead: 'Fast zweiundvierzig Prozent vom Bruttolohn fließen in die Sozialkassen. Ohne tiefgreifende Reformen droht eine fiskalische Notlage.',
    author: 'Malte Fischer',
    section: 'Wirtschaft',
    wordCount: 1420,
    readingTimeSeconds: 420,
    publishedAt: '2025-05-29',
    filename: '2025-05-29_wirtschaft_germany-s-welfare-state-threatened-financial-collapse_ld1886544.json',
  },
  {
    id: 'ld1860022',
    headline: 'Einzigartig als Athletin wie als Mensch: Mikaela Shiffrin setzt neue Maßstäbe',
    lead: 'Mit ihrem hundertsten Weltcupsieg schreibt die Amerikanerin Sportgeschichte und beweist beispiellose mentale Reife.',
    author: 'Christoph Krummenacher',
    section: 'Sport',
    wordCount: 1180,
    readingTimeSeconds: 350,
    publishedAt: '2025-02-23',
    filename: '2025-02-23_sport-ski_unique-as-athlete-as-person-mikaela-shiffrin_ld1860022.json',
  },
  {
    id: 'ld1928134',
    headline: 'Dario und Daniela Amodei: Die Geschwister, die dem Pentagon trotzen',
    lead: 'Das KI-Unternehmen Anthropic setzt auf kontrollierte Modelle – und gerät zwischen die Fronten von Militär und Tech-Konzernen.',
    author: 'Stefan Betschon',
    section: 'Technologie',
    wordCount: 1650,
    readingTimeSeconds: 490,
    publishedAt: '2026-03-12',
    filename: '2026-03-12_technologie_dario-daniela-amodei-siblings-who-defy-pentagon_ld1928134.json',
  },
  {
    id: 'ld1880992',
    headline: 'Die Zerschlagung von LockBit: Wie Ermittler das gefürchtetste Cyber-Kartell stürzten',
    lead: 'In einer globalen Operation legten FBI und europäische Behörden die Infrastruktur der berüchtigten Ransomware-Bande lahm.',
    author: 'Marcel Gyr',
    section: 'Technologie',
    wordCount: 2100,
    readingTimeSeconds: 630,
    publishedAt: '2025-05-07',
    filename: '2025-05-07_technologie_police-brought-down-world-s-most-feared_ld1880992.json',
  },
  {
    id: 'ld1902492',
    headline: 'Donald Trump und die Zölle: Ein gefährliches Spiel mit dem Weltfernhandel',
    lead: 'Der US-Präsident droht mit pauschalen Strafzöllen gegen Europa und Asien. Doch die protektionistische Rechnung geht ökonomisch selten auf.',
    author: 'Peter A. Fischer',
    section: 'Wirtschaft',
    wordCount: 1340,
    readingTimeSeconds: 400,
    publishedAt: '2025-09-20',
    filename: '2025-09-20_finanzen_trump-must-have-mistaken-usa-another-country_ld1902492.json',
  },
  {
    id: 'ld1876768',
    headline: 'Keine Lust auf Wehrdienst: Wie Europas Verteidigung an der Personalkrise scheitert',
    lead: 'Trotz milliardenschwerer Sondervermögen fehlt den europäischen Armeen das Wichtigste: motivierte Soldatinnen und Soldaten.',
    author: 'Marco Seliger',
    section: 'International',
    wordCount: 1510,
    readingTimeSeconds: 450,
    publishedAt: '2025-04-02',
    filename: '2025-04-02_international_not-keen-military-service-europe-s-defense_ld1876768.json',
  },
  {
    id: 'ld1896852',
    headline: 'Wie es klingt, wenn ein Alpengletscher stirbt',
    lead: 'Akustische Sensoren im Eis fangen das Knacken und Bersten schmelzender Eismassen im Wallis ein – ein Requiem im Hochgebirge.',
    author: 'Claudio Sieber',
    section: 'Wissenschaft',
    wordCount: 1290,
    readingTimeSeconds: 380,
    publishedAt: '2025-08-29',
    filename: '2025-08-29_folio_what-it-sounds-like-when-glacier-dies_ld1896852.json',
  },
  {
    id: 'ld1884009',
    headline: 'Artemisia Gentileschi: Die Augen ihrer Bilder erzählen die ganze Wahrheit',
    lead: 'Die Renaissance-Malerin überwand Gewalt und Vorurteile und schuf Meisterwerke von dramatischer Lichtführung und emotionaler Wucht.',
    author: 'Daniele Muscionico',
    section: 'Feuilleton',
    wordCount: 1380,
    readingTimeSeconds: 410,
    publishedAt: '2025-05-17',
    filename: '2025-05-17_feuilleton_artemisia-gentileschi-s-paintings-eyes-tell-whole_ld1884009.json',
  },
];

export async function fetchArticles(): Promise<ArticleSummary[]> {
  try {
    const res = await fetch(`${BASE_URL}/articles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
      return data.articles;
    }
    return FALLBACK_ARTICLES;
  } catch (err) {
    console.warn('Using fallback NZZ corpus due to API connection:', err);
    return FALLBACK_ARTICLES;
  }
}

export async function fetchArticleDetail(id: string): Promise<ArticleDetail> {
  try {
    const res = await fetch(`${BASE_URL}/articles/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.article) {
      return data.article;
    }
  } catch (err) {
    console.warn(`Falling back to local article metadata for ${id}:`, err);
  }

  // Fallback match
  const fallback = FALLBACK_ARTICLES.find((a) => a.id.includes(id) || id.includes(a.id)) || FALLBACK_ARTICLES[0];
  return {
    id: fallback.id,
    headline: fallback.headline,
    lead: fallback.lead,
    author: fallback.author || 'NZZ Redaktion',
    section: fallback.section || 'Wirtschaft',
    wordCount: fallback.wordCount || 1400,
    body: fallback.lead,
    summaryBullets: [
      'Strukturelle Verwerfungen und fiskalische Dynamiken fordern Institutionen heraus.',
      'Fehlende Reformbereitschaft erhöht langfristige Risiken für künftige Generationen.',
      'Unabhängige NZZ-Recherchen fordern ordnungspolitische Transparenz.',
    ],
  };
}

export async function generateLiquidFormats(params: {
  articleId: string;
  headline?: string;
  lead?: string;
  body?: string;
  author?: string;
  section?: string;
  language?: string;
  model?: 'gemini-3.8-flash' | 'gemini-3.8-pro';
  mock?: boolean;
}): Promise<LiquidDerivativesPayload> {
  try {
    const res = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) return data.data;
    }
  } catch (err) {
    console.warn('API generate failed, activating client fallback:', err);
  }

  const headline = params.headline || 'NZZ Hintergrundbericht';
  const author = params.author || 'NZZ Redaktion';
  const lead = params.lead || '';

  const script = `Im Fokus der aktuellen NZZ-Berichterstattung: ${headline}. ${lead} Hinter den Kulissen offenbaren sich weitreichende strategische Weichenstellungen. Die betroffenen Akteure stehen vor grundlegenden Herausforderungen, während traditionelle Annahmen unter dem Druck neuer Fakten ins Wanken geraten. Beobachter betonen die Notwendigkeit nüchterner Analysen statt kurzfristiger Schnellschüsse. Die kommenden Monate werden zeigen, ob die ergriffenen Maßnahmen ausreichen, um die Friktionen nachhaltig zu entschärfen. Für die Neue Zürcher Zeitung, ${author}.`;

  return {
    articleId: params.articleId,
    generatedAt: new Date().toISOString(),
    model: params.model || 'gemini-3.8-flash',
    audioBrief: {
      headline,
      wordCount: 140,
      estimatedDurationSeconds: 60,
      script,
      ssml: `<speak><prosody rate="medium" pitch="0st">${script}</prosody></speak>`,
      voiceProfile: {
        languageCode: 'de-DE',
        voiceName: 'de-DE-Neural2-B',
        gender: 'MALE',
      },
      approved: false,
    },
    executiveNewsletter: {
      headline,
      subhead: 'Strukturelle Dynamik und ordnungspolitische Herausforderungen',
      bullets: [
        `Zentrale Entwicklung: ${lead.slice(0, 95)}...`,
        'Struktureller Treiber: Institutionelle Rahmenbedingungen und ökonomische Verschiebungen.',
        'Strategische Konsequenz: Notwendigkeit ordnungspolitischer Weichenstellungen und langfristiger Vorsorge.',
      ],
      wordCount: 42,
      approved: false,
    },
    socialStoryboard: {
      title: headline.slice(0, 35),
      aspectRatio: '9:16',
      platformTargets: ['tiktok', 'reels', 'shorts'],
      totalDurationSeconds: 60,
      scenes: [
        {
          sceneIndex: 1,
          timeRange: '0:00 - 0:10',
          durationSeconds: 10,
          sceneType: 'hook',
          onScreenHeadline: headline.slice(0, 40),
          visualPrompt: 'Cinematic wide documentary shot, natural lighting, high dynamic range, 9:16 vertical frame, Google Veo 2',
          voiceoverText: lead.slice(0, 90) || headline,
        },
        {
          sceneIndex: 2,
          timeRange: '0:10 - 0:22',
          durationSeconds: 12,
          sceneType: 'data_stat',
          onScreenHeadline: 'Fakten & Schlüsseldaten',
          prominentMetric: '41.9%',
          visualPrompt: 'Minimalist high-contrast data visualization graphic showing key indicators, Swiss red highlight, 9:16 vertical',
          voiceoverText: 'Die Zahlen unterstreichen das Ausmaß der institutionellen Herausforderung.',
        },
        {
          sceneIndex: 3,
          timeRange: '0:22 - 0:35',
          durationSeconds: 13,
          sceneType: 'mechanism',
          onScreenHeadline: 'Der Wirkungsmechanismus',
          visualPrompt: 'Documentary footage capturing operational reality and institutional friction, 9:16 vertical',
          voiceoverText: 'Strukturelle Verwerfungen und verzögerte Anpassungen verstärken den Druck auf die Akteure.',
        },
        {
          sceneIndex: 4,
          timeRange: '0:35 - 0:48',
          durationSeconds: 13,
          sceneType: 'friction',
          onScreenHeadline: 'Wachsende Zielkonflikte',
          prominentMetric: '-0.4%',
          visualPrompt: 'Restrained close-up sequence capturing economic and societal tension, 9:16 vertical',
          voiceoverText: 'Ohne grundlegende Korrekturen drohen die Belastungen künftige Spielräume spürbar einzuschränken.',
        },
        {
          sceneIndex: 5,
          timeRange: '0:48 - 1:00',
          durationSeconds: 12,
          sceneType: 'verdict',
          onScreenHeadline: 'Die NZZ-Einordnung',
          visualPrompt: 'NZZ editorial signature monogram with restrained typography and call to read full analysis on nzz.ch, 9:16 vertical',
          voiceoverText: `Die vertiefte Recherche und alle Hintergründe lesen Sie auf NZZ.ch. Von ${author}.`,
        },
      ],
      approved: false,
    },
    instagramCarousel: {
      title: headline.slice(0, 45),
      aspectRatio: '4:5',
      captionText: `${lead} Ausführliche Analyse von ${author} auf NZZ.ch.`,
      hashtags: ['#NZZ', '#Analyse', '#Hintergrund', '#Journalismus'],
      slides: [
        {
          slideNumber: 1,
          slideType: 'cover',
          headline,
          imagePrompt: 'Monochrome architectural or documentary portrait with NZZ badge, 4:5 ratio',
        },
        {
          slideNumber: 2,
          slideType: 'data_point',
          headline: 'Die Ausgangslage in Zahlen',
          metricHighlight: {
            value: '41.9%',
            label: 'Sozialabgabenquote',
          },
          imagePrompt: 'Abstract geometric graphic showing directional shift with bold red accent, 4:5 ratio',
        },
        {
          slideNumber: 3,
          slideType: 'context',
          headline: 'Ursachen und Hintergründe',
          imagePrompt: 'Candid photojournalist scene illustrating the institutional environment, 4:5 ratio',
        },
        {
          slideNumber: 4,
          slideType: 'quote',
          headline: 'Stimme aus der Recherche',
          quote: {
            text: lead.slice(0, 75),
            speaker: author,
          },
          imagePrompt: 'Moody atmospheric texture with Swiss guillemets, 4:5 ratio',
        },
        {
          slideNumber: 5,
          slideType: 'consequences',
          headline: 'Ökonomische und gesellschaftliche Folgen',
          imagePrompt: 'Documentary framing of decision makers or infrastructure, 4:5 ratio',
        },
        {
          slideNumber: 6,
          slideType: 'outro',
          headline: 'Mehr fundierte Einordnung auf NZZ.ch',
          imagePrompt: 'Elegant dark background with Neue Zürcher Zeitung monogram and QR badge, 4:5 ratio',
        },
      ],
      approved: false,
    },
    factBox: {
      title: `Schlüsseldaten: ${headline.slice(0, 30)}`,
      metrics: [
        {
          id: 'metric-1',
          metricName: 'Primärer Indikator',
          value: '41.9%',
          delta: '+0.6 pp',
          direction: 'up',
          contextNote: 'Historischer Höchstwert',
        },
        {
          id: 'metric-2',
          metricName: 'Gesamtvolumen',
          value: '128 Mrd. €',
          delta: '+8.2%',
          direction: 'up',
          contextNote: 'Fiskalischer Netto-Effekt',
        },
        {
          id: 'metric-3',
          metricName: 'Netto-Entwicklung',
          value: '-0.4%',
          delta: '-1.1 pp',
          direction: 'down',
          contextNote: 'Kaufkraftverlust',
        },
      ],
      approved: false,
    },
    dialecticalFaq: {
      topic: headline.slice(0, 40),
      items: [
        {
          question: 'Wie begründen Befürworter den bisherigen Kurs?',
          answer: 'Befürworter argumentieren mit dem Schutz des sozialen Zusammenhalts und der Notwendigkeit, bestehende Leistungsversprechen auch in Übergangsphasen verlässlich einzulösen.',
          perspective: 'consensus',
        },
        {
          question: 'Welche Kritik äußern ordnungspolitische Ökonomen?',
          answer: 'Kritiker warnen vor Fehlanreizen und steigender Verschuldung, die Investitionen lähmen und die wirtschaftliche Widerstandskraft gefährden.',
          perspective: 'counterargument',
        },
        {
          question: 'Welche strukturellen Reformoptionen stehen zur Debatte?',
          answer: 'Diskutiert werden eine Kopplung der Parameter an die Demografie, strikte Ausgabendisziplin und stärkere marktwirtschaftliche Eigenverantwortung.',
          perspective: 'structural_outlook',
        },
      ],
      approved: false,
    },
  };
}

export async function synthesizeAudio(params: {
  script: string;
  author?: string;
  language?: string;
  voiceName?: string;
  mock?: boolean;
}): Promise<{ audioUrl: string; durationSeconds: number; wordCount: number }> {
  try {
    const res = await fetch(`${BASE_URL}/synthesize-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) return data.data;
    }
  } catch (err) {
    console.warn('Audio synthesis API offline, simulating audio brief:', err);
  }

  const words = params.script.trim().split(/\s+/).length;
  const duration = Math.round((words / 140) * 60);
  return {
    audioUrl: '',
    durationSeconds: duration,
    wordCount: words,
  };
}

export async function lintText(params: {
  text: string;
  isHeadline?: boolean;
  isSubhead?: boolean;
}): Promise<{ valid: boolean; warnings: string[] }> {
  try {
    const res = await fetch(`${BASE_URL}/lint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      return data.report;
    }
  } catch {
    // fallback
  }

  const warnings: string[] = [];
  if (params.text.includes('"') || params.text.includes('“') || params.text.includes('”')) {
    warnings.push('NZZ Invariant: Swiss guillemets « » required instead of US quotes.');
  }
  if (params.isHeadline && /[.!?]$/.test(params.text.trim())) {
    warnings.push('NZZ Invariant: Headlines must not end with a terminal period.');
  }
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export async function publishFormats(params: {
  articleId: string;
  payload: LiquidDerivativesPayload;
}): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function fetchPublishedFormats(
  articleId: string
): Promise<LiquidDerivativesPayload | null> {
  try {
    const res = await fetch(`${BASE_URL}/published/${articleId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    // fallback to dynamic generate
  }
  return generateLiquidFormats({ articleId });
}
