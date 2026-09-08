import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Users, TrendingUp, ShoppingBag, AlertCircle } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StatCard } from './components/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { CategoryChart } from './components/CategoryChart';
import { RegionalChart } from './components/RegionalChart';
import { PerformanceRadar } from './components/PerformanceRadar';
import { TrafficChart } from './components/TrafficChart';
import {
  fetchHealth,
  fetchOverview,
  fetchTimeSeries,
  fetchCategories,
  fetchRegional,
  fetchPerformance,
  fetchTraffic,
} from './services/api';
import type {
  MetricOverview,
  TimeSeriesPoint,
  CategoryData,
  RegionalData,
  PerformanceMetric,
  TrafficSource,
} from './types';
import './App.css';

export const App: React.FC = () => {
  const [range, setRange] = useState<'3m' | '6m' | '12m'>('12m');
  const [loading, setLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<MetricOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [regional, setRegional] = useState<RegionalData[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [traffic, setTraffic] = useState<TrafficSource[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check health
      try {
        await fetchHealth();
        setBackendConnected(true);
      } catch {
        setBackendConnected(false);
      }

      const [ovData, tsData, catData, regData, perfData, trafData] = await Promise.all([
        fetchOverview(),
        fetchTimeSeries(range),
        fetchCategories(),
        fetchRegional(),
        fetchPerformance(),
        fetchTraffic(),
      ]);

      setOverview(ovData);
      setTimeSeries(tsData);
      setCategories(catData);
      setRegional(regData);
      setPerformance(perfData);
      setTraffic(trafData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(
        'Unable to communicate with the Node.js API server. Please ensure the backend is running on http://localhost:5001.'
      );
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="dashboard-container">
      <Navbar
        range={range}
        onRangeChange={(newRange) => setRange(newRange)}
        onRefresh={loadData}
        loading={loading}
        backendConnected={backendConnected}
      />

      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <div className="error-text">
              <strong>Connection Warning:</strong> {error}
            </div>
            <button className="error-retry-btn" onClick={loadData}>
              Retry Connection
            </button>
          </div>
        )}

        {/* KPI Stat Cards */}
        <section className="stats-grid">
          <StatCard
            title="Total Revenue"
            value={overview ? `$${(overview.totalRevenue).toLocaleString()}` : '$1,248,500'}
            growth={overview ? overview.revenueGrowth : 18.4}
            subtext="vs previous period"
            icon={<DollarSign size={20} className="icon-blue" />}
          />
          <StatCard
            title="Active Users"
            value={overview ? overview.activeUsers.toLocaleString() : '84,320'}
            growth={overview ? overview.userGrowth : 12.6}
            subtext="monthly active accounts"
            icon={<Users size={20} className="icon-green" />}
          />
          <StatCard
            title="Conversion Rate"
            value={overview ? `${overview.conversionRate}%` : '4.85%'}
            growth={overview ? overview.conversionGrowth : 0.65}
            subtext="lead to customer"
            icon={<TrendingUp size={20} className="icon-amber" />}
          />
          <StatCard
            title="Avg Order Value"
            value={overview ? `$${overview.avgOrderValue}` : '$148'}
            growth={overview ? overview.aovGrowth : -2.3}
            subtext="per closed deal"
            icon={<ShoppingBag size={20} className="icon-purple" />}
          />
        </section>

        {/* Row 1: Time Series & Categories */}
        <section className="charts-grid-two-to-one">
          <div className="chart-col-large">
            <RevenueChart data={timeSeries} />
          </div>
          <div className="chart-col-small">
            <CategoryChart data={categories} />
          </div>
        </section>

        {/* Row 2: Regional, Radar, Traffic */}
        <section className="charts-grid-three">
          <RegionalChart data={regional} />
          <PerformanceRadar data={performance} />
          <TrafficChart data={traffic} />
        </section>
      </main>

      <footer className="dashboard-footer">
        <p>
          Data Visualisation Project • Node.js / Express & React / TypeScript • Powered by Recharts
        </p>
      </footer>
    </div>
  );
};

export default App;
