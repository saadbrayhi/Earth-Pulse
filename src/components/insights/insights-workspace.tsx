"use client";

import type { ReactNode } from "react";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { SelectedData } from "@/components/ui/selected-data";
import { observationRegistry, comparisonRegistry, displayedObservation } from "@/data/observations";
import { observations } from "@/data/study";
import { seasonal } from "@/data/seasons";
import { checkComparison } from "@/lib/comparison";
import { signedDb, formatNumber } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { ScienceNotice } from "@/components/science-notice";

export function InsightsWorkspace({ radar }: { radar: ReactNode }) {
  const { selection, ready } = useWorkspace();
  if (!ready) return <p role="status">Loading selected observations…</p>;
  const requested = observationRegistry.find((o) => o.id === selection.focusId);
  const focused = displayedObservation(selection.focusId) ?? requested;
  const result = checkComparison(selection.a, selection.b, observationRegistry, comparisonRegistry);
  const observation = focused?.radarKey
    ? observations.find((o) => o.key === focused.radarKey)
    : null;
  const unavailable =
    selection.mode === "seasonal" && seasonal.status === "unavailable"
      ? seasonal.reason
      : focused && !focused.asset
        ? `${focused.date}: this observation is catalog-only. There are no processed measurements or imagery to analyze.`
        : !focused && !result.comparison
          ? result.reason
          : null;
  return (
    <>
      <SelectedData />
      {unavailable ? (
        <section className="panel p-6" aria-label="Selected insights unavailable">
          <h1 className="section-title">No analysis for the selected data</h1>
          <p className="section-description">{unavailable}</p>
          <p className="section-description">
            Statistics from another observation pair are not substituted for this selection.
          </p>
        </section>
      ) : selection.mode === "seasonal" && seasonal.status === "classified" ? (
        <section aria-label="Seasonal insights">
          <h1 className="section-title">Selected seasonal classification</h1>
          <div className="metrics-grid">
            <MetricCard
              label="DRY WATER FOOTPRINT"
              value={`${formatNumber(seasonal.metrics.dryWaterAreaKm2, 2)} km²`}
              detail="Common valid classification area"
            />
            <MetricCard
              label="WET WATER FOOTPRINT"
              value={`${formatNumber(seasonal.metrics.wetWaterAreaKm2, 2)} km²`}
              detail="Same classification policy"
            />
          </div>
          <p className="section-description">
            {seasonal.method} {seasonal.reason}
          </p>
        </section>
      ) : selection.mode === "imagery" ? (
        <section className="panel p-6" aria-label="Optical imagery insights">
          <h1 className="section-title">
            NASA optical imagery · {focused?.date ?? "selected pair"}
          </h1>
          <p className="section-description">
            MODIS Terra corrected-reflectance daily browse imagery. This is an official public
            visualization with approximately 250 m native detail. Clouds and illumination affect
            appearance. No water-area, radar or classification measurements are calculated from the
            image.
          </p>
          {focused && (
            <>
              <p className="section-description">
                {requested?.id !== focused.id
                  ? "A separate same-date MODIS image supplies context; the requested catalog product is still unprocessed."
                  : focused.dateEvidence}
              </p>
              <a
                className="text-link"
                href={focused.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Inspect NASA source ↗
              </a>
              <p className="section-description">{focused.quality}</p>
            </>
          )}
        </section>
      ) : observation && focused ? (
        <section aria-label="Selected observation insights">
          <h1 className="section-title">Observation insights · {focused.date}</h1>
          <p className="section-description">
            {focused.mission} · {focused.measurement}. These intensity statistics use the valid
            paired population of the original October study; they are not whole-scene water
            measurements.
          </p>
          <div className="metrics-grid">
            <MetricCard
              label="MEAN BACKSCATTER"
              value={signedDb(observation.stats.meanDb)}
              detail={focused.date}
            />
            <MetricCard
              label="MEDIAN BACKSCATTER"
              value={signedDb(observation.stats.medianDb)}
              detail="Original study's paired-valid population"
            />
            <MetricCard
              label="SAMPLES"
              value={formatNumber(observation.stats.count)}
              detail="Valid in both original October observations"
            />
          </div>
          <ScienceNotice />
        </section>
      ) : (
        radar
      )}
      {unavailable && <ScienceNotice />}
    </>
  );
}
