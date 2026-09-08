import { z } from 'zod';

export const audioBriefSchema = z.object({
  headline: z.string().min(5),
  wordCount: z.number().int().min(80).max(200),
  estimatedDurationSeconds: z.number().int().min(45).max(80),
  script: z.string().min(50),
  ssml: z.string().min(50),
  audioUrl: z.string().optional(),
  voiceProfile: z.object({
    languageCode: z.string(),
    voiceName: z.string(),
    gender: z.enum(['MALE', 'FEMALE']),
  }),
  approved: z.boolean().default(false),
});

export const executiveNewsletterSchema = z.object({
  headline: z.string().min(5),
  subhead: z.string().min(5),
  bullets: z.tuple([z.string().min(10), z.string().min(10), z.string().min(10)]),
  wordCount: z.number().int().max(150),
  approved: z.boolean().default(false),
});

export const videoSceneSchema = z.object({
  sceneIndex: z.number().int().min(1).max(5),
  timeRange: z.string(),
  durationSeconds: z.number().int().min(5).max(20),
  sceneType: z.enum(['hook', 'data_stat', 'mechanism', 'friction', 'verdict']),
  onScreenHeadline: z.string().min(3),
  prominentMetric: z.string().optional(),
  visualPrompt: z.string().min(10),
  voiceoverText: z.string().min(10),
});

export const socialStoryboardSchema = z.object({
  title: z.string().min(5),
  aspectRatio: z.literal('9:16'),
  platformTargets: z.array(z.enum(['tiktok', 'reels', 'shorts'])),
  totalDurationSeconds: z.number().int().min(50).max(75),
  scenes: z.array(videoSceneSchema).length(5),
  approved: z.boolean().default(false),
});

export const carouselSlideSchema = z.object({
  slideNumber: z.number().int().min(1).max(6),
  slideType: z.enum(['cover', 'data_point', 'context', 'quote', 'consequences', 'outro']),
  headline: z.string().min(3),
  bodyText: z.string().optional(),
  metricHighlight: z
    .object({
      value: z.string(),
      label: z.string(),
    })
    .optional(),
  quote: z
    .object({
      text: z.string(),
      speaker: z.string(),
    })
    .optional(),
  imagePrompt: z.string().min(10),
});

export const instagramCarouselSchema = z.object({
  title: z.string().min(5),
  aspectRatio: z.enum(['1:1', '4:5']),
  slides: z.array(carouselSlideSchema).length(6),
  captionText: z.string().min(20),
  hashtags: z.array(z.string()).min(2),
  approved: z.boolean().default(false),
});

export const factBoxMetricSchema = z.object({
  id: z.string(),
  metricName: z.string().min(2),
  value: z.string().min(1),
  delta: z.string().optional(),
  direction: z.enum(['up', 'down', 'neutral']).optional(),
  contextNote: z.string().min(5),
});

export const factBoxSchema = z.object({
  title: z.string().min(3),
  metrics: z.array(factBoxMetricSchema).min(2).max(6),
  approved: z.boolean().default(false),
});

export const dialecticalFaqItemSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(15),
  perspective: z.enum(['consensus', 'counterargument', 'structural_outlook']),
});

export const dialecticalFaqSchema = z.object({
  topic: z.string().min(3),
  items: z.array(dialecticalFaqItemSchema).length(3),
  approved: z.boolean().default(false),
});

export const liquidDerivativesSchema = z.object({
  articleId: z.string(),
  generatedAt: z.string(),
  model: z.enum(['gemini-3.8-flash', 'gemini-3.8-pro']),
  audioBrief: audioBriefSchema,
  executiveNewsletter: executiveNewsletterSchema,
  socialStoryboard: socialStoryboardSchema,
  instagramCarousel: instagramCarouselSchema,
  factBox: factBoxSchema,
  dialecticalFaq: dialecticalFaqSchema,
});

export type LiquidDerivatives = z.infer<typeof liquidDerivativesSchema>;
