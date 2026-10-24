import { ForecastResult, EnergyMode } from "@/lib/types";

interface Props {
  results: ForecastResult[];
}

// Horizontal bar chart showing demand per hour, colored by mode, with critical alerts highlighted.
export function ModeTimeline({ results }: Props) {
  if (results.length === 0) return null;

  const maxDemand = Math.max(...results.map((r) => r.predictedDemandKw), 1);
  return (
    <div className="space-y-1.5">
      {results.map((r) => {
        const pct = (r.predictedDemandKw / maxDemand) * 100;
        const isRenewable = r.mode === ("Renewable Storage Mode" as EnergyMode);
        return (
          <div key={r.timestamp} className="flex items-center gap-3 text-xs">
            <span className="w-10 shrink-0 text-right font-mono text-slate-400">
              {String(r.hour).padStart(2, "0")}:00
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-slate-800/60">
              <div
                className={`h-full rounded transition-all duration-500 ${
                  r.isCritical
                    ? "bg-gradient-to-r from-rose-600 to-rose-400"
                    : isRenewable
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : "bg-gradient-to-r from-cyan-600 to-cyan-400"
                }`}
                style={{ width: `${pct}%` }}
              />
              <span className="absolute inset-y-0 right-2 flex items-center font-mono text-[10px] text-slate-200/90">
                {r.predictedDemandKw.toFixed(1)} kW
              </span>
            </div>
            {r.isCritical && (
              <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                CRITICAL
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
