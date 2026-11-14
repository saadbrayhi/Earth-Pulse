"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ImageOverlay as LeafletImageOverlay, type LeafletEventHandlerFnMap } from "leaflet";
import { ImageOverlay, useMap } from "react-leaflet";
import { radarLayers, type ImageView, type RadarMetadata, type RadarView } from "@/lib/radar";
import { imageSplitPercent } from "@/lib/map-clip";
import { MapStatus } from "./map-status";

type ImageStatus = "loading" | "ready" | "error";

export function RadarOverlay({
  metadata,
  layer,
  view,
  opacity,
  split,
}: {
  metadata: RadarMetadata;
  layer: ImageView;
  view: RadarView;
  opacity: number;
  split: number;
}) {
  const map = useMap();
  const overlay = useRef<LeafletImageOverlay>(null);
  const [status, setStatus] = useState<ImageStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  const active = view === layer || (view === "compare" && layer !== "change");
  const events = useMemo<LeafletEventHandlerFnMap>(
    () => ({
      load: () => setStatus("ready"),
      error: () => setStatus("error"),
    }),
    [],
  );

  useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setTimeout(() => setStatus("error"), 45000);
    return () => window.clearTimeout(timer);
  }, [status, attempt]);

  useEffect(() => {
    let frame = 0;
    function clip() {
      const image = overlay.current?.getElement();
      if (!image) return;
      if (view !== "compare" || layer === "change") {
        image.style.clipPath = "none";
        return;
      }
      const viewport = map.getContainer().getBoundingClientRect();
      const rect = image.getBoundingClientRect();
      if (rect.width <= 0) return;
      // Clip in image-relative percentages at a fixed viewport longitude divider.
      // Both overlays share ONE map, bounds and projection through every pan/zoom.
      const position = imageSplitPercent(
        viewport.left,
        viewport.width,
        rect.left,
        rect.width,
        split,
      );
      image.style.clipPath =
        layer === "before" ? `inset(0 ${100 - position}% 0 0)` : `inset(0 0 0 ${position}%)`;
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(clip);
    }
    clip();
    map.on("move zoom resize viewreset", schedule);
    return () => {
      map.off("move zoom resize viewreset", schedule);
      cancelAnimationFrame(frame);
    };
  }, [map, view, layer, split, status, attempt]);

  return (
    <>
      <ImageOverlay
        ref={overlay}
        key={`${layer}-${attempt}`}
        url={`${radarLayers[layer].url}${attempt ? `?retry=${attempt}` : ""}`}
        bounds={metadata.bounds}
        opacity={active && status === "ready" ? opacity : 0}
        zIndex={layer === "after" ? 3 : 2}
        eventHandlers={events}
        alt={`${radarLayers[layer].label} radar backscatter for ${metadata.location}`}
        attribution="NASA NISAR · GCOV · HH"
      />
      {active && status !== "ready" && (
        <div className="map-image-status">
          <MapStatus
            error={status === "error"}
            title={
              status === "error"
                ? `${radarLayers[layer].label} image unavailable`
                : `Loading ${radarLayers[layer].label.toLowerCase()} observation`
            }
            detail={
              status === "error"
                ? `Could not load the local ${layer} WebP overlay. Check the generated asset and try again.`
                : "Reading the optimized local radar overlay…"
            }
            onRetry={
              status === "error"
                ? () => {
                    setStatus("loading");
                    setAttempt((value) => value + 1);
                  }
                : undefined
            }
          />
        </div>
      )}
    </>
  );
}
