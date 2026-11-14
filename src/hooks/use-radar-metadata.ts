"use client";

import { useEffect, useState } from "react";
import { assertMatchingAnalysis, parseRadarMetadata, type RadarMetadata } from "@/lib/radar";

type MetadataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: RadarMetadata };

export function useRadarMetadata() {
  const [state, setState] = useState<MetadataState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(() => controller.abort(), 15000);

    async function load() {
      try {
        const response = await fetch("/data/metadata.json", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Metadata request returned HTTP ${response.status}.`);
        const data = parseRadarMetadata(await response.json());
        assertMatchingAnalysis(data);
        if (!cancelled) setState({ status: "ready", data });
      } catch (error) {
        if (!cancelled)
          setState({
            status: "error",
            message: controller.signal.aborted
              ? "The metadata request timed out."
              : error instanceof Error
                ? error.message
                : "Could not read local metadata.",
          });
      } finally {
        window.clearTimeout(timer);
      }
    }
    void load();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [attempt]);

  function retry() {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  return { state, retry };
}
