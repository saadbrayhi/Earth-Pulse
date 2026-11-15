import type { RadarBounds } from "./radar-metadata";

export interface MapAsset {
  url: string;
  bytes: number;
  width: number;
  height: number;
  projection: string;
  encoding: string;
}
export type Season = "dry" | "wet" | "transition" | "unknown";
export type ExplorerMode = "radar" | "seasonal" | "imagery";
export type SeasonalView = "dry" | "wet" | "compare" | "change";
export interface Observation {
  id: string;
  date: string;
  timestamp: string | null;
  dateEvidence: string;
  season: Season;
  mission: string;
  product: string;
  productId: string | null;
  measurement: string;
  maturity: string;
  coveragePercent: number | null;
  quality: string;
  status: "processed" | "catalog-only";
  sourceUrl: string;
  asset: MapAsset | null;
  bounds: RadarBounds | null;
  kind?: "optical-browse";
  contextObservationId?: string;
  radarKey?: "before" | "after";
}
export interface WaterTransition {
  key: "bothDates" | "wetOnly" | "dryOnly" | "neither";
  code: number;
  label: string;
  pixels: number;
  areaKm2: number;
  percentValidArea: number;
  asset: MapAsset;
}
export interface SeasonalMetrics {
  pairedPixels: number;
  unknownPixels: number;
  coveragePercent: number;
  comparedAreaKm2: number;
  dryWaterAreaKm2: number;
  wetWaterAreaKm2: number;
  netDifferenceKm2: number;
  transitions: WaterTransition[];
}
export interface SeasonalObservation {
  id: string;
  date: string;
  season: "dry" | "wet";
  mission: string;
  productId: string;
  productType: string;
  processingVersion: string;
  sourceUrl: string;
  sha256: string;
  asset: MapAsset;
}
interface SeasonalBase {
  schemaVersion: number;
  reason: string;
  method: string;
  methodSource: string;
  bounds: RadarBounds;
  validation: { status: "not-performed"; metrics: null };
  limitations: string[];
}
export type SeasonalReport = SeasonalBase &
  (
    | { status: "unavailable"; metrics: null; observations: []; assets: Record<string, never> }
    | {
        status: "classified";
        metrics: SeasonalMetrics;
        observations: SeasonalObservation[];
        assets: Record<"dry" | "wet" | "change", MapAsset>;
        areaMethod: string;
      }
  );
export interface Comparison {
  id: string;
  observationA: string;
  observationB: string;
  type: ExplorerMode;
  method: string;
  uncertainty: string;
}

export type MapSelection =
  | { mode: "imagery"; view: import("../data/study").RadarView; highlight: MapAsset | null }
  | { mode: "radar"; view: import("../data/study").RadarView; highlight: MapAsset | null }
  | { mode: "seasonal"; view: SeasonalView; highlight: MapAsset | null };
