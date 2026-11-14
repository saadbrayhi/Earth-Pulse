"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Database, ExternalLink, Info, Layers3, MapPin } from "lucide-react";
import { analysis, formatNumber } from "@/lib/analysis";
import { formatCoordinate, formatObservationDate, parseRadarMetadata, radarLayers, radarViews, type RadarMetadata, type RadarView } from "@/lib/radar";
import { ScienceNotice } from "@/components/science-notice";
import { ChangeLegend } from "./change-legend";
import { MapErrorBoundary } from "./map-error-boundary";
import { MapStatus } from "./map-status";

const RadarMap = dynamic(() => import("./radar-map"), { ssr: false, loading: () => <MapStatus /> });
type MetadataState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: RadarMetadata };

export default function ExploreDashboard() {
  const [metadata, setMetadata] = useState<MetadataState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<RadarView>("compare");
  const [opacity, setOpacity] = useState(100);
  const [split, setSplit] = useState(50);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(() => controller.abort(), 15000);
    async function loadMetadata() {
      try {
        const response = await fetch("/data/metadata.json", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error(`Metadata request returned HTTP ${response.status}.`);
        const data = parseRadarMetadata(await response.json());
        if (JSON.stringify(data.bounds) !== JSON.stringify(analysis.bounds) || data.beforeDate !== analysis.beforeDate || data.afterDate !== analysis.afterDate || data.changeThresholdDb !== analysis.processing.thresholdDb) {
          throw new Error("Metadata and analysis differ. Regenerate analysis before viewing these overlays.");
        }
        if (!cancelled) setMetadata({ status: "ready", data });
      } catch (error) {
        if (!cancelled) setMetadata({ status: "error", message: controller.signal.aborted ? "The metadata request timed out." : error instanceof Error ? error.message : "Could not read local metadata." });
      } finally { window.clearTimeout(timer); }
    }
    void loadMetadata();
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); };
  }, [attempt]);

  const data = metadata.status === "ready" ? metadata.data : null;
  return (
    <>
      <div className="page-intro">
        <div><p className="eyebrow mb-3">OBSERVE. COMPARE. UNDERSTAND.</p><h1 className="page-title">A changing landscape.</h1><p className="page-description">Explore a wetland through two radar observations. Slide to compare the same place.</p></div>
        <Link href="/insights" className="secondary-button inline-flex items-center gap-2">See the analysis <ArrowRight size={14} /></Link>
      </div>
      {data ? <>
        <section className="study-summary" aria-label="Study overview">
          <div className="summary-cell"><MapPin size={18} className="summary-icon" /><div><p className="eyebrow">STUDY AREA</p><h2 className="mt-2 text-sm font-medium text-slate-100">{data.location}</h2></div></div>
          <div className="summary-cell"><CalendarDays size={18} className="summary-icon" /><div><p className="eyebrow">OBSERVATION WINDOW</p><p className="mt-2 text-sm text-slate-200">{formatObservationDate(data.beforeDate)} → {formatObservationDate(data.afterDate)}</p></div></div>
          <div className="summary-cell"><Database size={18} className="summary-icon" /><div><p className="eyebrow">RADAR PRODUCT</p><p className="mt-2 text-sm text-slate-200">GCOV / Frequency A / HH</p></div></div>
        </section>
        <div className="explorer-grid">
          <section className="map-panel panel" aria-labelledby="map-heading">
            <div className="map-panel-heading">
              <div><h2 id="map-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100"><Layers3 size={17} className="text-teal-300" /> Radar comparison</h2><p className="mt-1.5 text-xs text-slate-400">One map. Synchronized geography.</p></div>
              <div className="layer-selector" role="group" aria-label="Radar layer">
                {radarViews.map((layer) => <button key={layer} aria-pressed={view === layer} aria-controls="radar-map" onClick={() => setView(layer)}>{radarLayers[layer].label}</button>)}
              </div>
            </div>
            <div className="map-observation-bar"><span>{radarLayers[view].label} / {view === "before" ? data.beforeDate : view === "after" ? data.afterDate : `${data.beforeDate} → ${data.afterDate}`}</span><span>↑ North up</span></div>
            <div id="radar-map" className="radar-map-frame" role="region" aria-label="Georeferenced radar imagery">
              <MapErrorBoundary><RadarMap metadata={data} view={view} opacity={opacity / 100} split={split} /></MapErrorBoundary>
            </div>
            {view === "compare" && <div className="swipe-controls">
              <div className="flex justify-between gap-3 text-xs"><label htmlFor="swipe-position">Before / after comparison</label><output htmlFor="swipe-position">{split}% before</output></div>
              <input id="swipe-position" aria-label="Before and after comparison position" type="range" min="0" max="100" value={split} onChange={(event) => setSplit(Number(event.target.value))} className="mt-3 w-full accent-teal-300" />
              <p className="mt-1 text-xs text-slate-400">Move the slider or use arrow keys. The divider stays fixed while you pan and zoom.</p>
            </div>}
            <div className="map-footer"><span>Dashed outline: analysis region, not a surveyed wetland boundary</span><span>Drag to pan · + / − to zoom</span></div>
          </section>
          <aside className="details-column" aria-label="Layer information">
            <section className="panel p-5">
              <h2 className="mb-5 text-sm font-semibold text-slate-100">Layer settings</h2>
              <label htmlFor="observation-date" className="text-xs text-slate-300">Available observations</label>
              <select id="observation-date" className="date-select" value={view} onChange={(event) => setView(event.target.value as RadarView)}>
                <option value="compare">Both observations · swipe</option><option value="before">{data.beforeDate}</option><option value="after">{data.afterDate}</option><option value="change">Derived backscatter difference</option>
              </select>
              <div className="mt-5 flex justify-between text-xs"><label htmlFor="overlay-opacity">Overlay opacity</label><output htmlFor="overlay-opacity" className="font-mono text-teal-300">{opacity}%</output></div>
              <input id="overlay-opacity" type="range" min="0" max="100" step="5" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} className="mt-4 w-full accent-teal-300" />
              <p className="mt-3 text-xs leading-5 text-slate-400">{view === "change" ? "After minus before in dB. Only changes beyond the exploratory threshold are colored." : `Shared grayscale stretch: ${formatNumber(analysis.processing.stretchDb[0], 2)} to ${formatNumber(analysis.processing.stretchDb[1], 2)} dB. Brighter means stronger radar return.`}</p>
              <div className="mt-4 flex gap-2 rounded-lg bg-white/3 p-3 text-xs leading-5 text-slate-400"><Info size={14} className="mt-0.5 shrink-0" /><span>Display previews are compressed; all statistics use the full-resolution source grid.</span></div>
            </section>
            <ChangeLegend threshold={data.changeThresholdDb} />
            <section className="panel p-5">
              <h2 className="text-sm font-semibold text-slate-100">Observation source</h2>
              <p className="mt-4 text-sm text-slate-200">NASA NISAR</p><p className="mt-1 text-xs leading-5 text-slate-400">{data.measurement} · HH polarization</p>
              <dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between"><dt>Before</dt><dd><time dateTime={data.beforeDate}>{data.beforeDate}</time></dd></div><div className="flex justify-between"><dt>After</dt><dd><time dateTime={data.afterDate}>{data.afterDate}</time></dd></div></dl>
              <p className="mt-4 text-xs leading-5 text-slate-400">Dates supplied with the source exports. Exact acquisition times and orbit metadata are unavailable.</p>
              <a href="/data/analysis.json" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs text-teal-300">View analysis & provenance <ExternalLink size={12} /></a>
            </section>
          </aside>
        </div>
        <ScienceNotice />
        <section className="extent-details" aria-label="Image extent"><span>Bounds from metadata</span><span>SW {formatCoordinate(data.bounds[0][0], "latitude")}, {formatCoordinate(data.bounds[0][1], "longitude")}</span><span>NE {formatCoordinate(data.bounds[1][0], "latitude")}, {formatCoordinate(data.bounds[1][1], "longitude")}</span></section>
      </> : <>
        <div className="panel relative min-h-[480px]"><MapStatus error={metadata.status === "error"} title={metadata.status === "error" ? "Study metadata unavailable" : "Loading the study area"} detail={metadata.status === "error" ? `${metadata.message} The viewer needs valid /data/metadata.json.` : "Reading observation dates and geographic bounds…"} onRetry={metadata.status === "error" ? () => { setMetadata({ status: "loading" }); setAttempt((value) => value + 1); } : undefined} /></div>
        <ScienceNotice />
      </>}
    </>
  );
}
