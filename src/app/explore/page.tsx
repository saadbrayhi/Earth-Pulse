import type { Metadata } from "next";
import ExploreDashboard from "@/components/explore/explore-dashboard";
import { pages } from "@/content/pages";

export const metadata: Metadata = pages.explore.metadata;

export default function ExplorePage() {
  return <ExploreDashboard />;
}
