import type {
  MetricOverview,
  TimeSeriesPoint,
  CategoryData,
  RegionalData,
  PerformanceMetric,
  TrafficSource,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchOverview(): Promise<MetricOverview> {
  const res = await fetch(`${API_BASE}/metrics/overview`);
  if (!res.ok) throw new Error(`Failed to fetch overview: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function fetchTimeSeries(range: '3m' | '6m' | '12m' = '12m'): Promise<TimeSeriesPoint[]> {
  const res = await fetch(`${API_BASE}/metrics/timeseries?range=${range}`);
  if (!res.ok) throw new Error(`Failed to fetch time series: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function fetchCategories(): Promise<CategoryData[]> {
  const res = await fetch(`${API_BASE}/metrics/categories`);
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function fetchRegional(): Promise<RegionalData[]> {
  const res = await fetch(`${API_BASE}/metrics/regional`);
  if (!res.ok) throw new Error(`Failed to fetch regional: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function fetchPerformance(): Promise<PerformanceMetric[]> {
  const res = await fetch(`${API_BASE}/metrics/performance`);
  if (!res.ok) throw new Error(`Failed to fetch performance: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}

export async function fetchTraffic(): Promise<TrafficSource[]> {
  const res = await fetch(`${API_BASE}/metrics/traffic`);
  if (!res.ok) throw new Error(`Failed to fetch traffic: ${res.statusText}`);
  const data = await res.json();
  return data.data;
}
