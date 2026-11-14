import report from "../../public/data/analysis.json";

export const analysis = report;
export const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
export const signedDb = (value: number) => `${value >= 0 ? "+" : ""}${formatNumber(value, 2)} dB`;
export const categoryLabels: Record<string, string> = {
  decreased: "Decreased backscatter",
  withinThreshold: "Within ±3 dB",
  increased: "Increased backscatter",
};
