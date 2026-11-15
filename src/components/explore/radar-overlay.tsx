import type { RadarMetadata } from "@/lib/radar";
import { radarLayers, radarProduct, type ImageView, type RadarView } from "@/data/study";
import { MapImageOverlay } from "./map-image-overlay";

export function RadarOverlay({
  metadata,
  layer,
  view,
  opacity,
  split,
  hidden = false,
}: {
  metadata: RadarMetadata;
  layer: ImageView;
  view: RadarView;
  opacity: number;
  split: number;
  hidden?: boolean;
}) {
  return (
    <MapImageOverlay
      url={radarLayers[layer].url}
      bounds={metadata.bounds}
      title={`${radarLayers[layer].label} radar backscatter for ${metadata.location}`}
      attribution={radarProduct.attribution}
      visible={!hidden && (view === layer || (view === "compare" && layer !== "change"))}
      opacity={opacity}
      split={split}
      clipSide={
        view === "compare" && layer !== "change" ? (layer === "before" ? "left" : "right") : null
      }
      zIndex={layer === "after" ? 3 : 2}
    />
  );
}
