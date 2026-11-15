"use client";

import { useWorkspace } from "@/components/layout/workspace-provider";
import { observationRegistry, comparisonRegistry, displayedObservation } from "@/data/observations";
import { checkComparison } from "@/lib/comparison";
import { formatNumber } from "@/lib/format";
import type { Observation, Comparison, MapAsset } from "@/lib/observation-types";
import { ObservationCalendar } from "./observation-calendar";
import { RadarChangeMatrix } from "./radar-change-matrix";

export function ChangeDetective({
  onCompare,
  onViewObservation,
  onRadarHighlight,
  selectedCategory,
  onSelectObservation,
}: {
  onCompare: (comparison: Comparison) => void;
  onViewObservation: (observation: Observation) => void;
  onRadarHighlight: (key: string | null, asset: MapAsset | null) => void;
  selectedCategory: string | null;
  onSelectObservation: () => void;
}) {
  const { selection, update } = useWorkspace();
  const { a, b } = selection;
  function setA(id: string) {
    update({ a: id, focusId: id, mode: "radar" });
    onSelectObservation();
  }
  function setB(id: string) {
    update({ b: id, focusId: id, mode: "radar" });
    onSelectObservation();
  }
  const result = checkComparison(a, b, observationRegistry, comparisonRegistry);
  const selected = [
    observationRegistry.find((o) => o.id === a)!,
    observationRegistry.find((o) => o.id === b)!,
  ];
  return (
    <section id="change-detective" className="extension-section" aria-labelledby="detective-title">
      <p className="eyebrow">FOLLOW THE OBSERVATIONS</p>
      <h2 id="detective-title" className="section-title mt-3">
        Change Detective Matrix
      </h2>
      <p className="section-description">
        Select records, inspect their evidence, then open an existing compatible comparison.
        Discovered dates do not imply processed map layers.
      </p>
      <div className="panel p-6">
        <div className="observation-selectors">
          {(["A", "B"] as const).map((label, index) => (
            <label key={label}>
              Observation {label}
              <select
                value={index === 0 ? a : b}
                onChange={(e) => (index === 0 ? setA : setB)(e.target.value)}
                className="date-select"
              >
                {observationRegistry.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.date} · {o.mission} ·{" "}
                    {o.status === "processed" ? "viewable" : "catalog only"} · {o.id}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="observation-records">
          {selected.map((o, index) => (
            <article key={`${index}-${o.id}`}>
              <p className="eyebrow">
                OBSERVATION {index === 0 ? "A" : "B"} · {o.status}
              </p>
              <h3 className="mt-2 font-semibold text-heading">
                {o.date} · {o.mission}
              </h3>
              <dl className="record-details">
                <dt>Product</dt>
                <dd>{o.product}</dd>
                <dt>Measurement</dt>
                <dd>{o.measurement}</dd>
                <dt>Maturity</dt>
                <dd>{o.maturity}</dd>
                <dt>Coverage</dt>
                <dd>
                  {o.coveragePercent === null
                    ? "Not assessed"
                    : `${formatNumber(o.coveragePercent, 3)}% numeric/valid coverage`}
                </dd>
                <dt>Quality</dt>
                <dd>{o.quality}</dd>
                <dt>Season</dt>
                <dd>{o.season} window; hydrological state unverified</dd>
                <dt>Date evidence</dt>
                <dd>{o.dateEvidence}</dd>
                <dt>Acquisition timestamp</dt>
                <dd>{o.timestamp ?? "Unresolved in local export"}</dd>
                <dt>Product ID</dt>
                <dd>{o.productId ?? "Parent granule unresolved"}</dd>
              </dl>
              <a className="text-link" href={o.sourceUrl} target="_blank" rel="noopener noreferrer">
                Inspect provenance ↗
              </a>
              {o.contextObservationId && (
                <button
                  type="button"
                  className="secondary-button mt-3"
                  onClick={() => {
                    const image = displayedObservation(o.id)!;
                    update({
                      [index === 0 ? "a" : "b"]: image.id,
                      focusId: image.id,
                      mode: "imagery",
                    });
                    onViewObservation(image);
                  }}
                >
                  Use NASA optical image
                </button>
              )}
              {o.asset && (
                <button
                  type="button"
                  className="secondary-button mt-3"
                  onClick={() => onViewObservation(o)}
                >
                  View observation {index === 0 ? "A" : "B"}
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="evidence-notice" id="comparison-reason" role="status">
          {result.reason}
        </p>
        <button
          type="button"
          className="primary-button"
          aria-describedby="comparison-reason"
          disabled={!result.comparison}
          onClick={() => {
            if (result.comparison) onCompare(result.comparison);
          }}
        >
          Compare selected observations
        </button>
        <ObservationCalendar onSelectA={setA} onSelectB={setB} onView={onViewObservation} />
      </div>
      <RadarChangeMatrix selectedCategory={selectedCategory} onHighlight={onRadarHighlight} />
    </section>
  );
}
