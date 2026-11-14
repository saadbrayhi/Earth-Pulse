import { ShieldAlert } from "lucide-react";

export function ScienceNotice() {
  return (
    <section className="interpretation-notice" aria-label="Scientific limitation">
      <ShieldAlert size={20} className="mt-0.5 shrink-0 text-gold" />
      <div>
        <h2 className="text-sm font-medium text-gold-strong">
          Radar backscatter change is NOT validated flood extent.
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Water, vegetation, roughness, moisture and acquisition conditions can affect the signal.
          Blue and orange indicate backscatter direction, not water expansion or recession. No water
          classification is validated here.
        </p>
      </div>
    </section>
  );
}
