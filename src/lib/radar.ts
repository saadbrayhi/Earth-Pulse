import { analysis } from "./analysis";

import type { RadarMetadata } from "./radar-metadata";
export { parseRadarMetadata } from "./radar-metadata";
export type { RadarBounds, RadarMetadata } from "./radar-metadata";

export const radarLayers = {
  before: { label: "Before", url: analysis.assets.before.url },
  after: { label: "After", url: analysis.assets.after.url },
  change: { label: "Change", url: analysis.assets.change.url },
} as const;

export type ImageView = keyof typeof radarLayers;
export type RadarView = ImageView | "compare";
export const imageViews: ImageView[] = ["before", "after", "change"];
export const radarViewOptions: { value: RadarView; label: string }[] = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "compare", label: "Swipe" },
  { value: "change", label: "Change" },
];

export function isRadarView(value: string): value is RadarView {
  return radarViewOptions.some((option) => option.value === value);
}

export function radarViewLabel(view: RadarView) {
  return view === "compare" ? "Swipe" : radarLayers[view].label;
}

export function observationLabel(metadata: RadarMetadata, view: RadarView) {
  if (view === "before") return metadata.beforeDate;
  if (view === "after") return metadata.afterDate;
  return `${metadata.beforeDate} → ${metadata.afterDate}`;
}

export function assertMatchingAnalysis(metadata: RadarMetadata) {
  const sameBounds = metadata.bounds.every((corner, index) =>
    corner.every((coordinate, axis) => coordinate === analysis.bounds[index][axis]),
  );
  if (
    !sameBounds ||
    metadata.beforeDate !== analysis.beforeDate ||
    metadata.afterDate !== analysis.afterDate ||
    metadata.changeThresholdDb !== analysis.processing.thresholdDb
  ) {
    throw new Error(
      "Metadata and analysis differ. Regenerate analysis before viewing these overlays.",
    );
  }
}
