import React from 'react';
import { Mail } from 'lucide-react';
import type { ExecutiveNewsletterFormat } from '../../types/liquid';

interface ExecutiveBriefCardProps {
  brief: ExecutiveNewsletterFormat;
}

export const ExecutiveBriefCard: React.FC<ExecutiveBriefCardProps> = ({ brief }) => {
  return (
    <div className="bg-slate-950 border-l-4 border-l-red-600 border border-slate-800/80 rounded-r-2xl p-5 my-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Auf einen Blick: Die 3 Kernpunkte
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          NZZ Executive Brief · &lt;90 Wörter
        </span>
      </div>

      {brief.subhead && (
        <h4 className="text-sm font-semibold text-slate-300 font-serif mb-3">
          {brief.subhead}
        </h4>
      )}

      <ul className="space-y-2.5">
        {brief.bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <span className="w-4 h-4 rounded-full bg-red-600/20 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
