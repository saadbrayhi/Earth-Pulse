"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { storyChapters } from "@/content/story";

export function GuidedStory({ onChapter }: { onChapter: (index: number) => void }) {
  const [step, setStep] = useState<number | null>(null);
  function select(index: number) {
    setStep(index);
    onChapter(index);
  }
  if (step === null)
    return (
      <div className="story-launch panel">
        <div>
          <p className="eyebrow">A 2–3 MINUTE GUIDED DEMO</p>
          <p className="mt-2 text-sm text-muted">
            The place, the seasons, the evidence and the people.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={() => select(0)}>
          <Play size={15} />
          Explore the story
        </button>
      </div>
    );
  const chapter = storyChapters[step];
  return (
    <section className="guided-story panel" aria-labelledby="story-title">
      <div className="story-step-heading">
        <p className="eyebrow">
          EXPLORE THE STORY · CHAPTER {step + 1} / {storyChapters.length}
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setStep(null)}
          aria-label="Close story"
        >
          <X size={15} />
        </button>
      </div>
      <div className="story-chapters" role="group" aria-label="Story chapters">
        {storyChapters.map((item, index) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={step === index}
            onClick={() => select(index)}
          >
            {index + 1}. {item.title}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        <h2 id="story-title" className="section-title">
          {chapter.title}
        </h2>
        <p className="section-description">{chapter.text}</p>
      </div>
      <div className="story-controls">
        <button
          type="button"
          className="secondary-button"
          disabled={step === 0}
          onClick={() => select(step - 1)}
        >
          Previous
        </button>
        <button type="button" className="text-link" onClick={() => setStep(null)}>
          Skip story
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => (step === storyChapters.length - 1 ? setStep(null) : select(step + 1))}
        >
          {step === storyChapters.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}
