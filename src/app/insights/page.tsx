import type { Metadata } from "next";
import { Download } from "lucide-react";
import { analysis } from "@/data/study";
import { formatNumber, signedDb } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/metric-card";
import { ScienceNotice } from "@/components/science-notice";
import { SignalExplainer } from "@/components/signal-explainer";
import { ChangeDistribution } from "@/components/insights/change-distribution";
import { ObservationTimeline } from "@/components/insights/observation-timeline";
import { DataQuality } from "@/components/insights/data-quality";
import { HistogramTable } from "@/components/insights/histogram-table";
import { pages } from "@/content/pages";
import { dataFiles } from "@/data/files";

export const metadata: Metadata = pages.insights.metadata;

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        {...pages.insights.header}
        action={
          <a
            className="secondary-button inline-flex gap-2 items-center"
            href={dataFiles.analysis}
            download
          >
            <Download size={14} /> Download results
          </a>
        }
      />
      <div className="metrics-grid">
        <MetricCard
          label="MEAN BACKSCATTER DIFFERENCE"
          value={signedDb(analysis.delta.meanDb)}
          detail="After − before, over valid paired pixels"
        />
        <MetricCard
          label="MEDIAN DIFFERENCE"
          value={signedDb(analysis.delta.medianDb)}
          detail="Median pixel difference; not a water-level change"
        />
        <MetricCard
          label="VALID PAIRED COVERAGE"
          value={`${formatNumber(analysis.quality.pairedValidPercent, 3)}%`}
          detail={`${formatNumber(analysis.quality.pairedValidPixels)} of ${formatNumber(analysis.quality.totalPixels)} grid pixels`}
        />
      </div>
      <ChangeDistribution />
      <ObservationTimeline />
      <DataQuality />
      <SignalExplainer />
      <ScienceNotice />
      <HistogramTable />
    </>
  );
}
