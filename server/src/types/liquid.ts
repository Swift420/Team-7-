export interface AudioBriefFormat {
  headline: string;
  wordCount: number;
  estimatedDurationSeconds: number; // strictly 55-65s
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
  bullets: [string, string, string]; // strictly 3 bullets
  wordCount: number;
  approved: boolean;
}

export interface VideoScene {
  sceneIndex: number; // 1 to 5
  timeRange: string; // e.g. "0:00 - 0:10"
  durationSeconds: number; // 10-14s
  sceneType: 'hook' | 'data_stat' | 'mechanism' | 'friction' | 'verdict';
  onScreenHeadline: string;
  prominentMetric?: string;
  visualPrompt: string; // Art direction for Google Veo 2 / Imagen 3
  voiceoverText: string;
}

export interface SocialStoryboardFormat {
  title: string;
  aspectRatio: '9:16';
  platformTargets: ('tiktok' | 'reels' | 'shorts')[];
  totalDurationSeconds: number; // ~60 seconds
  scenes: VideoScene[]; // 5 scenes
  approved: boolean;
}

export interface CarouselSlide {
  slideNumber: number; // 1 to 6
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
  imagePrompt: string; // Prompt for Google Imagen 3
}

export interface InstagramCarouselFormat {
  title: string;
  aspectRatio: '1:1' | '4:5';
  slides: CarouselSlide[]; // Exactly 6 slides
  captionText: string; // Ready-to-publish social copy
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
  items: DialecticalFAQItem[]; // 3 items
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
