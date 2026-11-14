import report from "../../public/data/analysis.json";

export const analysis = report;
export const changeThresholdDb = report.processing.thresholdDb;
export const categoryLabels: Record<string, string> = {
  decreased: "Decreased backscatter",
  withinThreshold: `Within ±${changeThresholdDb} dB`,
  increased: "Increased backscatter",
};
