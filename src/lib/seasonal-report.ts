import type { SeasonalReport } from "./observation-types";

/** Reject incomplete generated reports before enabling water comparisons. */
export function parseSeasonalReport(value: unknown): SeasonalReport {
  if (!value || typeof value !== "object") throw new Error("Seasonal report missing");
  const r = value as Record<string, unknown>;
  if (
    r.schemaVersion !== 1 ||
    typeof r.reason !== "string" ||
    typeof r.method !== "string" ||
    typeof r.methodSource !== "string" ||
    !Array.isArray(r.observations) ||
    !Array.isArray(r.bounds) ||
    !Array.isArray(r.limitations)
  )
    throw new Error("Invalid seasonal report");
  const bounds = r.bounds as number[][];
  if (
    bounds.length !== 2 ||
    bounds.some((c) => !Array.isArray(c) || c.length !== 2 || c.some((v) => !Number.isFinite(v))) ||
    bounds[0][0] >= bounds[1][0] ||
    bounds[0][1] >= bounds[1][1]
  )
    throw new Error("Invalid seasonal bounds");
  if (r.status === "unavailable" && r.metrics === null && r.observations.length === 0)
    return value as SeasonalReport;
  if (r.status !== "classified" || !r.metrics || typeof r.metrics !== "object")
    throw new Error("Incomplete seasonal classification");
  const report = value as SeasonalReport & { status: "classified" };
  if (
    report.observations.length !== 2 ||
    new Set(report.observations.map((o) => o.season)).size !== 2 ||
    !report.observations.every(
      (o) =>
        ["dry", "wet"].includes(o.season) &&
        /^\d{4}-\d{2}-\d{2}$/.test(o.date) &&
        o.id &&
        o.mission &&
        o.processingVersion &&
        o.productId &&
        o.sourceUrl,
    )
  )
    throw new Error("A documented dry/wet observation pair is required");
  const metrics = report.metrics;
  const numbers = [
    metrics.pairedPixels,
    metrics.unknownPixels,
    metrics.coveragePercent,
    metrics.comparedAreaKm2,
    metrics.dryWaterAreaKm2,
    metrics.wetWaterAreaKm2,
    metrics.netDifferenceKm2,
  ];
  if (
    !numbers.every(Number.isFinite) ||
    metrics.pairedPixels <= 0 ||
    metrics.comparedAreaKm2 <= 0 ||
    metrics.coveragePercent < 0 ||
    metrics.coveragePercent > 100 ||
    metrics.unknownPixels < 0 ||
    metrics.dryWaterAreaKm2 < 0 ||
    metrics.wetWaterAreaKm2 < 0
  )
    throw new Error("Invalid seasonal metrics");
  const keys = ["bothDates", "wetOnly", "dryOnly", "neither"];
  if (
    !Array.isArray(metrics.transitions) ||
    metrics.transitions.length !== 4 ||
    !keys.every((key) => metrics.transitions.some((c) => c.key === key)) ||
    metrics.transitions.some(
      (c) =>
        !Number.isInteger(c.pixels) ||
        c.pixels < 0 ||
        !Number.isFinite(c.areaKm2) ||
        c.areaKm2 < 0 ||
        !Number.isFinite(c.percentValidArea) ||
        c.percentValidArea < 0 ||
        c.percentValidArea > 100,
    )
  )
    throw new Error("Invalid water transition matrix");
  const sum = metrics.transitions.reduce((n, c) => n + c.pixels, 0);
  const area = metrics.transitions.reduce((n, c) => n + c.areaKm2, 0);
  const areas = Object.fromEntries(metrics.transitions.map((c) => [c.key, c.areaKm2]));
  if (
    sum !== metrics.pairedPixels ||
    Math.abs(area - metrics.comparedAreaKm2) > 1e-6 ||
    Math.abs(metrics.netDifferenceKm2 - (metrics.wetWaterAreaKm2 - metrics.dryWaterAreaKm2)) >
      1e-6 ||
    Math.abs(metrics.wetWaterAreaKm2 - areas.bothDates - areas.wetOnly) > 1e-6 ||
    Math.abs(metrics.dryWaterAreaKm2 - areas.bothDates - areas.dryOnly) > 1e-6 ||
    Math.abs(metrics.transitions.reduce((n, c) => n + c.percentValidArea, 0) - 100) > 1e-6
  )
    throw new Error("Seasonal accounting mismatch");
  for (const asset of [
    ...Object.values(report.assets),
    ...metrics.transitions.map((c) => c.asset),
    ...report.observations.map((o) => o.asset),
  ]) {
    if (
      !asset ||
      !/^\/data\/display\/[A-Za-z0-9-]+\.webp$/.test(asset.url) ||
      !Number.isFinite(asset.bytes) ||
      asset.bytes <= 0 ||
      !Number.isInteger(asset.width) ||
      asset.width <= 0 ||
      !Number.isInteger(asset.height) ||
      asset.height <= 0 ||
      asset.projection !== "EPSG:3857"
    )
      throw new Error("Missing local seasonal overlay");
  }
  for (const key of ["dry", "wet", "change"] as const)
    if (!report.assets[key]) throw new Error("Missing seasonal view");
  return report;
}
