import { z } from "zod";

// Gemini output is untrusted until every derivative passes these schemas.
export const audioBriefSchema = z.object({
  headline: z.string().min(3),
  wordCount: z.number().int().min(50).max(250),
  estimatedDurationSeconds: z.number().int().min(30).max(120),
  script: z.string().min(30),
  ssml: z.string().min(30),
  audioUrl: z.string().nullable().optional(),
  voiceProfile: z.object({
    languageCode: z.string(),
    voiceName: z.string(),
    gender: z.enum(["MALE", "FEMALE"]).optional().default("FEMALE"),
  }),
  approved: z.boolean().default(false),
});

export const executiveNewsletterSchema = z.object({
  headline: z.string().min(3),
  subhead: z.string().min(3),
  bullets: z.array(z.string()).min(2).max(5),
  wordCount: z.number().int().max(250),
  approved: z.boolean().default(false),
});

export const videoSceneSchema = z.object({
  sceneIndex: z.number().int().min(1).max(10).optional().default(1),
  timeRange: z.string().optional().default("0:00 - 0:12"),
  durationSeconds: z.number().int().min(3).max(30).optional().default(12),
  sceneType: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z
        .enum(["hook", "data_stat", "mechanism", "friction", "verdict"])
        .catch("hook"),
    ),
  onScreenHeadline: z.string().min(2),
  prominentMetric: z.string().nullable().optional(),
  visualPrompt: z.string().min(5),
  voiceoverText: z.string().min(5),
  imageUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  videoStatus: z.enum(["idle", "generating", "ready", "failed"]).optional(),
  modelUsed: z.string().optional(),
});

export const socialStoryboardSchema = z.object({
  title: z.string().min(3),
  aspectRatio: z.literal("9:16"),
  platformTargets: z
    .array(z.enum(["tiktok", "reels", "shorts"]))
    .optional()
    .default(["tiktok", "reels", "shorts"]),
  totalDurationSeconds: z.number().int().min(30).max(120),
  scenes: z.array(videoSceneSchema).min(3).max(7),
  renderedVideoUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  renderedVideoStatus: z.enum(["idle", "rendering", "ready", "failed"]).optional(),
  approved: z.boolean().default(false),
});

export const carouselSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(10).optional().default(1),
  slideType: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z
        .enum([
          "cover",
          "data_point",
          "context",
          "quote",
          "consequences",
          "outro",
        ])
        .catch("context"),
    ),
  layout: z
    .enum([
      "hook_hero",
      "split_media",
      "stat_callout",
      "dual_cards",
      "chart_data",
      "bullets_list",
      "quote",
      "cta_conversion",
    ])
    .optional(),
  headline: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim().length >= 2 ? v.trim() : "NZZ")),
  subhead: z.string().nullable().optional(),
  bodyText: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  theme: z.enum(["dark", "sand", "lavender", "grey", "white"]).optional(),
  hasImage: z.boolean().optional(),
  metricHighlight: z
    .object({
      value: z.string(),
      label: z.string(),
      sublabel: z.string().optional(),
    })
    .nullable()
    .optional(),
  comparisonCards: z
    .object({
      card1: z.object({
        title: z.string(),
        text: z.string(),
        badge: z.string().optional(),
        variant: z.string().optional(),
      }),
      card2: z.object({
        title: z.string(),
        text: z.string(),
        badge: z.string().optional(),
        variant: z.string().optional(),
      }),
      card3: z
        .object({
          title: z.string(),
          text: z.string(),
          badge: z.string().optional(),
          variant: z.string().optional(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  chartData: z
    .object({
      type: z.enum(["bar", "line"]).optional().default("bar"),
      title: z.string().optional(),
      items: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
            isHighlighted: z.boolean().optional(),
            percent: z.number().optional(),
          }),
        )
        .optional(),
      caption: z.string().optional(),
    })
    .nullable()
    .optional(),
  bulletItems: z
    .array(
      z.object({
        icon: z.string().optional(),
        title: z.string().optional(),
        text: z.string(),
      }),
    )
    .nullable()
    .optional(),
  quote: z
    .object({
      text: z.string(),
      speaker: z.string(),
      speakerTitle: z.string().optional(),
    })
    .nullable()
    .optional(),
  cta: z
    .object({
      headline: z.string(),
      subtext: z.string(),
      buttonText: z.string(),
    })
    .nullable()
    .optional(),
  imagePrompt: z.string().optional().default(""),
  imageUrl: z.string().nullable().optional(),
  detailZoomUrl: z.string().nullable().optional(),
  detailZoomLabel: z.string().nullable().optional(),
});

