"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ImageOverlay as LeafletImageOverlay, type LeafletEventHandlerFnMap } from "leaflet";
import { ImageOverlay, useMap } from "react-leaflet";
import type { RadarBounds } from "@/lib/radar-metadata";
import { imageSplitPercent } from "@/lib/map-clip";
import { MapStatus } from "./map-status";

type ImageStatus = "loading" | "ready" | "error";

export function MapImageOverlay({
  url,
  bounds,
  title,
  attribution,
  visible,
  opacity,
  split,
  clipSide = null,
  zIndex = 2,
}: {
  url: string;
  bounds: RadarBounds;
  title: string;
  attribution: string;
  visible: boolean;
  opacity: number;
  split: number;
  clipSide?: "left" | "right" | null;
  zIndex?: number;
}) {
  const map = useMap();
  const overlay = useRef<LeafletImageOverlay>(null);
  const [status, setStatus] = useState<ImageStatus>("loading");
  const [attempt, setAttempt] = useState(0);

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
      if (!clipSide) {
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
        clipSide === "left" ? `inset(0 ${100 - position}% 0 0)` : `inset(0 0 0 ${position}%)`;
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
  }, [map, clipSide, split, status, attempt]);

  return (
    <>
      <ImageOverlay
        ref={overlay}
        key={`${url}-${attempt}`}
        url={`${url}${attempt ? `?retry=${attempt}` : ""}`}
        bounds={bounds}
        opacity={visible && status === "ready" ? opacity : 0}
        zIndex={zIndex}
        eventHandlers={events}
        alt={title}
        attribution={attribution}
      />
      {visible && status !== "ready" && (
        <div className="map-image-status">
          <MapStatus
            error={status === "error"}
            title={
              status === "error"
                ? `${title} image unavailable`
                : `Loading ${title.toLowerCase()} observation`
            }
            detail={
              status === "error"
                ? `Could not load the local ${title} WebP overlay. Check the generated asset and try again.`
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
