"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, BookOpen, ChartNoAxesCombined, ChevronRight, Globe2, House, MapPin, Orbit, Satellite } from "lucide-react";
import type { ReactNode } from "react";
import { analysis } from "@/lib/analysis";

const navigation = [
  { href: "/", title: "Overview", icon: House },
  { href: "/explore", title: "Radar explorer", icon: Globe2 },
  { href: "/insights", title: "Insights", icon: ChartNoAxesCombined },
  { href: "/about", title: "Methodology", icon: BookOpen },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const current = navigation.find((item) => item.href === pathname);
  return (
    <div className="explore-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="explore-sidebar">
        <Link href="/" className="brand" aria-label="EarthPulse home">
          <span className="brand-mark"><Activity size={23} /></span>
          <span>Earth<span className="text-teal-300">Pulse</span><span className="brand-caption">A PLANET IN PERSPECTIVE</span></span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, title, icon: Icon }) => (
            <Link key={href} className="sidebar-nav-item" href={href} aria-current={pathname === href ? "page" : undefined}>
              <Icon size={18} /><span>{title}</span><ChevronRight size={14} className="ml-auto nav-chevron" />
            </Link>
          ))}
        </nav>
        <div className="sidebar-study">
          <span className="eyebrow">CURRENT STUDY</span>
          <div className="mt-4 flex items-start gap-2.5"><MapPin size={17} className="mt-0.5 shrink-0 text-teal-300" /><div><p className="text-sm font-medium text-slate-200">{analysis.location}</p><p className="mt-2 text-xs leading-5 text-slate-400">Water & wetland environments</p></div></div>
          <span className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> Two local observations</span>
        </div>
        <div className="mt-auto px-5 pb-6 pt-12"><Orbit size={22} className="mb-3 text-slate-500" /><p className="text-xs text-slate-400">NASA Space Apps 2026</p><p className="mt-2 text-[11px] text-slate-500">Dancing with the SARs</p></div>
      </aside>
      <div className="explore-main">
        <header className="explore-header"><div className="flex items-center gap-2 text-xs text-slate-400"><Globe2 size={15} /><span>EarthPulse</span><ChevronRight size={12} /><span className="text-slate-200">{current?.title ?? "Workspace"}</span></div><span className="source-badge"><Satellite size={13} /> NASA NISAR</span></header>
        <main id="main-content" className="explore-content">
          {children}
          <footer className="page-footer"><Link href="/" className="flex items-center gap-2"><Activity size={13} /> EarthPulse</Link><span>NASA Space Apps 2026 · {analysis.location}</span><Link href="/about" className="flex items-center gap-1">Sources & limitations <ArrowUpRight size={12} /></Link></footer>
        </main>
      </div>
    </div>
  );
}
