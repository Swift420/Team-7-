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
} from '../types';

const API_BASE = '/api';
let authToken: string | null = null;

export function setApiAuthToken(token: string | null) { authToken = token; }

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) {
    if (response.status === 204) return null;
    throw new Error(
      response.ok
        ? 'The server returned an empty response'
        : `The API is unavailable or returned an empty response (${response.status})`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The API returned an invalid response (${response.status})`);
  }
}

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return readJson(res);
}

export async function fetchOverview(): Promise<MetricOverview> {
  const res = await fetch(`${API_BASE}/metrics/overview`);
  if (!res.ok) throw new Error(`Failed to fetch overview: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

export async function fetchTimeSeries(range: '3m' | '6m' | '12m' = '12m'): Promise<TimeSeriesPoint[]> {
  const res = await fetch(`${API_BASE}/metrics/timeseries?range=${range}`);
  if (!res.ok) throw new Error(`Failed to fetch time series: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

export async function fetchCategories(): Promise<CategoryData[]> {
  const res = await fetch(`${API_BASE}/metrics/categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

export async function fetchRegional(): Promise<RegionalData[]> {
  const res = await fetch(`${API_BASE}/metrics/regional`);
  if (!res.ok) throw new Error(`Failed to fetch regional: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

export async function fetchPerformance(): Promise<PerformanceMetric[]> {
  const res = await fetch(`${API_BASE}/metrics/performance`);
  if (!res.ok) throw new Error(`Failed to fetch performance: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

export async function fetchTraffic(): Promise<TrafficSource[]> {
  const res = await fetch(`${API_BASE}/metrics/traffic`);
  if (!res.ok) throw new Error(`Failed to fetch traffic: ${res.statusText}`);
  const data = await readJson(res);
  return data.data;
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(url, { ...options, headers });
  const payload = await readJson(response);
  if (!response.ok) {
    const message = payload?.error?.message || `Request failed (${response.status})`;
    const details = payload?.error?.details;
    throw new Error(details?.length ? `${message}: ${details.join('; ')}` : message);
  }
  return payload?.data as T;
}

export async function loginEditor(username: string, password: string): Promise<{ token: string; user: User }> {
  const result = await apiRequest<{ token: string; user: User }>(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  setApiAuthToken(result.token);
  return result;
}

export function fetchArticles(): Promise<Article[]> {
  return apiRequest<Article[]>(`${API_BASE}/articles`);
}

export function fetchCountryCoverage(): Promise<CountryCoverage[]> {
  return apiRequest<CountryCoverage[]>('/api/story-map/countries');
}

export function fetchCountryConnections(): Promise<CountryConnection[]> {
  return apiRequest<CountryConnection[]>('/api/story-map/connections?limit=120');
}

export function fetchCountryStories(countryCode: string): Promise<CountryStorySummary[]> {
  return apiRequest<CountryStorySummary[]>(`/api/story-map/countries/${encodeURIComponent(countryCode)}/articles`);
}

export function fetchArticle(id: string): Promise<Article> {
  return apiRequest<Article>(`${API_BASE}/articles/${encodeURIComponent(id)}`);
}

export function importArticle(file: File, draft = false): Promise<ImportOutcome> {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<ImportOutcome>(`${API_BASE}/articles/import${draft ? '?draft=true' : ''}`, { method: 'POST', body });
}

export function publishArticle(id: string): Promise<Article> {
  return apiRequest<Article>(`${API_BASE}/articles/${encodeURIComponent(id)}/publish`, { method: 'POST' });
}

export async function removeArticle(id: string): Promise<void> {
  await apiRequest<never>(`${API_BASE}/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function analyzeArticleVisualizations(id: string, maxOpportunities = 4): Promise<VisualizationAnalysis> {
  return apiRequest<VisualizationAnalysis>(
    `${API_BASE}/articles/${encodeURIComponent(id)}/visualizations/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxOpportunities }),
    },
  );
}

export function fetchExistingVisualizations(id: string): Promise<ExistingVisualization[]> {
  return apiRequest<ExistingVisualization[]>(`${API_BASE}/articles/${encodeURIComponent(id)}/existing-visualizations`);
}

export function fetchSavedVisualizations(id: string): Promise<SavedVisualization[]> {
  return apiRequest<SavedVisualization[]>(`${API_BASE}/articles/${encodeURIComponent(id)}/visualizations`);
}

export function fetchVisualizationHistory(id: string): Promise<VisualizationApproval[]> {
  return apiRequest<VisualizationApproval[]>(`${API_BASE}/articles/${encodeURIComponent(id)}/visualizations/history`);
}

export function saveArticleVisualizations(id: string, visualizations: VisualizationOpportunity[]): Promise<SavedVisualization[]> {
  return apiRequest<SavedVisualization[]>(`${API_BASE}/articles/${encodeURIComponent(id)}/visualizations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visualizations }),
  });
}
