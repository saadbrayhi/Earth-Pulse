import { analysis, changeCategories, changeThresholdDb } from "@/data/study";
import { formatNumber, signedDb } from "@/lib/format";

export const scienceNotice = {
  title: "Radar backscatter change is NOT validated flood extent.",
  description:
    "Water, vegetation, roughness, moisture and acquisition conditions can affect the signal. Blue and orange indicate backscatter direction, not water expansion or recession. No water classification is validated here.",
};

export const changeLegend = {
  transparentLabel: "Transparent · not highlighted",
  transparentDescription:
    "Transparent pixels include changes within the threshold and pixels without valid paired observations.",
};

export type ExplanationTopic = "change" | "flooding" | "radar";
export const explanationTopics: { value: ExplanationTopic; label: string }[] = [
  { value: "change", label: "What changed?" },
  { value: "flooding", label: "Does this mean flooding?" },
  { value: "radar", label: "Why is radar useful?" },
];

const increased = changeCategories.find((item) => item.key === "increased");
const increasedSummary = increased
  ? `${formatNumber(increased.percentValid, 2)}% exceed the exploratory +${changeThresholdDb} dB threshold. `
  : "";

export const signalExplanations: Record<ExplanationTopic, string> = {
  change: `Across ${formatNumber(analysis.quality.pairedValidPixels)} valid paired pixels, the mean backscatter difference is ${signedDb(analysis.delta.meanDb)}. ${increasedSummary}This describes radar signal change across the rectangular study region; it does not measure water extent.`,
  flooding:
    "No. Smooth open water can return a weak signal, but wind, vegetation, soil moisture and acquisition geometry also affect HH backscatter. Flooded vegetation can even produce a stronger return. Neither color uniquely identifies water. Independent co-temporal references and quality masks are needed before estimating water expansion or recession.",
  radar:
    "Radar illuminates the surface with microwave pulses, so it can observe without sunlight and through clouds. It measures a different property from an optical photograph: the strength of the returned signal. Comparing that signal can reveal surface changes to investigate, even when optical views are cloudy.",
};
