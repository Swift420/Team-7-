import fs from 'node:fs/promises';
import path from 'node:path';
import { ArticleRecord } from '../types/article.js';
import { ExistingVisualization, VisualizationChartType } from '../types/visualization.js';

interface QToolPayload {
  _id?: string;
  tool?: string;
  title?: string;
  subtitle?: string;
  notes?: string | null;
  data?: unknown;
  options?: { chartType?: string };
  sources?: Array<{ text?: string; link?: { url?: string } }>;
}

const qDataRoot = () => process.env.Q_DATA_DIR || path.resolve(process.cwd(), '../VisualVelocity/input/q_data');

function articleDirectory(article: ArticleRecord): string | null {
  if (!article.nzzId) return null;
  return article.nzzId.replace(/[^a-zA-Z0-9]/g, '');
}

function chartTypeForQTool(value?: string): VisualizationChartType | null {
  const normalized = value?.toLowerCase();
  if (normalized === 'bar') return 'bar';
  if (normalized === 'line') return 'line';
  if (normalized === 'area') return 'area';
  if (normalized === 'stackedbar') return 'stacked_bar';
  if (normalized === 'dotplot') return 'dot_plot';
  return null;
}

function numberFromQTool(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().replace(/[\s'’ ]/g, '').replace(/%|\$/g, '').replace(',', '.');
  if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseCsv(content: string): string[][] {
  return content.trim().split(/\r?\n/).map((line) => {
    const cells: string[] = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) { cell += '"'; index += 1; }
      else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) { cells.push(cell.trim()); cell = ''; }
      else cell += character;
    }
    cells.push(cell.trim());
    return cells;
  });
}

function chartData(table: unknown[][], elementId: string) {
  if (table.length < 3) {
    return { series: [], data: [] };
  }
  const headers = table[0].map(String);
  if (headers.length < 2) return { series: [], data: [] };
  const series = headers.slice(1).map((label, index) => ({ key: `series_${index + 1}`, label }));
  const data = table.slice(1).map((row) => ({
    label: String(row[0] ?? ''),
    values: row.slice(1, headers.length).map(numberFromQTool),
    sourceElementIds: [elementId],
  }));
  if (data.some((point) => point.values.length !== series.length || point.values.some((value) => value === null))) {
    return { series: [], data: [] };
  }
  return { series, data: data.map((point) => ({ ...point, values: point.values as number[] })) };
}

export async function loadExistingVisualizations(article: ArticleRecord): Promise<ExistingVisualization[]> {
  const directoryName = articleDirectory(article);
  if (!directoryName) return [];
  const directory = path.join(qDataRoot(), directoryName);
  let files: string[];
  try {
    files = await fs.readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const results: ExistingVisualization[] = [];
  for (const element of article.body.filter((item) => item.type === 'q_tool_embed' && item.externalId)) {
    const prefix = `${element.externalId}_`;
    const jsonFile = files.find((file) => file.startsWith(prefix) && file.endsWith('.json') && !file.endsWith('.usage.json'));
    if (!jsonFile) continue;
    const payload = JSON.parse(await fs.readFile(path.join(directory, jsonFile), 'utf8')) as QToolPayload;
    const csvFile = files.find((file) => file.startsWith(prefix) && file.endsWith('.csv'));
    const rawTable = Array.isArray(payload.data) && payload.data.every(Array.isArray)
      ? payload.data as unknown[][]
      : csvFile ? parseCsv(await fs.readFile(path.join(directory, csvFile), 'utf8')) : [];
    const { series, data } = chartData(rawTable, element.id);
    const assetUrls = files
      .filter((file) => file.startsWith(prefix) && /\.(png|jpe?g|webp|gif)$/i.test(file))
      .sort()
      .map((file) => `/api/visual-assets/${encodeURIComponent(directoryName)}/${encodeURIComponent(file)}`);
    results.push({
      elementId: element.id,
      externalId: element.externalId!,
      tool: payload.tool || 'unknown',
      title: payload.title || 'Existing data visualization',
      subtitle: payload.subtitle || '',
      notes: payload.notes || '',
      sources: (payload.sources || []).map((source) => ({ text: source.text || 'Source', url: source.link?.url || '' })),
      chartType: payload.tool === 'chart'
        ? chartTypeForQTool(payload.options?.chartType)
        : payload.tool === 'choropleth' ? 'map'
        : payload.tool?.startsWith('election_') && data.length ? 'bar' : null,
      series,
      data,
      table: rawTable.map((row) => row.map((cell) => String(cell ?? ''))),
      assetUrls,
      mapData: payload.tool === 'choropleth' ? rawTable.slice(1).map((row) => ({ label: String(row[0] ?? ''), value: String(row[1] ?? '') })) : undefined,
    });
  }
  return results;
}
