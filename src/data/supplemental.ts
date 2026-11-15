// Kept separate so catalog reports never enter map/chart client bundles.
import discoveryReport from "../../public/data/discovery.json";
import referenceProbe from "../../public/data/reference-probe.json";

export const discovery = discoveryReport;
export const referenceResults: { targetDate: string; status: string; sourceUrl?: string }[] =
  referenceProbe.results;
