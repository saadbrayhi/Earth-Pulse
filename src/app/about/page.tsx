import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MethodologyContent } from "@/components/methodology/methodology-content";
import { ScienceNotice } from "@/components/science-notice";
import { pages } from "@/content/pages";
import { routes } from "@/data/project";

export const metadata: Metadata = pages.about.metadata;

export default function AboutPage() {
  return (
    <>
      <PageHeader
        {...pages.about.header}
        action={
          <Link
            href={routes.explore.href}
            className="secondary-button inline-flex gap-2 items-center"
          >
            Inspect the imagery <ArrowRight size={14} />
          </Link>
        }
      />
      <ScienceNotice />
      <MethodologyContent />
    </>
  );
}
