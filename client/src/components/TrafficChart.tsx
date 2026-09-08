import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrafficSource } from '../types';

interface TrafficChartProps {
  data: TrafficSource[];
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Traffic Channels & Engagement</h2>
          <p className="chart-subtitle">Monthly visitor volume and bounce rates by acquisition channel</p>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis dataKey="source" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'Bounce Rate') return [`${value}%`, name];
                return [Number(value).toLocaleString(), name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="visitors" name="Visitors" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="bounceRate"
              name="Bounce Rate"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ fill: '#f43f5e', r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
