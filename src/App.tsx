import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Gauge,
  LayoutDashboard,
  Upload,
  Info,
  Cpu,
  Zap,
  Battery,
  AlertTriangle,
} from "lucide-react";
import { TelemetryInput, ForecastResult } from "@/lib/types";
import { forecast, isQuickMLConfigured } from "@/lib/forecastingService";
import { SummaryCards } from "@/components/SummaryCards";
import { ForecastChart } from "@/components/ForecastChart";
import { ModeTimeline } from "@/components/ModeTimeline";
import { ManualInputForm } from "@/components/ManualInputForm";
import { CsvUpload } from "@/components/CsvUpload";
import { ForecastTable } from "@/components/ForecastTable";

type View = "dashboard" | "input";

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [inputs, setInputs] = useState<TelemetryInput[]>([]);
  const [results, setResults] = useState<ForecastResult[]>([]);
  const [modelName, setModelName] = useState<string>("POWER-I Demo Heuristic Model");
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const quickMlConfigured = useMemo(() => isQuickMLConfigured(), []);

  const runForecast = useCallback(async (rows: TelemetryInput[]) => {
    if (rows.length === 0) {
      setResults([]);
      setInputs([]);
      return;
    }
    setLoading(true);
    setForecastError("");
    try {
      // Sort by timestamp ascending so the timeline reads left-to-right.
      const sorted = [...rows].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const res = await forecast(sorted);
      setInputs(sorted);
      setResults(res.results);
      setModelName(res.model);
      setIsDemo(res.isDemo);
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : "Forecast failed unexpectedly.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleAdd(input: TelemetryInput) {
    runForecast([...inputs, input]);
  }

  function handleCsvUpload(rows: TelemetryInput[]) {
    // Replace current inputs with the uploaded set (typically 24 hourly rows).
    runForecast(rows);
  }

  function handleClear() {
    setInputs([]);
    setResults([]);
    setForecastError("");
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-100">
      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <Header
          view={view}
          setView={setView}
          loading={loading}
          isDemo={isDemo}
          modelName={modelName}
          quickMlConfigured={quickMlConfigured}
        />

        <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          {view === "dashboard" ? (
            <DashboardView
              results={results}
              loading={loading}
              forecastError={forecastError}
              inputs={inputs}
            />
          ) : (
            <InputView
              onAdd={handleAdd}
              onUpload={handleCsvUpload}
              results={results}
              onClear={handleClear}
              loading={loading}
              forecastError={forecastError}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* ----------------------------- Header / Nav ----------------------------- */

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
  loading: boolean;
  isDemo: boolean;
  modelName: string;
  quickMlConfigured: boolean;
}

function Header({ view, setView, loading, isDemo, modelName, quickMlConfigured }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0a0f1c]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20">
            <Activity className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-50">
              POWER<span className="text-cyan-400">-I</span>
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Smart Energy Management
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <NavButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </NavButton>
          <NavButton active={view === "input"} onClick={() => setView("input")} icon={<Upload className="h-4 w-4" />}>
            Data Input
          </NavButton>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              Forecasting...
            </span>
          ) : (
            <ModelBadge isDemo={isDemo} modelName={modelName} configured={quickMlConfigured} />
          )}
        </div>
      </div>
    </header>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ModelBadge({ isDemo, modelName, configured }: { isDemo: boolean; modelName: string; configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isDemo ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
      }`}
      title={configured ? "QuickML endpoint detected" : "No QuickML endpoint configured"}
    >
      <Cpu className="h-3 w-3" />
      {isDemo ? "Demo Predictions" : "QuickML Live"}
    </span>
  );
}

/* ----------------------------- Dashboard View ----------------------------- */

function DashboardView({
  results,
  loading,
  forecastError,
  inputs,
}: {
  results: ForecastResult[];
  loading: boolean;
  forecastError: string;
  inputs: TelemetryInput[];
}) {
  const hasData = results.length > 0;
  return (
    <div className="space-y-6 pt-6">
      {/* Hero status banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/80 to-cyan-950/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-50">Energy Forecast Dashboard</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              24-hour power demand and renewable generation forecast with automatic energy
              transition control. The system switches to <span className="text-emerald-300">Renewable Storage Mode</span> when
              demand exceeds 160 kW or during the 18:00–22:00 evening peak, and raises a{" "}
              <span className="text-rose-300">Critical Overload Alert</span> at or above 200 kW.
            </p>
          </div>
          <TransitionRulesCard />
        </div>
      </div>

      {forecastError && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          Forecast error: {forecastError}
        </div>
      )}

      {loading && !hasData ? (
        <SkeletonState />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          <SummaryCards results={results} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Gauge className="h-4 w-4 text-cyan-400" />
                  Demand vs. Generation Forecast
                </h3>
                <Legend />
              </div>
              <ForecastChart results={results} />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Activity className="h-4 w-4 text-emerald-400" />
                Hourly Mode Timeline
              </h3>
              <ModeTimeline results={results} />
              <TimelineLegend />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <ForecastTable results={results} onClear={() => {}} />
          </div>

          <p className="text-center text-xs text-slate-600">
            Showing {inputs.length} telemetry input{inputs.length === 1 ? "" : "s"} → {results.length} forecast row
            {results.length === 1 ? "" : "s"}.
          </p>
        </>
      )}
    </div>
  );
}

function TransitionRulesCard() {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3 text-xs">
      <p className="mb-2 flex items-center gap-1.5 font-semibold text-slate-300">
        <Info className="h-3.5 w-3.5 text-cyan-400" />
        Transition Rules
      </p>
      <ul className="space-y-1 text-slate-400">
        <li className="flex items-start gap-1.5">
          <Battery className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
          Demand {">"} 160 kW <em>or</em> hour 18:00–22:00 → Renewable Storage
        </li>
        <li className="flex items-start gap-1.5">
          <Zap className="mt-0.5 h-3 w-3 shrink-0 text-cyan-400" />
          Otherwise → Main Grid Mode
        </li>
        <li className="flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
          Demand ≥ 200 kW → Critical Overload Alert
        </li>
      </ul>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-3 rounded-sm bg-cyan-400" /> Demand (kW)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-3 rounded-sm bg-emerald-400" /> Generation (kW)
      </span>
    </div>
  );
}

function TimelineLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-cyan-400" /> Grid</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-emerald-400" /> Renewable</span>
      <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-rose-500" /> Critical</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
        <Gauge className="h-7 w-7 text-cyan-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">No forecast data yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
        Head to the <span className="text-cyan-400">Data Input</span> tab to add telemetry readings
        manually or upload a CSV of 24 hourly rows. The dashboard will generate predictions and
        apply the energy transition rules automatically.
      </p>
    </div>
  );
}

function SkeletonState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
    </div>
  );
}

/* ----------------------------- Input View ----------------------------- */

function InputView({
  onAdd,
  onUpload,
  results,
  onClear,
  loading,
  forecastError,
}: {
  onAdd: (input: TelemetryInput) => void;
  onUpload: (rows: TelemetryInput[]) => void;
  results: ForecastResult[];
  onClear: () => void;
  loading: boolean;
  forecastError: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 pt-6 lg:grid-cols-2">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Upload className="h-4 w-4 text-cyan-400" />
            Manual Telemetry Input
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Enter a single hourly reading. It will be appended to the forecast.
          </p>
          <ManualInputForm onAdd={onAdd} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Upload className="h-4 w-4 text-emerald-400" />
            CSV Upload (24 hourly rows)
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Upload a CSV with columns timestamp, temperature, humidity, solar_irradiance.
            This replaces the current forecast set.
          </p>
          <CsvUpload onUpload={onUpload} />
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          {forecastError && (
            <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">
              {forecastError}
            </div>
          )}
          {loading ? (
            <div className="space-y-2">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-800" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-slate-800/60" />
              ))}
            </div>
          ) : (
            <ForecastTable results={results} onClear={onClear} />
          )}
        </section>

        <DemoNotice />
      </div>
    </div>
  );
}

function DemoNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200/90">
      <p className="mb-1 flex items-center gap-1.5 font-semibold">
        <Info className="h-3.5 w-3.5" />
        Demonstration predictions
      </p>
      <p className="leading-relaxed">
        Predictions shown here come from the bundled POWER-I demo heuristic model. They are clearly
        labelled and are suitable for validating the dashboard. To use real predictions, configure a
        Zoho Catalyst QuickML endpoint via <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px]">VITE_QUICKML_PREDICT_URL</code>{" "}
        and <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px]">VITE_QUICKML_TOKEN</code> in your environment — the
        forecasting service will switch to it automatically.
      </p>
    </div>
  );
}

export default App;
