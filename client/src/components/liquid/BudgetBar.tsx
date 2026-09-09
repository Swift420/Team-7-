import React from "react";

interface BudgetBarProps {
  current: number;
  min: number;
  max: number;
  unit: string;
  label: string;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({
  current,
  min,
  max,
  unit,
  label,
}) => {
  const isTooLow = current < min;
  const isTooHigh = current > max;

  const percentage = Math.min(100, Math.round((current / max) * 100));

  let statusColor = "bg-emerald-500";
  let badgeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-800";
  let statusText = "Optimal";

  if (isTooLow) {
    statusColor = "bg-amber-500";
    badgeColor = "text-amber-400 bg-amber-950/60 border-amber-800";
    statusText = `Under budget (min ${min} ${unit})`;
  } else if (isTooHigh) {
    statusColor = "bg-rose-500";
    badgeColor = "text-rose-400 bg-rose-950/60 border-rose-800";
    statusText = `Over budget (max ${max} ${unit})`;
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-semibold">
            {current} / {max} {unit}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${badgeColor}`}
          >
            {statusText}
          </span>
        </div>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${statusColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
