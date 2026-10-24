import { TelemetryInput } from "./types";

export type FieldErrors = Partial<Record<keyof TelemetryInput, string>>;

/** Validate a single manual telemetry entry. Returns errors keyed by field. */
export function validateTelemetryInput(input: TelemetryInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.timestamp) {
    errors.timestamp = "Timestamp is required.";
  } else {
    const ts = Date.parse(input.timestamp);
    if (Number.isNaN(ts)) errors.timestamp = "Enter a valid date and time.";
  }

  if (input.temperature === undefined || Number.isNaN(input.temperature)) {
    errors.temperature = "Temperature is required.";
  } else if (input.temperature < -50 || input.temperature > 70) {
    errors.temperature = "Temperature must be between -50°C and 70°C.";
  }

  if (input.humidity === undefined || Number.isNaN(input.humidity)) {
    errors.humidity = "Humidity is required.";
  } else if (input.humidity < 0 || input.humidity > 100) {
    errors.humidity = "Humidity must be between 0 and 100%.";
  }

  if (input.solarIrradiance === undefined || Number.isNaN(input.solarIrradiance)) {
    errors.solarIrradiance = "Solar irradiance is required.";
  } else if (input.solarIrradiance < 0 || input.solarIrradiance > 1500) {
    errors.solarIrradiance = "Solar irradiance must be between 0 and 1500 W/m².";
  }

  return errors;
}
