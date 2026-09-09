import type {
  InstagramCarouselFormat,
  SocialStoryboardFormat,
  AudioBriefFormat,
  ExecutiveNewsletterFormat,
} from '../../types/liquid';

export type DerivativeAssetType =
  | 'instagram_carousel'
  | 'vertical_video'
  | 'commuter_audio'
  | 'executive_brief';

export type AssetStatus = 'idle' | 'generating' | 'ready' | 'error';

export type GlobalGenerationState =
  | 'idle'
  | 'generating'
  | 'partial'
  | 'complete'
  | 'failed'
  | 'cancelled';

export interface ArticleInclusionSettings {
  commuterAudioEnabled: boolean;
  executiveBriefEnabled: boolean;
}

export interface VideoDetails {
  durationSeconds: number;
  format: string;
  subtitles: string;
  style: string;
}

export interface StudioAssetData {
  carousel?: InstagramCarouselFormat;
  storyboard?: SocialStoryboardFormat;
  audioBrief?: AudioBriefFormat;
  executiveBrief?: ExecutiveNewsletterFormat;
}
