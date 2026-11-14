"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { analysis, formatNumber, signedDb } from "@/lib/analysis";

const topics = ["What changed?", "Does this mean flooding?", "Why is radar useful?"];

export function SignalExplainer() {
  const [topic, setTopic] = useState(0);
  const increased = analysis.categories.find((item) => item.key === "increased")!;
  const explanations = [
    `Across ${formatNumber(analysis.quality.pairedValidPixels)} valid paired pixels, the mean backscatter difference is ${signedDb(analysis.delta.meanDb)}. ${formatNumber(increased.percentValid, 2)}% exceed the exploratory +3 dB threshold. This describes radar signal change across the rectangular study region; it does not measure water extent.`,
    "No. Smooth open water can return a weak signal, but wind, vegetation, soil moisture and acquisition geometry also affect HH backscatter. Flooded vegetation can even produce a stronger return. Neither color uniquely identifies water. Independent co-temporal references and quality masks are needed before estimating water expansion or recession.",
    "Radar illuminates the surface with microwave pulses, so it can observe without sunlight and through clouds. It measures a different property from an optical photograph: the strength of the returned signal. Comparing that signal can reveal surface changes to investigate, even when optical views are cloudy.",
  ];
  return <section className="panel explainer">
    <div className="flex items-center gap-2"><Sparkles size={17} className="text-teal-300" /><h2 className="section-title">Make sense of the signal</h2></div>
    <p className="mt-2 text-xs text-slate-400">Deterministic explanations grounded in this dataset. No external AI service.</p>
    <div className="explanation-topics" role="group" aria-label="Explanation topic">{topics.map((text, index) => <button key={text} onClick={() => setTopic(index)} aria-pressed={index === topic}>{text}</button>)}</div>
    <p className="explanation-answer" aria-live="polite">{explanations[topic]}</p>
  </section>;
}
