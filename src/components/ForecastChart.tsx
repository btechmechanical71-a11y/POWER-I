import { useMemo } from "react";
import { ForecastResult } from "@/lib/types";

interface Props {
  results: ForecastResult[];
}

// Smooth area chart of predicted demand vs renewable generation across hours.
export function ForecastChart({ results }: Props) {
  const width = 720;
  const height = 280;
  const padX = 44;
  const padY = 28;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const { demandPath, genPath, yMax, xStep, points } = useMemo(() => {
    if (results.length === 0) {
      return { demandPath: "", genPath: "", yMax: 100, xStep: 1, points: [] as number[] };
    }
    const maxVal = Math.max(
      ...results.map((r) => Math.max(r.predictedDemandKw, r.predictedGenerationKw)),
      1
    );
    const yMax = Math.ceil(maxVal / 25) * 25;
    const xStep = results.length > 1 ? innerW / (results.length - 1) : innerW;
    const points = results.map((_, i) => i * xStep);
    const toY = (v: number) => innerH - (v / yMax) * innerH + padY;

    const demandPts = results.map((r, i) => `${padX + points[i]},${toY(r.predictedDemandKw)}`);
    const genPts = results.map((r, i) => `${padX + points[i]},${toY(r.predictedGenerationKw)}`);

    const demandPath = buildSmoothPath(demandPts);
    const genPath = buildSmoothPath(genPts);

    return { demandPath, genPath, yMax, xStep, points };
  }, [results, innerW, innerH]);

  if (results.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 text-sm text-slate-500">
        No forecast data yet. Add telemetry inputs or upload a CSV to see the chart.
      </div>
    );
  }

  const toY = (v: number) => innerH - (v / yMax) * innerH + padY;
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Forecast chart">
      <defs>
        <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid + labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padX}
            x2={width - padX}
            y1={toY(t)}
            y2={toY(t)}
            stroke="#1e293b"
            strokeWidth={1}
          />
          <text x={padX - 8} y={toY(t) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
            {Math.round(t)}
          </text>
        </g>
      ))}

      {/* X labels (hours) */}
      {results.map((r, i) => (
        <text
          key={i}
          x={padX + points[i]}
          y={height - 8}
          textAnchor="middle"
          className="fill-slate-500 text-[10px]"
        >
          {String(r.hour).padStart(2, "0")}
        </text>
      ))}

      {/* Critical threshold line (200 kW) */}
      {yMax >= 200 && (
        <g>
          <line
            x1={padX}
            x2={width - padX}
            y1={toY(200)}
            y2={toY(200)}
            stroke="#f43f5e"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text x={width - padX} y={toY(200) - 5} textAnchor="end" className="fill-rose-400 text-[10px]">
            Critical 200 kW
          </text>
        </g>
      )}
      {/* Renewable threshold line (160 kW) */}
      {yMax >= 160 && (
        <g>
          <line
            x1={padX}
            x2={width - padX}
            y1={toY(160)}
            y2={toY(160)}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <text x={padX} y={toY(160) - 5} textAnchor="start" className="fill-amber-400 text-[10px]">
            Renewable 160 kW
          </text>
        </g>
      )}

      {/* Generation area + line */}
      <path d={`${genPath} L ${padX + (points[points.length - 1] ?? 0)},${padY + innerH} L ${padX},${padY + innerH} Z`} fill="url(#genGrad)" />
      <path d={genPath} fill="none" stroke="#34d399" strokeWidth={2} />

      {/* Demand area + line */}
      <path d={`${demandPath} L ${padX + (points[points.length - 1] ?? 0)},${padY + innerH} L ${padX},${padY + innerH} Z`} fill="url(#demandGrad)" />
      <path d={demandPath} fill="none" stroke="#22d3ee" strokeWidth={2.5} />

      {/* Point markers */}
      {results.map((r, i) => (
        <g key={i}>
          <circle cx={padX + points[i]} cy={toY(r.predictedDemandKw)} r={3.5} fill="#22d3ee" stroke="#0b1220" strokeWidth={1} />
          <circle cx={padX + points[i]} cy={toY(r.predictedGenerationKw)} r={3} fill="#34d399" stroke="#0b1220" strokeWidth={1} />
        </g>
      ))}
    </svg>
  );
}

// Build a smooth (catmull-rom-ish) path through points.
function buildSmoothPath(pts: string[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0]}`;
  let d = `M ${pts[0]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i].split(",").map(Number);
    const [x1, y1] = pts[i + 1].split(",").map(Number);
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
}
