// Forecasting service for POWER-I.
//
// This module computes power demand and renewable generation predictions for
// hourly telemetry inputs. It ships with a transparent demonstration model so
// the dashboard is fully functional out of the box. When a real
// secure Catalyst backend forecasting API is configured via
// VITE_FORECAST_API_URL, the
// `forecast` function will call it instead of the demo model and the results
// will be labelled as live QuickML predictions rather than demonstrations.

import {
  ForecastResponse,
  ForecastResult,
  TelemetryInput,
} from "./types";
import { decideTransition } from "./transitionRules";

const DEMO_MODEL_NAME = "POWER-I Demo Heuristic Model";

// A Catalyst backend must own QuickML credentials; never put API tokens in VITE_ variables.
const FORECAST_API_URL = import.meta.env.VITE_FORECAST_API_URL as string | undefined;

/** Local hour (0-23) for a given ISO timestamp, using the browser's timezone. */
function localHourOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours();
}

/**
 * Demonstration predictor. It is intentionally a deterministic, interpretable
 * heuristic so the dashboard produces meaningful, realistic-looking numbers
 * before a real model is connected. Demand rises in the evening and falls with
 * temperature; generation tracks solar irradiance.
 */
function demoPredict(input: TelemetryInput): { demand: number; generation: number; confidence: number } {
  const hour = localHourOf(input.timestamp);

  // Base daytime demand 90 kW, evening bump up to ~190 kW.
  const eveningFactor = hour >= 17 && hour <= 22 ? (1 + (22 - hour) * 0.12) : 1;
  const tempFactor = 1 + Math.max(0, input.temperature - 22) * 0.015; // AC load on hot days
  let demand = 90 * eveningFactor * tempFactor;

  // Cloudy / humid conditions slightly reduce demand (less cooling).
  if (input.humidity > 80) demand *= 0.96;

  // Renewable generation tracks irradiance (W/m^2 to kW with ~18% panel efficiency).
  const generation = (input.solarIrradiance * 0.18 * 4) / 1000; // ~kW for a 4 kWp array
  const isDaytime = hour >= 6 && hour <= 18;

  return {
    demand: Math.round(demand * 10) / 10,
    generation: isDaytime ? Math.round(generation * 10) / 10 : 0,
    confidence: 0.86,
  };
}

/**
 * Call the real Zoho Catalyst QuickML prediction endpoint.
 * The request/response shape depends on the deployed QuickML model; this stub
 * assumes the model accepts the four telemetry features and returns a demand
 * prediction. Adjust the mapping to match your QuickML model schema.
 */
async function quickMLPredict(inputs: TelemetryInput[]): Promise<{ demand: number; generation: number; confidence: number }[]> {
  if (!FORECAST_API_URL) throw new Error("Forecast API not configured");
  const response = await fetch(FORECAST_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs: inputs.map((i) => ({
        timestamp: i.timestamp,
        ambient_temp_c: i.temperature,
        humidity_pct: i.humidity,
        solar_irradiance_wm2: i.solarIrradiance,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`QuickML request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    predictions?: Array<{ predicted_demand_kw?: number; confidence?: number }>;
  };

  if (!data.predictions || data.predictions.length !== inputs.length) {
    throw new Error("QuickML response did not contain the expected predictions array.");
  }

  return data.predictions.map((p, idx) => {
    const hour = localHourOf(inputs[idx].timestamp);
    const isDaytime = hour >= 6 && hour <= 18;
    const generation = isDaytime
      ? Math.round(((inputs[idx].solarIrradiance * 0.18 * 4) / 1000) * 10) / 10
      : 0;
    return {
      demand: p.predicted_demand_kw ?? 0,
      generation,
      confidence: p.confidence ?? 0.95,
    };
  });
}

/**
 * Produce forecasts for one or more telemetry inputs. Uses QuickML when
 * configured, otherwise falls back to the bundled demo model.
 */
export async function forecast(inputs: TelemetryInput[]): Promise<ForecastResponse> {
  if (inputs.length === 0) {
    return { results: [], model: DEMO_MODEL_NAME, isDemo: true };
  }

  const config = FORECAST_API_URL;
  let isDemo: boolean;
  let model: string;
  let predictions: { demand: number; generation: number; confidence: number }[];

  if (config) {
    try {
      predictions = await quickMLPredict(inputs);
      isDemo = false;
      model = "Zoho Catalyst QuickML";
    } catch (err) {
      // Fall back gracefully so the dashboard keeps working.
      console.warn("QuickML forecast failed, using demo model:", err);
      predictions = inputs.map(demoPredict);
      isDemo = true;
      model = DEMO_MODEL_NAME;
    }
  } else {
    predictions = inputs.map(demoPredict);
    isDemo = true;
    model = DEMO_MODEL_NAME;
  }

  const results: ForecastResult[] = inputs.map((input, idx) => {
    const pred = predictions[idx];
    const hour = localHourOf(input.timestamp);
    const decision = decideTransition(pred.demand, hour);
    return {
      hour,
      timestamp: input.timestamp,
      temperature: input.temperature,
      humidity: input.humidity,
      solarIrradiance: input.solarIrradiance,
      predictedDemandKw: pred.demand,
      predictedGenerationKw: pred.generation,
      mode: decision.mode,
      isCritical: decision.isCritical,
      confidence: pred.confidence,
      isDemo,
    };
  });

  return { results, model, isDemo };
}

/** Whether a real QuickML endpoint is configured (for UI labelling). */
export function isQuickMLConfigured(): boolean {
  return Boolean(FORECAST_API_URL);
}
