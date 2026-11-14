"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { RadarView } from "@/lib/radar";
import { useRadarMetadata } from "@/hooks/use-radar-metadata";
import { PageHeader } from "@/components/ui/page-header";
import { ScienceNotice } from "@/components/science-notice";
import { ChangeLegend } from "./change-legend";
import { ImageExtent, ObservationSource, StudySummary } from "./study-details";
import { LayerSettings } from "./layer-settings";
import { MapStatus } from "./map-status";
import { RadarComparison } from "./radar-comparison";

export default function ExploreDashboard() {
  const { state, retry } = useRadarMetadata();
  const [view, setView] = useState<RadarView>("compare");
  const [opacity, setOpacity] = useState(100);
  const [split, setSplit] = useState(50);

  return (
    <>
      <PageHeader
        eyebrow="OBSERVE. COMPARE. UNDERSTAND."
        title="A changing landscape."
        description="Explore a wetland through two radar observations. Slide to compare the same place."
        action={
          <Link href="/insights" className="secondary-button inline-flex items-center gap-2">
            See the analysis <ArrowRight size={14} />
          </Link>
        }
      />
      {state.status === "ready" ? (
        <>
          <StudySummary metadata={state.data} />
          <div className="explorer-grid">
            <RadarComparison
              metadata={state.data}
              view={view}
              opacity={opacity}
              split={split}
              onViewChange={setView}
              onSplitChange={setSplit}
            />
            <aside className="details-column" aria-label="Layer information">
              <LayerSettings
                metadata={state.data}
                view={view}
                opacity={opacity}
                onViewChange={setView}
                onOpacityChange={setOpacity}
              />
              <ChangeLegend threshold={state.data.changeThresholdDb} />
              <ObservationSource metadata={state.data} />
            </aside>
          </div>
          <ImageExtent bounds={state.data.bounds} />
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
      <ScienceNotice />
    </>
  );
}
