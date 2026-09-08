export interface MetricOverview {
  totalRevenue: number;
  revenueGrowth: number;
  activeUsers: number;
  userGrowth: number;
  conversionRate: number;
  conversionGrowth: number;
  avgOrderValue: number;
  aovGrowth: number;
}

export interface TimeSeriesPoint {
  month: string;
  revenue: number;
  profit: number;
  expenses: number;
  target: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface RegionalData {
  region: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
}

export interface PerformanceMetric {
  subject: string;
  score: number;
  benchmark: number;
  fullMark: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  bounceRate: number;
}
