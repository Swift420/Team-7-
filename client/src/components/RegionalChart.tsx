import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RegionalData } from "../types";

interface RegionalChartProps {
  data: RegionalData[];
}

const formatCurrency = (val: number) => {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
};

export const RegionalChart: React.FC<RegionalChartProps> = ({ data }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Regional Distribution</h2>
          <p className="chart-subtitle">
            Quarterly sales distribution across major global markets
          </p>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.4}
            />
            <XAxis
              dataKey="region"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e4e4e0",
                borderRadius: "4px",
                color: "#111111",
              }}
              formatter={(value: unknown) => [
                `$${Number(value).toLocaleString()}`,
                "",
              ]}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            <Bar dataKey="q1" name="Q1" fill="#111111" radius={[2, 2, 0, 0]} />
            <Bar dataKey="q2" name="Q2" fill="#52525b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="q3" name="Q3" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
            <Bar dataKey="q4" name="Q4" fill="#d80000" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
