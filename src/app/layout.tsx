import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "./explore/explore.css";
import "./site.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "EarthPulse | Wetlands in perspective",
  description: "Explore real NASA NISAR radar observations of Tanguar Haor. Transparent analysis, visible change, honest uncertainty.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col"><AppShell>{children}</AppShell></body>
    </html>
  );
}
