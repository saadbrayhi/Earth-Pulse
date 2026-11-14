"use client";

// Map on top (two dates + "what changed"), report below.

import { useState } from "react";
import RadarMap from "./RadarMap";
import Report from "./Report";
import { fmtDate } from "@/lib/explain";
import type { StudyMetadata, View } from "@/lib/types";

export default function ResultView({ meta, dataPath, toolbar }: { meta: StudyMetadata; dataPath: string; toolbar?: React.ReactNode }) {
  const [view, setView] = useState<View>("change");
  const color = (k: string) => meta.layers.waterChange.classes.find((c) => c.key === k)?.color ?? "#888";
  const buttons: { id: View; label: string }[] = [
    { id: "before", label: fmtDate(meta.before.date) },
    { id: "after", label: fmtDate(meta.after.date) },
    { id: "change", label: "What changed" },
  ];

  return (
    <>
      <section className="relative h-[65vh] min-h-[420px] w-full overflow-hidden border-b border-line print:h-[45vh]">
        <RadarMap meta={meta} dataPath={dataPath} view={view} />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-wrap items-start gap-2 p-3">
          <div role="tablist" aria-label="What the map shows" className="pointer-events-auto flex gap-1 rounded-xl bg-panel/90 p-1 shadow-lg backdrop-blur">
            {buttons.map((b) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={view === b.id}
                onClick={() => setView(b.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === b.id ? "bg-accent text-ink" : "text-text/80 hover:bg-white/10"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          {toolbar}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[calc(100%-5rem)] rounded-xl bg-panel/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
          {view === "change" ? (
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: color("receded") }} /> water left
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: color("persistent") }} /> water both dates
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: color("new") }} /> new water
              </li>
            </ul>
          ) : (
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-neutral-900 ring-1 ring-white/40" /> dark = water
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-neutral-200" /> bright = land, plants, houses
              </span>
            </span>
          )}
          <span className="mt-1 block text-muted">👆 Click any spot in the box to check it</span>
        </div>
      </section>

      <Report meta={meta} dataPath={dataPath} />
    </>
  );
}
