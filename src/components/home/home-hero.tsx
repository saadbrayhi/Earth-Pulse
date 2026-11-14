import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Satellite } from "lucide-react";
import { analysis } from "@/lib/analysis";
import { formatObservationDate } from "@/lib/format";

export function HomeHero() {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow text-teal-300!">WATER & WETLANDS · EARTH OBSERVATION</p>
        <h1>
          Every wetland
          <br />
          has a <span>pulse.</span>
        </h1>
        <p className="hero-description">
          See a changing landscape through radar. EarthPulse brings NASA NISAR observations of
          Tanguar Haor into focus, with real data and room for uncertainty.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" href="/explore">
            Explore the landscape <ArrowRight size={17} />
          </Link>
          <Link className="text-link" href="/about">
            <BookOpen size={15} /> How it works
          </Link>
        </div>
        <div className="hero-caption">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> {analysis.location} ·{" "}
          {analysis.beforeDate} → {analysis.afterDate}
        </div>
      </div>
      <Link
        href="/explore"
        className="hero-observation"
        aria-label="Explore actual NISAR backscatter imagery"
      >
        <Image
          src={analysis.assets.after.url}
          alt={`Actual ${analysis.afterDate} NISAR HH radar observation of ${analysis.location}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="hero-radar-image"
        />
        <div className="hero-image-top">
          <span>
            <Satellite size={14} /> NISAR / GCOV / HH
          </span>
          <time dateTime={analysis.afterDate}>
            {formatObservationDate(analysis.afterDate).toUpperCase()}
          </time>
        </div>
        <div className="hero-image-bottom">
          <p className="eyebrow text-teal-200!">AN OBSERVATION, NOT AN ILLUSTRATION</p>
          <p className="hero-image-title">The texture of a living landscape.</p>
          <span>
            Open the radar explorer <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </section>
  );
}
