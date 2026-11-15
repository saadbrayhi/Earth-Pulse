import Link from "next/link";
import { ArrowRight, Droplets } from "lucide-react";
import { analysis, observationWindow } from "@/data/study";
import { routes } from "@/data/project";
import { formatNumber } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { ScienceNotice } from "@/components/science-notice";
import { HomeHero } from "@/components/home/home-hero";
import { ProjectStory } from "@/components/home/project-story";

export default function Home() {
  return (
    <>
      <HomeHero />
      <div className="metrics-grid">
        <MetricCard
          label="OBSERVATIONS"
          value={String(analysis.sources.length)}
          detail={observationWindow}
        />
        <MetricCard
          label="VALID PAIRED PIXELS"
          value={formatNumber(analysis.quality.pairedValidPixels)}
          detail="Full-resolution, positive finite measurements"
        />
        <MetricCard
          label="PAIRED COVERAGE"
          value={`${formatNumber(analysis.quality.pairedValidPercent, 3)}%`}
          detail="Valid samples within the rectangular analysis grid"
        />
      </div>
      <ProjectStory />
      <ScienceNotice />
      <section className="home-cta">
        <Droplets size={28} />
        <div>
          <h2>Start with what the satellite observed.</h2>
          <p>Then explore what the signal can — and cannot — tell us.</p>
        </div>
        <Link href={routes.explore.href} className="primary-button">
          Open explorer <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
