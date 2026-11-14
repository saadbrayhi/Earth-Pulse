export type RadarBounds = [[number, number], [number, number]];
export interface RadarMetadata {
  location: string;
  beforeDate: string;
  afterDate: string;
  measurement: string;
  bounds: RadarBounds;
  changeThresholdDb: number;
  interpretation: string;
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isCoordinatePair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (coordinate: unknown) => typeof coordinate === "number" && Number.isFinite(coordinate),
    ) &&
    Math.abs(value[0]) < 85.051129 &&
    Math.abs(value[1]) <= 180
  );
}

function isBounds(value: unknown): value is RadarBounds {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isCoordinatePair(value[0]) &&
    isCoordinatePair(value[1]) &&
    value[0][0] < value[1][0] &&
    value[0][1] < value[1][1]
  );
}

function requiredText(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Metadata is missing ${field}.`);
  return value;
}

/** Reject bad georeferencing instead of silently placing a misaligned image. */
export function parseRadarMetadata(value: unknown): RadarMetadata {
  if (!value || typeof value !== "object") throw new Error("Metadata must be a JSON object.");
  const data = value as Record<string, unknown>;
  if (!isBounds(data.bounds)) {
    throw new Error(
      "Metadata bounds must be valid southwest / northeast latitude–longitude pairs within the map projection.",
    );
  }
  if (!isDate(data.beforeDate) || !isDate(data.afterDate) || data.beforeDate >= data.afterDate) {
    throw new Error("Metadata must contain valid, ordered observation dates (YYYY-MM-DD).");
  }
  if (
    typeof data.changeThresholdDb !== "number" ||
    !Number.isFinite(data.changeThresholdDb) ||
    data.changeThresholdDb <= 0
  ) {
    throw new Error("Metadata must contain a positive change threshold in dB.");
  }
  return {
    location: requiredText(data, "location"),
    measurement: requiredText(data, "measurement"),
    interpretation: requiredText(data, "interpretation"),
    beforeDate: data.beforeDate,
    afterDate: data.afterDate,
    bounds: data.bounds,
    changeThresholdDb: data.changeThresholdDb,
  };
}
