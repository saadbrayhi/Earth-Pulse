import { Info } from "lucide-react";
import { analysis, radarViewOptions, type RadarView } from "@/data/study";
import { formatNumber } from "@/lib/format";
import { isRadarView, type RadarMetadata } from "@/lib/radar";
import { RangeControl } from "@/components/ui/range-control";

interface LayerSettingsProps {
  metadata: RadarMetadata;
  view: RadarView;
  opacity: number;
  onViewChange: (view: RadarView) => void;
  onOpacityChange: (opacity: number) => void;
}

export function LayerSettings({
  metadata,
  view,
  opacity,
  onViewChange,
  onOpacityChange,
}: LayerSettingsProps) {
  const [low, high] = analysis.processing.stretchDb;
  const description =
    view === "change"
      ? "After minus before in dB. Only changes beyond the exploratory threshold are colored."
      : `Shared grayscale stretch: ${formatNumber(low, 2)} to ${formatNumber(high, 2)} dB. Brighter means stronger radar return.`;

  return (
    <section className="panel p-5">
      <h2 className="mb-5 text-sm font-semibold text-heading">Layer settings</h2>
      <label htmlFor="observation-date" className="text-xs text-foreground">
        Observations & comparison
      </label>
      <select
        id="observation-date"
        className="date-select"
        value={view}
        onChange={(event) => {
          if (isRadarView(event.target.value)) onViewChange(event.target.value);
        }}
      >
        {radarViewOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value === "before"
              ? metadata.beforeDate
              : option.value === "after"
                ? metadata.afterDate
                : option.label}
          </option>
        ))}
      </select>
      <div className="mt-5">
        <RangeControl label="Overlay opacity" value={opacity} step={5} onChange={onOpacityChange} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">{description}</p>
      <div className="mt-4 flex gap-2 rounded-lg bg-accent-soft p-3 text-xs leading-5 text-muted">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Display previews are compressed; all statistics use the full-resolution source grid.
        </span>
      </div>
    </section>
  );
}
