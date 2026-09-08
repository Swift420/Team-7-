export interface AudioBriefFormat {
  headline: string;
  wordCount: number;
  estimatedDurationSeconds: number;
  script: string;
  ssml: string;
  audioUrl?: string;
  voiceProfile: {
    languageCode: string;
    voiceName: string;
    gender: 'MALE' | 'FEMALE';
  };
  approved: boolean;
}

export interface ExecutiveNewsletterFormat {
  headline: string;
  subhead: string;
  bullets: [string, string, string];
  wordCount: number;
  approved: boolean;
}

export interface VideoScene {
  sceneIndex: number;
  timeRange: string;
  durationSeconds: number;
  sceneType: 'hook' | 'data_stat' | 'mechanism' | 'friction' | 'verdict';
  onScreenHeadline: string;
  prominentMetric?: string;
  visualPrompt: string;
  voiceoverText: string;
}

export interface SocialStoryboardFormat {
  title: string;
  aspectRatio: '9:16';
  platformTargets: ('tiktok' | 'reels' | 'shorts')[];
  totalDurationSeconds: number;
  scenes: VideoScene[];
  approved: boolean;
}

export interface CarouselSlide {
  slideNumber: number;
  slideType: 'cover' | 'data_point' | 'context' | 'quote' | 'consequences' | 'outro';
  headline: string;
  bodyText?: string;
  metricHighlight?: {
    value: string;
    label: string;
  };
  quote?: {
    text: string;
    speaker: string;
  };
  imagePrompt: string;
}

export interface InstagramCarouselFormat {
  title: string;
  aspectRatio: '1:1' | '4:5';
  slides: CarouselSlide[];
  captionText: string;
  hashtags: string[];
  approved: boolean;
}

export interface FactBoxMetric {
  id: string;
  metricName: string;
  value: string;
  delta?: string;
  direction?: 'up' | 'down' | 'neutral';
  contextNote: string;
}

export interface FactBoxFormat {
  title: string;
  metrics: FactBoxMetric[];
  approved: boolean;
}

export interface DialecticalFAQItem {
  question: string;
  answer: string;
  perspective: 'consensus' | 'counterargument' | 'structural_outlook';
}

export interface DialecticalFAQFormat {
  topic: string;
  items: DialecticalFAQItem[];
  approved: boolean;
}

export interface LiquidDerivativesPayload {
  articleId: string;
  generatedAt: string;
  model: 'gemini-3.8-flash' | 'gemini-3.8-pro';
  audioBrief: AudioBriefFormat;
  executiveNewsletter: ExecutiveNewsletterFormat;
  socialStoryboard: SocialStoryboardFormat;
  instagramCarousel: InstagramCarouselFormat;
  factBox: FactBoxFormat;
  dialecticalFaq: DialecticalFAQFormat;
}

export interface ArticleSummary {
  id: string;
  document_id?: number;
  headline: string;
  lead: string;
  author?: string;
  section?: string;
  wordCount?: number;
  readingTimeSeconds?: number;
  publishedAt?: string;
  filename: string;
}

export interface ArticleDetail {
  id: string;
  headline: string;
  lead: string;
  author: string;
  section: string;
  wordCount: number;
  body: string;
  summaryBullets?: string[];
  teaserImage?: {
    url: string;
    caption: string;
    credit: string;
  };
}
