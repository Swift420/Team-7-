import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { z } from 'zod';
import { ArticleRecord } from '../types/article.js';
import { VisualizationAnalysis, VisualizationOpportunity } from '../types/visualization.js';
import { ExistingVisualization } from '../types/visualization.js';
import { loadExistingVisualizations } from './existingVisualService.js';

const seriesSchema = z.object({
  key: z.string().trim().min(1).regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().trim().min(1),
});

const dataPointSchema = z.object({
  label: z.string().trim().min(1),
  values: z.array(z.number().finite()).min(1).max(3),
  sourceElementIds: z.array(z.string().trim().min(1)).min(1),
});

const timelineEventSchema = z.object({
  dateLabel: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  sourceParagraphIds: z.array(z.string().trim().min(1)).min(1),
});

const opportunitySchema = z.object({
  type: z.enum(['CHART', 'TIMELINE']).optional(),
  title: z.string().trim().min(1),
  subtitle: z.string().trim(),
  rationale: z.string().trim().min(1).optional(),
  reason: z.string().trim().min(1).optional(),
  chartType: z.enum(['bar', 'line', 'area', 'stacked_bar', 'dot_plot', 'donut', 'timeline']),
  confidence: z.number().min(0).max(1),
  dataStatus: z.enum(['ready', 'needs_review']),
  relatedElementIds: z.array(z.string().trim().min(1)).min(1),
  suggestedPlacementAfter: z.string().trim().min(1),
  xAxisLabel: z.string().trim(),
  yAxisLabel: z.string().trim(),
  unit: z.string().trim(),
  series: z.array(seriesSchema).max(3),
  data: z.array(dataPointSchema).max(16),
  events: z.array(timelineEventSchema).max(24).optional(),
  sourceNote: z.string().trim(),
  caveats: z.array(z.string().trim().min(1)).max(5),
  accessibilitySummary: z.string().trim().min(1),
}).superRefine((opportunity, context) => {
  if (opportunity.chartType === 'timeline') {
    return;
  }
  if (opportunity.series.length < 1) context.addIssue({ code: 'custom', path: ['series'], message: 'A chart needs at least one numeric series' });
  if (opportunity.data.length < 2) context.addIssue({ code: 'custom', path: ['data'], message: 'A chart needs at least two data points' });
  opportunity.data.forEach((point, index) => {
    if (point.values.length !== opportunity.series.length) {
      context.addIssue({
        code: 'custom',
        path: ['data', index, 'values'],
        message: 'Each data point must contain one value per series',
      });
    }
  });
});

const modelAnalysisSchema = z.object({
  summary: z.string().trim().min(1),
  opportunities: z.array(opportunitySchema).max(6),
});

const responseJsonSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['CHART', 'TIMELINE'] },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          rationale: { type: 'string' },
          reason: { type: 'string' },
          chartType: { type: 'string', enum: ['bar', 'line', 'area', 'stacked_bar', 'dot_plot', 'donut', 'timeline'] },
          confidence: { type: 'number' },
          dataStatus: { type: 'string', enum: ['ready', 'needs_review'] },
          relatedElementIds: { type: 'array', items: { type: 'string' } },
          suggestedPlacementAfter: { type: 'string' },
          xAxisLabel: { type: 'string' },
          yAxisLabel: { type: 'string' },
          unit: { type: 'string' },
          series: {
            type: 'array',
            items: {
              type: 'object',
              properties: { key: { type: 'string' }, label: { type: 'string' } },
              required: ['key', 'label'],
            },
          },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                values: { type: 'array', items: { type: 'number' } },
                sourceElementIds: { type: 'array', items: { type: 'string' } },
              },
              required: ['label', 'values', 'sourceElementIds'],
            },
          },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                dateLabel: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
                sourceParagraphIds: { type: 'array', items: { type: 'string' } },
              },
              required: ['dateLabel', 'title', 'description', 'sourceParagraphIds'],
            },
          },
          sourceNote: { type: 'string' },
          caveats: { type: 'array', items: { type: 'string' } },
          accessibilitySummary: { type: 'string' },
        },
        required: [
          'title', 'subtitle', 'chartType', 'confidence', 'dataStatus',
          'relatedElementIds', 'suggestedPlacementAfter', 'xAxisLabel', 'yAxisLabel',
          'unit', 'series', 'data', 'events', 'sourceNote', 'caveats', 'accessibilitySummary',
        ],
      },
    },
  },
  required: ['summary', 'opportunities'],
};

export class VisualizationAnalysisError extends Error {
  constructor(message: string, public readonly code: 'AI_NOT_CONFIGURED' | 'AI_RESPONSE_INVALID' | 'AI_REQUEST_FAILED') {
    super(message);
    this.name = 'VisualizationAnalysisError';
  }
}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GCP_LOCATION || 'us-central1';
  if (!project) {
    throw new VisualizationAnalysisError('GOOGLE_CLOUD_PROJECT (or GCP_PROJECT_ID) is not configured', 'AI_NOT_CONFIGURED');
  }
  client ??= new GoogleGenAI({ vertexai: true, project, location, httpOptions: { apiVersion: 'v1' } });
  return client;
}

