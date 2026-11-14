import type { Metadata } from "next";
import ExploreDashboard from "@/components/explore/explore-dashboard";

export const metadata: Metadata = {
  title: "Radar Explorer | EarthPulse",
  description: "Compare NASA NISAR HH radar backscatter observations over Tanguar Haor, Bangladesh. Radar change is not validated flood extent.",
};

export default function ExplorePage() {
  return <ExploreDashboard />;
}
