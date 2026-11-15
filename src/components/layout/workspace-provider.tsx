"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { displayedObservation } from "@/data/observations";
import {
  defaultSelection,
  parseWorkspaceSelection,
  selectionParams,
  type WorkspaceSelection,
} from "@/lib/workspace-selection";

type SelectionUpdate = Partial<WorkspaceSelection>;
interface Workspace {
  selection: WorkspaceSelection;
  ready: boolean;
  update: (change: SelectionUpdate) => void;
  reset: () => void;
}
const WorkspaceContext = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState(defaultSelection);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    function restore() {
      const url = new URL(window.location.href);
      const restored = parseWorkspaceSelection(url.searchParams);
      // Keep repaired source IDs consistent in the address bar and shared navigation.
      if (
        (url.searchParams.has("a") && url.searchParams.get("a") !== restored.a) ||
        (url.searchParams.has("b") && url.searchParams.get("b") !== restored.b)
      ) {
        url.searchParams.set("a", restored.a);
        url.searchParams.set("b", restored.b);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
      setSelection(restored);
      setReady(true);
    }
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const update = useCallback((change: SelectionUpdate) => {
    // Native history is integrated with Next navigation; editing a selection needs no page fetch.
    const current = parseWorkspaceSelection(new URLSearchParams(window.location.search));
    const next = { ...current, ...change };
    if (change.focusId) {
      const observation = displayedObservation(change.focusId);
      if (observation?.kind === "optical-browse") next.mode = "imagery";
      else if (observation?.radarKey) next.mode = "radar";
      else if (observation?.asset) next.mode = "seasonal";
    }
    const url = new URL(window.location.href);
    url.search = selectionParams(next).toString();
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setSelection(next);
  }, []);
  return (
    <WorkspaceContext value={{ selection, ready, update, reset: () => update(defaultSelection) }}>
      {children}
    </WorkspaceContext>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("WorkspaceProvider is required");
  return value;
}
