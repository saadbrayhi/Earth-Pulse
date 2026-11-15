import Link from "next/link";
import { Activity, ArrowUpRight, MapPin, Orbit, Satellite } from "lucide-react";
import type { ReactNode } from "react";
import { analysis } from "@/data/study";
import { project, radarMission, routes } from "@/data/project";

import { RouteBreadcrumb, SiteNavigation } from "./layout/site-navigation";
import { ThemeSwitcher } from "./ui/theme-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="explore-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="explore-sidebar">
        <Link href={routes.home.href} className="brand" aria-label={`${project.name} home`}>
          <span className="brand-mark">
            <Activity size={23} />
          </span>
          <span>
            {project.wordmark.primary}
            <span className="text-accent">{project.wordmark.accent}</span>
            <span className="brand-caption">{project.tagline}</span>
          </span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <SiteNavigation />
        <div className="sidebar-study">
          <span className="eyebrow">CURRENT STUDY</span>
          <div className="mt-4 flex items-start gap-2.5">
            <MapPin size={17} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium text-heading">{analysis.location}</p>
              <p className="mt-2 text-xs leading-5 text-muted">Water & wetland environments</p>
            </div>
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Two local observations
          </span>
        </div>
        <div className="sidebar-footer mt-auto px-5 pb-6 pt-12">
          <Orbit size={22} className="mb-3 text-muted" />
          <p className="text-xs text-muted">{project.event}</p>
          <p className="mt-2 text-[11px] text-muted">{project.challenge}</p>
        </div>
      </aside>
      <div className="explore-main">
        <header className="explore-header">
          <RouteBreadcrumb />
          <div className="header-actions">
            <ThemeSwitcher />
            <span className="source-badge">
              <Satellite size={13} /> {radarMission.displayName}
            </span>
          </div>
        </header>
        <main id="main-content" className="explore-content" tabIndex={-1}>
          {children}
          <footer className="page-footer">
            <Link href={routes.home.href} className="flex items-center gap-2">
              <Activity size={13} /> {project.name}
            </Link>
            <span>
              {project.event} · {analysis.location}
            </span>
            <Link href={routes.about.href} className="flex items-center gap-1">
              Sources & limitations <ArrowUpRight size={12} />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
