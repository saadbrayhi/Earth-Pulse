import type { Observation, Comparison } from "./observation-types";

export function checkComparison(
  a: string,
  b: string,
  observations: Observation[],
  comparisons: Comparison[],
) {
  const first = observations.find((o) => o.id === a),
    second = observations.find((o) => o.id === b);
  if (!first || !second) return { comparison: null, reason: "Choose two known observations." };
  if (a === b) return { comparison: null, reason: "Choose two different observations." };
  if (first.status !== "processed" || second.status !== "processed")
    return {
      comparison: null,
      reason:
        "Catalog discovery only: required images, quality checks and difference layers have not been processed.",
    };
  const comparison = comparisons.find((c) => c.observationA === a && c.observationB === b);
  if (!comparison)
    return {
      comparison: null,
      reason:
        "No compatible processed comparison in this order. No difference will be inferred from unrelated layers.",
    };
  return { comparison, reason: comparison.uncertainty };
}
