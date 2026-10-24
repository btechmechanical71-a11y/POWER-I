import { TelemetryInput } from "./types";

const REQUIRED_COLUMNS = ["timestamp", "temperature", "humidity", "solar_irradiance"] as const;

export interface CsvParseResult {
  rows: TelemetryInput[];
  errors: string[];
}

/** Parse CSV text into validated telemetry rows. Header row required. */
export function parseTelemetryCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: ["The CSV file is empty."] };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const index: Record<string, number> = {};
  for (const col of REQUIRED_COLUMNS) {
    const idx = header.indexOf(col);
    if (idx === -1) {
      errors.push(`Missing required column "${col}". Expected header: ${REQUIRED_COLUMNS.join(", ")}.`);
      return { rows: [], errors };
    }
    index[col] = idx;
  }

  const rows: TelemetryInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    const rowErrors: string[] = [];
    const lineNo = i + 1;

    const rawTs = cells[index.timestamp];
    const rawTemp = cells[index.temperature];
    const rawHum = cells[index.humidity];
    const rawSolar = cells[index.solar_irradiance];

    if (!rawTs) rowErrors.push("timestamp is empty");
    if (!rawTemp) rowErrors.push("temperature is empty");
    if (!rawHum) rowErrors.push("humidity is empty");
    if (!rawSolar) rowErrors.push("solar_irradiance is empty");

    const temperature = Number(rawTemp);
    const humidity = Number(rawHum);
    const solarIrradiance = Number(rawSolar);

    if (rawTemp && Number.isNaN(temperature)) rowErrors.push("temperature is not a number");
    if (rawHum && (Number.isNaN(humidity) || humidity < 0 || humidity > 100))
      rowErrors.push("humidity must be a number 0-100");
    if (rawSolar && (Number.isNaN(solarIrradiance) || solarIrradiance < 0))
      rowErrors.push("solar_irradiance must be a non-negative number");

    let timestamp = rawTs;
    const tsParsed = Date.parse(rawTs);
    if (rawTs && Number.isNaN(tsParsed)) {
      rowErrors.push("timestamp is not a valid date");
    } else if (rawTs) {
      timestamp = new Date(tsParsed).toISOString();
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${lineNo}: ${rowErrors.join("; ")}.`);
      continue;
    }

    rows.push({ timestamp, temperature, humidity, solarIrradiance });
  }

  return { rows, errors };
}

/** Convert forecast results into downloadable CSV text. */
export function resultsToCsv(rows: { timestamp: string; hour: number; temperature: number; humidity: number; solarIrradiance: number; predictedDemandKw: number; predictedGenerationKw: number; mode: string; isCritical: boolean; confidence: number; isDemo: boolean; }[]): string {
  const header = [
    "timestamp",
    "hour",
    "temperature",
    "humidity",
    "solar_irradiance",
    "predicted_demand_kw",
    "predicted_generation_kw",
    "mode",
    "is_critical",
    "confidence",
    "source",
  ];
  const lines = rows.map((r) =>
    [
      r.timestamp,
      r.hour,
      r.temperature.toFixed(2),
      r.humidity.toFixed(2),
      r.solarIrradiance.toFixed(2),
      r.predictedDemandKw.toFixed(2),
      r.predictedGenerationKw.toFixed(2),
      r.mode,
      r.isCritical ? "true" : "false",
      r.confidence.toFixed(3),
      r.isDemo ? "demo" : "quickml",
    ].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

/** Trigger a browser download of the given CSV content. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
