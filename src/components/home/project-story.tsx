import Link from "next/link";
import { Layers3, Satellite, Waves, type LucideIcon } from "lucide-react";
import { projectStories } from "@/content/home";

const icons: Record<string, LucideIcon> = { Waves, Satellite, Layers3 };

export function ProjectStory() {
  return (
    <section className="story-section">
      <div className="section-heading">
        <p className="eyebrow">FROM SIGNAL TO UNDERSTANDING</p>
        <h2>A different way to see water landscapes.</h2>
        <p className="section-description">
          Wetlands support habitats, store water and sustain livelihoods. Understanding their
          changing surface conditions begins with observations we can inspect and explain.
        </p>
      </div>
      <div className="story-grid">
        {projectStories.map((story) => {
          const Icon = icons[story.icon] ?? Layers3;
          const external = story.href.startsWith("https://");
          return (
            <article key={story.eyebrow} className="panel story-card">
              <Icon />
              <span className="eyebrow">{story.eyebrow}</span>
              <h3>{story.title}</h3>
              <p>{story.description}</p>
              <Link
                href={story.href}
                className="text-link"
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {story.action} {external ? "↗" : "→"}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
