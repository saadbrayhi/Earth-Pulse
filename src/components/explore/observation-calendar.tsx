"use client";
import { useWorkspace } from "@/components/layout/workspace-provider";
import type { Observation } from "@/lib/observation-types";
import { observationRegistry, observationYears } from "@/data/observations";
import { formatNumber } from "@/lib/format";
import { DataTable } from "@/components/ui/data-table";
const months = Array.from({ length: 12 }, (_, i) => ({
  number: String(i + 1).padStart(2, "0"),
  label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, i, 1)),
  ),
}));
export function ObservationCalendar({
  onSelectA,
  onSelectB,
  onView,
}: {
  onSelectA: (id: string) => void;
  onSelectB: (id: string) => void;
  onView: (observation: Observation) => void;
}) {
  const { selection, update } = useWorkspace();
  const { year, month } = selection;
  const setMonth = (month: string | null) => update({ month });
  const filtered = observationRegistry.filter(
    (o) => o.date.startsWith(year) && (!month || o.date.slice(5, 7) === month),
  );
  return (
    <>
      <div className="calendar-heading">
        <h3 className="section-title">Observation calendar</h3>
        <label>
          Year
          <select
            className="date-select"
            value={year}
            onChange={(e) => {
              update({ year: e.target.value, month: null });
            }}
          >
            {observationYears.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <button className="text-link" type="button" onClick={() => setMonth(null)}>
          All months
        </button>
      </div>
      <p className="text-xs leading-5 text-muted">
        This calendar reflects the local registry and bounded catalog samples, not an exhaustive
        archive. “No verified record” does not mean the satellite acquired nothing.
      </p>
      <div className="observation-calendar" role="group" aria-label="Filter observations by month">
        {months.map((m) => {
          const records = observationRegistry.filter((o) =>
            o.date.startsWith(`${year}-${m.number}`),
          );
          const viewable = records.filter((o) => o.status === "processed").length;
          return (
            <button
              type="button"
              key={m.number}
              aria-pressed={month === m.number}
              onClick={() => setMonth(month === m.number ? null : m.number)}
            >
              <strong>{m.label}</strong>
              <span>{viewable} viewable</span>
              <span>{records.length - viewable} catalog only</span>
              {records.length === 0 && <small>No verified record</small>}
            </button>
          );
        })}
      </div>
      <div className="observation-days" role="group" aria-label="Observation dates">
        {filtered.map((o) => (
          <article key={o.id} className={selection.focusId === o.id ? "day-selected" : ""}>
            <time dateTime={o.date}>{o.date}</time>
            <small>{o.mission}</small>
            {o.radarKey && <small>Original NISAR study · {o.measurement}</small>}
            <span>
              {o.status === "processed" ? "Viewable" : "Catalog only"}{" "}
              {selection.a === o.id ? "· Selected A" : ""}{" "}
              {selection.b === o.id ? "· Selected B" : ""}
            </span>
            <div className="matrix-row-actions">
              <button
                type="button"
                className="secondary-button"
                aria-pressed={selection.a === o.id}
                onClick={() => onSelectA(o.id)}
              >
                Select A
              </button>
              <button
                type="button"
                className="secondary-button"
                aria-pressed={selection.b === o.id}
                onClick={() => onSelectB(o.id)}
              >
                Select B
              </button>
              <button
                type="button"
                className="text-link"
                disabled={!o.asset && !o.contextObservationId}
                onClick={() => onView(o)}
              >
                {o.asset ? "View map" : "View NASA context"}
              </button>
            </div>
          </article>
        ))}
      </div>
      <DataTable
        caption="Observation date matrix — processing and comparison evidence"
        columns={[
          "Date / season window",
          "Mission / product",
          "Maturity / quality",
          "Coverage / layer",
          "Select",
        ]}
      >
        {filtered.map((o) => (
          <tr key={o.id} aria-selected={selection.a === o.id || selection.b === o.id}>
            <th scope="row">
              {o.date}
              <span className="table-note">{o.season} candidate/window</span>
            </th>
            <td>
              {o.mission}
              <span className="table-note">
                {o.product} · {o.measurement}
              </span>
            </td>
            <td>
              {o.maturity}
              <span className="table-note">{o.quality}</span>
            </td>
            <td>
              {o.coveragePercent === null
                ? "Not assessed"
                : `${formatNumber(o.coveragePercent, 3)}%`}
              <span className="table-note">
                {o.asset
                  ? "Processed and viewable"
                  : o.contextObservationId
                    ? "Catalog product unprocessed · NASA optical context available"
                    : "Catalog only · no map layer"}
              </span>
            </td>
            <td>
              <div className="matrix-row-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSelectA(o.id)}
                  aria-label={`Select ${o.id} as A`}
                >
                  A
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onSelectB(o.id)}
                  aria-label={`Select ${o.id} as B`}
                >
                  B
                </button>
              </div>
            </td>
          </tr>
        ))}
        {!filtered.length && (
          <tr>
            <td colSpan={5}>No verified record in this registry for the selected month.</td>
          </tr>
        )}
      </DataTable>
    </>
  );
}
