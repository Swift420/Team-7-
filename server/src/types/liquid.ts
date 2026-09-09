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
    gender: "MALE" | "FEMALE";
  };
  approved: boolean;
}

export interface ExecutiveNewsletterFormat {
  headline: string;
  subhead: string;
  bullets: string[]; // validated by the generation schema
  wordCount: number;
  approved: boolean;
}

export interface VideoScene {
  sceneIndex: number; // 1 to 5
  timeRange: string; // e.g. "0:00 - 0:10"
  durationSeconds: number; // 10-14s
  sceneType: "hook" | "data_stat" | "mechanism" | "friction" | "verdict";
  onScreenHeadline: string;
  prominentMetric?: string;
  visualPrompt: string; // Art direction for Google Veo 3.1 / Imagen 3
  voiceoverText: string;
  imageUrl?: string;
  videoUrl?: string;
  videoStatus?: "idle" | "generating" | "ready" | "failed";
  modelUsed?: string;
}

export interface SocialStoryboardFormat {
  title: string;
  aspectRatio: "9:16";
  platformTargets: ("tiktok" | "reels" | "shorts")[];
  totalDurationSeconds: number; // ~60 seconds
  scenes: VideoScene[]; // 5 scenes
  renderedVideoUrl?: string;
  renderedVideoStatus?: "idle" | "rendering" | "ready" | "failed";
  approved: boolean;
}

export type CarouselTheme = "dark" | "sand" | "lavender" | "grey" | "white";
export type CarouselSlideLayout =
  | "hook_hero"
  | "split_media"
  | "stat_callout"
  | "dual_cards"
  | "chart_data"
  | "bullets_list"
  | "quote"
  | "cta_conversion";

export interface CarouselSlide {
  slideNumber: number; // 1 to 7
  slideType:
    | "cover"
    | "data_point"
    | "context"
    | "quote"
    | "consequences"
    | "outro"
    | string;
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
    card1: {
      title: string;
      text: string;
      badge?: string;
      variant?: "default" | "winner" | "unacceptable";
    };
    card2: {
      title: string;
      text: string;
      badge?: string;
      variant?: "default" | "loser" | "high_risk";
    };
    card3?: {
      title: string;
      text: string;
      badge?: string;
      variant?: "default" | "neutral" | "limited_risk";
    };
  };
  chartData?: {
    type?: "bar" | "line";
    title?: string;
    items?: {
      label: string;
      value: string;
      isHighlighted?: boolean;
      percent?: number;
    }[];
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
  imagePrompt: string; // Prompt for Google Imagen 3 / Flux
  imageUrl?: string;
  detailZoomUrl?: string;
  detailZoomLabel?: string;
}

export interface InstagramCarouselFormat {
  title: string;
  aspectRatio: "1:1" | "4:5";
  theme?: CarouselTheme;
  slides: CarouselSlide[]; // Strictly 7 slides per NZZ Design System
  captionText: string; // Ready-to-publish social copy
  hashtags: string[];
  approved: boolean;
}

export interface FactBoxMetric {
  id: string;
  metricName: string;
  value: string;
  delta?: string;
  direction?: "up" | "down" | "neutral";
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
  perspective: "consensus" | "counterargument" | "structural_outlook";
}

export interface DialecticalFAQFormat {
  topic: string;
  items: DialecticalFAQItem[]; // 3 items
  approved: boolean;
}

export interface EditorialAnalysis {
  articleDepth: "brief" | "standard" | "deep";
  slideCount: number;
  reasoning: string;
}

export interface LiquidDerivativesPayload {
  articleId: string;
  generatedAt: string;
  model: string;
  detectedCategory?: string;
  suggestedTags?: string[];
  editorialAnalysis?: EditorialAnalysis;
  audioBrief: AudioBriefFormat;
  executiveNewsletter: ExecutiveNewsletterFormat;
  socialStoryboard: SocialStoryboardFormat;
  instagramCarousel: InstagramCarouselFormat;
  factBox: FactBoxFormat;
  dialecticalFaq: DialecticalFAQFormat;
}
