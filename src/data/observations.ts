import { publicImagery } from "./public-imagery";
import { analysis, observations } from "./study";
import { seasonal, seasonalDiscovery } from "./seasons";
import { dataFiles } from "./files";
import { radarMission } from "./project";
import type { Observation, Comparison } from "@/lib/observation-types";

const original: Observation[] = observations.map((o, index) => ({
  id: `radar-${o.date}`,
  date: o.date,
  timestamp: null,
  dateEvidence: analysis.dateEvidence,
  season: "transition",
  mission: radarMission.credit,
  product: analysis.product,
  productId: analysis.sources[index].parentGranuleId,
  measurement: analysis.polarization,
  maturity: "Export tags verified; parent release unverified",
  coveragePercent:
    (analysis.sources[index].validPixels /
      (analysis.sources[index].width * analysis.sources[index].height)) *
    100,
  quality: "Positive finite samples checked; native quality masks unavailable",
  status: "processed",
  sourceUrl: dataFiles.analysis,
  asset: o.asset,
  bounds: analysis.bounds as Observation["bounds"],
  radarKey: o.key,
}));
const classified: Observation[] =
  seasonal.status === "classified"
    ? seasonal.observations.map((o) => ({
        id: o.id,
        date: o.date,
        timestamp: null,
        dateEvidence: "Acquisition metadata in selected seasonal manifest",
        season: o.season,
        mission: o.mission,
        product: o.productType,
        productId: o.productId,
        measurement: "Water / non-water classification",
        maturity: `Processing ${o.processingVersion}`,
        coveragePercent: seasonal.metrics?.coveragePercent ?? null,
        quality: "Classified; independent local validation not performed",
        status: "processed",
        sourceUrl: o.sourceUrl,
        asset: o.asset,
        bounds: seasonal.bounds,
      }))
    : [];

const optical: Observation[] = publicImagery.observations.map((o) => ({
  id: o.id,
  date: o.date,
  timestamp: null,
  dateEvidence:
    "NASA GIBS requested daily composite date, within published availability; not an exact acquisition timestamp",
  season: ["12", "01", "02"].includes(o.date.slice(5, 7))
    ? "dry"
    : ["06", "07", "08", "09"].includes(o.date.slice(5, 7))
      ? "wet"
      : "transition",
  mission: "NASA / MODIS Terra",
  product: "GIBS corrected reflectance true color",
  productId: o.layer,
  measurement: "Optical browse imagery; approximately 250 m native detail",
  maturity: "Public visualization, not a calibrated analysis raster",
  coveragePercent: null,
  quality:
    "Clouds may obscure the ground. Image alpha is not cloud-free or classification coverage.",
  status: "processed",
  sourceUrl: o.sourceUrl,
  asset: o.asset,
  bounds: o.bounds as Observation["bounds"],
  kind: "optical-browse",
}));

const candidates: Observation[] = seasonalDiscovery.results.flatMap((query) =>
  query.candidates.map(
    (o) =>
      ({
        contextObservationId: optical.find((image) => image.date === o.start?.slice(0, 10))?.id,
        id: o.id,
        date: o.start?.slice(0, 10) ?? "",
        timestamp: o.start,
        dateEvidence: "NASA CMR granule acquisition metadata",
        season: query.season as "dry" | "wet",
        mission: query.collection.startsWith("NISAR")
          ? radarMission.credit
          : query.collection.includes("HLS")
            ? "OPERA / Landsat–Sentinel-2"
            : "OPERA / Sentinel-1",
        product: query.collection,
        productId: o.productId,
        measurement: query.collection.startsWith("NISAR")
          ? "Polarization compatibility unverified"
          : "Water classification candidate",
        maturity: query.collection.includes("PROVISIONAL")
          ? "Provisional collection; compatibility unverified"
          : query.collection.includes("BETA")
            ? "Beta collection; radiometry unverified"
            : "Collection version 1; local QC pending",
        coveragePercent: null,
        quality:
          o.cloudCover === null
            ? "Footprint, quality and processing not assessed"
            : `Scene cloud cover ${o.cloudCover}%; AOI quality unassessed`,
        status: "catalog-only",
        sourceUrl: o.sourceUrl,
        asset: null,
        bounds: null,
      }) as Observation,
  ),
);
export const observationRegistry: Observation[] = [
  ...new Map(
    [...original, ...candidates, ...classified, ...optical].map((o) => [o.id, o]),
  ).values(),
].sort(
  (a, b) =>
    a.date.localeCompare(b.date) ||
    Number(Boolean(b.radarKey)) - Number(Boolean(a.radarKey)) ||
    a.id.localeCompare(b.id),
);
export const originalRadarPair = { a: original[0].id, b: original[1].id };
export function displayedObservation(id: string | null) {
  const requested = observationRegistry.find((o) => o.id === id);
  return requested?.asset
    ? requested
    : observationRegistry.find((o) => o.id === requested?.contextObservationId);
}
export const comparisonRegistry: Comparison[] = [
  ...optical.flatMap((a) =>
    optical
      .filter((b) => b.date > a.date)
      .map((b) => ({
        id: `optical-${a.date}-${b.date}`,
        observationA: a.id,
        observationB: b.id,
        type: "imagery" as const,
        method:
          "Side-by-side daily corrected-reflectance browse images; no pixel subtraction or classification",
        uncertainty:
          "Visual comparison only. Clouds, illumination and compositing affect appearance. No water change measurements.",
      })),
  ),
  {
    id: "october-radar",
    observationA: original[0].id,
    observationB: original[1].id,
    type: "radar",
    method: analysis.processing.formula,
    uncertainty: analysis.quality.orbitComparability,
  },
  ...(seasonal.status === "classified"
    ? [
        {
          id: "seasonal-water",
          observationA: seasonal.observations.find((o) => o.season === "dry")!.id,
          observationB: seasonal.observations.find((o) => o.season === "wet")!.id,
          type: "seasonal" as const,
          method: seasonal.method,
          uncertainty: seasonal.reason,
        },
      ]
    : []),
];
export const observationYears = [
  ...new Set(observationRegistry.map((o) => o.date.slice(0, 4))),
].sort();
