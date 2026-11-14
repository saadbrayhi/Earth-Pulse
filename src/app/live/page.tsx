import type { Metadata } from "next";
import LiveTool from "@/components/LiveTool";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "EarthPulse · Check any place",
  description: "Choose a small area and two dates; EarthPulse reads NISAR radar data and shows where water appeared or disappeared.",
};

export default function LivePage() {
  return (
    <>
      <SiteHeader active="live" />
      <main>
        <LiveTool />
      </main>
    </>
  );
}
