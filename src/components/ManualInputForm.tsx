import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { TelemetryInput } from "@/lib/types";
import { validateTelemetryInput, FieldErrors } from "@/lib/validation";

interface Props {
  onAdd: (input: TelemetryInput) => void;
}

function nowLocalISO(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

const emptyInput: TelemetryInput = {
  timestamp: nowLocalISO(),
  temperature: 25,
  humidity: 60,
  solarIrradiance: 500,
};

export function ManualInputForm({ onAdd }: Props) {
  const [input, setInput] = useState<TelemetryInput>(emptyInput);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  function update<K extends keyof TelemetryInput>(key: K, value: TelemetryInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    if (touched) {
      const e = validateTelemetryInput({ ...input, [key]: value });
      setErrors(e);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const e_ = validateTelemetryInput(input);
    setErrors(e_);
    if (Object.keys(e_).length > 0) return;
    onAdd(input);
    setInput({ ...emptyInput, timestamp: nowLocalISO() });
    setTouched(false);
    setErrors({});
  }

  const fieldClass = (field: keyof TelemetryInput) =>
    `w-full rounded-lg border bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors ${
      errors[field] ? "border-rose-500/70" : "border-slate-700 focus:border-cyan-500/70"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">Timestamp</label>
          <input
            type="datetime-local"
            className={fieldClass("timestamp")}
            value={input.timestamp.slice(0, 16)}
            onChange={(e) => update("timestamp", e.target.value)}
          />
          {errors.timestamp && <FieldError msg={errors.timestamp} />}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            className={fieldClass("temperature")}
            value={Number.isNaN(input.temperature) ? "" : input.temperature}
            onChange={(e) => update("temperature", parseFloat(e.target.value))}
          />
          {errors.temperature && <FieldError msg={errors.temperature} />}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Humidity (%)</label>
          <input
            type="number"
            step="1"
            min={0}
            max={100}
            className={fieldClass("humidity")}
            value={Number.isNaN(input.humidity) ? "" : input.humidity}
            onChange={(e) => update("humidity", parseFloat(e.target.value))}
          />
          {errors.humidity && <FieldError msg={errors.humidity} />}
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">Solar Irradiance (W/m²)</label>
          <input
            type="number"
            step="1"
            min={0}
            className={fieldClass("solarIrradiance")}
            value={Number.isNaN(input.solarIrradiance) ? "" : input.solarIrradiance}
            onChange={(e) => update("solarIrradiance", parseFloat(e.target.value))}
          />
          {errors.solarIrradiance && <FieldError msg={errors.solarIrradiance} />}
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:shadow-lg hover:shadow-cyan-500/20 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Add Telemetry Reading
      </button>
    </form>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-rose-400">
      <AlertCircle className="h-3 w-3" />
      {msg}
    </p>
  );
}
