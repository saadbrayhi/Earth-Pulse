"use client";

// Map for choosing an area: click to place a square box.

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { addBasemap, loadLeaflet } from "@/lib/map";

export type Focus = { lat: number; lng: number; zoom: number; key: number };

type Props = {
  bbox: [number, number, number, number] | null;
  onPick: (lat: number, lng: number) => void;
  focus: Focus;
};

export default function SelectMap({ bbox, onPick, focus }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const ref = useRef<{ L: typeof Leaflet; map: Leaflet.Map; rect: Leaflet.Rectangle | null } | null>(null);
  const pickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;
    let created: Leaflet.Map | null = null;
    loadLeaflet().then((L) => {
      if (cancelled || !el.current) return;
      const map = L.map(el.current, { zoomControl: false, minZoom: 3, maxZoom: 17, worldCopyJump: true });
      created = map;
      map.setView([25.125, 91.075], 9);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      addBasemap(L, map);
      map.on("click", (e: Leaflet.LeafletMouseEvent) => pickRef.current(e.latlng.lat, e.latlng.lng));
      ref.current = { L, map, rect: null };
      setReady(true);
    });
    return () => {
      cancelled = true;
      created?.remove();
      ref.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const s = ref.current;
    if (!ready || !s) return;
    s.rect?.remove();
    s.rect = null;
    if (bbox) {
      const [w, so, e, n] = bbox;
      s.rect = s.L.rectangle(
        [
          [so, w],
          [n, e],
        ],
        { color: "#5eead4", weight: 2, fillColor: "#5eead4", fillOpacity: 0.12, interactive: false },
      ).addTo(s.map);
      // Zoom in to the box the first time, so people can see what they picked
      if (s.map.getZoom() < 11) s.map.flyToBounds(s.rect.getBounds(), { padding: [80, 80], duration: 0.8 });
    }
  }, [ready, bbox]);

  useEffect(() => {
    const s = ref.current;
    if (!ready || !s || focus.key === 0) return;
    s.map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.8 });
  }, [ready, focus]);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const ro = new ResizeObserver(() => ref.current?.map.invalidateSize());
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="absolute inset-0">
      <div ref={el} className="absolute inset-0 cursor-crosshair" role="region" aria-label="Map: click to choose an area" />
      {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-muted">Loading map…</div>}
    </div>
  );
}
