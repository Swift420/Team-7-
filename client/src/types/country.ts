export interface CountryCoverage {
  countryCode: string;
  countryName: string;
  storyCount: number;
  recentStoryCount: number;
  lastPublishedAt: string | null;
}

export interface CountryStorySummary {
  id: string;
  headline: string;
  lead: string | null;
  section: string | null;
  publishedAt: string | null;
  teaserImage: Record<string, unknown> | null;
  tags: string[];
}
