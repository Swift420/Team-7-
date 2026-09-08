import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  growth: number;
  subtext: string;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  growth,
  subtext,
  icon,
}) => {
  const isPositive = growth >= 0;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon-wrapper">{icon}</div>
      </div>
      <div className="stat-card-body">
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-card-footer">
        <span className={`stat-growth ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {isPositive ? `+${growth}%` : `${growth}%`}
        </span>
        <span className="stat-subtext">{subtext}</span>
      </div>
    </div>
  );
};
