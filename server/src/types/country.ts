export interface CountryStorySummary {
  id: string;
  headline: string;
  lead: string | null;
  section: string | null;
  publishedAt: Date | null;
  teaserImage: Record<string, unknown> | null;
  tags: string[];
}

export interface CountryCoverage {
  countryCode: string;
  countryName: string;
  storyCount: number;
  recentStoryCount: number;
  lastPublishedAt: Date | null;
}
