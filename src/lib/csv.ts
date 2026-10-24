import { TelemetryInput } from "./types";

const REQUIRED_COLUMNS = ["timestamp", "ambient_temp_c", "humidity_pct", "solar_irradiance_wm2"] as const;

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
    const rawTemp = cells[index.ambient_temp_c];
    const rawHum = cells[index.humidity_pct];
    const rawSolar = cells[index.solar_irradiance_wm2];

    if (!rawTs) rowErrors.push("timestamp is empty");
    if (!rawTemp) rowErrors.push("ambient_temp_c is empty");
    if (!rawHum) rowErrors.push("humidity is empty");
    if (!rawSolar) rowErrors.push("solar_irradiance_wm2 is empty");

    const temperature = Number(rawTemp);
    const humidity = Number(rawHum);
    const solarIrradiance = Number(rawSolar);

    if (rawTemp && Number.isNaN(temperature)) rowErrors.push("ambient_temp_c is not a number");
    if (rawHum && (Number.isNaN(humidity) || humidity < 0 || humidity > 100))
      rowErrors.push("humidity_pct must be a number 0-100");
    if (rawSolar && (Number.isNaN(solarIrradiance) || solarIrradiance < 0))
      rowErrors.push("solar_irradiance must be a non-negative number");

    let timestamp = rawTs;
    const tsParsed = Date.parse(rawTs);
    if (rawTs && Number.isNaN(tsParsed)) {
      rowErrors.push("timestamp is not a valid date");
    } else if (rawTs) {
      timestamp = rawTs;
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
export function resultsToCsv(rows: { timestamp: string; predictedDemandKw: number }[]): string {
  const lines = rows.map((r) => [r.timestamp, r.predictedDemandKw.toFixed(2)].join(","));
  return ["timestamp,target_demand_kw", ...lines].join("\n");
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
