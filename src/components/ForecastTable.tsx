import { Download, Trash2, Zap, Battery, AlertTriangle } from "lucide-react";
import { ForecastResult } from "@/lib/types";
import { resultsToCsv, downloadCsv } from "@/lib/csv";

interface Props {
  results: ForecastResult[];
  onClear: () => void;
}

export function ForecastTable({ results, onClear }: Props) {
  function handleExport() {
    if (results.length === 0) return;
    const csv = resultsToCsv(results);
    downloadCsv(`power-i-forecast-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">
          Forecast Results{" "}
          <span className="ml-1 text-xs font-normal text-slate-500">
            ({results.length} rows)
          </span>
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={results.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={onClear}
            disabled={results.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-500">
          No forecast results yet. Add readings manually or upload a CSV to generate predictions.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-medium">Hour</th>
                <th className="px-3 py-2.5 font-medium">Timestamp</th>
                <th className="px-3 py-2.5 font-medium">Temp °C</th>
                <th className="px-3 py-2.5 font-medium">Hum %</th>
                <th className="px-3 py-2.5 font-medium">Solar W/m²</th>
                <th className="px-3 py-2.5 font-medium">Demand kW</th>
                <th className="px-3 py-2.5 font-medium">Gen kW</th>
                <th className="px-3 py-2.5 font-medium">Mode</th>
                <th className="px-3 py-2.5 font-medium">Conf.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {results.map((r) => (
                <tr
                  key={r.timestamp}
                  className={`transition-colors hover:bg-slate-800/40 ${
                    r.isCritical ? "bg-rose-500/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {String(r.hour).padStart(2, "0")}:00
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400">
                    {new Date(r.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{r.temperature.toFixed(1)}</td>
                  <td className="px-3 py-2 text-slate-300">{r.humidity.toFixed(0)}</td>
                  <td className="px-3 py-2 text-slate-300">{r.solarIrradiance.toFixed(0)}</td>
                  <td className="px-3 py-2">
                    <span className={r.isCritical ? "font-semibold text-rose-300" : "text-cyan-300"}>
                      {r.predictedDemandKw.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-emerald-300">{r.predictedGenerationKw.toFixed(1)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.mode === "Renewable Storage Mode"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-cyan-500/15 text-cyan-300"
                      }`}
                    >
                      {r.mode === "Renewable Storage Mode" ? (
                        <Battery className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {r.mode === "Renewable Storage Mode" ? "Renewable" : "Grid"}
                    </span>
                    {r.isCritical && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        CRITICAL
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {(r.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
