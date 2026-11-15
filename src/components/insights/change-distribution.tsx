import { changeCategories, changeThresholdDb } from "@/data/study";
import { formatNumber } from "@/lib/format";
import { ChangeChart } from "@/components/change-chart";

export function ChangeDistribution() {
  return (
    <div className="insights-grid">
      <section className="panel chart-panel">
        <h2 className="section-title">A distribution, not a diagnosis.</h2>
        <p className="section-description">
          Pixel counts by after-minus-before difference (dB). End bins include all tails.
        </p>
        <ChangeChart />
        <p className="chart-axis-caption">
          Radar backscatter difference (dB) · vertical axis: paired pixel count
        </p>
      </section>
      <section className="panel p-6">
        <p className="eyebrow">EXPLORATORY THRESHOLD · ±{changeThresholdDb} dB</p>
        <h2 className="section-title mt-3">Direction of change</h2>
        <div className="category-list">
          {changeCategories.map((item) => (
            <div key={item.key}>
              <div className="flex justify-between gap-3 text-sm">
                <span>{item.label}</span>
                <strong>{formatNumber(item.percentValid, 2)}%</strong>
              </div>
              <div className={`category-track ${item.key}`}>
                <span style={{ width: `${item.percentValid}%` }} />
              </div>
              <p className="text-xs text-muted">{formatNumber(item.pixels)} valid paired pixels</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-5 text-muted">
          Percentages use valid paired pixels, not total wetland area. Pixels within the threshold
          may still have changed; they are simply not highlighted.
        </p>
      </section>
    </div>
  );
}
