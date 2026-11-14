"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, ChevronRight, Globe2, House } from "lucide-react";

const navigation = [
  { href: "/", title: "Overview", icon: House },
  { href: "/explore", title: "Radar explorer", icon: Globe2 },
  { href: "/insights", title: "Insights", icon: ChartNoAxesCombined },
  { href: "/about", title: "Methodology", icon: BookOpen },
];

export function SiteNavigation() {
  const pathname = usePathname();
  return (
    <nav className="site-navigation" aria-label="Main navigation">
      {navigation.map(({ href, title, icon: Icon }) => (
        <Link
          key={href}
          className="sidebar-nav-item"
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon size={18} />
          <span>{title}</span>
          <ChevronRight size={14} className="ml-auto nav-chevron" />
        </Link>
      ))}
    </nav>
  );
}

export function RouteBreadcrumb() {
  const pathname = usePathname();
  const title = navigation.find((item) => item.href === pathname)?.title ?? "Workspace";
  return (
    <div className="route-breadcrumb">
      <Globe2 size={15} />
      <Link href="/">EarthPulse</Link>
      <ChevronRight size={12} />
      <span className="text-heading" aria-current="page">
        {title}
      </span>
    </div>
  );
}
