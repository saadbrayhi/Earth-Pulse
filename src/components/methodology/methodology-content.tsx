import { ExternalLink } from "lucide-react";
import { analysis, radarProduct } from "@/data/study";
import { formatNumber } from "@/lib/format";
import { discovery, referenceResults } from "@/data/supplemental";
import { scientificSources } from "@/data/sources";
import { dataFiles } from "@/data/files";
import { project, radarMission } from "@/data/project";
import { methodologyStories, methodologySections } from "@/content/methodology";
import { DataTable } from "@/components/ui/data-table";
import { MethodSection } from "./method-section";

export function MethodologyContent() {
  return (
    <div className="methodology-layout">
      <nav className="methodology-nav" aria-label="Methodology sections">
        {methodologySections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>
      <div className="methodology-body">
        <MethodStory id="mission" />
        <MethodSection
          id="observations"
          eyebrow="02 / INPUTS"
          title="Two exported GCOV observations."
        >
          <p>
            GCOV is the geocoded polarimetric covariance product. HHHH is its HH diagonal intensity
            term; the product represents terrain-corrected gamma-nought radar power. Frequency A
            refers to the selected frequency sub-band. The supplied files retain the GCOV product
            and HHHH band descriptions.
          </p>
          <DataTable
            caption="Local analysis inputs"
            columns={["Supplied date", "Measurement", "Export grid"]}
          >
            {analysis.sources.map((source) => (
              <tr key={source.date}>
                <th scope="row">{source.date}</th>
                <td>{radarProduct.measurement}</td>
                <td>
                  {source.width} × {source.height}, {source.crs}
                </td>
              </tr>
            ))}
          </DataTable>
          <p>
            Pixel spacing in the exports is{" "}
            {analysis.sources[0].resolutionDegrees[0].toPrecision(8)} degrees. This is a resampled
            geographic grid; it must not be described as the native GCOV resolution. The TIFFs
            retain historical UTM projection tags from the parent product, while the actual raster
            CRS and transform are EPSG:4326.
          </p>
          <p>
            {analysis.dateEvidence} Exact acquisition times, parent product IDs, relative orbit,
            incidence angle and processing release cannot be independently recovered from these
            files. The CMR candidates below have not been matched to these exports.
          </p>
        </MethodSection>
        <MethodSection
          id="processing"
          eyebrow="03 / REPRODUCIBILITY"
          title="From power to a measurable difference."
        >
          <ol className="method-list">
            <li>
              Check that the two source grids match exactly in shape, CRS and affine transform.
              Reject misalignment.
            </li>
            <li>
              Exclude raster NoData, NaN, infinite and non-positive power values. A paired pixel
              must be valid on both dates.
            </li>
            <li>
              Convert each valid power sample using 10 × log₁₀(power). No speckle filter is applied;
              small changes may include speckle.
            </li>
            <li>
              Subtract before dB from after dB. Compute statistics and a complete histogram on the
              full-resolution paired grid.
            </li>
            <li>
              Use a shared 2nd–98th percentile display stretch across both dates:{" "}
              {formatNumber(analysis.processing.stretchDb[0], 2)} to{" "}
              {formatNumber(analysis.processing.stretchDb[1], 2)} dB.
            </li>
            <li>
              Highlight differences below −{analysis.processing.thresholdDb} dB in blue and above +
              {analysis.processing.thresholdDb} dB in orange. This exploratory threshold is not a
              validated water-detection rule.
            </li>
            <li>
              Reproject small browser previews to EPSG:3857. Use bilinear interpolation for
              intensity and nearest-neighbor for categorical change and validity. Use lossless WebP
              for change colors.
            </li>
          </ol>
          <div className="formula">ΔdB = {analysis.processing.formula}</div>
          <p>
            The pipeline separately writes before and after dB rasters, the continuous dB
            difference, a paired-valid mask, summary statistics, input checksums and provenance. The
            original TIFFs and PNGs are preserved. Areas in the machine-readable results are
            computed using equal-area EPSG:6933, not degrees squared; they describe signal
            categories in the analysis rectangle, not water area.
          </p>
          <a href={dataFiles.analysis} className="text-link">
            Inspect the complete computed results <ExternalLink size={13} />
          </a>
        </MethodSection>
        <MethodStory id="water" />
        <MethodSection
          id="references"
          eyebrow="05 / SUPPLEMENTAL INVESTIGATION"
          title="What else is in the catalog?"
        >
          <p>
            A bounded public NASA CMR search used this study’s actual bounds, the interval{" "}
            {discovery.temporalWindow.join(" to ")}, and at most {discovery.maxSamplesPerCollection}{" "}
            returned records per collection. Catalog overlap does not establish full coverage,
            usable quality, matching geometry or permission to stream an asset.
          </p>
          <DataTable
            caption="Catalog search results; metadata only, no supplemental observations used in analysis"
            columns={["Collection", "Catalog hits"]}
          >
            {discovery.results.map((result) => (
              <tr key={result.collection}>
                <th scope="row">
                  <a href={result.queryUrl} target="_blank" rel="noopener noreferrer">
                    {result.collection} ↗
                  </a>
                </th>
                <td>{"hits" in result ? result.hits : "Unavailable"}</td>
              </tr>
            ))}
          </DataTable>
          <p>
            DSWx-HLS optical classifications are potential water references after cloud/shadow
            screening; DSWx-S1 offers a different radar-derived reference, with correlated SAR
            interpretation risks. HLS surface reflectance requires cloud and quality masking plus a
            documented water method. Historical alternatives include NASA MOD44W (annual, 250 m) and
            JRC Global Surface Water (30 m, through 2024). Neither resolves water on the supplied
            observation dates; neither is integrated. JRC published-layer use requires EC JRC/Google
            attribution and the documented citation.
          </p>
          <p>
            JPL’s DSWx product page lists DSWx-NI as under development. We do not infer operational
            availability from a schedule. Additional GCOV candidates must be checked for
            polarization, orbit, processing version and geometry before inclusion. No additional
            dates are presented as a fabricated time series.
          </p>
          <a href={dataFiles.discovery} className="text-link">
            Read discovery queries & candidate product IDs <ExternalLink size={13} />
          </a>
        </MethodSection>
        <MethodSection id="sources" eyebrow="06 / CREDITS" title="Sources you can inspect.">
          <ul className="source-list">
            {scientificSources.map((source) => (
              <li key={source.href}>
                <a href={source.href}>{source.label} ↗</a>
                <span>{source.description}</span>
              </li>
            ))}
          </ul>
          <p>
            Data credit: {radarMission.credit}; distribution documentation: NASA ASF DAAC.{" "}
            {project.name} is an independent hackathon project, not an operational NASA
            flood-warning service. Supplemental data use would require checking each product’s
            citation and attribution terms.
          </p>
        </MethodSection>
        <MethodSection
          id="reference-access"
          eyebrow="REFERENCE ACCESS CHECK"
          title="Near-date candidates, unresolved access."
        >
          <p>
            One DSWx-HLS candidate within ±1 day of each supplied date was probed through GDAL with
            supported local authentication handling. Neither attempt yielded a usable raster, so no
            supplemental pixels entered the analysis.
          </p>
          <ul className="method-list">
            {referenceResults.map((result) => (
              <li key={result.targetDate}>
                {result.targetDate}: {result.status}.{" "}
                {result.sourceUrl && (
                  <a href={result.sourceUrl} className="text-accent">
                    Candidate metadata ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
          <p>
            A further attempt should resolve asset access, mosaic all tiles intersecting the
            rectangle, apply documented cloud/shadow/snow/NoData classes, and assess usable overlap
            before evaluating water classification. A single catalog tile does not cover the entire
            region by assumption.
          </p>
          <a href={dataFiles.referenceProbe} className="text-link">
            Read the bounded access-check results <ExternalLink size={13} />
          </a>
        </MethodSection>
      </div>
    </div>
  );
}

function MethodStory({ id }: { id: string }) {
  const story = methodologyStories.find((item) => item.id === id);
  if (!story) return null;
  return (
    <MethodSection id={story.id} eyebrow={story.eyebrow} title={story.title}>
      {story.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </MethodSection>
  );
}
