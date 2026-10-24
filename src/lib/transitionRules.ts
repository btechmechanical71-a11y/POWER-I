import {
  EnergyMode,
  EVENING_END_HOUR,
  EVENING_START_HOUR,
  RENEWABLE_DEMAND_KW,
  CRITICAL_DEMAND_KW,
} from "./types";

export interface TransitionDecision {
  mode: EnergyMode;
  isCritical: boolean;
  reason: string;
}

/** Determine the energy transition mode and overload state for a single hour. */
export function decideTransition(demandKw: number, localHour: number): TransitionDecision {
  const isEveningPeak = localHour >= EVENING_START_HOUR && localHour <= EVENING_END_HOUR;
  const highDemand = demandKw > RENEWABLE_DEMAND_KW;
  const critical = demandKw >= CRITICAL_DEMAND_KW;

  if (isEveningPeak || highDemand) {
    return {
      mode: "Renewable Storage Mode",
      isCritical: critical,
      reason: isEveningPeak && highDemand
        ? `Evening peak (${EVENING_START_HOUR}:00-${EVENING_END_HOUR}:00) and demand ${demandKw} kW > ${RENEWABLE_DEMAND_KW} kW`
        : isEveningPeak
          ? `Evening peak window ${EVENING_START_HOUR}:00-${EVENING_END_HOUR}:00`
          : `Demand ${demandKw} kW > ${RENEWABLE_DEMAND_KW} kW`,
    };
  }

  return {
    mode: "Main Grid Mode",
    isCritical: critical,
    reason: `Demand ${demandKw} kW ≤ ${RENEWABLE_DEMAND_KW} kW and outside evening peak`,
  };
}
