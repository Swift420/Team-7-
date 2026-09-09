import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { PerformanceMetric } from "../types";

interface PerformanceRadarProps {
  data: PerformanceMetric[];
}

export const PerformanceRadar: React.FC<PerformanceRadarProps> = ({ data }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Operational Health Radar</h2>
          <p className="chart-subtitle">
            Key service & system benchmarks vs current score
          </p>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
            <Radar
              name="Current Score"
              dataKey="score"
              stroke="#38bdf8"
              fill="#38bdf8"
              fillOpacity={0.4}
            />
            <Radar
              name="Benchmark Target"
              dataKey="benchmark"
              stroke="#f43f5e"
              fill="#f43f5e"
              fillOpacity={0.15}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                borderColor: "#334155",
                borderRadius: "8px",
                color: "#f8fafc",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