export const instagramCarouselSchema = z.object({
  title: z.string().min(3),
  aspectRatio: z.enum(["1:1", "4:5"]).optional().default("4:5"),
  theme: z
    .enum(["dark", "sand", "lavender", "grey", "white"])
    .optional()
    .default("dark"),
  slides: z.array(carouselSlideSchema).min(4).max(10),
  captionText: z.string().min(10),
  hashtags: z.array(z.string()).min(1),
  approved: z.boolean().default(false),
});

export const factBoxMetricSchema = z.object({
  id: z
    .string()
    .optional()
    .default(() => Math.random().toString(36).slice(2, 7)),
  metricName: z.string().min(1).optional().default("Indicator"),
  value: z.string().min(1),
  delta: z.string().nullable().optional(),
  direction: z.enum(["up", "down", "neutral"]).optional().default("neutral"),
  contextNote: z.string().nullable().optional().default(""),
});

export const factBoxSchema = z.object({
  title: z.string().min(2),
  metrics: z.array(factBoxMetricSchema).min(1).max(8),
  approved: z.boolean().default(false),
});

export const dialecticalFaqItemSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(5),
  perspective: z
    .string()
    .transform((v) => v.toLowerCase())
    .pipe(
      z
        .enum(["consensus", "counterargument", "structural_outlook"])
        .catch("consensus"),
    ),
});

export const dialecticalFaqSchema = z.object({
  topic: z.string().min(2).optional().default("Economic Analysis"),
  items: z.array(dialecticalFaqItemSchema).min(1).max(5),
  approved: z.boolean().default(false),
});

export const chartPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
});

export const chartSeriesSchema = z.object({
  name: z.string(),
  points: z.array(chartPointSchema),
});

export const chartConfigSchema = z.object({
  id: z.string(),
  chartType: z.enum(["line", "bar", "grouped_bar", "area", "scatter"]),
  title: z.string(),
  subtitle: z.string().optional().default(""),
  sourceNote: z.string().optional().default(""),
  xAxisLabel: z.string().optional().default(""),
  yAxisLabel: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  series: z.array(chartSeriesSchema),
  confidence: z.number().optional().default(1.0),
  sourceSentence: z.string(),
  approved: z.boolean().default(false),
});

export const visualVelocitySchema = z.object({
  charts: z.array(chartConfigSchema).default([]),
});

export type ChartConfig = z.infer<typeof chartConfigSchema>;
export type VisualVelocity = z.infer<typeof visualVelocitySchema>;

export const editorialAnalysisSchema = z.object({
  articleDepth: z.enum(["brief", "standard", "deep"]).default("standard"),
  slideCount: z.number().int().min(3).max(10).default(6),
  reasoning: z
    .string()
    .default("Determined from article length and narrative depth"),
});

export const liquidDerivativesSchema = z.object({
  articleId: z.string().optional().default("art-1"),
  generatedAt: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  source: z
    .enum(["vertex-ai", "gemini-api", "cloud-tts", "imagen", "template"])
    .default("vertex-ai"),
  model: z.string().optional().default("gemini-2.5-flash"),
  elapsedMs: z.number().optional(),
  detectedCategory: z.string().optional(),
  suggestedTags: z.array(z.string()).optional(),
  editorialAnalysis: editorialAnalysisSchema.optional(),
  audioBrief: audioBriefSchema,
  executiveNewsletter: executiveNewsletterSchema,
  socialStoryboard: socialStoryboardSchema,
  instagramCarousel: instagramCarouselSchema,
  factBox: factBoxSchema,
  dialecticalFaq: dialecticalFaqSchema,
  visualVelocity: visualVelocitySchema.default({ charts: [] }),
});

export type LiquidDerivatives = z.infer<typeof liquidDerivativesSchema>;
export type CarouselSlide = z.infer<typeof carouselSlideSchema>;
export type AudioBrief = z.infer<typeof audioBriefSchema>;
export type ExecutiveNewsletter = z.infer<typeof executiveNewsletterSchema>;
export type SocialStoryboard = z.infer<typeof socialStoryboardSchema>;
export type InstagramCarousel = z.infer<typeof instagramCarouselSchema>;
export type FactBox = z.infer<typeof factBoxSchema>;
export type DialecticalFaq = z.infer<typeof dialecticalFaqSchema>;
