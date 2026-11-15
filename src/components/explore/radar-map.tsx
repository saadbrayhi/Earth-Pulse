"use client";

import { useWorkspace } from "@/components/layout/workspace-provider";
import { displayedObservation } from "@/data/observations";
import { GeoJSON } from "react-leaflet";
import { ManagedMap } from "./managed-map";
import type { GeoJsonObject } from "geojson";
import { Navigation2 } from "lucide-react";
import { analysis, imageViews } from "@/data/study";
import { seasonal, seasonalProduct } from "@/data/seasons";
import type { RadarMetadata } from "@/lib/radar";
import type { MapSelection } from "@/lib/observation-types";
import { MapControls } from "./map-controls";
import { RadarOverlay } from "./radar-overlay";
import { MapImageOverlay } from "./map-image-overlay";

export default function RadarMap({
  unavailableReason,
  metadata,
  selection,
  opacity,
  split,
  onSplitChange,
}: {
  unavailableReason?: string;
  metadata: RadarMetadata;
  selection: MapSelection;
  opacity: number;
  split: number;
  onSplitChange: (split: number) => void;
}) {
  const { selection: workspace } = useWorkspace();
  const opticalA = displayedObservation(workspace.focusId ?? workspace.a);
  const opticalB = displayedObservation(workspace.b);
  const opticalPair = [opticalA, opticalB].filter((o) => o?.kind === "optical-browse");
  const compare =
    !unavailableReason &&
    selection.view === "compare" &&
    (selection.mode === "radar" ||
      (selection.mode === "imagery" && !workspace.focusId) ||
      seasonal.status === "classified");
  const dates =
    selection.mode === "imagery"
      ? [opticalA?.date, opticalB?.date]
      : selection.mode === "radar"
        ? [metadata.beforeDate, metadata.afterDate]
        : [
            seasonal.observations.find((o) => o.season === "dry")?.date,
            seasonal.observations.find((o) => o.season === "wet")?.date,
          ];
  return (
    <>
      <ManagedMap bounds={metadata.bounds}>
        {!unavailableReason &&
          (selection.mode === "imagery"
            ? opticalPair.map(
                (o, index) =>
                  o?.asset &&
                  o.bounds && (
                    <MapImageOverlay
                      key={`${index}-${o.id}`}
                      url={o.asset.url}
                      bounds={o.bounds}
                      title={`NASA MODIS optical browse ${o.date}`}
                      attribution="NASA GIBS / MODIS Terra · optical browse"
                      visible={
                        workspace.focusId !== null
                          ? index === 0
                          : selection.view === "compare" ||
                            selection.view === (index === 0 ? "before" : "after")
                      }
                      opacity={opacity}
                      split={split}
                      clipSide={compare ? (index === 0 ? "left" : "right") : null}
                    />
                  ),
              )
            : selection.mode === "radar"
              ? imageViews.map((layer) => (
                  <RadarOverlay
                    key={layer}
                    metadata={metadata}
                    layer={layer}
                    view={selection.view}
                    opacity={opacity}
                    split={split}
                    hidden={selection.highlight !== null}
                  />
                ))
              : seasonal.status === "classified" &&
                (["dry", "wet", "change"] as const).map((layer) => (
                  <MapImageOverlay
                    key={layer}
                    url={seasonal.assets[layer].url}
                    bounds={seasonal.bounds}
                    title={`${layer} classified water footprint`}
                    attribution={seasonalProduct.attribution}
                    visible={
                      !selection.highlight &&
                      (selection.view === layer ||
                        (selection.view === "compare" && layer !== "change"))
                    }
                    opacity={opacity}
                    split={split}
                    clipSide={
                      selection.view === "compare" && layer !== "change"
                        ? layer === "dry"
                          ? "left"
                          : "right"
                        : null
                    }
                    zIndex={layer === "wet" ? 3 : 2}
                  />
                )))}
        {!unavailableReason && selection.highlight && (
          <MapImageOverlay
            key={selection.highlight.url}
            url={selection.highlight.url}
            bounds={selection.mode === "radar" ? metadata.bounds : seasonal.bounds}
            title="Selected matrix category"
            attribution={
              selection.mode === "radar"
                ? "NASA/ISRO NISAR · exploratory radar change"
                : "NASA OPERA · classification transition"
            }
            visible
            opacity={opacity}
            split={split}
            zIndex={5}
          />
        )}
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
      </ManagedMap>
      {unavailableReason && (
        <div className="seasonal-map-empty" role="status">
          <strong>Selected data unavailable</strong>
          <span>{unavailableReason}</span>
        </div>
      )}
      <div className="map-north" aria-label="North is up">
        <Navigation2 size={17} fill="currentColor" />
        <span>N</span>
      </div>
      {selection.mode === "seasonal" && seasonal.status === "unavailable" && (
        <div className="seasonal-map-empty" role="status">
          <strong>Seasonal layers unavailable</strong>
          <span>
            No classified dry/wet pixels are integrated. The outline shows the analysis region only.
          </span>
        </div>
      )}
      {compare && !selection.highlight && (
        <>
          <div className="swipe-divider" style={{ left: `${split}%` }} aria-hidden="true" />
          <button
            type="button"
            className="swipe-handle"
            style={{ left: `${split}%` }}
            role="slider"
            aria-label="Map comparison divider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={split}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const frame = event.currentTarget.parentElement!.getBoundingClientRect();
              onSplitChange(
                Math.round(
                  Math.max(0, Math.min(100, ((event.clientX - frame.left) / frame.width) * 100)),
                ),
              );
            }}
            onKeyDown={(event) => {
              const keys: Record<string, number> = {
                ArrowLeft: split - 5,
                ArrowRight: split + 5,
                Home: 0,
                End: 100,
              };
              if (event.key in keys) {
                event.preventDefault();
                onSplitChange(Math.max(0, Math.min(100, keys[event.key])));
              }
            }}
          >
            ↔
          </button>
          <div className="swipe-date swipe-date-before">{dates[0]}</div>
          <div className="swipe-date swipe-date-after">{dates[1]}</div>
        </>
      )}
    </>
  );
}
