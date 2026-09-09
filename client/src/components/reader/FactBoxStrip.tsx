import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { FactBoxFormat } from '../../types/liquid';

interface FactBoxStripProps {
  factBox: FactBoxFormat;
}

export const FactBoxStrip: React.FC<FactBoxStripProps> = ({ factBox }) => {
  if (!factBox.metrics || factBox.metrics.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 my-8">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
          {factBox.title || 'Kernindikatoren im Überblick'}
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">NZZ Dossier Data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {factBox.metrics.map((metric) => (
          <div
            key={metric.id}
            className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
          >
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                {metric.metricName}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black font-mono text-white">
                  {metric.value}
                </span>
                {metric.delta && (
                  <span
                    className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                      metric.direction === 'down'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {metric.direction === 'down' ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : metric.direction === 'up' ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    {metric.delta}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-800/60 pt-2">
              {metric.contextNote}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

