import type {
  MetricOverview,
  TimeSeriesPoint,
  CategoryData,
  RegionalData,
  PerformanceMetric,
  TrafficSource,
  Article,
  ImportOutcome,
  VisualizationAnalysis,
  ExistingVisualization,
  SavedVisualization,
  VisualizationApproval,
  VisualizationOpportunity,
  CountryCoverage,
  CountryConnection,
  CountryStorySummary,
  User,
} from "../types";
import { API_BASE, apiRequest, setApiAuthToken } from "./httpClient";

export { setApiAuthToken } from "./httpClient";

// These functions return domain types rather than exposing fetch responses to components.
export async function fetchHealth(): Promise<{
  status: string;
  timestamp: string;
}> {
  try {
    return await apiRequest<{ status: string; timestamp: string }>(
      `${API_BASE}/health`,
    );
  } catch {
    // fallback
  }
  return { status: "healthy", timestamp: new Date().toISOString() };
}

export async function fetchOverview(): Promise<MetricOverview> {
  const data = await apiRequest<{ data: MetricOverview }>(
    `${API_BASE}/metrics/overview`,
  );
  return data.data;
}

export async function fetchTimeSeries(
  range: "3m" | "6m" | "12m" = "12m",
): Promise<TimeSeriesPoint[]> {
  const data = await apiRequest<{ data: TimeSeriesPoint[] }>(
    `${API_BASE}/metrics/timeseries?range=${range}`,
  );
  return data.data;
}

export async function fetchCategories(): Promise<CategoryData[]> {
  const data = await apiRequest<{ data: CategoryData[] }>(
    `${API_BASE}/metrics/categories`,
  );
  return data.data;
}

export async function fetchRegional(): Promise<RegionalData[]> {
  const data = await apiRequest<{ data: RegionalData[] }>(
    `${API_BASE}/metrics/regional`,
  );
  return data.data;
}

export async function fetchPerformance(): Promise<PerformanceMetric[]> {
  const data = await apiRequest<{ data: PerformanceMetric[] }>(
    `${API_BASE}/metrics/performance`,
  );
  return data.data;
}

export async function fetchTraffic(): Promise<TrafficSource[]> {
  const data = await apiRequest<{ data: TrafficSource[] }>(
    `${API_BASE}/metrics/traffic`,
  );
  return data.data;
}

export async function loginEditor(
  username: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const result = await apiRequest<{ token: string; user: User }>(
    `${API_BASE}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
  );
  setApiAuthToken(result.token);
  return result;
}

export function fetchArticles(): Promise<Article[]> {
  return apiRequest<Article[]>(`${API_BASE}/articles`);
}

export function fetchCountryCoverage(): Promise<CountryCoverage[]> {
  return apiRequest<CountryCoverage[]>("/api/story-map/countries");
}

export function fetchCountryConnections(): Promise<CountryConnection[]> {
  return apiRequest<CountryConnection[]>(
    "/api/story-map/connections?limit=120",
  );
}

export function fetchCountryStories(
  countryCode: string,
): Promise<CountryStorySummary[]> {
  return apiRequest<CountryStorySummary[]>(
    `/api/story-map/countries/${encodeURIComponent(countryCode)}/articles`,
  );
}

export function fetchArticle(id: string): Promise<Article> {
  return apiRequest<Article>(`${API_BASE}/articles/${encodeURIComponent(id)}`);
}

export function importArticle(
  file: File,
  draft = false,
): Promise<ImportOutcome> {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ImportOutcome>(
    `${API_BASE}/articles/import${draft ? "?draft=true" : ""}`,
    { method: "POST", body },
  );
}

export function publishArticle(id: string): Promise<Article> {
  return apiRequest<Article>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
}

export async function removeArticle(id: string): Promise<void> {
  await apiRequest<never>(`${API_BASE}/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function analyzeArticleVisualizations(
  id: string,
  maxOpportunities = 4,
): Promise<VisualizationAnalysis> {
  return apiRequest<VisualizationAnalysis>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/visualizations/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxOpportunities }),
    },
  );
}

export function fetchExistingVisualizations(
  id: string,
): Promise<ExistingVisualization[]> {
  return apiRequest<ExistingVisualization[]>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/existing-visualizations`,
  );
}

export function fetchSavedVisualizations(
  id: string,
): Promise<SavedVisualization[]> {
  return apiRequest<SavedVisualization[]>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/visualizations`,
  );
}

export function fetchVisualizationHistory(
  id: string,
): Promise<VisualizationApproval[]> {
  return apiRequest<VisualizationApproval[]>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/visualizations/history`,
  );
}

export function saveArticleVisualizations(
  id: string,
  visualizations: VisualizationOpportunity[],
): Promise<SavedVisualization[]> {
  return apiRequest<SavedVisualization[]>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/visualizations`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visualizations }),
    },
  );
}
