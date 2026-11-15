"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { explanationTopics, signalExplanations, type ExplanationTopic } from "@/content/science";
import { SegmentedControl } from "./ui/segmented-control";

export function SignalExplainer() {
  const [topic, setTopic] = useState<ExplanationTopic>("change");
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
        options={explanationTopics}
        value={topic}
        onChange={setTopic}
        className="explanation-topics"
      />
      <p className="explanation-answer" aria-live="polite">
        {signalExplanations[topic]}
      </p>
    </section>
  );
}
