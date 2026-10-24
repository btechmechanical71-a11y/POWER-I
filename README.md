# POWER-I — AI-Powered Smart Energy Management System

POWER-I is a web-based energy management dashboard that forecasts hourly power demand and renewable generation, then automatically determines the optimal energy transition mode (Main Grid or Renewable Storage) and raises critical overload alerts.

Built with **React + TypeScript + Vite + Tailwind CSS**. The forecasting service is designed to plug into a real **Zoho Catalyst QuickML** prediction endpoint, with a bundled demonstration model for out-of-the-box use.

## Features

- **Energy dashboard** with a smooth demand-vs-generation area chart, hourly mode timeline, and six summary cards (average demand, peak demand, total generation, renewable hours, critical alerts, forecast window).
- **Manual telemetry input** for a single hourly reading: timestamp, temperature (°C), humidity (%), and solar irradiance (W/m²) — with inline validation and helpful error messages.
- **CSV upload** for up to 24 hourly input rows. Drag-and-drop or file picker, with a downloadable CSV template and per-row parse error reporting.
- **Forecast results table** with per-hour predictions, mode, confidence, and critical flags — plus one-click **CSV export**.
- **Energy transition rules engine**:
  - Demand **> 160 kW** OR local hour between **18:00 and 22:00 inclusive** → **Renewable Storage Mode**.
  - Otherwise → **Main Grid Mode**.
  - Demand **≥ 200 kW** → **Critical Overload Alert** (shown in the chart, table, and timeline).
- **Separate forecasting service** (`src/lib/forecastingService.ts`) that calls Zoho Catalyst QuickML when configured, otherwise falls back to a transparent demo heuristic model. Results are clearly labelled as demonstration predictions until a real model is connected.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the build
npm run typecheck
```

The app is a client-side SPA — no backend is required to use the demo model.

## CSV format

The CSV upload expects a header row with these columns (case-insensitive):

```
timestamp,temperature,humidity,solar_irradiance
```

- `timestamp` — ISO date/time, e.g. `2026-10-24T14:00`.
- `temperature` — ambient temperature in °C.
- `humidity` — relative humidity, 0–100.
- `solar_irradiance` — solar irradiance in W/m² (non-negative).

Up to 24 hourly rows. You can download a template from the Data Input tab.

## Connecting a real Zoho Catalyst QuickML model

The forecasting service reads two environment variables:

| Variable | Purpose |
| --- | --- |
| `VITE_QUICKML_PREDICT_URL` | The QuickML prediction endpoint URL. |
| `VITE_QUICKML_TOKEN` | Bearer token for authenticating with the endpoint. |

Set them in a `.env` file at the project root:

```env
VITE_QUICKML_PREDICT_URL=https://<your-catalyst-project>/quickml/v1/models/<model-id>/predict
VITE_QUICKML_TOKEN=your_bearer_token
```

When both are present, `forecast()` POSTs the telemetry batch to QuickML and renders results as **QuickML Live**. If the request fails, it falls back to the demo model so the dashboard keeps working. When they are absent, the demo model runs and predictions are clearly labelled as **Demo Predictions**.

> The expected QuickML request/response shape is documented in `src/lib/forecastingService.ts`. Adjust the request body and response mapping to match your deployed QuickML model schema.

## Project structure

```
src/
├─ App.tsx                       # Dashboard + Data Input views, navigation
├─ components/
│  ├─ SummaryCards.tsx           # KPI summary cards
│  ├─ ForecastChart.tsx          # SVG area chart (demand vs generation)
│  ├─ ModeTimeline.tsx           # Per-hour horizontal bar timeline
│  ├─ ManualInputForm.tsx        # Single-reading input with validation
│  ├─ CsvUpload.tsx              # CSV upload + template download
│  └─ ForecastTable.tsx          # Results table + CSV export
└─ lib/
   ├─ types.ts                   # Shared types + thresholds
   ├─ transitionRules.ts         # Energy transition decision engine
   ├─ forecastingService.ts       # QuickML client + demo model fallback
   ├─ csv.ts                     # CSV parsing + export helpers
   └─ validation.ts              # Manual input validation
```

## Notes

- Predictions from the demo model are deterministic and interpretable: demand rises during the evening peak and on hot days; renewable generation tracks solar irradiance during daylight hours.
- All transition thresholds (160 kW, 200 kW, 18:00–22:00) are defined as constants in `src/lib/types.ts`.
