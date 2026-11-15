"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Map as LeafletMap, latLngBounds } from "leaflet";
import {
  LeafletContext,
  createLeafletContext,
  type LeafletContextInterface,
} from "@react-leaflet/core";
import type { RadarBounds } from "@/lib/radar-metadata";

/** Keep Leaflet's panes with Activity's preserved DOM. Dispose on actual DOM removal,
 * not effect disconnection: child layer effects reconnect with the preserved context.
 */
export function ManagedMap({ bounds, children }: { bounds: RadarBounds; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const active = useRef(false);
  const detachObserver = useRef<MutationObserver | null>(null);
  const [context, setContext] = useState<LeafletContextInterface | null>(null);
  const [[south, west], [north, east]] = bounds;
  useLayoutEffect(() => {
    const node = host.current!;
    active.current = true;
    detachObserver.current?.disconnect();
    if (!instance.current) {
      const extent: RadarBounds = [
        [south, west],
        [north, east],
      ];
      const map = new LeafletMap(node, {
        maxBounds: latLngBounds(extent).pad(2),
        maxBoundsViscosity: 0.8,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false,
        scrollWheelZoom: false,
        zoomAnimation: false,
        trackResize: false,
      });
      map.fitBounds(extent, { padding: [32, 32] });
      instance.current = map;
      setContext(createLeafletContext(map));
    }
    return () => {
      active.current = false;
      instance.current?.stop();
      // Activity disconnects effects but retains connected DOM. Its final eviction may
      // remove that DOM without a second effect cleanup, so watch for real detachment.
      queueMicrotask(() => {
        if (active.current) return;
        function disposeIfDetached() {
          if (node.isConnected) return;
          detachObserver.current?.disconnect();
          instance.current?.remove();
          instance.current = null;
        }
        if (!node.isConnected) disposeIfDetached();
        else {
          detachObserver.current?.disconnect();
          detachObserver.current = new MutationObserver(disposeIfDetached);
          detachObserver.current.observe(document.documentElement, {
            childList: true,
            subtree: true,
          });
        }
      });
    };
  }, [south, west, north, east]);
  return (
    <div ref={host} className="radar-leaflet-map">
      {context && <LeafletContext value={context}>{children}</LeafletContext>}
    </div>
  );
}
