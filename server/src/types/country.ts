export interface CountryStorySummary {
  id: string;
  headline: string;
  lead: string | null;
  section: string | null;
  publishedAt: Date | null;
  teaserImage: Record<string, unknown> | null;
  tags: string[];
}

export interface CountryConnection {
  id: string;
  source: { countryCode: string; countryName: string };
  target: { countryCode: string; countryName: string };
  storyCount: number;
  stories: CountryStorySummary[];
}

export interface CountryCoverage {
  countryCode: string;
  countryName: string;
  storyCount: number;
  recentStoryCount: number;
  lastPublishedAt: Date | null;
}
