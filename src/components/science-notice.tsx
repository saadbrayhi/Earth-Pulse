import { ShieldAlert } from "lucide-react";
import { scienceNotice } from "@/content/science";

export function ScienceNotice() {
  return (
    <section className="interpretation-notice" aria-label="Scientific limitation">
      <ShieldAlert size={20} className="mt-0.5 shrink-0 text-gold" />
      <div>
        <h2 className="text-sm font-medium text-gold-strong">{scienceNotice.title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{scienceNotice.description}</p>
      </div>
    </section>
  );
}
