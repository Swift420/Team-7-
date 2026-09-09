import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale } from 'lucide-react';
import type { DialecticalFAQFormat } from '../../types/liquid';

interface DialecticalAccordionProps {
  faq: DialecticalFAQFormat;
}

export const DialecticalAccordion: React.FC<DialecticalAccordionProps> = ({ faq }) => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const getBadge = (perspective: string) => {
    switch (perspective) {
      case 'consensus':
        return { label: 'Mehrheitsmeinung / Status Quo', color: 'bg-blue-950/60 text-blue-400 border-blue-800' };
      case 'counterargument':
        return { label: 'Ökonomische Gegenposition', color: 'bg-amber-950/60 text-amber-400 border-amber-800' };
      case 'structural_outlook':
        return { label: 'Strukturelle Reformoptionen', color: 'bg-purple-950/60 text-purple-400 border-purple-800' };
      default:
        return { label: 'Debatte', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 my-8">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Scale className="w-5 h-5 text-red-500" />
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Kontroverse & Argumente: {faq.topic || 'Einordnung'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gegensätzliche Positionen und ordnungspolitische Abwägungen nach NZZ-Debattenstandard.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faq.items.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          const badge = getBadge(item.perspective);

          return (
            <div
              key={idx}
              className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleIndex(idx)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-slate-900/50"
              >
                <div className="space-y-1">
                  <span
                    className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                  <h4 className="text-xs font-semibold text-white font-serif">{item.question}</h4>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-900">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
