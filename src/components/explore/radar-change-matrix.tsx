import { radarCategories, radarComparisonWarning } from "@/data/seasons";
import { changeThresholdDb } from "@/data/study";
import { formatNumber } from "@/lib/format";
import type { MapAsset } from "@/lib/observation-types";
export function RadarChangeMatrix({
  selectedCategory,
  onHighlight,
}: {
  selectedCategory: string | null;
  onHighlight: (key: string | null, asset: MapAsset | null) => void;
}) {
  return (
    <div className="panel p-6 mt-6">
      <h3 className="section-title">October radar change matrix</h3>
      <p className="section-description">
        After minus before, exploratory ±{changeThresholdDb} dB. Select a category to highlight its
        actual pixels on the map. Counts use the full source grid; preview resampling affects
        display only.
      </p>
      <div className="radar-matrix">
        {radarCategories.map((category) => (
          <button
            key={category.key}
            type="button"
            aria-pressed={selectedCategory === category.key}
            className={`radar-category radar-category-${category.key}`}
            onClick={() => onHighlight(category.key, category.asset)}
          >
            <span>{category.label}</span>
            <strong>{formatNumber(category.pixels)} pixels</strong>
            <small>
              {category.percentValid === null
                ? `${formatNumber(category.percentGrid, 4)}% of total grid; excluded`
                : `${formatNumber(category.percentValid, 2)}% of valid paired pixels`}
            </small>
          </button>
        ))}
      </div>
      <button type="button" className="text-link mt-4" onClick={() => onHighlight(null, null)}>
        Clear category highlight
      </button>
      <p className="section-description">
        Radar backscatter change, not confirmed flooding. {radarComparisonWarning}. Grid alignment
        permits an exploratory contrast; it does not resolve these acquisition differences.
      </p>
    </div>
  );
}
