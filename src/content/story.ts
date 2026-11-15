import { seasonal } from "@/data/seasons";
import { analysis } from "@/data/study";

export const storyChapters = [
  {
    id: "place",
    title: "The Place",
    target: "study-overview",
    text: `${analysis.location} is a landscape shaped by water. Seasonal inundation sustains aquatic habitats and livelihoods; early flooding can threaten the harvest. The dashed outline is our analysis rectangle, not the official wetland boundary.`,
  },
  {
    id: "seasons",
    title: "Two Seasons",
    target: "seasonal-dynamics",
    text:
      seasonal.status === "classified"
        ? "Compare the selected dry and wet observations. Their dates, classification policy and common valid area are visible. Water on both dates does not establish permanent water."
        : "The wet/dry catalog search found candidates, but classified rasters are not integrated. Seasonal Dynamics explains this gap openly; it does not substitute the October radar pair for seasonal water maps.",
  },
  {
    id: "detective",
    title: "Detecting Change",
    target: "change-detective",
    text: "Inspect available dates and try the radar matrix. Its clickable categories highlight the original exploratory backscatter differences. Catalog-only observations cannot generate a comparison. Blue and orange do not uniquely identify water.",
  },
  {
    id: "impact",
    title: "Human Impact",
    target: "why-changes-matter",
    text: "Published 2017 research and dated 2026 reports show why timing matters for Boro rice and fisheries. These historical losses were not measured by our October satellite scenes, and are not assigned to individual pixels.",
  },
  {
    id: "future",
    title: "The Future",
    target: "monitoring-roadmap",
    text: "The roadmap links documented observations, water classification, independent validation and unusual-condition detection to human-reviewed warnings and agricultural decisions. EarthPulse currently explores measurements; it is not a deployed warning system.",
  },
] as const;
export const monitoringRoadmap = [
  "Satellite observations",
  "Water classification",
  "Independent validation",
  "Unusual-condition detection",
  "Human-reviewed warnings",
  "Agricultural decision support",
];
