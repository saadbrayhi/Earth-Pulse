"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { SelectedData } from "@/components/ui/selected-data";
import { selectionHref } from "@/lib/workspace-selection";
import {
  observationRegistry,
  comparisonRegistry,
  displayedObservation,
  originalRadarPair,
} from "@/data/observations";
import { checkComparison } from "@/lib/comparison";
import { routes } from "@/data/project";
import { pages } from "@/content/pages";
import { storyChapters } from "@/content/story";
import type { RadarView } from "@/data/study";
import { analysis } from "@/data/study";
import { seasonal, seasonalProduct, radarCategories } from "@/data/seasons";
import type {
  ExplorerMode,
  SeasonalView,
  MapAsset,
  MapSelection,
  Comparison,
  Observation,
} from "@/lib/observation-types";
import { useRadarMetadata } from "@/hooks/use-radar-metadata";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ScienceNotice } from "@/components/science-notice";
import { ChangeLegend } from "./change-legend";
import { ImageExtent, ObservationSource, StudySummary } from "./study-details";
import { LayerSettings } from "./layer-settings";
import { MapStatus } from "./map-status";
import { RadarComparison } from "./radar-comparison";
import { SeasonalPanel } from "./seasonal-panel";
import { ChangeDetective } from "./change-detective";
import { GuidedStory } from "./guided-story";

