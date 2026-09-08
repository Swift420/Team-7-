import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Users, TrendingUp, ShoppingBag, AlertCircle } from 'lucide-react';
import { Navbar, AppViewMode } from './components/Navbar';
import { StatCard } from './components/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { CategoryChart } from './components/CategoryChart';
import { RegionalChart } from './components/RegionalChart';
import { PerformanceRadar } from './components/PerformanceRadar';
import { TrafficChart } from './components/TrafficChart';
import { LiquidCockpit } from './components/liquid/LiquidCockpit';
import { ReaderView } from './components/reader/ReaderView';
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
  const [currentView, setCurrentView] = useState<AppViewMode>('cockpit');
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
        currentView={currentView}
        onViewChange={(mode) => setCurrentView(mode)}
        range={range}
        onRangeChange={(newRange) => setRange(newRange)}
        onRefresh={loadData}
        loading={loading}
        backendConnected={backendConnected}
      />

      <main className="dashboard-main max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {error && currentView === 'analytics' && (
          <div className="error-banner mb-6">
            <AlertCircle size={20} />
            <div className="error-text">
              <strong>Connection Warning:</strong> {error}
            </div>
            <button className="error-retry-btn" onClick={loadData}>
              Retry Connection
            </button>
          </div>
        )}

        {/* VIEW 1: LIQUID COCKPIT */}
        {currentView === 'cockpit' && <LiquidCockpit />}

        {/* VIEW 2: DYNAMIC READER EXPERIENCE */}
        {currentView === 'reader' && <ReaderView />}

        {/* VIEW 3: VISUAL VELOCITY ANALYTICS */}
        {currentView === 'analytics' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <section className="stats-grid">
              <StatCard
                title="Total Readers"
                value={overview ? `$${overview.totalRevenue.toLocaleString()}` : '$1,248,500'}
                growth={overview ? overview.revenueGrowth : 18.4}
                subtext="multimodal engagement"
                icon={<DollarSign size={20} className="icon-blue" />}
              />
              <StatCard
                title="Active Readers"
                value={overview ? overview.activeUsers.toLocaleString() : '84,320'}
                growth={overview ? overview.userGrowth : 12.6}
                subtext="monthly active accounts"
                icon={<Users size={20} className="icon-green" />}
              />
              <StatCard
                title="Audio Completion"
                value={overview ? `${overview.conversionRate}%` : '4.85%'}
                growth={overview ? overview.conversionGrowth : 0.65}
                subtext="60s brief listen rate"
                icon={<TrendingUp size={20} className="icon-amber" />}
              />
              <StatCard
                title="Avg Time in Story"
                value={overview ? `$${overview.avgOrderValue}` : '$148'}
                growth={overview ? overview.aovGrowth : -2.3}
                subtext="across liquid derivatives"
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
          </div>
        )}
      </main>

      <footer className="dashboard-footer text-center py-6 text-xs text-slate-500 border-t border-slate-900">
        <p>
          NZZ Pulse • Liquid Story Engine & Visual Velocity • Neue Zürcher Zeitung & Google Cloud Hackathon
        </p>
      </footer>
    </div>
  );
};

export default App;
