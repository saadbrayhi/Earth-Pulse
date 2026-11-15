import type { Metadata } from "next";
import "./globals.css";
import "@/styles/theme.css";
import "@/styles/theme-switcher.css";
import "leaflet/dist/leaflet.css";
import "@/styles/shell.css";
import "@/styles/explorer.css";
import "@/styles/pages.css";
import { AppShell } from "@/components/app-shell";
import { defaultTheme, themeBootstrapScript } from "@/lib/themes";
import { siteMetadata } from "@/content/pages";

export const metadata: Metadata = siteMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={defaultTheme}
      suppressHydrationWarning
    >
      <head>
        <script
          id="earthpulse-theme-init"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
