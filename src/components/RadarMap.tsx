"use client";

// Result map: shows one radar picture or the change map, and answers
// "was this spot under water?" when you click anywhere inside the box.

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { addBasemap, loadClassGrid, loadLeaflet, spotAt, spotText, type ClassGrid } from "@/lib/map";
import { fmtDate } from "@/lib/explain";
import type { StudyMetadata, View } from "@/lib/types";

type Props = { meta: StudyMetadata; dataPath: string; view: View };

type MapState = {
  L: typeof Leaflet;
  map: Leaflet.Map;
  before: Leaflet.ImageOverlay;
  after: Leaflet.ImageOverlay;
  water: Leaflet.ImageOverlay;
};

export default function RadarMap({ meta, dataPath, view }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<MapState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let created: Leaflet.Map | null = null;
    let grid: ClassGrid | null = null;

    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current) return;
      const bounds = L.latLngBounds(meta.bounds);
      const map = L.map(containerRef.current, { zoomControl: false, minZoom: 5, maxZoom: 18, zoomSnap: 0.25, scrollWheelZoom: false });
      created = map;
      map.fitBounds(bounds, { paddingTopLeft: [16, 64], paddingBottomRight: [16, 16] });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      addBasemap(L, map);
      map.attributionControl.addAttribution("Radar: NASA/ISRO NISAR via ASF DAAC");
      // Wheel zoom only after the map is clicked, so scrolling down to the report isn't hijacked
      map.once("click", () => map.scrollWheelZoom.enable());

      const img = (file: string, alt: string) =>
        L.imageOverlay(dataPath + file, bounds, { alt, className: "radar-img", interactive: false, opacity: 0 }).addTo(map);
      stateRef.current = {
        L,
        map,
        before: img(meta.layers.before.file, meta.layers.before.label),
        after: img(meta.layers.after.file, meta.layers.after.label),
        water: img(meta.layers.waterChange.file, meta.layers.waterChange.label),
      };
      const [w, s, e, n] = meta.studyArea.aoiLonLat;
      L.rectangle(
        [
          [s, w],
          [n, e],
        ],
        { color: "#fde68a", weight: 2, opacity: 0.9, fill: false, dashArray: "6 5", interactive: false },
      ).addTo(map);

      // Point check
      loadClassGrid(dataPath + meta.layers.waterChange.file, meta)
        .then((g) => (grid = g))
        .catch(() => (grid = null));
      const marker = L.circleMarker([0, 0], { radius: 7, color: "#fff", weight: 2, fillColor: "#5eead4", fillOpacity: 1 });
      map.on("click", (ev: Leaflet.LeafletMouseEvent) => {
        if (!grid) return;
        const st = spotAt(grid, ev.latlng.lat, ev.latlng.lng);
        const t = spotText(st, fmtDate(meta.before.date), fmtDate(meta.after.date));
        const rows = t.lines.map(([d, v]) => `<div class="ep-row"><span>${d}</span><strong>${v}</strong></div>`).join("");
        marker.setLatLng(ev.latlng).addTo(map);
        L.popup({ className: "ep-popup", offset: [0, -4] })
          .setLatLng(ev.latlng)
          .setContent(`<div class="ep-pop"><div class="ep-title">${t.title}</div>${rows}</div>`)
          .openOn(map);
      });

      setReady(true);
    });

    return () => {
      cancelled = true;
      created?.remove();
      stateRef.current = null;
      setReady(false);
    };
  }, [meta, dataPath]);

  useEffect(() => {
    const s = stateRef.current;
    if (!ready || !s) return;
    s.before.setOpacity(view === "before" ? 1 : 0);
    s.after.setOpacity(view === "after" || view === "change" ? 1 : 0);
    s.water.setOpacity(view === "change" ? 0.85 : 0);
  }, [ready, view]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => stateRef.current?.map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" aria-label="Map" role="region" />
      {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-muted">Loading map…</div>}
    </div>
  );
}
