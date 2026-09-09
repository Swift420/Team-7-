export type VisualizationChartType =
  | "bar"
  | "line"
  | "area"
  | "stacked_bar"
  | "dot_plot"
  | "donut"
  | "timeline"
  | "map";
export type VisualizationDataStatus = "ready" | "needs_review";

export interface VisualizationSeries {
  key: string;
  label: string;
}

export interface VisualizationDataPoint {
  label: string;
  values: number[];
  sourceElementIds: string[];
}

export interface TimelineEvent {
  dateLabel: string;
  title: string;
  description: string;
  sourceParagraphIds: string[];
}

export interface VisualizationOpportunity {
  id: string;
  type?: "CHART" | "TIMELINE";
  title: string;
  subtitle: string;
  rationale: string;
  reason?: string;
  chartType: VisualizationChartType;
  confidence: number;
  dataStatus: VisualizationDataStatus;
  relatedElementIds: string[];
  suggestedPlacementAfter: string;
  xAxisLabel: string;
  yAxisLabel: string;
  unit: string;
  series: VisualizationSeries[];
  data: VisualizationDataPoint[];
  events?: TimelineEvent[];
  sourceNote: string;
  caveats: string[];
  accessibilitySummary: string;
}

export interface VisualizationAnalysis {
  model: string;
  analyzedAt: string;
  summary: string;
  opportunities: VisualizationOpportunity[];
}

export interface SavedVisualization {
  id: string;
  articleId: string;
  status: "approved";
  placementAfterElementId: string;
  specification: VisualizationOpportunity;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisualizationApproval {
  id: string;
  articleId: string;
  actor: string;
  action: "saved" | "cleared";
  visualizations: VisualizationOpportunity[];
  createdAt: Date;
}

export interface ExistingVisualization {
  elementId: string;
  externalId: string;
  tool: string;
  title: string;
  subtitle: string;
  notes: string;
  sources: Array<{ text: string; url: string }>;
  chartType: VisualizationChartType | null;
  series: VisualizationSeries[];
  data: VisualizationDataPoint[];
  table: string[][];
  assetUrls: string[];
  mapData?: Array<{ label: string; value: string }>;
}
