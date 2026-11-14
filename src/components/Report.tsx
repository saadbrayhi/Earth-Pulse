"use client";

// The report under the map: big numbers first, then a short explanation in sections,
// then technical details folded away for experts.

import { useState } from "react";
import Histogram from "./Histogram";
import { daysBetween, explain, fmtDate, footballFields, km2 } from "@/lib/explain";
import type { SceneInfo, StudyMetadata } from "@/lib/types";

function Tile({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${accent ?? ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Section({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5 text-[15px] leading-relaxed text-text/85">
        {items.map((t) => (
          <li key={t} className="border-l-2 border-line pl-3">
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SceneRow({ s }: { s: SceneInfo }) {
  return (
    <tr className="border-t border-line align-top">
      <td className="py-1.5 pr-3 font-mono">{fmtDate(s.date)}</td>
      <td className="py-1.5 pr-3">
        {s.passDirection} · track {s.track} · frame {s.frame} · orbit {s.orbit}
      </td>
      <td className="py-1.5 pr-3 font-mono">
        {s.rangeBandwidthMHz[0]} MHz · {s.nativePixelM} m
      </td>
      <td className="py-1.5 pr-3">{s.collection}</td>
      <td className="py-1.5">
        <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="break-all text-accent hover:underline">
          source file ↗
        </a>
      </td>
    </tr>
  );
}

export default function Report({ meta, dataPath }: { meta: StudyMetadata; dataPath: string }) {
  const s = meta.stats;
  const e = explain(meta);
  const days = daysBetween(meta.before.date, meta.after.date);
  const net = s.netChangeKm2;
  const pct = s.waterLikeBefore.km2 > 0 ? (100 * net) / s.waterLikeBefore.km2 : 0;
  const digits = Math.max(s.waterLikeBefore.km2, s.waterLikeAfter.km2) < 50 ? 1 : 0;
  const tone = { High: "text-emerald-300", Moderate: "text-amber-300", Low: "text-rose-300" }[e.confidence.level];
  const [pol, setPol] = useState<"HH" | "HV">("HH");
  const h = meta.histogram;

  return (
    <article className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header>
        <p className="text-sm font-medium text-accent">
          {meta.studyArea.name}
          {meta.studyArea.region ? ` · ${meta.studyArea.region}` : ""} · {fmtDate(meta.before.date)} → {fmtDate(meta.after.date)}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">{e.headline}</h2>
        <p className="mt-3 max-w-3xl text-lg text-text/80">{e.summary}</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label={`Water on ${fmtDate(meta.before.date)}`} value={km2(s.waterLikeBefore.km2, digits)} sub={`${Math.round(s.waterLikeBefore.percent)}% of the area`} />
        <Tile label={`Water on ${fmtDate(meta.after.date)}`} value={km2(s.waterLikeAfter.km2, digits)} sub={`${Math.round(s.waterLikeAfter.percent)}% of the area`} />
        <Tile
          label={`Change in ${days} days`}
          value={`${net < 0 ? "−" : "+"}${km2(Math.abs(net), digits)}`}
          sub={`${pct < 0 ? "−" : "+"}${Math.abs(pct).toFixed(0)}% · ≈ ${footballFields(net)} football fields`}
          accent={net < 0 ? "text-recede" : "text-water"}
        />
        <Tile label="How sure are we?" value={e.confidence.label} sub="see the checklist below" accent={tone} />
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <Section icon="👀" title="What the satellite saw" items={e.observation} />
        <Section icon="🌧️" title="Why it probably happened" items={e.drivers} />
        <Section icon="🤔" title="What else could explain it" items={e.alternatives} />
        <Section icon="🤝" title="Why it matters" items={e.relevance} />
      </div>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h3 className="text-lg font-semibold">
          How sure are we? <span className={tone}>{e.confidence.label}</span>
        </h3>
        <ul className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          {e.confidence.reasons.map((r) => (
            <li key={r.text} className="flex gap-2">
              <span className={r.good ? "text-emerald-300" : "text-amber-300"}>{r.good ? "✓" : "!"}</span>
              <span className="text-text/85">{r.text}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          &ldquo;Water&rdquo; here means the radar picture is very dark. That is usually open water, but not always. This
          text is written by fixed rules from the measured numbers; nothing is made up by AI.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink hover:brightness-110">
          🖨 Print / save as PDF
        </button>
        <a href={dataPath + meta.layers.waterChange.file} download className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent">
          ↓ Water map image
        </a>
        <a href={dataPath + "metadata.json"} download className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent">
          ↓ All numbers (JSON)
        </a>
      </div>

      <details className="group rounded-2xl border border-dashed border-line p-5">
        <summary className="cursor-pointer list-none text-sm text-muted hover:text-text">
          🔬 Data and method, for experts <span className="inline-block transition group-open:rotate-90">›</span>
        </summary>
        <div className="mt-5 grid gap-8 text-sm md:grid-cols-2">
          <div>
            <h4 className="font-semibold">Radar brightness distribution</h4>
            <div className="mt-2 flex gap-1 text-xs">
              {(["HH", "HV"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPol(p)}
                  className={`rounded px-2 py-0.5 font-mono ${pol === p ? "bg-accent/15 text-accent" : "text-muted hover:text-text"}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Histogram
              bins={h.binStartDb}
              before={pol === "HH" ? h.hhBeforePct : h.hvBeforePct}
              after={pol === "HH" ? h.hhAfterPct : h.hvAfterPct}
              threshold={pol === "HH" ? s.waterThresholdDb : s.waterThresholdHvDb}
              beforeLabel={fmtDate(meta.before.date)}
              afterLabel={fmtDate(meta.after.date)}
              xLabel={`${pol} backscatter γ⁰ (dB)`}
            />
            <p className="mt-2 text-xs text-muted">
              Water-like = HH &lt; {s.waterThresholdDb} dB and HV &lt; {s.waterThresholdHvDb} dB. Persistent{" "}
              {km2(s.persistent.km2, 2)}, receded {km2(s.receded.km2, 2)}, new {km2(s.new.km2, 2)} of {km2(s.validAreaKm2, 2)}{" "}
              analysed.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Method</h4>
              <ul className="mt-2 space-y-1.5 text-xs text-text/85">
                {Object.entries(meta.processing)
                  .filter(([k]) => k !== "scripts")
                  .map(([k, v]) => (
                    <li key={k}>
                      <span className="text-muted">{k.replace(/([A-Z])/g, " $1").toLowerCase()}:</span>{" "}
                      {Array.isArray(v) ? v.join(", ") : v}
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">Limitations</h4>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-text/85">
                {meta.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="font-semibold">Radar scenes used</h4>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <tbody>
                  <SceneRow s={meta.before} />
                  <SceneRow s={meta.after} />
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Sources:{" "}
              {meta.sources.map((src, i) => (
                <span key={src.url}>
                  {i > 0 && " · "}
                  <a href={src.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                    {src.label}
                  </a>
                </span>
              ))}
            </p>
          </div>
        </div>
      </details>
    </article>
  );
}
