import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from 'recharts';
import { TimeSeriesPoint } from '../types';

interface RevenueChartProps {
  data: TimeSeriesPoint[];
}

const formatCurrency = (val: number) => {
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Revenue & Profit Overview</h2>
          <p className="chart-subtitle">Monthly financial trajectory vs performance targets</p>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
