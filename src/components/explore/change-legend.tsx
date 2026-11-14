export function ChangeLegend({ threshold }: { threshold: number }) {
  return (
    <section className="panel p-5" aria-labelledby="legend-heading">
      <p className="eyebrow mb-2">READ THE CHANGE LAYER</p>
      <h2 id="legend-heading" className="text-sm font-semibold text-heading">
        Radar backscatter change
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted">
        After minus before · threshold ±{threshold} dB
      </p>
      <ul className="mt-5 space-y-4 text-sm">
        <li className="flex items-center gap-3">
          <span className="legend-swatch bg-signal-decreased" />
          <span className="flex-1 text-foreground">Decreased backscatter</span>
          <span className="font-mono text-xs text-muted">&lt; −{threshold} dB</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="legend-swatch bg-signal-increased" />
          <span className="flex-1 text-foreground">Increased backscatter</span>
          <span className="font-mono text-xs text-muted">&gt; +{threshold} dB</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="legend-swatch transparency-swatch" />
          <span className="text-foreground">Transparent · not highlighted</span>
        </li>
      </ul>
      <p className="mt-5 border-t border-divider pt-4 text-xs leading-5 text-muted">
        Transparent pixels include changes within the threshold and pixels without valid paired
        observations.
      </p>
    </section>
  );
}
