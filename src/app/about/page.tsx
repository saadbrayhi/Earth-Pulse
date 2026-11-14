import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MethodologyContent } from "@/components/methodology/methodology-content";
import { ScienceNotice } from "@/components/science-notice";

export const metadata: Metadata = {
  title: "Methodology & Sources | EarthPulse",
  description:
    "Reproducible NISAR processing, source provenance, supplemental data discovery and scientific limitations.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="TRANSPARENCY IS PART OF THE PRODUCT"
        title="Follow the evidence."
        description="The data, the decisions, and the limits behind EarthPulse."
        action={
          <Link href="/explore" className="secondary-button inline-flex gap-2 items-center">
            Inspect the imagery <ArrowRight size={14} />
          </Link>
        }
      />
      <ScienceNotice />
      <MethodologyContent />
    </>
  );
}
