import { observationRegistry, originalRadarPair, displayedObservation } from "@/data/observations";
import { analysis } from "@/data/study";
import type { RadarView } from "@/data/study";
import type { ExplorerMode, SeasonalView } from "./observation-types";

export interface WorkspaceSelection {
  a: string;
  b: string;
  focusId: string | null;
  mode: ExplorerMode;
  radarView: RadarView;
  seasonalView: SeasonalView;
  year: string;
  month: string | null;
}
export const defaultSelection: WorkspaceSelection = {
  ...originalRadarPair,
  focusId: null,
  mode: "radar",
  radarView: "compare",
  seasonalView: "compare",
  year: analysis.beforeDate.slice(0, 4),
  month: analysis.beforeDate.slice(5, 7),
};
export function parseWorkspaceSelection(params: URLSearchParams): WorkspaceSelection {
  const known = (id: string | null) => id !== null && observationRegistry.some((o) => o.id === id);
  const a = params.get("a"),
    b = params.get("b"),
    focus = params.get("focus");
  const view = params.get("view"),
    mode = params.get("mode"),
    year = params.get("year"),
    month = params.get("month");
  const selection: WorkspaceSelection = {
    ...defaultSelection,
    a: known(a) ? a! : defaultSelection.a,
    b: known(b) ? b! : defaultSelection.b,
    focusId: known(focus) ? focus : null,
    mode:
      displayedObservation(focus)?.kind === "optical-browse"
        ? "imagery"
        : mode === "seasonal"
          ? "seasonal"
          : mode === "imagery"
            ? "imagery"
            : "radar",
    radarView: (["before", "after", "compare", "change"] as string[]).includes(view ?? "")
      ? (view as RadarView)
      : "compare",
    seasonalView: (["dry", "wet", "compare", "change"] as string[]).includes(view ?? "")
      ? (view as SeasonalView)
      : "compare",
    year:
      year && observationRegistry.some((o) => o.date.startsWith(year + "-"))
        ? year
        : defaultSelection.year,
    month:
      month === "all"
        ? null
        : month && /^(0[1-9]|1[0-2])$/.test(month)
          ? month
          : defaultSelection.month,
  };
  // Older links can retain optical IDs after returning to the original radar study.
  // Repair only that same-date pair; unrelated or unsupported selections stay explicit.
  if (
    selection.mode === "radar" &&
    selection.focusId === null &&
    (selection.radarView === "compare" || selection.radarView === "change") &&
    observationRegistry.find((o) => o.id === selection.a)?.date === analysis.beforeDate &&
    observationRegistry.find((o) => o.id === selection.b)?.date === analysis.afterDate
  ) {
    return { ...selection, ...originalRadarPair };
  }
  return selection;
}
export function selectionParams(selection: WorkspaceSelection): URLSearchParams {
  const p = new URLSearchParams({
    a: selection.a,
    b: selection.b,
    mode: selection.mode,
    view: selection.mode === "seasonal" ? selection.seasonalView : selection.radarView,
    year: selection.year,
    month: selection.month ?? "all",
  });
  if (selection.focusId) p.set("focus", selection.focusId);
  return p;
}
export function selectionHref(path: string, selection: WorkspaceSelection) {
  return `${path}?${selectionParams(selection)}`;
}
