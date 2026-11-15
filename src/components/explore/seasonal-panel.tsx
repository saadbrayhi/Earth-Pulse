import { seasonal, seasonalContext, seasonalDiscovery, seasonalAccess } from "@/data/seasons";
import { dataFiles } from "@/data/files";
import type { MapAsset, SeasonalView } from "@/lib/observation-types";
import { formatNumber } from "@/lib/format";
import { RangeControl } from "@/components/ui/range-control";
import { WaterTransitionMatrix } from "./water-transition-matrix";
import { MetricCard } from "@/components/metric-card";

export function SeasonalPanel({
  view,
  opacity,
  onOpacityChange,
  onHighlight,
}: {
  view: SeasonalView;
  opacity: number;
  onOpacityChange: (value: number) => void;
  onHighlight: (asset: MapAsset | null) => void;
}) {
  return (
    <section id="seasonal-dynamics" className="panel p-6" aria-labelledby="seasonal-heading">
      <p className="eyebrow">TWO SEASONS · ONE TRANSFORMING WETLAND</p>
      <h2 id="seasonal-heading" className="section-title mt-3">
        Seasonal Dynamics
      </h2>
      <p className="section-description" aria-live="polite">
        {seasonalContext[view]}
      </p>
      {seasonal.status === "unavailable" ? (
        <>
          <p className="evidence-notice">
            <strong>Seasonal analysis is unavailable.</strong> {seasonal.reason}
          </p>
          <p className="section-description">
            No water-area values or transition counts are available. Zero would be a measurement, so
            missing results are not displayed as zero.
          </p>
          <details>
            <summary>Inspect the data search and access results</summary>
            <p className="section-description">
              Bounded search checked {seasonalDiscovery.results.length} collection/window
              combinations. Counts are granules, not unique acquisition dates or guaranteed
              full-region coverage. Checked {seasonalDiscovery.checkedAt.slice(0, 10)}.
            </p>
            <ul className="method-list">
              {seasonalDiscovery.results.map((q) => (
                <li key={q.season + q.collection}>
                  {q.season} · {q.collection}:{" "}
                  {"hits" in q ? `${q.hits} catalog hits` : "Search unavailable"}
                </li>
              ))}
            </ul>
            <ul className="method-list">
              {seasonalAccess.results.map((result) => (
                <li key={result.season}>
                  {result.season}: {result.status}.{" "}
                  <a
                    className="text-link"
                    href={result.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Candidate record ↗
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="text-link"
              href={dataFiles.seasonalDiscovery}
              target="_blank"
              rel="noopener noreferrer"
            >
              Full seasonal catalog report ↗
            </a>
            <br />
            <a
              className="text-link"
              href={dataFiles.seasonalAccess}
              target="_blank"
              rel="noopener noreferrer"
            >
              Raster access report ↗
            </a>
          </details>
        </>
      ) : (
        <>
          <p className="evidence-notice">
            Classified water footprint · independent local validation not performed. Supplemental
            OPERA DSWx-HLS observations, not NISAR water measurements.
          </p>
          <div className="metrics-grid seasonal-metrics">
            <MetricCard
              label="DRY-DATE WATER FOOTPRINT"
              value={`${formatNumber(seasonal.metrics.dryWaterAreaKm2, 2)} km²`}
              detail="Common valid area; includes partial-water pixel footprints"
            />
            <MetricCard
              label="WET-DATE WATER FOOTPRINT"
              value={`${formatNumber(seasonal.metrics.wetWaterAreaKm2, 2)} km²`}
              detail="Same classification policy and compared area"
            />
            <MetricCard
              label="PAIRED CLASSIFICATION COVERAGE"
              value={`${formatNumber(seasonal.metrics.coveragePercent, 2)}%`}
              detail={`${formatNumber(seasonal.metrics.unknownPixels)} excluded pixels`}
            />
          </div>
          <p className="section-description">
            Wet minus dry: {formatNumber(seasonal.metrics.netDifferenceKm2, 2)} km² over{" "}
            {formatNumber(seasonal.metrics.comparedAreaKm2, 2)} km² of common valid classifications.
            This is a date-pair difference, not a measured annual trend.
          </p>
          <WaterTransitionMatrix cells={seasonal.metrics.transitions} onHighlight={onHighlight} />
          <button className="text-link mt-3" type="button" onClick={() => onHighlight(null)}>
            Show all transitions
          </button>
          <p className="section-description">
            Rows/columns: dry-water + wet-water = both dates; dry-non-water + wet-water = wet-only;
            dry-water + wet-non-water = dry-only; both non-water = neither. Unknown is separate and
            excluded. “Both dates” does not mean year-round water.
          </p>
          <ul className="method-list">
            {seasonal.observations.map((o) => (
              <li key={o.id}>
                {o.season}: <time dateTime={o.date}>{o.date}</time> · {o.mission} · {o.productId}
              </li>
            ))}
          </ul>
          <p className="section-description">
            {seasonal.method} Area method: {seasonal.areaMethod}.
          </p>
          <a
            className="text-link"
            href={seasonal.methodSource}
            target="_blank"
            rel="noopener noreferrer"
          >
            Classification documentation ↗
          </a>
          <RangeControl label="Seasonal layer opacity" value={opacity} onChange={onOpacityChange} />
          <ul className="seasonal-legend">
            <li>
              <i className="transition-wetOnly" />
              Blue: wet-date-only water
            </li>
            <li>
              <i className="transition-bothDates" />
              Teal: water on both dates
            </li>
            <li>
              <i className="transition-dryOnly" />
              Amber: dry-date-only water
            </li>
            <li>
              <i className="transition-neither" />
              Neutral: neither water
            </li>
            <li>
              <i className="transition-unknown" />
              Purple: unknown / excluded
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
