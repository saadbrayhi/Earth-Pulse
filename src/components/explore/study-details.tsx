import { CalendarDays, Database, ExternalLink, MapPin } from "lucide-react";
import { dataFiles } from "@/data/files";
import { radarMission } from "@/data/project";
import { analysis, observations, radarProduct } from "@/data/study";
import { formatCoordinate, formatObservationDate } from "@/lib/format";
import type { RadarMetadata } from "@/lib/radar";

export function StudySummary({
  metadata,
  comparison,
}: {
  metadata: RadarMetadata;
  comparison?: { window: string; product: string };
}) {
  const items = [
    { label: "STUDY AREA", value: metadata.location, icon: MapPin },
    {
      label: "OBSERVATION WINDOW",
      value:
        comparison?.window ??
        `${formatObservationDate(metadata.beforeDate)} → ${formatObservationDate(metadata.afterDate)}`,
      icon: CalendarDays,
    },
    {
      label: comparison ? "SELECTED PRODUCT" : "RADAR PRODUCT",
      value: comparison?.product ?? radarProduct.summary,
      icon: Database,
    },
  ];
  return (
    <section className="study-summary" aria-label="Study overview">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="summary-cell">
          <Icon size={18} className="summary-icon" />
          <div>
            <p className="eyebrow">{label}</p>
            <p className="mt-2 text-sm text-heading">{value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function ObservationSource({ metadata }: { metadata: RadarMetadata }) {
  return (
    <section className="panel observation-source p-5">
      <h2 className="text-sm font-semibold text-heading">Observation source</h2>
      <p className="mt-4 text-sm text-heading">{radarMission.displayName}</p>
      <p className="mt-1 text-xs leading-5 text-muted">
        {metadata.measurement} · {analysis.polarization} polarization
      </p>
      <dl className="mt-4 space-y-2 text-xs">
        {observations.map(({ label, date }) => (
          <div key={label} className="flex justify-between">
            <dt>{label}</dt>
            <dd>
              <time dateTime={date}>{date}</time>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-5 text-muted">{analysis.dateEvidence}</p>
      <a
        href={dataFiles.analysis}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-xs text-accent"
      >
        View analysis & provenance <ExternalLink size={12} />
      </a>
    </section>
  );
}

export function ImageExtent({ bounds }: { bounds: RadarMetadata["bounds"] }) {
  return (
    <section className="extent-details" aria-label="Image extent">
      <span>Bounds from metadata</span>
      {bounds.map(([latitude, longitude], index) => (
        <span key={index}>
          {index === 0 ? "SW" : "NE"} {formatCoordinate(latitude, "latitude")},{" "}
          {formatCoordinate(longitude, "longitude")}
        </span>
      ))}
    </section>
  );
}
