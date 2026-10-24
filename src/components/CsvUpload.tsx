import { useRef, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { TelemetryInput } from "@/lib/types";
import { parseTelemetryCsv } from "@/lib/csv";

interface Props {
  onUpload: (rows: TelemetryInput[]) => void;
}

export function CsvUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setInfo("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrors(["Please select a .csv file."]);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, errors: parseErrors } = parseTelemetryCsv(text);
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
      }
      if (rows.length === 0 && parseErrors.length === 0) {
        setErrors(["No valid data rows found in the CSV."]);
        return;
      }
      if (rows.length > 24) {\n        setErrors(["Maximum 24 hourly rows allowed."]);\n        return;\n      }\n      if (rows.length > 0 && parseErrors.length === 0) {
        onUpload(rows);
        setInfo(`Loaded ${rows.length} valid row${rows.length === 1 ? "" : "s"} from ${file.name}.`);
      }
    };
    reader.onerror = () => setErrors(["Could not read the file."]);
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const header = "timestamp,ambient_temp_c,humidity_pct,solar_irradiance_wm2";
    const sample = "2026-10-24T00:00,22.5,68,0\n2026-10-24T01:00,21.8,70,0";
    const blob = new Blob([`${header}\n${sample}\n`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "power-i-telemetry-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 px-4 py-8 text-center transition-colors hover:border-cyan-500/60"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) inputRef.current!.files = e.dataTransfer.files;
          if (f) handleFile({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
        }}
      >
        <Upload className="h-8 w-8 text-cyan-400" />
        <p className="text-sm text-slate-300">
          Drag & drop a CSV here, or
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          <FileText className="h-4 w-4" />
          Choose CSV File
        </button>
        <p className="text-xs text-slate-500">
          Expects columns: timestamp, temperature, humidity, solar_irradiance (up to 24 hourly rows)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="flex items-center justify-between">
        {fileName ? (
          <span className="text-xs text-slate-400">Loaded: {fileName}</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-xs text-cyan-400 underline-offset-2 hover:underline"
        >
          Download CSV template
        </button>
      </div>

      {info && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {info}
        </p>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-rose-300">
            <AlertCircle className="h-4 w-4" />
            {errors.length} error{errors.length === 1 ? "" : "s"} while parsing CSV
          </p>
          <ul className="ml-5 list-disc space-y-0.5 text-xs text-rose-300/90">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
