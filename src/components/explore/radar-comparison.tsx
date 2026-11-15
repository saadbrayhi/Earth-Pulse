"use client";

import dynamic from "next/dynamic";
import { Layers3 } from "lucide-react";
import { observationLabel, radarViewLabel, type RadarMetadata } from "@/lib/radar";
import { radarViewOptions, type RadarView } from "@/data/study";
import { RangeControl } from "@/components/ui/range-control";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MapErrorBoundary } from "./map-error-boundary";
import { MapStatus } from "./map-status";

// The client boundary keeps browser-dependent Leaflet out of server rendering.
const RadarMap = dynamic(() => import("./radar-map"), { ssr: false, loading: () => <MapStatus /> });

interface RadarComparisonProps {
  metadata: RadarMetadata;
  view: RadarView;
  opacity: number;
  split: number;
  onViewChange: (view: RadarView) => void;
  onSplitChange: (split: number) => void;
}

export function RadarComparison({
  metadata,
  view,
  opacity,
  split,
  onViewChange,
  onSplitChange,
}: RadarComparisonProps) {
  return (
    <section className="map-panel panel" aria-labelledby="map-heading">
      <div className="map-panel-heading">
        <div>
          <h2
            id="map-heading"
            className="flex items-center gap-2 text-sm font-semibold text-heading"
          >
            <Layers3 size={17} className="text-accent" /> Radar comparison
          </h2>
          <p className="mt-1.5 text-xs text-muted">One map. Synchronized geography.</p>
        </div>
        <SegmentedControl
          label="Radar layer"
          value={view}
          options={radarViewOptions}
          onChange={onViewChange}
          controls="radar-map"
        />
      </div>
      <div className="map-observation-bar">
        <span>
          {radarViewLabel(view)} / {observationLabel(metadata, view)}
        </span>
        <span>↑ North up</span>
      </div>
      <div
        id="radar-map"
        className="radar-map-frame"
        role="region"
        aria-label="Georeferenced radar imagery"
      >
        <MapErrorBoundary>
          <RadarMap metadata={metadata} view={view} opacity={opacity / 100} split={split} />
        </MapErrorBoundary>
      </div>
      {view === "compare" && (
        <div className="swipe-controls">
          <RangeControl
            label="Before / after comparison"
            value={split}
            valueLabel={`${split}% before`}
            onChange={onSplitChange}
            hint="Move the slider or use arrow keys. The divider stays fixed while you pan and zoom."
          />
        </div>
      )}
      <div className="map-footer">
        <span>Dashed outline: analysis region, not a surveyed wetland boundary</span>
        <span>Drag to pan · + / − to zoom</span>
      </div>
    </section>
  );
}
