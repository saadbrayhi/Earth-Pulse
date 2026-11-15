/** Shared project identity. Scientific measurements belong in study.ts. */
const wordmark = { primary: "Earth", accent: "Pulse" } as const;

export const project = {
  name: `${wordmark.primary}${wordmark.accent}`,
  wordmark,
  event: "NASA Space Apps 2026",
  challenge: "Dancing with the SARs",
  track: "Water & Wetlands Monitoring",
  tagline: "A PLANET IN PERSPECTIVE",
} as const;

export const radarMission = {
  name: "NISAR",
  displayName: "NASA NISAR",
  credit: "NASA/ISRO NISAR",
} as const;

export const routes = {
  home: { href: "/", title: "Overview", icon: "House" },
  explore: { href: "/explore", title: "Radar explorer", icon: "Globe2" },
  insights: { href: "/insights", title: "Insights", icon: "ChartNoAxesCombined" },
  about: { href: "/about", title: "Methodology", icon: "BookOpen" },
} as const;

export const navigation = Object.values(routes);
