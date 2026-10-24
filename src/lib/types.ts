// Core data types for the POWER-I energy management system.

export interface TelemetryInput {
  /** ISO timestamp string, e.g. "2026-10-24T14:00". */
  timestamp: string;
  /** Ambient temperature in degrees Celsius. */
  temperature: number;
  /** Relative humidity as a percentage (0-100). */
  humidity: number;
  /** Solar irradiance in W/m^2. */
  solarIrradiance: number;
}

export interface ForecastResult {
  /** Local hour of day 0-23 derived from the timestamp. */
  hour: number;
  /** ISO timestamp of the reading. */
  timestamp: string;
  /** Measured / input ambient temperature (°C). */
  temperature: number;
  /** Measured / input humidity (%). */
  humidity: number;
  /** Measured / input solar irradiance (W/m^2). */
  solarIrradiance: number;
  /** Predicted power demand in kW. */
  predictedDemandKw: number;
  /** Predicted renewable generation in kW. */
  predictedGenerationKw: number;
  /** Energy transition mode for the hour. */
  mode: EnergyMode;
  /** True when demand crosses the critical overload threshold. */
  isCritical: boolean;
  /** Confidence score 0-1 reported by the forecasting service. */
  confidence: number;
  /** Whether this prediction came from a demonstration model. */
  isDemo: boolean;
}

export type EnergyMode = "Main Grid Mode" | "Renewable Storage Mode";

export interface ForecastResponse {
  results: ForecastResult[];
  /** Name of the model that produced the predictions. */
  model: string;
  /** True when using the bundled demonstration model. */
  isDemo: boolean;
}

export const CRITICAL_DEMAND_KW = 200;
export const RENEWABLE_DEMAND_KW = 160;
export const EVENING_START_HOUR = 18;
export const EVENING_END_HOUR = 22;
