import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Droplets, Layers3, Satellite, Waves } from "lucide-react";
import { analysis, formatNumber } from "@/lib/analysis";
import { MetricCard } from "@/components/metric-card";
import { ScienceNotice } from "@/components/science-notice";

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow text-teal-300!">WATER & WETLANDS · EARTH OBSERVATION</p>
          <h1>Every wetland<br />has a <span>pulse.</span></h1>
          <p className="hero-description">See a changing landscape through radar. EarthPulse brings NASA NISAR observations of Tanguar Haor into focus, with real data and room for uncertainty.</p>
          <div className="hero-actions"><Link className="primary-button" href="/explore">Explore the landscape <ArrowRight size={17} /></Link><Link className="text-link" href="/about"><BookOpen size={15} /> How it works</Link></div>
          <div className="hero-caption"><span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> Tanguar Haor, Bangladesh · October 2026</div>
        </div>
        <Link href="/explore" className="hero-observation" aria-label="Explore actual NISAR backscatter imagery">
          <Image src={analysis.assets.after.url} alt="Actual October 30 NISAR HH radar observation of the Tanguar Haor analysis region" fill priority unoptimized sizes="(max-width: 1023px) 100vw, 50vw" className="hero-radar-image" />
          <div className="hero-image-top"><span><Satellite size={14} /> NISAR / GCOV / HH</span><span>30 OCT 2026</span></div>
          <div className="hero-image-bottom"><p className="eyebrow text-teal-200!">AN OBSERVATION, NOT AN ILLUSTRATION</p><p>The texture of a living landscape.</p><span>Open the radar explorer <ArrowRight size={15} /></span></div>
        </Link>
      </section>
      <div className="metrics-grid home-metrics">
        <MetricCard label="OBSERVATION PAIR" value="06 → 30 Oct" detail="Two supplied observations, 2026" />
        <MetricCard label="VALID PAIRED PIXELS" value={formatNumber(analysis.quality.pairedValidPixels)} detail="Full-resolution, positive finite measurements" />
        <MetricCard label="PAIRED COVERAGE" value={`${formatNumber(analysis.quality.pairedValidPercent, 3)}%`} detail="Valid samples within the rectangular analysis grid" />
      </div>
      <section className="story-section">
        <div className="section-heading"><p className="eyebrow">FROM SIGNAL TO UNDERSTANDING</p><h2>A different way to see water landscapes.</h2><p>Wetlands support habitats, store water and sustain livelihoods. Understanding their changing surface conditions begins with observations we can inspect and explain.</p></div>
        <div className="story-grid">
          <article className="panel story-card"><Waves /><span className="eyebrow">01 / THE PLACE</span><h3>A seasonal wetland mosaic</h3><p>Tanguar Haor is a Ramsar-listed wetland in northeastern Bangladesh. Its mix of water, vegetation and surrounding land makes it a useful case study for interpreting a complex radar signal.</p><a className="text-link" href="https://rsis.ramsar.org/RISapp/files/RISrep/BD1031RIS.pdf" target="_blank" rel="noopener noreferrer">Ramsar site information ↗</a></article>
          <article className="panel story-card"><Satellite /><span className="eyebrow">02 / THE SENSOR</span><h3>Observe beyond the clouds</h3><p>NISAR is the NASA–ISRO Synthetic Aperture Radar mission. Radar uses its own signal to observe surfaces day or night, without needing clear optical skies.</p><a className="text-link" href="https://nisar-docs.asf.alaska.edu/amplitude/" target="_blank" rel="noopener noreferrer">Read the NISAR guide ↗</a></article>
          <article className="panel story-card"><Layers3 /><span className="eyebrow">03 / THE EVIDENCE</span><h3>Compare, then question</h3><p>Swipe between two HH observations, inspect backscatter differences in decibels, and see exactly which pixels contribute to the summary. A changing signal is the starting point for investigation.</p><Link className="text-link" href="/insights">Inspect the measured changes <ArrowRight size={14} /></Link></article>
        </div>
      </section>
      <ScienceNotice />
      <section className="home-cta"><Droplets size={28} /><div><h2>Start with what the satellite observed.</h2><p>Then explore what the signal can — and cannot — tell us.</p></div><Link href="/explore" className="primary-button">Open explorer <ArrowRight size={16} /></Link></section>
    </>
  );
}
