import { query, withTransaction } from '../config/database.js';
import { CountryCoverage, CountryStorySummary } from '../types/country.js';

export interface CountryAssignment { code: string; name: string; relevance: number; confidence: number; evidence: string[] }

export async function replaceArticleCountries(articleId: string, assignments: CountryAssignment[]) {
  await withTransaction(async (client) => {
    await client.query('DELETE FROM article_countries WHERE article_id = $1', [articleId]);
    for (const assignment of assignments) {
      await client.query(`INSERT INTO article_countries (article_id, country_code, country_name, relevance_score, confidence, source, evidence) VALUES ($1,$2,$3,$4,$5,'rules',$6)`, [articleId, assignment.code, assignment.name, assignment.relevance, assignment.confidence, JSON.stringify(assignment.evidence)]);
    }
  });
}

export async function listCountryCoverage(): Promise<CountryCoverage[]> {
  const result = await query<{ country_code: string; country_name: string; story_count: string; recent_story_count: string; last_published_at: Date | null }>(`SELECT ac.country_code, ac.country_name, COUNT(*)::text AS story_count, COUNT(*) FILTER (WHERE a.published_at >= now() - interval '90 days')::text AS recent_story_count, MAX(a.published_at) AS last_published_at FROM article_countries ac JOIN articles a ON a.id = ac.article_id GROUP BY ac.country_code, ac.country_name ORDER BY COUNT(*) DESC, MAX(a.published_at) DESC NULLS LAST`);
  return result.rows.map((row) => ({ countryCode: row.country_code, countryName: row.country_name, storyCount: Number(row.story_count), recentStoryCount: Number(row.recent_story_count), lastPublishedAt: row.last_published_at }));
}

export async function listCountryStories(code: string): Promise<CountryStorySummary[]> {
  const result = await query<{ id: string; headline: string; lead: string | null; section: string | null; published_at: Date | null; teaser_image: Record<string, unknown> | null; tags: string[] }>(`SELECT a.id, a.headline, a.lead, a.section, a.published_at, a.teaser_image, a.tags FROM article_countries ac JOIN articles a ON a.id = ac.article_id WHERE ac.country_code = $1 ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC`, [code.toUpperCase()]);
  return result.rows.map((row) => ({ id: row.id, headline: row.headline, lead: row.lead, section: row.section, publishedAt: row.published_at, teaserImage: row.teaser_image, tags: row.tags || [] }));
}
