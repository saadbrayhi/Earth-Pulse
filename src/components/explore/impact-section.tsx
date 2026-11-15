import { impactEvidence, impactSources } from "@/data/impact";
import { formatNumber } from "@/lib/format";
import { monitoringRoadmap } from "@/content/story";

export function ImpactSection() {
  return (
    <section id="why-changes-matter" className="extension-section" aria-labelledby="impact-title">
      <p className="eyebrow">HISTORICAL EVIDENCE · HUMAN CONTEXT</p>
      <h2 id="impact-title" className="section-title mt-3">
        Why these changes matter
      </h2>
      <p className="section-description">
        Why Bangladesh? The haor landscape supports fisheries and aquatic habitats during
        inundation, then cultivation as water recedes. For a farming household, water arriving
        before the Boro harvest can threaten food and income together.
      </p>
      <p className="evidence-notice">
        Historical impact — not measured by the current EarthPulse satellite scene. The October 2026
        images do not show the April–May disaster.
      </p>
      <div className="impact-timeline">
        {impactEvidence.map((event) => (
          <article key={event.id} className="panel p-6">
            <p className="eyebrow">
              {event.period} · {event.evidenceType}
            </p>
            <h3 className="section-title mt-3">{event.title}</h3>
            <p className="section-description">{event.description}</p>
            <p className="text-xs text-muted">Geographic scope: {event.scope}</p>
            <dl className="impact-metrics">
              {event.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt>{metric.label}</dt>
                  <dd>
                    {formatNumber(metric.value)} <span>{metric.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <details>
              <summary>Source, date and assessment method</summary>
              <p className="section-description">{event.method}</p>
              <p className="text-xs text-muted">Published: {event.publicationDate}</p>
              <a
                className="text-link mt-3"
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {event.sourceOrganization} ↗
              </a>
            </details>
          </article>
        ))}
      </div>
      <p className="section-description">
        Estimates evolve: {impactSources.alternative2026.description}{" "}
        <a
          className="text-link"
          href={impactSources.alternative2026.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {impactSources.alternative2026.label} ↗
        </a>
      </p>
      <div className="impact-context-grid">
        <article className="panel p-6">
          <p className="eyebrow">GENERAL ECOLOGICAL CONTEXT</p>
          <h3 className="section-title mt-3">A wetland is more than a water mask.</h3>
          <p className="section-description">
            The Ramsar designation announcement describes a{" "}
            {formatNumber(impactSources.biodiversity.areaHa)} ha site supporting at least{" "}
            {impactSources.biodiversity.fishSpecies} fish species and{" "}
            {impactSources.biodiversity.birdSpecies} bird species. These are figures reported in
            2000, not a current species census. Seasonal habitats support fishing and biodiversity
            alongside agricultural livelihoods.
          </p>
          <p className="text-xs text-muted">
            The designated Ramsar site area differs from our rectangular satellite analysis area.
          </p>
          <a
            href={impactSources.biodiversity.url}
            className="text-link mt-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            {impactSources.biodiversity.label} ↗
          </a>
        </article>
        <article className="panel p-6">
          <p className="eyebrow">EXTERNAL RESEARCH · SENTINEL-1</p>
          <h3 className="section-title mt-3">Why radar matters</h3>
          <p className="section-description">
            Monsoon clouds can obstruct optical observations. SAR sends microwave pulses and
            measures their return, allowing observation by day or night and through many cloudy
            conditions. Interpretation still depends on vegetation, moisture, surface roughness and
            acquisition geometry.
          </p>
          <p className="section-description">
            A Bangladesh Sentinel-1 study reported {impactSources.sar.accuracy}% overall flood-map
            accuracy for its specific method and evaluation. This is not EarthPulse accuracy and
            does not validate our NISAR results.
          </p>
          <a
            href={impactSources.sar.url}
            className="text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {impactSources.sar.label} ↗
          </a>
        </article>
      </div>
      <article id="monitoring-roadmap" className="panel p-6 mt-6">
        <p className="eyebrow">FUTURE CONCEPT · NOT AN OPERATIONAL SERVICE</p>
        <h3 className="section-title mt-3">From observation to informed decisions</h3>
        <ol className="roadmap">
          {monitoringRoadmap.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="section-description">
          Future monitoring would need validated methods, timely acquisition, water-level/rainfall
          context and human review. No farmer losses or damage estimates are mapped to pixels
          without spatial exposure evidence.
        </p>
      </article>
    </section>
  );
}
