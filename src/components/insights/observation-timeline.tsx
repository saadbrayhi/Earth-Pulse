import { analysis } from "@/lib/analysis";
import { formatNumber } from "@/lib/format";

export function ObservationTimeline() {
  return (
    <section className="panel observation-timeline">
      <div>
        <p className="eyebrow">TWO OBSERVATIONS · NO INFERRED TREND</p>
        <h2 className="section-title mt-2">Observation record</h2>
      </div>
      <div className="timeline-pair">
        {[
          { date: analysis.beforeDate, stats: analysis.before },
          { date: analysis.afterDate, stats: analysis.after },
        ].map(({ date, stats }) => (
          <article key={date}>
            <time dateTime={date}>{date}</time>
            <strong>{formatNumber(stats.medianDb, 2)} dB</strong>
            <p>Median HH backscatter, paired population</p>
          </article>
        ))}
      </div>
    </section>
  );
}
