import report from "../../public/data/seasonal.json";
import discovery from "../../public/data/seasonal-discovery.json";
import access from "../../public/data/seasonal-access.json";
import categoryReport from "../../public/data/radar-categories.json";
import { parseSeasonalReport } from "@/lib/seasonal-report";
import type { MapAsset, SeasonalView } from "@/lib/observation-types";
import { changeCategories, analysis } from "./study";

export const seasonal = parseSeasonalReport(report);
export const seasonalProduct = {
  name: "NASA OPERA / DSWx-HLS",
  attribution: "NASA OPERA / DSWx-HLS · not NISAR",
  window:
    seasonal.status === "classified"
      ? seasonal.observations.map((o) => `${o.season}: ${o.date}`).join(" → ")
      : "No seasonal observation pair integrated",
};
export const seasonalDiscovery = discovery;
export const seasonalAccess = access;
export const radarCategories = categoryReport.categories.map((item) => ({
  ...item,
  label: changeCategories.find((c) => c.key === item.key)?.label ?? "Invalid paired pixels",
  asset: item.asset as MapAsset,
  percentValid: changeCategories.find((c) => c.key === item.key)?.percentValid ?? null,
}));
export type RadarCategory = (typeof radarCategories)[number]["key"];
export const seasonalViewOptions: { value: SeasonalView; label: string }[] = [
  { value: "wet", label: "Wet Season" },
  { value: "dry", label: "Dry Season" },
  { value: "compare", label: "Compare" },
  { value: "change", label: "Seasonal Change" },
];
export const seasonalContext: Record<SeasonalView, string> = {
  wet: "Monsoon inundation connects aquatic habitats and supports fisheries. Normal seasonal water is not automatically a damaging flood.",
  dry: "As water recedes, exposed land supports cultivation, including Boro rice. Early inundation before harvest can threaten livelihoods.",
  compare:
    "Compare the selected dates over the same region. A dry/wet pair describes their difference, not a complete annual cycle.",
  change:
    "Wet-only, dry-only and water on both dates are classification transitions. They do not establish a flood event or permanent water.",
};
export const radarComparisonWarning = analysis.quality.orbitComparability;
