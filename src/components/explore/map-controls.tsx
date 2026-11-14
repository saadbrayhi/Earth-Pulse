"use client";

import { useEffect } from "react";
import { ScaleControl, ZoomControl, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import type { RadarMetadata } from "@/lib/radar";

export function MapControls({ metadata }: { metadata: RadarMetadata }) {
  const map = useMap();
  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);
  return (
    <>
      <ZoomControl position="topright" />
      <ScaleControl position="bottomleft" imperial={false} />
      <div className="map-fit-control leaflet-control">
        <button
          title="Fit study area"
          aria-label="Fit study area"
          onClick={(event) => {
            event.stopPropagation();
            map.fitBounds(metadata.bounds, { padding: [32, 32] });
          }}
        >
          <LocateFixed size={18} />
        </button>
      </div>
    </>
  );
}
