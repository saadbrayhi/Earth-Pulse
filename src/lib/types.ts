// Shape of public/data/<study-area>/metadata.json, written by scripts/process_change.py

export type AreaStat = { km2: number; percent: number };

export type SceneInfo = {
  key: "before" | "after";
  date: string;
  startTimeUtc: string;
  sceneName: string;
  sourceUrl: string;
  collection: string;
  productVersion: string;
  productDoi: string;
  orbit: number;
  track: number;
  frame: number;
  passDirection: string;
  lookDirection: string;
  rangeBandwidthMHz: string[];
  nativePixelM: number;
  polarizations: string[];
  qa: { checks: number; passed: number; failed: string[] };
};

export type WaterClass = { value: number; key: "persistent" | "receded" | "new"; label: string; color: string };

export type StudyMetadata = {
  id: string;
  generatedAt: string;
  studyArea: { name: string; region: string; aoiLonLat: [number, number, number, number]; center: [number, number] };
  bounds: [[number, number], [number, number]];
  before: SceneInfo;
  after: SceneInfo;
  layers: {
    before: { file: string; label: string; stretchDb: [number, number] };
    after: { file: string; label: string; stretchDb: [number, number] };
    waterChange: { file: string; label: string; classes: WaterClass[] };
    backscatterChange: {
      file: string;
      label: string;
      units: string;
      hiddenBelowDb: number;
      saturationDb: number;
      negativeColor: string;
      positiveColor: string;
    };
  };
  processing: Record<string, string | string[]>;
  comparability: { sameGeometry: boolean; sameBandwidth: boolean; sameMaturity: boolean };
  stats: {
    validAreaKm2: number;
    waterThresholdDb: number;
    waterThresholdHvDb: number;
    thresholdDerivation: {
      hhDarkModeDb: number | null;
      hhDarkSigmaDb: number | null;
      hvNoiseFloorDb: number;
      hvMedianDb: number;
      fallback?: boolean;
    };
    waterLikeBefore: AreaStat;
    waterLikeAfter: AreaStat;
    persistent: AreaStat;
    receded: AreaStat;
    new: AreaStat;
    netChangeKm2: number;
    meanHhDb: { before: number | null; after: number | null };
    meanHvDb: { before: number | null; after: number | null };
    notableDarkening: AreaStat;
    notableBrightening: AreaStat;
    recededSignature: { hhBeforeDb: number | null; hhAfterDb: number | null; hvBeforeDb: number | null; hvAfterDb: number | null };
  };
  histogram: {
    binStartDb: number[];
    hhBeforePct: number[];
    hhAfterPct: number[];
    hvBeforePct: number[];
    hvAfterPct: number[];
  };
  caveats: string[];
  sources: { label: string; url: string }[];
};

/** What the map shows: one of the two radar pictures, or the change map. */
export type View = "before" | "after" | "change";

/** Live API: a set of dates that can be compared fairly (same orbit, sharpness and data version). */
export type ComparableSet = {
  id: string;
  direction: string;
  track: number;
  frame: number;
  bandwidth: string;
  pixelM: number | null;
  maturity: "VALIDATED" | "PROVISIONAL" | "BETA" | "URGENT_RESPONSE";
  scenes: { sceneName: string; date: string; startTime: string; polarizations: string[]; crid: string }[];
};

export type ScenesResponse = { bbox: [number, number, number, number]; totalScenes: number; coveringScenes: number; sets: ComparableSet[] };

export type JobResponse = { status: "queued" | "running" | "done" | "error"; log: string[]; result?: string; error?: string };
