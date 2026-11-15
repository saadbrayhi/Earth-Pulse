import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Satellite } from "lucide-react";
import { analysis, observationWindow, radarProduct } from "@/data/study";
import { radarMission, routes } from "@/data/project";
import { homeHero } from "@/content/home";
import { formatObservationDate } from "@/lib/format";

export function HomeHero() {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow text-accent!">WATER & WETLANDS · EARTH OBSERVATION</p>
        <h1>
          Every wetland
          <br />
          has a <span>pulse.</span>
        </h1>
        <p className="hero-description">{homeHero.description}</p>
        <div className="hero-actions">
          <Link className="primary-button" href={routes.explore.href}>
            Explore the landscape <ArrowRight size={17} />
          </Link>
          <Link className="text-link" href={routes.about.href}>
            <BookOpen size={15} /> How it works
          </Link>
        </div>
        <div className="hero-caption">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {analysis.location} ·{" "}
          {observationWindow}
        </div>
      </div>
      <Link
        href={routes.explore.href}
        className="hero-observation"
        aria-label={`Explore actual ${radarMission.name} backscatter imagery`}
      >
        <Image
          src={analysis.assets.after.url}
          alt={`Actual ${analysis.afterDate} ${radarMission.name} ${analysis.polarization} radar observation of ${analysis.location}`}
          fill
          priority
          unoptimized
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="hero-radar-image"
        />
        <div className="hero-image-top">
          <span>
            <Satellite size={14} /> {radarProduct.imageLabel}
          </span>
          <time dateTime={analysis.afterDate}>
            {formatObservationDate(analysis.afterDate).toUpperCase()}
          </time>
        </div>
        <div className="hero-image-bottom">
          <p className="eyebrow text-image-accent!">AN OBSERVATION, NOT AN ILLUSTRATION</p>
          <p className="hero-image-title">The texture of a living landscape.</p>
          <span>
            Open the radar explorer <ArrowRight size={15} />
          </span>
        </div>
      </Link>
    </section>
  );
}
