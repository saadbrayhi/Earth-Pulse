"use client";

import Link from "next/link";
import { useWorkspace } from "@/components/layout/workspace-provider";
import { observationRegistry, comparisonRegistry, displayedObservation } from "@/data/observations";
import { seasonal } from "@/data/seasons";
import { checkComparison } from "@/lib/comparison";
import { selectionHref } from "@/lib/workspace-selection";
import { routes } from "@/data/project";

export function SelectedData({ compact = false }: { compact?: boolean }) {
  const { selection, ready, reset, update } = useWorkspace();
  if (!ready)
    return (
      <div className="selected-data" aria-label="Selected data">
        Loading data selection…
      </div>
    );
  const a = observationRegistry.find((o) => o.id === selection.a)!,
    b = observationRegistry.find((o) => o.id === selection.b)!;
  const focus =
    displayedObservation(selection.focusId) ??
    observationRegistry.find((o) => o.id === selection.focusId);
  const check = checkComparison(a.id, b.id, observationRegistry, comparisonRegistry);
  const seasonalMissing = selection.mode === "seasonal" && seasonal.status === "unavailable";
  return (
    <div
      className={`selected-data ${compact ? "selected-data-compact" : ""}`}
      aria-label="Selected data"
    >
      <span className="eyebrow">SELECTED DATA</span>
      <strong>{seasonalMissing ? "Seasonal pair unavailable" : `${a.date} → ${b.date}`}</strong>
      <span>
        {seasonalMissing
          ? "No classified observations integrated"
          : focus
            ? `Viewing ${focus.date} · ${focus.mission} · ${focus.status === "processed" ? "viewable" : "catalog only"}`
            : check.comparison
              ? check.comparison.type === "imagery"
                ? "Optical visual comparison · no measured change"
                : "Processed comparison · exploratory radar change"
              : "Comparison unavailable for this selection"}
      </span>
      {!compact && (
        <div className="selection-links">
          <Link className="text-link" href={selectionHref(routes.explore.href, selection)}>
            View map
          </Link>
          <Link className="text-link" href={selectionHref(routes.insights.href, selection)}>
            View selected insights
          </Link>
          <button
            className="text-link"
            type="button"
            disabled={!check.comparison}
            onClick={() =>
              update({
                focusId: null,
                mode: check.comparison!.type,
                radarView: "compare",
                seasonalView: "compare",
              })
            }
          >
            Analyze selected pair
          </button>
          <button type="button" className="text-link" onClick={reset}>
            Reset selection
          </button>
        </div>
      )}
      {!compact && (
        <details className="selection-editor">
          <summary>Change selected observations</summary>
          <div className="selection-pickers">
            {(["a", "b"] as const).map((slot) => (
              <label key={slot}>
                Observation {slot.toUpperCase()}
                <select
                  className="date-select"
                  value={selection[slot]}
                  onChange={(event) =>
                    update({
                      [slot]: event.target.value,
                      focusId: event.target.value,
                      mode: "radar",
                    })
                  }
                >
                  {observationRegistry.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.date} · {o.mission} ·{" "}
                      {o.status === "processed" ? "viewable" : "catalog only"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
