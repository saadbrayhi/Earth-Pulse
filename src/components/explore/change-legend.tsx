import { changeCategories, changeThresholdDb } from "@/data/study";
import { changeLegend } from "@/content/science";

export function ChangeLegend() {
  return (
    <section className="panel p-5" aria-labelledby="legend-heading">
      <p className="eyebrow mb-2">READ THE CHANGE LAYER</p>
      <h2 id="legend-heading" className="text-sm font-semibold text-heading">
        Radar backscatter change
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        After minus before · threshold ±{changeThresholdDb} dB
      </p>
      <ul className="mt-5 space-y-4 text-sm">
        {changeCategories
          .filter((category) => category.key !== "withinThreshold")
          .map((category) => (
            <li key={category.key} className="flex items-center gap-3">
              <span className={`legend-swatch ${category.swatchClass}`} />
              <span className="flex-1 text-foreground">{category.label}</span>
              <span className="font-mono text-xs text-muted">{category.range}</span>
            </li>
          ))}
        <li className="flex items-center gap-3">
          <span className="legend-swatch transparency-swatch" />
          <span className="text-foreground">{changeLegend.transparentLabel}</span>
        </li>
      </ul>
      <p className="mt-5 border-t border-divider pt-4 text-xs leading-5 text-muted">
        {changeLegend.transparentDescription}
      </p>
    </section>
  );
}
