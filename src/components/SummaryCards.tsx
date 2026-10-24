import { ForecastResult } from "@/lib/types";

interface Props {
  results: ForecastResult[];
}

interface Summary {
  avgDemand: number;
  peakDemand: number;
  totalGeneration: number;
  renewableHours: number;
  criticalCount: number;
}

function computeSummary(results: ForecastResult[]): Summary {
  if (results.length === 0) {
    return { avgDemand: 0, peakDemand: 0, totalGeneration: 0, renewableHours: 0, criticalCount: 0 };
  }
  const totalDemand = results.reduce((s, r) => s + r.predictedDemandKw, 0);
  const totalGen = results.reduce((s, r) => s + r.predictedGenerationKw, 0);
  return {
    avgDemand: totalDemand / results.length,
    peakDemand: Math.max(...results.map((r) => r.predictedDemandKw)),
    totalGeneration: totalGen,
    renewableHours: results.filter((r) => r.mode === "Renewable Storage Mode").length,
    criticalCount: results.filter((r) => r.isCritical).length,
  };
}

export function SummaryCards({ results }: Props) {
  const s = computeSummary(results);

  const cards = [
    { label: "Avg. Demand", value: `${s.avgDemand.toFixed(1)} kW`, accent: "text-cyan-300", ring: "border-cyan-500/30" },
    { label: "Peak Demand", value: `${s.peakDemand.toFixed(1)} kW`, accent: "text-cyan-300", ring: "border-cyan-500/30" },
    { label: "Total Generation", value: `${s.totalGeneration.toFixed(1)} kW`, accent: "text-emerald-300", ring: "border-emerald-500/30" },
    { label: "Renewable Hours", value: `${s.renewableHours}/${results.length}`, accent: "text-emerald-300", ring: "border-emerald-500/30" },
    { label: "Critical Alerts", value: `${s.criticalCount}`, accent: s.criticalCount > 0 ? "text-rose-300" : "text-slate-300", ring: s.criticalCount > 0 ? "border-rose-500/40" : "border-slate-700" },
    { label: "Forecast Window", value: `${results.length}h`, accent: "text-slate-300", ring: "border-slate-700" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border ${c.ring} bg-slate-900/70 p-3 backdrop-blur-sm transition-transform hover:-translate-y-0.5`}
        >
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{c.label}</div>
          <div className={`mt-1 text-xl font-semibold ${c.accent}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
