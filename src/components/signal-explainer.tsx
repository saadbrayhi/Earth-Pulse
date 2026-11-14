"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { analysis, changeThresholdDb } from "@/lib/analysis";
import { formatNumber, signedDb } from "@/lib/format";
import { SegmentedControl } from "./ui/segmented-control";

type Topic = "change" | "flooding" | "radar";
const topics: { value: Topic; label: string }[] = [
  { value: "change", label: "What changed?" },
  { value: "flooding", label: "Does this mean flooding?" },
  { value: "radar", label: "Why is radar useful?" },
];
const increased = analysis.categories.find((item) => item.key === "increased");
const increasedSummary = increased
  ? `${formatNumber(increased.percentValid, 2)}% exceed the exploratory +${changeThresholdDb} dB threshold. `
  : "";
const explanations: Record<Topic, string> = {
  change: `Across ${formatNumber(analysis.quality.pairedValidPixels)} valid paired pixels, the mean backscatter difference is ${signedDb(analysis.delta.meanDb)}. ${increasedSummary}This describes radar signal change across the rectangular study region; it does not measure water extent.`,
  flooding:
    "No. Smooth open water can return a weak signal, but wind, vegetation, soil moisture and acquisition geometry also affect HH backscatter. Flooded vegetation can even produce a stronger return. Neither color uniquely identifies water. Independent co-temporal references and quality masks are needed before estimating water expansion or recession.",
  radar:
    "Radar illuminates the surface with microwave pulses, so it can observe without sunlight and through clouds. It measures a different property from an optical photograph: the strength of the returned signal. Comparing that signal can reveal surface changes to investigate, even when optical views are cloudy.",
};

export function SignalExplainer() {
  const [topic, setTopic] = useState<Topic>("change");
  return (
    <section className="panel explainer">
      <div className="flex items-center gap-2">
        <Sparkles size={17} className="text-accent" />
        <h2 className="section-title">Make sense of the signal</h2>
      </div>
      <p className="mt-2 text-xs text-muted">
        Explore what the observed signal can tell us, and where uncertainty remains.
      </p>
      <SegmentedControl
        label="Explanation topic"
        options={topics}
        value={topic}
        onChange={setTopic}
        className="explanation-topics"
      />
      <p className="explanation-answer" aria-live="polite">
        {explanations[topic]}
      </p>
    </section>
  );
}
