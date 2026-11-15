"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartNoAxesCombined, ChevronRight, Globe2, House } from "lucide-react";
import { navigation, project, routes } from "@/data/project";

const icons = { House, Globe2, ChartNoAxesCombined, BookOpen };

export function SiteNavigation() {
  const pathname = usePathname();
  return (
    <nav className="site-navigation" aria-label="Main navigation">
      {navigation.map(({ href, title, icon }) => {
        const Icon = icons[icon];
        return (
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
        );
      })}
    </nav>
  );
}

export function RouteBreadcrumb() {
  const pathname = usePathname();
  const title = navigation.find((item) => item.href === pathname)?.title ?? "Workspace";
  return (
    <div className="route-breadcrumb">
      <Globe2 size={15} />
      <Link href={routes.home.href}>{project.name}</Link>
      <ChevronRight size={12} />
      <span className="text-heading" aria-current="page">
        {title}
      </span>
    </div>
  );
}
