import { analysis } from "@/lib/analysis";
import { formatNumber } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function DataQuality() {
  return (
    <section className="quality-grid">
      <article className="panel p-6">
        <CheckCircle2 size={20} className="text-teal-300" />
        <h2 className="section-title mt-4">What we checked</h2>
        <ul className="method-list">
          <li>Matching CRS, dimensions and affine transforms</li>
          <li>Finite, positive power and raster NoData masks</li>
          <li>Full-grid statistics; no compressed-preview measurements</li>
          <li>Histogram and category counts sum to the valid population</li>
          <li>
            {formatNumber(analysis.quality.invalidPairedPixels)} pixels excluded from the paired
            comparison
          </li>
        </ul>
      </article>
      <article className="panel p-6">
        <h2 className="section-title">What remains uncertain</h2>
        <p className="section-description">
          {analysis.quality.orbitComparability}. The native NISAR quality mask is not included. A
          common grid supports pixel comparison, but does not establish identical acquisition
          conditions.
        </p>
        <p className="section-description">
          Independent water validation has not been performed. Water area, flood extent and
          classification accuracy are therefore not reported.
        </p>
        <Link href="/about" className="text-link mt-5">
          Read the full methodology <ArrowRight size={14} />
        </Link>
      </article>
    </section>
  );
}
