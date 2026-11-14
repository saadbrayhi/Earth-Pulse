import { analysis } from "./analysis";

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

export const radarLayers = {
  before: { label: "Before", url: analysis.assets.before.url },
  after: { label: "After", url: analysis.assets.after.url },
  compare: { label: "Swipe", url: "" },
  change: { label: "Change", url: analysis.assets.change.url },
} as const;

export type RadarView = keyof typeof radarLayers;
export const radarViews: RadarView[] = ["before", "after", "compare", "change"];
export type ImageView = Exclude<RadarView, "compare">;
export const imageViews: ImageView[] = ["before", "after", "change"];

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Reject invalid georeferencing rather than silently displaying a misplaced image. */
export function parseRadarMetadata(value: unknown): RadarMetadata {
  if (!value || typeof value !== "object") throw new Error("Metadata must be a JSON object.");
  const data = value as Record<string, unknown>;
  const bounds = data.bounds;
  if (
    !Array.isArray(bounds) || bounds.length !== 2 ||
    !bounds.every((point: unknown) => Array.isArray(point) && point.length === 2 &&
      point.every((coordinate: unknown) => typeof coordinate === "number" && Number.isFinite(coordinate)) &&
      Math.abs(point[0]) < 85.051129 && Math.abs(point[1]) <= 180) ||
    bounds[0][0] >= bounds[1][0] || bounds[0][1] >= bounds[1][1]
  ) {
    throw new Error("Metadata bounds must be valid southwest / northeast latitude–longitude pairs within the map projection.");
  }
  for (const field of ["location", "measurement", "interpretation"] as const) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      throw new Error(`Metadata is missing ${field}.`);
    }
  }
  if (!isDate(data.beforeDate) || !isDate(data.afterDate) || data.beforeDate >= data.afterDate) {
    throw new Error("Metadata must contain valid, ordered observation dates (YYYY-MM-DD).");
  }
  if (typeof data.changeThresholdDb !== "number" || !Number.isFinite(data.changeThresholdDb) || data.changeThresholdDb <= 0) {
    throw new Error("Metadata must contain a positive change threshold in dB.");
  }
  return data as unknown as RadarMetadata;
}

export function formatObservationDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatCoordinate(value: number, axis: "latitude" | "longitude") {
  const direction = axis === "latitude" ? (value < 0 ? "S" : "N") : (value < 0 ? "W" : "E");
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}
