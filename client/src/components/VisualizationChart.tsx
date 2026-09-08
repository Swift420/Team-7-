import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
} from 'recharts';
import { VisualizationChartType, VisualizationOpportunity } from '../types';

interface VisualizationChartProps {
  opportunity: VisualizationOpportunity;
  chartType?: VisualizationChartType;
}

const colors = ['#60a5fa', '#f59e0b', '#34d399'];

export const VisualizationChart: React.FC<VisualizationChartProps> = ({ opportunity, chartType = opportunity.chartType }) => {
  const data = opportunity.data.map((point) => {
    const row: Record<string, string | number> = { label: point.label };
    opportunity.series.forEach((series, index) => { row[series.key] = point.values[index]; });
    return row;
  });
  const shared = {
    data,
    margin: { top: 12, right: 16, left: 2, bottom: 8 },
  };
  const axes = <>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" vertical={false} />
    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} />
    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} width={48} />
    <Tooltip
      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
      formatter={(value) => [`${String(value)}${opportunity.unit ? ` ${opportunity.unit}` : ''}`]}
    />
    {opportunity.series.length > 1 && <Legend />}
  </>;

  if (chartType === 'donut') {
    const pieData = opportunity.data.map((point) => ({ name: point.label, value: point.values[0]}));
    return <div className="visual-chart" role="img" aria-label={opportunity.accessibilitySummary}>
      <ResponsiveContainer width="100%" height="100%"><PieChart>
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="76%" paddingAngle={2}>
          {pieData.map((point, index) => <Cell key={point.name} fill={colors[index % colors.length]} />)}
        </Pie>
        <Tooltip formatter={(value) => [`${String(value)}${opportunity.unit ? ` ${opportunity.unit}` : ''}`]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
        <Legend />
      </PieChart></ResponsiveContainer>
    </div>;
  }

  if (chartType === 'timeline') {
    return <div className="visual-timeline" role="img" aria-label={opportunity.accessibilitySummary}>
      {(opportunity.events || []).map((event, index) => <div className="timeline-event" key={`${event.dateLabel}-${index}`}>
        <div className="timeline-marker" />
        <button className="timeline-event-content" type="button" onClick={() => { const source = event.sourceParagraphIds.map((id) => document.getElementById(id)).find(Boolean); source?.scrollIntoView({ behavior: 'smooth', block: 'center' }); source?.classList.add('source-highlight'); window.setTimeout(() => source?.classList.remove('source-highlight'), 1800); }}><strong>{event.dateLabel}</strong><h4>{event.title}</h4><p>{event.description}</p><small>View source context</small></button>
      </div>)}
    </div>;
  }

  if (chartType === 'dot_plot') {
    return <div className="visual-chart" role="img" aria-label={opportunity.accessibilitySummary}>
      <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 12, right: 20, left: 36, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
        <XAxis type="number" dataKey="value" stroke="#94a3b8" tick={{ fontSize: 12 }} />
        <YAxis type="number" dataKey="row" domain={[-0.5, opportunity.data.length - 0.5]} ticks={opportunity.data.map((_, index) => index)} tickFormatter={(value) => opportunity.data[value]?.label || ''} stroke="#94a3b8" tick={{ fontSize: 11 }} width={105} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => [`${String(value)}${opportunity.unit ? ` ${opportunity.unit}` : ''}`]} labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ''} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
        {opportunity.series.map((series, seriesIndex) => <Scatter key={series.key} name={series.label} fill={colors[seriesIndex]} data={opportunity.data.map((point, row) => ({ row, label: point.label, value: point.values[seriesIndex] }))} />)}
        {opportunity.series.length > 1 && <Legend />}
      </ScatterChart></ResponsiveContainer>
    </div>;
  }

  return <div className="visual-chart" role="img" aria-label={opportunity.accessibilitySummary}>
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'line' ? <LineChart {...shared}>
        {axes}
        {opportunity.series.map((series, index) => <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={colors[index]} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />)}
      </LineChart> : chartType === 'area' ? <AreaChart {...shared}>
        {axes}
        {opportunity.series.map((series, index) => <Area key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={colors[index]} fill={colors[index]} fillOpacity={0.18} strokeWidth={2} />)}
      </AreaChart> : <BarChart {...shared}>
        {axes}
        {opportunity.series.map((series, index) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={colors[index]} stackId={chartType === 'stacked_bar' ? 'total' : undefined} radius={[4, 4, 0, 0]} />)}
      </BarChart>}
    </ResponsiveContainer>
  </div>;
};
