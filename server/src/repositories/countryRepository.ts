import { query, withTransaction } from '../config/database.js';
import { CountryConnection, CountryCoverage, CountryStorySummary } from '../types/country.js';

export interface CountryAssignment {
  code: string;
  name: string;
  relevance: number;
  confidence: number;
  evidence: string[];
}

export async function replaceArticleCountries(articleId: string, assignments: CountryAssignment[]): Promise<void> {
  try {
    await withTransaction(async (client) => {
      await client.query('DELETE FROM article_countries WHERE article_id = $1', [articleId]);
      for (const assignment of assignments) {
        await client.query(
          `INSERT INTO article_countries (article_id, country_code, country_name, relevance_score, confidence, source, evidence) VALUES ($1,$2,$3,$4,$5,'rules',$6)`,
          [
            articleId,
            assignment.code,
            assignment.name,
            assignment.relevance,
            assignment.confidence,
            JSON.stringify(assignment.evidence),
          ]
        );
      }
    });
  } catch (err: any) {
    console.warn(`[CountryRepository] Could not persist countries for article ${articleId} (Postgres offline):`, err.message);
  }
}

export async function listCountryCoverage(): Promise<CountryCoverage[]> {
  try {
    const result = await query<{
      country_code: string;
      country_name: string;
      story_count: string;
      recent_story_count: string;
      last_published_at: Date | null;
    }>(
      `SELECT ac.country_code, ac.country_name, COUNT(*)::text AS story_count, COUNT(*) FILTER (WHERE a.published_at >= now() - interval '90 days')::text AS recent_story_count, MAX(a.published_at) AS last_published_at FROM article_countries ac JOIN articles a ON a.id = ac.article_id WHERE a.publication_status = 'published' GROUP BY ac.country_code, ac.country_name ORDER BY COUNT(*) DESC, MAX(a.published_at) DESC NULLS LAST`
    );
    return result.rows.map((row) => ({
      countryCode: row.country_code,
      countryName: row.country_name,
      storyCount: Number(row.story_count),
      recentStoryCount: Number(row.recent_story_count),
      lastPublishedAt: row.last_published_at,
    }));
  } catch {
    return [];
  }
}

export async function listCountryStories(code: string): Promise<CountryStorySummary[]> {
  try {
    const result = await query<{
      id: string;
      headline: string;
      lead: string | null;
      section: string | null;
      published_at: Date | null;
      teaser_image: Record<string, unknown> | null;
      tags: string[];
    }>(
      `SELECT a.id, a.headline, a.lead, a.section, a.published_at, a.teaser_image, a.tags FROM article_countries ac JOIN articles a ON a.id = ac.article_id WHERE ac.country_code = $1 AND a.publication_status = 'published' ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC`,
      [code.toUpperCase()]
    );
    return result.rows.map((row) => ({
      id: row.id,
      headline: row.headline,
      lead: row.lead,
      section: row.section,
      publishedAt: row.published_at,
      teaserImage: row.teaser_image,
      tags: row.tags || [],
    }));
  } catch {
    return [];
  }
}

export async function listCountryConnections(limit = 120): Promise<CountryConnection[]> {
  try {
    const result = await query<{
      article_id: string;
      headline: string;
      lead: string | null;
      section: string | null;
      published_at: Date | null;
      teaser_image: Record<string, unknown> | null;
      tags: string[];
      source_code: string;
      source_name: string;
      target_code: string;
      target_name: string;
    }>(
      `SELECT a.id AS article_id, a.headline, a.lead, a.section, a.published_at, a.teaser_image, a.tags,
        ac1.country_code AS source_code, ac1.country_name AS source_name,
        ac2.country_code AS target_code, ac2.country_name AS target_name
      FROM article_countries ac1
      JOIN article_countries ac2 ON ac2.article_id = ac1.article_id AND ac1.country_code < ac2.country_code
      JOIN articles a ON a.id = ac1.article_id
      WHERE a.publication_status = 'published'
      ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
      LIMIT $1`,
      [Math.max(1, limit * 8)]
    );
    const grouped = new Map<string, CountryConnection>();
    for (const row of result.rows) {
      const id = `${row.source_code}-${row.target_code}`;
      const connection = grouped.get(id) || {
        id,
        source: { countryCode: row.source_code, countryName: row.source_name },
        target: { countryCode: row.target_code, countryName: row.target_name },
        storyCount: 0,
        stories: [],
      };
      connection.storyCount += 1;
      if (!connection.stories.some((story) => story.id === row.article_id)) {
        connection.stories.push({
          id: row.article_id,
          headline: row.headline,
          lead: row.lead,
          section: row.section,
          publishedAt: row.published_at,
          teaserImage: row.teaser_image,
          tags: row.tags || [],
        });
      }
      grouped.set(id, connection);
    }
    return [...grouped.values()].sort((a, b) => b.storyCount - a.storyCount).slice(0, limit);
  } catch {
    return [];
  }
}
