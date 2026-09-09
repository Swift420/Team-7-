import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { RevenueChart } from "./RevenueChart";
import { CategoryChart } from "./CategoryChart";
import { RegionalChart } from "./RegionalChart";
import { PerformanceRadar } from "./PerformanceRadar";
import { TrafficChart } from "./TrafficChart";
import {
  fetchOverview,
  fetchTimeSeries,
  fetchCategories,
  fetchRegional,
  fetchPerformance,
  fetchTraffic,
  fetchHealth,
} from "../services/api";
import type {
  MetricOverview,
  TimeSeriesPoint,
  CategoryData,
  RegionalData,
  PerformanceMetric,
  TrafficSource,
} from "../types";

export const AnalyticsView: React.FC = () => {
  const [range, setRange] = useState<"3m" | "6m" | "12m">("12m");
  const [loading, setLoading] = useState<boolean>(true);
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
      } catch {
        // Silent catch for health check
      }

      const [ovData, tsData, catData, regData, perfData, trafData] =
        await Promise.all([
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
      console.warn(
        "Backend API not responding, using offline metrics preview.",
        err,
      );
      setError(
        "Backend API is offline on port 5001. Showing simulated telemetry metrics.",
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="analytics-view-container">
      {/* Subheader */}
      <div className="analytics-header-row">
        <div>
          <h2 className="section-heading">Analytics & Data Insights</h2>
          <p className="section-subheading">
            Live telemetry, revenue streams, and engagement metrics accompanying
            our published tech articles.
          </p>
        </div>

        <div className="analytics-controls">
          <div className="range-selector">
            {(["3m", "6m", "12m"] as const).map((r) => (
              <button
                key={r}
                className={`range-btn ${range === r ? "active" : ""}`}
                onClick={() => setRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className={`btn-refresh ${loading ? "spinning" : ""}`}
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={15} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ margin: "1rem 0" }}>
          <AlertCircle size={18} />
          <div className="error-text">
            <strong>System Notice:</strong> {error}
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <section className="stats-grid">
        <StatCard
          title="Publication Readers"
          value={overview ? overview.activeUsers.toLocaleString() : "84,320"}
          growth={overview ? overview.userGrowth : 12.6}
          subtext="monthly active readers"
          icon={<Users size={20} className="icon-green" />}
        />
        <StatCard
          title="Reader Conversion"
          value={overview ? `${overview.conversionRate}%` : "4.85%"}
          growth={overview ? overview.conversionGrowth : 0.65}
          subtext="free readers to subscribers"
          icon={<TrendingUp size={20} className="icon-amber" />}
        />
        <StatCard
          title="Platform Revenue"
          value={
            overview
              ? `$${overview.totalRevenue.toLocaleString()}`
              : "$1,248,500"
          }
          growth={overview ? overview.revenueGrowth : 18.4}
          subtext="syndication & sponsors"
          icon={<DollarSign size={20} className="icon-blue" />}
        />
        <StatCard
          title="Avg Article Read Time"
          value="4m 32s"
          growth={8.2}
          subtext="per session"
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
  );
};
