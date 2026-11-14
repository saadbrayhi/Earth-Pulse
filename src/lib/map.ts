// Shared Leaflet helpers (client only) and the "is this spot under water?" check.

import type * as Leaflet from "leaflet";
import type { StudyMetadata } from "./types";

export async function loadLeaflet(): Promise<typeof Leaflet> {
  const mod = await import("leaflet");
  return ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet;
}

/** Satellite basemap + place-name labels, for context only. */
export function addBasemap(L: typeof Leaflet, map: Leaflet.Map) {
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    attribution: "Basemap © Esri, Maxar, Earthstar Geographics",
  }).addTo(map);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 18, pane: "shadowPane", opacity: 0.85 },
  ).addTo(map);
}

// ---------------------------------------------------------------- point check
export type SpotState = "persistent" | "receded" | "new" | "dry" | "outside";

export type ClassGrid = { width: number; height: number; data: Uint8ClampedArray; meta: StudyMetadata };

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Load the class map image into memory so any clicked point can be looked up. */
export function loadClassGrid(url: string, meta: StudyMetadata): Promise<ClassGrid> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0);
      resolve({ width: c.width, height: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data, meta });
    };
    img.onerror = () => reject(new Error("could not load " + url));
    img.src = url;
  });
}

/** The layer is in Web Mercator, so latitude is converted with the Mercator formula. */
export function spotAt(grid: ClassGrid, lat: number, lng: number): SpotState {
  const [[s, w], [n, e]] = grid.meta.bounds;
  const [aw, as, ae, an] = grid.meta.studyArea.aoiLonLat;
  if (lng < aw || lng > ae || lat < as || lat > an) return "outside";
  const x = Math.floor(((lng - w) / (e - w)) * grid.width);
  const y = Math.floor(((mercY(n) - mercY(lat)) / (mercY(n) - mercY(s))) * grid.height);
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return "outside";
  const i = (y * grid.width + x) * 4;
  const [r, g, b, a] = [grid.data[i], grid.data[i + 1], grid.data[i + 2], grid.data[i + 3]];
  if (a === 0) return "dry";
  let best: SpotState = "dry";
  let bestD = Infinity;
  for (const c of grid.meta.layers.waterChange.classes) {
    const m = c.color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
    const d = (m[0] - r) ** 2 + (m[1] - g) ** 2 + (m[2] - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c.key;
    }
  }
  return best;
}

export function spotText(state: SpotState, before: string, after: string): { title: string; lines: [string, string][] } {
  const yes = "💧 Water";
  const no = "🟫 No water";
  switch (state) {
    case "persistent":
      return { title: "Under water on both dates", lines: [[before, yes], [after, yes]] };
    case "receded":
      return { title: "The water left this spot", lines: [[before, yes], [after, no]] };
    case "new":
      return { title: "Water arrived at this spot", lines: [[before, no], [after, yes]] };
    case "dry":
      return { title: "No open water on either date", lines: [[before, no], [after, no]] };
    default:
      return { title: "Outside the checked area", lines: [] };
  }
}
