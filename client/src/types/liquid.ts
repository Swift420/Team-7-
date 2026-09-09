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
  imageUrl?: string;
}

export interface SocialStoryboardFormat {
  title: string;
  aspectRatio: '9:16';
  platformTargets: ('tiktok' | 'reels' | 'shorts')[];
  totalDurationSeconds: number;
  scenes: VideoScene[];
  videoUrl?: string;
  approved: boolean;
}

export type CarouselTheme = 'dark' | 'sand' | 'lavender' | 'grey' | 'white';
export type CarouselSlideLayout =
  | 'hook_hero'
  | 'split_media'
  | 'stat_callout'
  | 'dual_cards'
  | 'chart_data'
  | 'bullets_list'
  | 'quote'
  | 'cta_conversion';

export interface CarouselSlide {
  slideNumber: number; // 1 to 7
  slideType: 'cover' | 'data_point' | 'context' | 'quote' | 'consequences' | 'outro' | string;
  layout?: CarouselSlideLayout;
  headline: string;
  subhead?: string;
  bodyText?: string;
  badge?: string;
  theme?: CarouselTheme;
  hasImage?: boolean;
  metricHighlight?: {
    value: string;
    label: string;
    sublabel?: string;
  };
  comparisonCards?: {
    card1: { title: string; text: string; badge?: string; variant?: 'default' | 'winner' | 'unacceptable' };
    card2: { title: string; text: string; badge?: string; variant?: 'default' | 'loser' | 'high_risk' };
    card3?: { title: string; text: string; badge?: string; variant?: 'default' | 'neutral' | 'limited_risk' };
  };
  chartData?: {
    type?: 'bar' | 'line';
    title?: string;
    items?: { label: string; value: string; isHighlighted?: boolean; percent?: number }[];
    caption?: string;
  };
  bulletItems?: {
    icon?: string;
    title?: string;
    text: string;
  }[];
  quote?: {
    text: string;
    speaker: string;
    speakerTitle?: string;
  };
  cta?: {
    headline: string;
    subtext: string;
    buttonText: string;
  };
  imagePrompt: string;
  imageUrl?: string;
  detailZoomUrl?: string;
  detailZoomLabel?: string;
}

export interface InstagramCarouselFormat {
  title: string;
  category?: string;
  detectedCategory?: string;
  aspectRatio: '1:1' | '4:5';
  theme?: CarouselTheme;
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

export interface ChartConfig {
  type: 'line' | 'bar' | 'donut';
  title: string;
  data: { label: string; value: number }[];
  unit?: string;
  sourceLabel?: string;
}

export interface VisualVelocityFormat {
  charts: ChartConfig[];
}

export interface EditorialAnalysis {
  articleDepth: 'brief' | 'standard' | 'deep';
  slideCount: number;
  reasoning: string;
}

export interface LiquidDerivativesPayload {
  articleId: string;
  generatedAt: string;
  source?: 'vertex-ai' | 'gemini-api' | 'cloud-tts' | 'imagen' | 'template';
  model: string;
  elapsedMs?: number;
  detectedCategory?: string;
  suggestedTags?: string[];
  editorialAnalysis?: EditorialAnalysis;
  audioBrief: AudioBriefFormat;
  executiveNewsletter: ExecutiveNewsletterFormat;
  socialStoryboard: SocialStoryboardFormat;
  instagramCarousel: InstagramCarouselFormat;
  factBox: FactBoxFormat;
  dialecticalFaq: DialecticalFAQFormat;
  visualVelocity?: VisualVelocityFormat;
}

export interface ArticleSummary {
  id: string;
  document_id?: number;
  headline: string;
  lead: string;
  author?: string;
  section?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  wordCount?: number;
  readingTimeSeconds?: number;
  publishedAt?: string;
  createdAt?: string;
  filename?: string;
  language?: 'en' | 'de';
}

export interface ArticleDetail {
  id: string;
  headline: string;
  lead: string;
  author: string;
  section: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  wordCount: number;
  body: string;
  summaryBullets?: string[];
  teaserImage?: {
    url: string;
    caption: string;
    credit: string;
  };
  language?: 'en' | 'de';
}

