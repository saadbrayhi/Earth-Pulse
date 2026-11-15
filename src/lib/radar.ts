import { analysis, radarViewLabels, radarViewOptions, type RadarView } from "@/data/study";

import type { RadarMetadata } from "./radar-metadata";
export { parseRadarMetadata } from "./radar-metadata";
export type { RadarBounds, RadarMetadata } from "./radar-metadata";

export function isRadarView(value: string): value is RadarView {
  return radarViewOptions.some((option) => option.value === value);
}

export function radarViewLabel(view: RadarView) {
  return radarViewLabels[view];
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
    metadata.location !== analysis.location ||
    metadata.beforeDate !== analysis.beforeDate ||
    metadata.afterDate !== analysis.afterDate ||
    metadata.changeThresholdDb !== analysis.processing.thresholdDb
  ) {
    throw new Error(
      "Metadata and analysis differ. Regenerate analysis before viewing these overlays.",
    );
  }
}
