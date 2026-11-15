"use client";

import { useMemo } from "react";
import { latLngBounds } from "leaflet";
import { GeoJSON, MapContainer } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import { Navigation2 } from "lucide-react";
import { analysis, imageViews, type RadarView } from "@/data/study";
import type { RadarMetadata } from "@/lib/radar";
import { MapControls } from "./map-controls";
import { RadarOverlay } from "./radar-overlay";

export default function RadarMap({
  metadata,
  view,
  opacity,
  split,
}: {
  metadata: RadarMetadata;
  view: RadarView;
  opacity: number;
  split: number;
}) {
  const navigationBounds = useMemo(() => latLngBounds(metadata.bounds).pad(2), [metadata.bounds]);
  return (
    <>
      <MapContainer
        bounds={metadata.bounds}
        boundsOptions={{ padding: [32, 32] }}
        maxBounds={navigationBounds}
        maxBoundsViscosity={0.8}
        minZoom={5}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom={false}
        zoomAnimation={false}
        className="radar-leaflet-map"
      >
        {imageViews.map((layer) => (
          <RadarOverlay
            key={layer}
            metadata={metadata}
            layer={layer}
            view={view}
            opacity={opacity}
            split={split}
          />
        ))}
        <GeoJSON
          data={analysis.studyArea as GeoJsonObject}
          style={{
            color: "var(--map-muted)",
            weight: 1,
            opacity: 0.8,
            fill: false,
            dashArray: "4 5",
          }}
          interactive={false}
        />
        <MapControls metadata={metadata} />
      </MapContainer>
      <div className="map-north" aria-label="North is up">
        <Navigation2 size={17} fill="currentColor" />
        <span>N</span>
      </div>
      {view === "compare" && (
        <>
          <div className="swipe-divider" style={{ left: `${split}%` }} aria-hidden="true">
            <span>↔</span>
          </div>
          <div className="swipe-date swipe-date-before">{metadata.beforeDate}</div>
          <div className="swipe-date swipe-date-after">{metadata.afterDate}</div>
        </>
      )}
    </>
  );
}