function articlePrompt(article: ArticleRecord, maxOpportunities: number, existingVisuals: ExistingVisualization[]): string {
  const elements = article.body
    .map((element) => {
      if (element.text && /@import\s+url\(|ml-form-|g-recaptcha|mailerlite|<\/?style\b|<\/?script\b|document\.querySelector/i.test(element.text)) return '';
      if (element.text?.trim()) return `[${element.id} | ${element.type}]\n${element.text.trim()}`;
      if (element.type === 'q_tool_embed') return `[${element.id} | EXISTING VISUAL | ${element.externalId || 'unknown id'}]`;
      return `[${element.id} | ${element.type}]`;
    })
    .join('\n\n');

  const existing = existingVisuals.length
    ? existingVisuals.map((visual) => `- ${visual.elementId}: ${visual.tool}; title="${visual.title}"; subtitle="${visual.subtitle}"`).join('\n')
    : '- None';

  return `You are an editorial data-visualization analyst. Analyze the supplied article and identify up to ${maxOpportunities} strong, non-duplicative opportunities for a reader-facing chart.

Hard rules:
- Use only numeric facts explicitly present in the supplied article. Never invent, interpolate, browse for, or estimate values.
- Every plotted value must cite one or more valid article element IDs in sourceElementIds.
- Do not recreate a chart already represented by an embed in the article.
- Existing visuals suppress only the same metric and narrative. Look for genuinely distinct comparisons, margins, changes, or chronology elsewhere in the text; do not return zero merely because the article contains other charts.
- Recommend a visualization only when there are at least two comparable numeric data points.
- Keep one consistent unit per opportunity. Do not mix percentages with percentage points or absolute numbers.
- Use dataStatus "needs_review" when meaning, unit, chronology, or comparability is ambiguous; otherwise use "ready".
- series keys must be lowercase snake_case and every data point must contain exactly one numeric value per series, in the same order.
- Select the chart form that best communicates the evidence; do not default reflexively to bars.
- Use bar for direct categorical magnitude comparisons.
- Use dot_plot when precise comparison across several categories matters and a zero baseline is not the story.
- Use line for genuine ordered time series; use area only when accumulated magnitude or volume is meaningful.
- Use stacked_bar only for part-to-whole comparisons where values share a denominator and normally sum to about 100.
- Use donut only for a simple part-to-whole snapshot with 2–5 mutually exclusive categories. Never use it for change over time.
- Use timeline only when chronology is genuinely important to the story, not merely because dates appear. Detect exact dates, months, years, decades, and relative references such as "three months later", "after the announcement", "twenty years earlier", or "the following week". Preserve approximate wording such as "late 2000s" or "around 2020". Prefer 3–8 meaningful events, never invent dates/events, and use dataStatus "needs_review" when dates conflict or remain unclear. For a timeline set type to "TIMELINE", chartType to "timeline", put the editorial explanation in reason, and provide sourceParagraphIds for every event.
- Always include an events array (use [] for non-timeline charts).
- Write titles, labels, rationale, caveats, and accessibility summaries in the article language.
- If no trustworthy chart can be made from the text alone, return an empty opportunities array and explain why in summary.

ARTICLE METADATA
Headline: ${article.headline}
Lead: ${article.lead || ''}
Language: ${article.language || 'unknown'}
Section: ${article.section || 'unknown'}

EXISTING VISUALS — preserve these and do not recommend the same metric, comparison, or narrative again
${existing}

ARTICLE ELEMENTS
${elements}`;
}

export function parseVisualizationAnalysis(raw: string, article: ArticleRecord, model: string): VisualizationAnalysis {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new VisualizationAnalysisError('Gemini returned malformed JSON', 'AI_RESPONSE_INVALID');
  }

  const parsed = modelAnalysisSchema.safeParse(json);
  if (!parsed.success) {
    throw new VisualizationAnalysisError(`Gemini response failed validation: ${z.prettifyError(parsed.error)}`, 'AI_RESPONSE_INVALID');
  }

  const validElementIds = new Set(article.body.map((element) => element.id));
  const opportunities: VisualizationOpportunity[] = parsed.data.opportunities.filter((opportunity) => opportunity.chartType !== 'timeline' || (opportunity.events && opportunity.events.length >= 2)).map((opportunity, index) => {
    const referencedIds = new Set([
      ...opportunity.relatedElementIds,
      opportunity.suggestedPlacementAfter,
      ...opportunity.data.flatMap((point) => point.sourceElementIds),
      ...(opportunity.events || []).flatMap((event) => event.sourceParagraphIds),
    ]);
    const unknownIds = [...referencedIds].filter((id) => !validElementIds.has(id));
    if (unknownIds.length) {
      throw new VisualizationAnalysisError(`Gemini referenced unknown article elements: ${unknownIds.join(', ')}`, 'AI_RESPONSE_INVALID');
    }
    const rationale = opportunity.rationale || opportunity.reason || 'Editorial visualization opportunity.';
    return { ...opportunity, rationale, type: opportunity.type || (opportunity.chartType === 'timeline' ? 'TIMELINE' : 'CHART'), id: `visual-${index + 1}` };
  });

  return { model, analyzedAt: new Date().toISOString(), summary: parsed.data.summary, opportunities };
}

export async function analyzeArticleVisualizations(article: ArticleRecord, maxOpportunities = 4): Promise<VisualizationAnalysis> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const existingVisuals = await loadExistingVisualizations(article);
    const response = await getClient().models.generateContent({
      model,
      contents: articlePrompt(article, maxOpportunities, existingVisuals),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM, includeThoughts: false },
      },
    });
    if (!response.text) {
      throw new VisualizationAnalysisError('Gemini returned an empty response', 'AI_RESPONSE_INVALID');
    }
    return parseVisualizationAnalysis(response.text, article, model);
  } catch (error) {
    if (error instanceof VisualizationAnalysisError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    throw new VisualizationAnalysisError(`Gemini analysis failed: ${message}`, 'AI_REQUEST_FAILED');
  }
}
