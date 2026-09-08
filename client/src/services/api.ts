import type {
  MetricOverview,
  TimeSeriesPoint,
  CategoryData,
  RegionalData,
  PerformanceMetric,
  TrafficSource,
} from '../types';

const API_BASE = '/api';

const DEFAULT_OVERVIEW: MetricOverview = {
  totalRevenue: 1248500,
  activeUsers: 84320,
  conversionRate: 4.85,
  avgOrderValue: 148,
  revenueGrowth: 18.4,
  userGrowth: 12.6,
  conversionGrowth: 0.65,
  aovGrowth: -2.3,
};

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return { status: 'healthy', timestamp: new Date().toISOString() };
}

export async function fetchOverview(): Promise<MetricOverview> {
  try {
    const res = await fetch(`${API_BASE}/metrics/overview`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('Overview API unavailable, using fallback metrics');
  }
  return DEFAULT_OVERVIEW;
}

export async function fetchTimeSeries(range: '3m' | '6m' | '12m' = '12m'): Promise<TimeSeriesPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/timeseries?range=${range}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('TimeSeries API unavailable, using fallback data');
  }
  return [
    { month: 'Jan', revenue: 84000, profit: 32000, expenses: 52000, target: 80000 },
    { month: 'Feb', revenue: 92000, profit: 36000, expenses: 56000, target: 85000 },
    { month: 'Mar', revenue: 104000, profit: 42000, expenses: 62000, target: 95000 },
    { month: 'Apr', revenue: 118000, profit: 48000, expenses: 70000, target: 110000 },
    { month: 'Mai', revenue: 125000, profit: 51000, expenses: 74000, target: 120000 },
  ];
}

export async function fetchCategories(): Promise<CategoryData[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/categories`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('Categories API unavailable, using fallback data');
  }
  return [
    { name: 'Wirtschaft', value: 420000, color: '#ef4444' },
    { name: 'International', value: 310000, color: '#6366f1' },
    { name: 'Technologie', value: 260000, color: '#06b6d4' },
    { name: 'Feuilleton', value: 140000, color: '#a855f7' },
    { name: 'Sport', value: 118500, color: '#f59e0b' },
  ];
}

export async function fetchRegional(): Promise<RegionalData[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/regional`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('Regional API unavailable, using fallback data');
  }
  return [
    { region: 'Zürich', q1: 120000, q2: 135000, q3: 140000, q4: 145000, total: 540000 },
    { region: 'Bern & Mittelland', q1: 68000, q2: 74000, q3: 76000, q4: 77000, total: 295000 },
    { region: 'Basel & Nordwest', q1: 52000, q2: 54000, q3: 56000, q4: 58000, total: 220000 },
    { region: 'Deutschland & DACH', q1: 44000, q2: 48000, q3: 50000, q4: 51500, total: 193500 },
  ];
}

export async function fetchPerformance(): Promise<PerformanceMetric[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/performance`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('Performance API unavailable, using fallback data');
  }
  return [
    { subject: 'Retention', score: 91, benchmark: 80, fullMark: 100 },
    { subject: 'Audio Listen', score: 84, benchmark: 65, fullMark: 100 },
    { subject: 'Video View Thru', score: 76, benchmark: 60, fullMark: 100 },
    { subject: 'Fact Check Trust', score: 96, benchmark: 85, fullMark: 100 },
    { subject: 'Executive Read', score: 89, benchmark: 75, fullMark: 100 },
  ];
}

export async function fetchTraffic(): Promise<TrafficSource[]> {
  try {
    const res = await fetch(`${API_BASE}/metrics/traffic`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch {
    console.warn('Traffic API unavailable, using fallback data');
  }
  return [
    { source: 'Direct (NZZ.ch)', visitors: 42000, bounceRate: 24.2 },
    { source: 'Audio Brief (Podcast)', visitors: 21000, bounceRate: 14.8 },
    { source: 'Vertical Video (Reels/TikTok)', visitors: 14500, bounceRate: 31.5 },
    { source: 'Executive Newsletter', visitors: 10500, bounceRate: 18.6 },
  ];
}
