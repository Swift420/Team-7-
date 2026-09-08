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

export const mockOverview: MetricOverview = {
  totalRevenue: 1248500,
  revenueGrowth: 18.4,
  activeUsers: 84320,
  userGrowth: 12.6,
  conversionRate: 4.85,
  conversionGrowth: 0.65,
  avgOrderValue: 148,
  aovGrowth: -2.3
};

export const mockTimeSeries: TimeSeriesPoint[] = [
  { month: 'Jan', revenue: 65000, profit: 24000, expenses: 41000, target: 60000 },
  { month: 'Feb', revenue: 72000, profit: 29000, expenses: 43000, target: 65000 },
  { month: 'Mar', revenue: 84000, profit: 36000, expenses: 48000, target: 75000 },
  { month: 'Apr', revenue: 78000, profit: 31000, expenses: 47000, target: 80000 },
  { month: 'May', revenue: 95000, profit: 42000, expenses: 53000, target: 85000 },
  { month: 'Jun', revenue: 110000, profit: 51000, expenses: 59000, target: 95000 },
  { month: 'Jul', revenue: 104000, profit: 47000, expenses: 57000, target: 100000 },
  { month: 'Aug', revenue: 118000, profit: 56000, expenses: 62000, target: 105000 },
  { month: 'Sep', revenue: 125000, profit: 61000, expenses: 64000, target: 110000 },
  { month: 'Oct', revenue: 132000, profit: 66000, expenses: 66000, target: 120000 },
  { month: 'Nov', revenue: 141000, profit: 72000, expenses: 69000, target: 130000 },
  { month: 'Dec', revenue: 156000, profit: 82000, expenses: 74000, target: 140000 }
];

export const mockCategories: CategoryData[] = [
  { name: 'SaaS Platform', value: 420000, color: '#3b82f6' },
  { name: 'Enterprise Cloud', value: 310000, color: '#10b981' },
  { name: 'API Subscriptions', value: 240000, color: '#f59e0b' },
  { name: 'Consulting & Setup', value: 165000, color: '#8b5cf6' },
  { name: 'Hardware & Add-ons', value: 113500, color: '#ec4899' }
];

export const mockRegional: RegionalData[] = [
  { region: 'North America', q1: 180000, q2: 210000, q3: 240000, q4: 280000, total: 910000 },
  { region: 'Europe', q1: 120000, q2: 135000, q3: 155000, q4: 185000, total: 595000 },
  { region: 'Asia-Pacific', q1: 95000, q2: 110000, q3: 130000, q4: 160000, total: 495000 },
  { region: 'Latin America', q1: 45000, q2: 52000, q3: 63000, q4: 78000, total: 238000 },
  { region: 'Middle East & Africa', q1: 30000, q2: 38000, q3: 45000, q4: 55000, total: 168000 }
];

export const mockPerformance: PerformanceMetric[] = [
  { subject: 'Uptime SLA', score: 99.8, benchmark: 95, fullMark: 100 },
  { subject: 'Response Speed', score: 88, benchmark: 80, fullMark: 100 },
  { subject: 'Customer CSAT', score: 92, benchmark: 85, fullMark: 100 },
  { subject: 'Feature Adoption', score: 79, benchmark: 70, fullMark: 100 },
  { subject: 'Security Score', score: 96, benchmark: 90, fullMark: 100 },
  { subject: 'Cost Efficiency', score: 84, benchmark: 75, fullMark: 100 }
];

export const mockTrafficSources: TrafficSource[] = [
  { source: 'Organic Search', visitors: 34500, bounceRate: 38.2 },
  { source: 'Direct / Referrals', visitors: 22100, bounceRate: 29.5 },
  { source: 'Social Media', visitors: 14800, bounceRate: 52.1 },
  { source: 'Paid Campaigns', visitors: 9600, bounceRate: 41.7 },
  { source: 'Email Marketing', visitors: 7800, bounceRate: 24.3 }
];
