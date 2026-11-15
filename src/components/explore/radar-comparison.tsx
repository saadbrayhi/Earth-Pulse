"use client";

import { useWorkspace } from "@/components/layout/workspace-provider";
import { displayedObservation } from "@/data/observations";
import dynamic from "next/dynamic";
import { Layers3 } from "lucide-react";
import { observationLabel, radarViewLabel, type RadarMetadata } from "@/lib/radar";
import { radarViewOptions, type RadarView } from "@/data/study";
import { seasonal, seasonalViewOptions } from "@/data/seasons";
import type { MapSelection, SeasonalView } from "@/lib/observation-types";
import { RangeControl } from "@/components/ui/range-control";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MapErrorBoundary } from "./map-error-boundary";
import { MapStatus } from "./map-status";

const RadarMap = dynamic(() => import("./radar-map"), { ssr: false, loading: () => <MapStatus /> });
interface Props {
  unavailableReason?: string;
  metadata: RadarMetadata;
  selection: MapSelection;
  opacity: number;
  split: number;
  onViewChange: (view: RadarView) => void;
  onSeasonalViewChange: (view: SeasonalView) => void;
  onSplitChange: (split: number) => void;
}
export function RadarComparison({
  unavailableReason,
  metadata,
  selection,
  opacity,
  split,
  onViewChange,
  onSeasonalViewChange,
  onSplitChange,
}: Props) {
  const { selection: workspace } = useWorkspace();
  const displayed = displayedObservation(workspace.focusId ?? workspace.a);
  const ready = selection.mode !== "seasonal" || seasonal.status === "classified";
  return (
    <section id="observation-map" className="map-panel panel" aria-labelledby="map-heading">
      <div className="map-panel-heading">
        <div>
          <h2
            id="map-heading"
            className="flex items-center gap-2 text-sm font-semibold text-heading"
          >
            <Layers3 size={17} className="text-accent" />
            {selection.mode === "imagery"
              ? "NASA optical imagery"
              : selection.mode === "radar"
                ? "Radar comparison"
                : "Seasonal Dynamics — Wet vs Dry"}
          </h2>
          <p className="mt-1.5 text-xs text-muted">One map. Synchronized geography.</p>
        </div>
        {selection.mode === "imagery" ? (
          <SegmentedControl
            label="Optical image view"
            value={selection.view}
            options={radarViewOptions.filter((o) => o.value !== "change")}
            onChange={onViewChange}
            controls="radar-map"
          />
        ) : selection.mode === "radar" ? (
          <SegmentedControl
            label="Radar layer"
            value={selection.view}
            options={radarViewOptions}
            onChange={onViewChange}
            controls="radar-map"
          />
        ) : (
          <SegmentedControl
            label="Seasonal layer"
            value={selection.view}
            options={seasonalViewOptions}
            onChange={onSeasonalViewChange}
            controls="radar-map"
          />
        )}
      </div>
      <div className="map-observation-bar">
        <span>
          {selection.mode === "imagery"
            ? `NASA MODIS / ${workspace.focusId ? displayed?.date : `${displayed?.date} → ${displayedObservation(workspace.b)?.date}`} / optical context, not radar`
            : selection.mode === "radar"
              ? `${radarViewLabel(selection.view)} / ${observationLabel(metadata, selection.view)}`
              : seasonal.status === "classified"
                ? seasonal.observations.map((o) => `${o.season}: ${o.date}`).join(" / ")
                : "No selected seasonal pair · classification unavailable"}
        </span>
        <span>↑ North up</span>
      </div>
      <div
        id="radar-map"
        className="radar-map-frame"
        role="region"
        aria-label="Georeferenced satellite imagery"
      >
        <MapErrorBoundary>
          <RadarMap
            metadata={metadata}
            selection={selection}
            unavailableReason={unavailableReason}
            opacity={opacity / 100}
            split={split}
            onSplitChange={onSplitChange}
          />
        </MapErrorBoundary>
      </div>
      {selection.view === "compare" && ready && !selection.highlight && !unavailableReason && (
        <div className="swipe-controls">
          <RangeControl
            label={
              selection.mode === "radar" ? "Before / after comparison" : "Dry / wet comparison"
            }
            value={split}
            valueLabel={`${split}% ${selection.mode === "radar" ? "before" : "dry"}`}
            onChange={onSplitChange}
            hint="Drag the map divider or use this slider. Arrow keys also move the comparison."
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
