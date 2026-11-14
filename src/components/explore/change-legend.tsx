export function ChangeLegend({ threshold }: { threshold: number }) {
  return (
    <section className="panel p-5" aria-labelledby="legend-heading">
      <p className="eyebrow mb-2">READ THE CHANGE LAYER</p>
      <h2 id="legend-heading" className="text-sm font-semibold text-slate-100">Radar backscatter change</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">After minus before · threshold ±{threshold} dB</p>
      <ul className="mt-5 space-y-4 text-sm">
        <li className="flex items-center gap-3"><span className="legend-swatch bg-[#286edc]" /><span className="flex-1 text-slate-300">Decreased backscatter</span><span className="font-mono text-xs text-slate-400">&lt; −{threshold} dB</span></li>
        <li className="flex items-center gap-3"><span className="legend-swatch bg-[#eb6937]" /><span className="flex-1 text-slate-300">Increased backscatter</span><span className="font-mono text-xs text-slate-400">&gt; +{threshold} dB</span></li>
        <li className="flex items-center gap-3"><span className="legend-swatch transparency-swatch" /><span className="text-slate-300">Transparent · not highlighted</span></li>
      </ul>
      <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-5 text-slate-400">Transparent pixels include changes within the threshold and pixels without valid paired observations.</p>
    </section>
  );
}