const modes: { value: ExplorerMode; label: string }[] = [
  { value: "imagery", label: "Public imagery" },
  { value: "radar", label: "Radar Change" },
  { value: "seasonal", label: "Seasonal Dynamics" },
];
export default function ExploreDashboard({ impact }: { impact: ReactNode }) {
  const { state, retry } = useRadarMetadata();
  const { selection: workspace, update, reset } = useWorkspace();
  const mode = workspace.mode;
  const requested = observationRegistry.find((o) => o.id === workspace.focusId);
  const focused = displayedObservation(workspace.focusId) ?? requested;
  const view = mode === "radar" && focused?.radarKey ? focused.radarKey : workspace.radarView;
  const seasonalView = workspace.seasonalView;
  const setSeasonalView = (seasonalView: SeasonalView) => update({ seasonalView });
  const activeComparison = checkComparison(
    workspace.a,
    workspace.b,
    observationRegistry,
    comparisonRegistry,
  );
  const unavailableReason =
    mode !== "seasonal"
      ? focused && !focused.asset
        ? `${focused.date} is a catalog-only observation. No processed map layer or statistics are available.`
        : !focused && !activeComparison.comparison
          ? activeComparison.reason
          : undefined
      : undefined;
  const [opacity, setOpacity] = useState(100),
    [split, setSplit] = useState(50);
  const [highlight, setHighlight] = useState<MapAsset | null>(null),
    [category, setCategory] = useState<string | null>(null);
  const activeHighlight =
    workspace.focusId === null && (mode === "seasonal" || view === "change") ? highlight : null;
  const selection: MapSelection =
    mode !== "seasonal"
      ? { mode, view, highlight: activeHighlight }
      : { mode, view: seasonalView, highlight: activeHighlight };
  function clearHighlight() {
    setHighlight(null);
    setCategory(null);
  }
  function scrollTo(id: string) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" }),
      ),
    );
  }
  function changeMode(value: ExplorerMode) {
    if (value === "radar") reset();
    else update({ mode: value, focusId: null });
    clearHighlight();
  }
  function radarView(value: RadarView) {
    update({
      ...(mode === "radar" ? originalRadarPair : {}),
      radarView: value,
      focusId:
        mode === "imagery"
          ? value === "before"
            ? workspace.a
            : value === "after"
              ? workspace.b
              : null
          : value === "before" || value === "after"
            ? observationRegistry.find((o) => o.radarKey === value)!.id
            : null,
    });
    clearHighlight();
  }
  function seasonView(value: SeasonalView) {
    setSeasonalView(value);
    clearHighlight();
  }
  function compare(comparison: Comparison) {
    update({
      a: comparison.observationA,
      b: comparison.observationB,
      mode: comparison.type,
      focusId: null,
      radarView: "compare",
      seasonalView: "compare",
    });
    clearHighlight();
    scrollTo("explore-workspace");
  }
  function showObservation(o: Observation) {
    clearHighlight();
    update({
      focusId: o.id,
      mode: o.kind === "optical-browse" ? "imagery" : o.radarKey ? "radar" : "seasonal",
      radarView: o.radarKey ?? "compare",
      seasonalView: o.season === "wet" ? "wet" : "dry",
    });
    scrollTo("explore-workspace");
  }
  return (
    <>
      <PageHeader
        {...pages.explore.header}
        action={
          <Link
            href={selectionHref(routes.insights.href, workspace)}
            className="secondary-button inline-flex items-center gap-2"
          >
            See the analysis <ArrowRight size={14} />
          </Link>
        }
      />
      <SelectedData />
      {focused?.kind === "optical-browse" && (
        <p className="evidence-notice">
          NASA MODIS optical context · {focused.date}.{" "}
          {requested?.id !== focused.id
            ? "The selected catalog product remains unprocessed; this is a separate public optical image for the same date. "
            : ""}
          Clouds may obscure the ground. This is not NISAR imagery or a water classification.
        </p>
      )}
      <GuidedStory
        onChapter={(index) => {
          const chapter = storyChapters[index];
          if (chapter.id === "seasons") changeMode("seasonal");
          if (chapter.id === "detective") {
            const original = comparisonRegistry.find((c) => c.id === "october-radar")!;
            update({
              a: original.observationA,
              b: original.observationB,
              mode: "radar",
              radarView: "change",
              focusId: null,
            });
            clearHighlight();
          }
          scrollTo(chapter.target);
        }}
      />
      <div id="explore-workspace" className="mode-toolbar">
        <SegmentedControl
          label="Analysis mode"
          value={mode}
          options={modes}
          onChange={changeMode}
          controls="radar-map"
        />
        <button
          type="button"
          className="secondary-button inline-flex items-center gap-2 text-xs"
          onClick={() => changeMode("radar")}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Original NISAR study · {analysis.beforeDate} → {analysis.afterDate}
        </button>
      </div>
      {state.status === "ready" ? (
        <>
          <div id="study-overview">
            <StudySummary
              metadata={state.data}
              comparison={
                mode === "seasonal"
                  ? { window: seasonalProduct.window, product: seasonalProduct.name }
                  : mode === "imagery"
                    ? {
                        window:
                          focused?.date ??
                          `${observationRegistry.find((o) => o.id === workspace.a)?.date} → ${observationRegistry.find((o) => o.id === workspace.b)?.date}`,
                        product: "NASA / MODIS Terra · optical browse",
                      }
                    : focused
                      ? { window: focused.date, product: `${focused.mission} / ${focused.product}` }
                      : undefined
              }
            />
          </div>
          <div className="explorer-grid">
            <RadarComparison
              metadata={state.data}
              selection={selection}
              unavailableReason={unavailableReason}
              opacity={opacity}
              split={split}
              onViewChange={radarView}
              onSeasonalViewChange={seasonView}
              onSplitChange={setSplit}
            />
            <aside className="details-column" aria-label="Layer information">
              {unavailableReason ? (
                <div className="panel p-5" role="status">
                  <h2 className="section-title">Selected observation not processed</h2>
                  <p className="section-description">{unavailableReason}</p>
                  {focused && (
                    <>
                      <p className="section-description">
                        {focused.mission} · {focused.product} · {focused.maturity}
                      </p>
                      <a
                        href={focused.sourceUrl}
                        className="text-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Inspect selected source ↗
                      </a>
                    </>
                  )}
                </div>
              ) : mode === "imagery" ? (
                <div className="panel p-5">
                  <h2 className="section-title">Official public optical imagery</h2>
                  <p className="section-description">
                    NASA GIBS / MODIS Terra corrected reflectance. Approximately 250 m native
                    detail; daily composite date, not an exact acquisition time. No radar or
                    water-area statistics are derived.
                  </p>
                  <a
                    href={displayedObservation(workspace.focusId ?? workspace.a)?.sourceUrl}
                    className="text-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NASA source image ↗
                  </a>
                </div>
              ) : mode === "radar" ? (
                <>
                  <LayerSettings
                    metadata={state.data}
                    view={view}
                    opacity={opacity}
                    onViewChange={radarView}
                    onOpacityChange={setOpacity}
                  />
                  <ChangeLegend />
                  <ObservationSource metadata={state.data} />
                </>
              ) : (
                <div className="panel p-5">
                  <h2 className="section-title">A different question</h2>
                  <p className="section-description">
                    Seasonal Dynamics compares classified water footprints. It does not reinterpret
                    October blue/orange radar changes as water.
                  </p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => changeMode("radar")}
                  >
                    Return to October radar
                  </button>
                </div>
              )}
              {activeHighlight && (
                <div className="panel p-5" role="status">
                  <p className="text-sm">
                    Selected mask:{" "}
                    {radarCategories.find((c) => c.key === category)?.label ??
                      "Water transition category"}
                    .
                  </p>
                  <button className="text-link mt-3" type="button" onClick={clearHighlight}>
                    Clear highlight
                  </button>
                </div>
              )}
            </aside>
          </div>
          <ImageExtent
            bounds={
              mode === "seasonal" && seasonal.status === "classified"
                ? seasonal.bounds
                : state.data.bounds
            }
          />
        </>
      ) : (
        <div className="panel metadata-status">
          <MapStatus
            error={state.status === "error"}
            title={
              state.status === "error" ? "Study metadata unavailable" : "Loading the study area"
            }
            detail={
              state.status === "error"
                ? `${state.message} The viewer needs valid study metadata.`
                : "Reading observation dates and geographic bounds…"
            }
            onRetry={state.status === "error" ? retry : undefined}
          />
        </div>
      )}
      {mode === "seasonal" && (
        <div className="extension-section">
          <SeasonalPanel
            view={seasonalView}
            opacity={opacity}
            onOpacityChange={setOpacity}
            onHighlight={(asset) => {
              setHighlight(asset);
              scrollTo("explore-workspace");
            }}
          />
        </div>
      )}
      <ScienceNotice />
      <ChangeDetective
        onCompare={compare}
        onSelectObservation={clearHighlight}
        onViewObservation={showObservation}
        selectedCategory={activeHighlight ? category : null}
        onRadarHighlight={(key, asset) => {
          const original = comparisonRegistry.find((c) => c.id === "october-radar")!;
          update({
            a: original.observationA,
            b: original.observationB,
            mode: "radar",
            radarView: "change",
            focusId: null,
          });
          setCategory(key);
          setHighlight(asset);
          if (asset) scrollTo("explore-workspace");
        }}
      />
      {impact}
    </>
  );
}
