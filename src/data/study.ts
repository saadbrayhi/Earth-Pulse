import report from "../../public/data/analysis.json";
import { radarMission } from "./project";

/** The generated full-resolution report is the authoritative source for study facts. */
export const analysis = report;
export const changeThresholdDb = analysis.processing.thresholdDb;
export const observationWindow = `${analysis.beforeDate} → ${analysis.afterDate}`;

export const observations = [
  {
    key: "before",
    label: "Before",
    date: analysis.beforeDate,
    stats: analysis.before,
    asset: analysis.assets.before,
  },
  {
    key: "after",
    label: "After",
    date: analysis.afterDate,
    stats: analysis.after,
    asset: analysis.assets.after,
  },
] as const;

export const radarProduct = {
  summary: `${analysis.product} / Frequency ${analysis.frequency} / ${analysis.polarization}`,
  imageLabel: `${analysis.product} / ${analysis.polarization}`,
  measurement: `Frequency ${analysis.frequency} / ${analysis.measurement}`,
  attribution: `${radarMission.displayName} · ${analysis.product} · ${analysis.polarization}`,
} as const;

const categoryDefinitions = {
  decreased: {
    label: "Decreased backscatter",
    swatchClass: "bg-signal-decreased",
    range: `< −${changeThresholdDb} dB`,
  },
  withinThreshold: {
    label: `Within ±${changeThresholdDb} dB`,
    swatchClass: "transparency-swatch",
    range: `±${changeThresholdDb} dB`,
  },
  increased: {
    label: "Increased backscatter",
    swatchClass: "bg-signal-increased",
    range: `> +${changeThresholdDb} dB`,
  },
} as const;

export type ChangeCategoryKey = keyof typeof categoryDefinitions;

/** Labels and exact counts stay together for legends, summaries and explanations. */
export const changeCategories = analysis.categories.map((category) => {
  if (!Object.hasOwn(categoryDefinitions, category.key)) {
    throw new Error(`Unknown analysis category: ${category.key}`);
  }
  const key = category.key as ChangeCategoryKey;
  return { ...category, key, ...categoryDefinitions[key] };
});

export const radarLayers = {
  before: { label: observations[0].label, url: observations[0].asset.url },
  after: { label: observations[1].label, url: observations[1].asset.url },
  change: { label: "Change", url: analysis.assets.change.url },
} as const;

export type ImageView = keyof typeof radarLayers;
export const imageViews = Object.keys(radarLayers) as ImageView[];

export const radarViewLabels = {
  before: radarLayers.before.label,
  after: radarLayers.after.label,
  compare: "Swipe",
  change: radarLayers.change.label,
} as const;

export type RadarView = keyof typeof radarViewLabels;
export const radarViewOptions = (Object.keys(radarViewLabels) as RadarView[]).map((value) => ({
  value,
  label: radarViewLabels[value],
}));
