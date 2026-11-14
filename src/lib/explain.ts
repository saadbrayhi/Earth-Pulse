// Plain-language "Why did it change?" text, built by fixed rules from metadata.json.
// Every number comes from real NISAR measurements; the wording only interprets them.
// No AI model writes or invents values here.

import type { StudyMetadata } from "./types";

export const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const km2 = (v: number, digits = 0) =>
  `${v.toLocaleString("en-US", { maximumFractionDigits: digits })} km²`;
export const db = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`;

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** A football (soccer) pitch of 105 m x 68 m, to make areas easier to imagine. */
const FOOTBALL_FIELD_KM2 = 0.105 * 0.068;
export function footballFields(areaKm2: number) {
  const n = Math.abs(areaKm2) / FOOTBALL_FIELD_KM2;
  const rounded = n >= 1000 ? Math.round(n / 100) * 100 : Math.round(n / 10) * 10;
  return rounded.toLocaleString("en-US");
}

export type Confidence = {
  level: "Low" | "Moderate" | "High";
  label: string;
  reasons: { good: boolean; text: string }[];
};

export type Explanation = {
  headline: string;
  summary: string;
  observation: string[];
  drivers: string[];
  alternatives: string[];
  relevance: string[];
  confidence: Confidence;
};

export function explain(m: StudyMetadata): Explanation {
  const s = m.stats;
  const before = fmtDate(m.before.date);
  const after = fmtDate(m.after.date);
  const days = daysBetween(m.before.date, m.after.date);
  const net = s.netChangeKm2;
  const netPct = Math.abs((100 * net) / s.waterLikeBefore.km2);
  const shrinking = net < 0;
  const little = Math.abs(net) < 0.02 * Math.max(s.waterLikeBefore.km2, 0.01) || Math.abs(net) < 0.05;
  const sig = s.recededSignature;
  const hasReceded = sig.hhAfterDb != null && sig.hhBeforeDb != null && s.receded.km2 > 0.05;
  const hhRise = hasReceded ? (sig.hhAfterDb ?? 0) - (sig.hhBeforeDb ?? 0) : 0;
  const hvRise = hasReceded ? (sig.hvAfterDb ?? 0) - (sig.hvBeforeDb ?? 0) : 0;
  // Seasonal (monsoon) wording only for the Tanguar Haor example, where that context is documented.
  // For any other place the text stays neutral, because we don't know the local situation.
  const isHaor = m.id === "tanguar-haor";
  const noWater = s.waterLikeBefore.km2 < 0.05 && s.waterLikeAfter.km2 < 0.05;

  const headline = noWater
    ? "The radar sees almost no open water here on either date"
    : little
      ? "The water area stayed about the same"
      : isHaor
        ? shrinking
          ? "Most likely, the wetland is drying out after the rainy season"
          : "The water area grew, which is unusual at this time of year"
        : shrinking
          ? "The water area got smaller"
          : "The water area got bigger";

  const summary = `In ${days} days, the water area ${shrinking ? "shrank" : "grew"} by about ${km2(Math.abs(net), Math.abs(net) < 10 ? 1 : 0)} (${netPct.toFixed(0)}%), about ${footballFields(net)} football fields.`;

  const observation = [
    `On ${before}, water covered about ${km2(s.waterLikeBefore.km2, 1)} of the area (${Math.round(s.waterLikeBefore.percent)}%). On ${after}, it covered about ${km2(s.waterLikeAfter.km2, 1)} (${Math.round(s.waterLikeAfter.percent)}%).`,
    `About ${km2(s.receded.km2, 1)} that was water on ${before} was no longer water on ${after}, and ${km2(s.new.km2, 1)} became new water.`,
  ];

  const seasonal = isHaor
    ? shrinking
      ? `The rainy season (monsoon) ends around October. Every year after that, water slowly drains out of the haor into the rivers. What we see fits that yearly pattern.`
      : `Water growing this late in the year is unusual. Heavy rain shortly before the second picture could explain it and should be checked.`
    : shrinking
      ? `Water often shrinks when the rains stop, rivers fall, fields are drained or water is used for irrigation. Local rainfall and river records can tell which one happened here.`
      : `Water often grows after heavy rain, river floods, high tides or when fields are flooded for crops. Local rainfall and river records can tell which one happened here.`;
  const drivers = [
    seasonal,
    ...(hasReceded
      ? [
          hhRise > 1.5
            ? `Where the water left, the radar picture got brighter. That means the surface became rougher, like wet mud or young plants instead of a flat water surface.`
            : `Where the water left, the radar picture barely changed, so the ground is probably still very wet and smooth.`,
          hvRise < 3
            ? `Plants make one of the radar's channels much brighter. Here it changed only a little, so most of the uncovered land is probably still bare, not yet green.`
            : `One of the radar's channels that reacts to plants got clearly brighter, so plants are probably already growing on the uncovered land.`,
        ]
      : []),
  ];

  const c = m.comparability;
  const alternatives = [
    `Wind: waves make water look brighter to the radar, so windy water can look like land.`,
    `Rain: wet soil and dry soil look different to the radar, even when there is no open water.`,
    ...(c.sameBandwidth
      ? []
      : [`Camera settings: the two pictures were taken in different sharpness modes. We adjusted for this, but small differences remain.`]),
    `Hidden water: water under tall plants can look bright, so some water may be missed.`,
  ];

  const relevance = isHaor
    ? [
        `Farmers: when the water leaves, farmers plant rice on the land. Knowing when the water goes helps them plan.`,
        `Nature: as the water shrinks, fish and migrating birds crowd into the remaining deep pools, which matters for protecting the wetland.`,
        `Clouds don't stop radar: in the rainy season normal satellite photos are blocked by clouds, but radar still sees the ground.`,
      ]
    : [
        `Farmers and families can check whether their fields, roads or homes were under water on each date.`,
        `Local officials and aid groups can see where water spread or drained, to plan help and repairs.`,
        `Clouds don't stop radar: during storms and rainy seasons, when normal satellite photos are blocked, radar still sees the ground.`,
      ];

  const qaOk =
    m.before.qa.failed.every((c) => c.includes("identification")) &&
    m.after.qa.failed.every((c) => c.includes("identification"));
  const validated = !m.before.collection.includes("PROVISIONAL") && !m.after.collection.includes("PROVISIONAL");
  const reasons = [
    {
      good: c.sameGeometry,
      text: c.sameGeometry
        ? "Both pictures were taken from exactly the same position in orbit"
        : "The two pictures were taken from different positions",
    },
    {
      good: c.sameMaturity && validated,
      text:
        c.sameMaturity && validated
          ? "Both pictures are official, fully checked (validated) NASA data"
          : "The two pictures are not both fully checked (validated) data",
    },
    {
      good: c.sameBandwidth,
      text: c.sameBandwidth ? `Both pictures have the same sharpness (${m.before.nativePixelM} m detail)` : "The two pictures have different sharpness",
    },
    { good: qaOk, text: qaOk ? "The satellite's own quality checks passed" : "Some of the satellite's quality checks failed" },
    { good: false, text: "We only have two dates, and nobody measured the water on the ground" },
  ];
  // The missing ground truth always caps us below "High": data quality alone can't prove it is water.
  const goods = reasons.filter((r) => r.good).length;
  const level = goods >= 5 ? "High" : goods >= 2 ? "Moderate" : "Low";
  const label = { High: "Very sure", Moderate: "Fairly sure", Low: "Not very sure" }[level];

  return { headline, summary, observation, drivers, alternatives, relevance, confidence: { level, label, reasons } };
}
