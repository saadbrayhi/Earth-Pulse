import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, CheckCircle2 } from "lucide-react";
import { analysis, categoryLabels, formatNumber, signedDb } from "@/lib/analysis";
import { MetricCard } from "@/components/metric-card";
import { ChangeChart } from "@/components/change-chart";
import { ScienceNotice } from "@/components/science-notice";
import { SignalExplainer } from "@/components/signal-explainer";

export const metadata: Metadata = { title: "Insights | EarthPulse", description: "Real full-resolution NISAR backscatter statistics and transparent data-quality limits for Tanguar Haor." };

export default function InsightsPage() {
  return <>
    <div className="page-intro"><div><p className="eyebrow mb-3">EVIDENCE, WITH CONTEXT</p><h1 className="page-title">What the signal says.</h1><p className="page-description">Full-resolution backscatter analysis · {analysis.beforeDate} → {analysis.afterDate}</p></div><a className="secondary-button inline-flex gap-2 items-center" href="/data/analysis.json" download><Download size={14} /> Download results</a></div>
    <div className="metrics-grid">
      <MetricCard label="MEAN BACKSCATTER DIFFERENCE" value={signedDb(analysis.delta.meanDb)} detail="After − before, over valid paired pixels" />
      <MetricCard label="MEDIAN DIFFERENCE" value={signedDb(analysis.delta.medianDb)} detail="Median pixel difference; not a water-level change" />
      <MetricCard label="VALID PAIRED COVERAGE" value={`${formatNumber(analysis.quality.pairedValidPercent, 3)}%`} detail={`${formatNumber(analysis.quality.pairedValidPixels)} of ${formatNumber(analysis.quality.totalPixels)} grid pixels`} />
    </div>
    <div className="insights-grid">
      <section className="panel chart-panel"><h2 className="section-title">A distribution, not a diagnosis.</h2><p className="section-description">Pixel counts by after-minus-before difference (dB). End bins include all tails.</p><ChangeChart /><p className="chart-axis-caption">Radar backscatter difference (dB) · vertical axis: paired pixel count</p></section>
      <section className="panel p-6"><p className="eyebrow">EXPLORATORY THRESHOLD · ±{analysis.processing.thresholdDb} dB</p><h2 className="section-title mt-3">Direction of change</h2><div className="category-list">{analysis.categories.map((item) => <div key={item.key}><div className="flex justify-between gap-3 text-sm"><span>{categoryLabels[item.key]}</span><strong>{formatNumber(item.percentValid, 2)}%</strong></div><div className={`category-track ${item.key}`}><span style={{ width: `${item.percentValid}%` }} /></div><p className="text-xs text-slate-400">{formatNumber(item.pixels)} valid paired pixels</p></div>)}</div><p className="mt-6 text-xs leading-5 text-slate-400">Percentages use valid paired pixels, not total wetland area. Pixels within the threshold may still have changed; they are simply not highlighted.</p></section>
    </div>
    <section className="panel observation-timeline"><div><p className="eyebrow">TWO OBSERVATIONS · NO INFERRED TREND</p><h2 className="section-title mt-2">Observation record</h2></div><div className="timeline-pair">{[{ date: analysis.beforeDate, stats: analysis.before }, { date: analysis.afterDate, stats: analysis.after }].map(({ date, stats }) => <article key={date}><time dateTime={date}>{date}</time><strong>{formatNumber(stats.medianDb, 2)} dB</strong><p>Median HH backscatter, paired population</p></article>)}</div></section>
    <section className="quality-grid">
      <article className="panel p-6"><CheckCircle2 size={20} className="text-teal-300" /><h2 className="section-title mt-4">What we checked</h2><ul className="method-list"><li>Matching CRS, dimensions and affine transforms</li><li>Finite, positive power and raster NoData masks</li><li>Full-grid statistics; no compressed-preview measurements</li><li>Histogram and category counts sum to the valid population</li><li>{formatNumber(analysis.quality.invalidPairedPixels)} pixels excluded from the paired comparison</li></ul></article>
      <article className="panel p-6"><h2 className="section-title">What remains uncertain</h2><p className="section-description">{analysis.quality.orbitComparability}. The native NISAR quality mask is not included. A common grid supports pixel comparison, but does not establish identical acquisition conditions.</p><p className="section-description">Independent water validation has not been performed. Water area, flood extent and classification accuracy are therefore not reported.</p><Link href="/about" className="text-link mt-5">Read the full methodology <ArrowRight size={14} /></Link></article>
    </section>
    <SignalExplainer /><ScienceNotice />
    <details className="panel data-details"><summary>Inspect exact histogram counts</summary><div className="table-scroll"><table><caption>Full-resolution paired radar backscatter difference histogram</caption><thead><tr><th scope="col">Difference bin (dB)</th><th scope="col">Pixels</th></tr></thead><tbody>{analysis.histogram.map((bin) => <tr key={bin.label}><th scope="row">{bin.label}</th><td>{formatNumber(bin.pixels)}</td></tr>)}</tbody></table></div></details>
  </>;
}
