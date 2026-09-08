import { randomUUID } from 'node:crypto';
import { query, withTransaction } from '../config/database.js';
import { SavedVisualization, VisualizationApproval, VisualizationOpportunity } from '../types/visualization.js';

interface VisualizationRow {
  id: string;
  article_id: string;
  status: 'approved';
  placement_after_element_id: string;
  specification: VisualizationOpportunity;
  created_at: Date;
  updated_at: Date;
}

const columns = 'id, article_id, status, placement_after_element_id, specification, created_at, updated_at';
const mapRow = (row: VisualizationRow): SavedVisualization => ({
  id: row.id,
  articleId: row.article_id,
  status: row.status,
  placementAfterElementId: row.placement_after_element_id,
  specification: row.specification,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listArticleVisualizations(articleId: string): Promise<SavedVisualization[]> {
  const result = await query<VisualizationRow>(
    `SELECT ${columns} FROM article_visualizations WHERE article_id = $1 ORDER BY created_at`,
    [articleId],
  );
  return result.rows.map(mapRow);
}

export async function replaceArticleVisualizations(articleId: string, specifications: VisualizationOpportunity[]): Promise<SavedVisualization[]> {
  return withTransaction(async (client) => {
    await client.query('DELETE FROM article_visualizations WHERE article_id = $1', [articleId]);
    const saved: SavedVisualization[] = [];
    for (const specification of specifications) {
      const result = await client.query<VisualizationRow>(
        `INSERT INTO article_visualizations (id, article_id, placement_after_element_id, specification)
         VALUES ($1, $2, $3, $4) RETURNING ${columns}`,
        [randomUUID(), articleId, specification.suggestedPlacementAfter, JSON.stringify(specification)],
      );
      saved.push(mapRow(result.rows[0]));
    }
    await client.query(
      `INSERT INTO visualization_approval_history (id, article_id, actor, action, visualizations) VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), articleId, 'editor', specifications.length ? 'saved' : 'cleared', JSON.stringify(specifications)],
    );
    return saved;
  });
}

export async function listVisualizationApprovals(articleId: string): Promise<VisualizationApproval[]> {
  const result = await query<{ id: string; article_id: string; actor: string; action: 'saved' | 'cleared'; visualizations: VisualizationOpportunity[]; created_at: Date }>(
    `SELECT id, article_id, actor, action, visualizations, created_at FROM visualization_approval_history WHERE article_id = $1 ORDER BY created_at DESC`,
    [articleId],
  );
  return result.rows.map((row) => ({ id: row.id, articleId: row.article_id, actor: row.actor, action: row.action, visualizations: row.visualizations, createdAt: row.created_at }));
}
