"use client";

// "Check any place": choose a small area and two comparable NISAR dates; the EarthPulse API reads only
// that area from the source files at ASF, runs the same analysis as the example, and returns a report.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ResultView from "./ResultView";
import SelectMap, { type Focus } from "./SelectMap";
import { fmtDate } from "@/lib/explain";
import type { ComparableSet, JobResponse, ScenesResponse, StudyMetadata } from "@/lib/types";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const SIZES = [3, 5, 8, 10];

type Phase = "pick" | "searching" | "choose" | "running" | "done";

function squareBox(lat: number, lng: number, km: number): [number, number, number, number] {
  const dLat = km / 2 / 110.57;
  const dLng = km / 2 / (111.32 * Math.cos((lat * Math.PI) / 180));
  const r = (v: number) => Math.round(v * 1e5) / 1e5;
  return [r(lng - dLng), r(lat - dLat), r(lng + dLng), r(lat + dLat)];
}

function setLabel(s: ComparableSet) {
  const mat = s.maturity === "VALIDATED" ? "✅ validated data" : s.maturity === "PROVISIONAL" ? "provisional data" : s.maturity.toLowerCase();
  return `${mat} · ${s.pixelM ?? "?"} m detail · orbit track ${s.track}`;
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${done ? "bg-accent text-ink" : "bg-accent/15 text-accent"}`}>
          {done ? "✓" : n}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm">{children}</div>
    </section>
  );
}

export default function LiveTool() {
  const [server, setServer] = useState<"checking" | "ok" | "down">("checking");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [sizeKm, setSizeKm] = useState(5);
  const [phase, setPhase] = useState<Phase>("pick");
  const [sets, setSets] = useState<ComparableSet[]>([]);
  const [setIdx, setSetIdx] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ meta: StudyMetadata; path: string } | null>(null);
  const [focus, setFocus] = useState<Focus>({ lat: 0, lng: 0, zoom: 0, key: 0 });
  const [query, setQuery] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const bbox = useMemo(() => (center ? squareBox(center.lat, center.lng, sizeKm) : null), [center, sizeKm]);

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => setServer(r.ok ? "ok" : "down"))
      .catch(() => setServer("down"));
  }, []);

  const pick = useCallback((lat: number, lng: number) => {
    setCenter({ lat, lng });
    setPhase("pick");
    setSets([]);
    setError(null);
  }, []);

  const searchPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const [hit] = await r.json();
      if (!hit) return setError(`No place called “${query}” found.`);
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      setFocus({ lat, lng, zoom: 12, key: Date.now() });
      pick(lat, lng);
    } catch {
      setError("Place search is not available right now. Click on the map instead.");
    }
  };

  const findDates = async () => {
    if (!bbox) return;
    setPhase("searching");
    setError(null);
    try {
      const r = await fetch(`${API}/api/scenes?bbox=${bbox.join(",")}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "Search failed");
      const res = d as ScenesResponse;
      setSets(res.sets);
      setSetIdx(0);
      if (res.sets.length) {
        const sc = res.sets[0].scenes;
        setFrom(sc[sc.length - 2].sceneName);
        setTo(sc[sc.length - 1].sceneName);
        setPhase("choose");
      } else {
        setPhase("pick");
        setError(
          res.totalScenes === 0
            ? "NISAR has no radar pictures of this spot yet."
            : "There are radar pictures here, but no two that can be compared fairly yet (same orbit, same sharpness, same data version, covering the whole box). Try a smaller box or a nearby spot.",
        );
      }
    } catch (err) {
      setPhase("pick");
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const chooseSet = (i: number) => {
    setSetIdx(i);
    const sc = sets[i].scenes;
    setFrom(sc[sc.length - 2].sceneName);
    setTo(sc[sc.length - 1].sceneName);
  };

  const analyze = async () => {
    if (!bbox || !from || !to || from === to) return;
    setError(null);
    setJob(null);
    setPhase("running");
    setElapsed(0);
    try {
      const r = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bbox, before: from, after: to }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail ?? "Could not start");
      setJobId(d.jobId);
    } catch (err) {
      setPhase("choose");
      setError(err instanceof Error ? err.message : "Could not start");
    }
  };

  // Poll the job while it runs
  useEffect(() => {
    if (!jobId || phase !== "running") return;
    const t0 = Date.now();
    const timer = setInterval(async () => {
      setElapsed(Math.round((Date.now() - t0) / 1000));
      try {
        const r = await fetch(`${API}/api/jobs/${jobId}`);
        const j = (await r.json()) as JobResponse;
        setJob(j);
        if (j.status === "done" && j.result) {
          clearInterval(timer);
          const path = `${API}${j.result}`;
          const meta = (await (await fetch(path + "metadata.json")).json()) as StudyMetadata;
          setResult({ meta, path });
          setPhase("done");
          window.scrollTo({ top: 0 });
        } else if (j.status === "error") {
          clearInterval(timer);
          setPhase("choose");
          setError(j.error ?? "The analysis failed.");
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [jobId, phase]);

  if (phase === "done" && result) {
    return (
      <ResultView
        meta={result.meta}
        dataPath={result.path}
        toolbar={
          <button
            onClick={() => {
              setResult(null);
              setJobId(null);
              setPhase("choose");
            }}
            className="pointer-events-auto rounded-xl bg-panel/90 px-3 py-2 text-sm shadow-lg backdrop-blur hover:text-accent"
          >
            ← New check
          </button>
        }
      />
    );
  }

  const current = sets[setIdx];
  const scenes = current?.scenes ?? [];

  return (
    <>
      <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden border-b border-line">
        <SelectMap bbox={bbox} onPick={pick} focus={focus} />
        <form onSubmit={searchPlace} className="absolute left-3 top-3 z-[1000] flex w-[min(360px,calc(100%-1.5rem))] gap-1 rounded-xl bg-panel/90 p-1 shadow-lg backdrop-blur">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a village, town or river…"
            className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted"
            aria-label="Search a place"
          />
          <button className="rounded-lg bg-accent/15 px-3 text-sm text-accent hover:bg-accent/25">Go</button>
        </form>
        {!center && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[1000] text-center">
            <span className="rounded-full bg-panel/90 px-4 py-2 text-sm shadow-lg backdrop-blur">👆 Click the map where you want to check for water</span>
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Check any place</h1>
          <p className="mt-1 max-w-3xl text-text/80">
            Choose a small area and two dates. EarthPulse reads only that area from NASA&apos;s NISAR radar files and shows
            where water appeared or disappeared, in about a minute.
          </p>
        </div>

        {server === "down" && (
          <p className="rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-sm">
            The live analysis server is offline right now. You can still explore the{" "}
            <Link href="/" className="text-accent underline">
              Tanguar Haor example
            </Link>
            .
          </p>
        )}
        {error && <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-3">
          <Step n={1} title="Choose your area" done={!!center}>
            <p className="text-muted">{center ? `Centre: ${center.lat.toFixed(4)}° N, ${center.lng.toFixed(4)}° E` : "Click the map or search for a place."}</p>
            <div>
              <span className="text-xs text-muted">Box size</span>
              <div className="mt-1 flex gap-1">
                {SIZES.map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSizeKm(k);
                      setSets([]);
                      setPhase("pick");
                    }}
                    className={`rounded-lg px-3 py-1.5 ${sizeKm === k ? "bg-accent text-ink" : "border border-line hover:text-accent"}`}
                  >
                    {k} km
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Smaller boxes are faster (5 km ≈ 1–2 minutes).</p>
            </div>
          </Step>

          <Step n={2} title="Choose two dates" done={phase === "choose" || phase === "running"}>
            {sets.length === 0 ? (
              <button
                onClick={findDates}
                disabled={!center || phase === "searching" || server !== "ok"}
                className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-ink hover:brightness-110 disabled:opacity-40"
              >
                {phase === "searching" ? "Searching NISAR…" : "Find radar dates"}
              </button>
            ) : (
              <>
                <label className="block text-xs text-muted">
                  Group of comparable pictures
                  <select
                    value={setIdx}
                    onChange={(e) => chooseSet(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm text-text"
                  >
                    {sets.map((s, i) => (
                      <option key={s.id} value={i}>
                        {i === 0 ? "Best: " : ""}
                        {setLabel(s)} · {s.scenes.length} dates
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["From", from, setFrom],
                      ["To", to, setTo],
                    ] as const
                  ).map(([lbl, val, set]) => (
                    <label key={lbl} className="block text-xs text-muted">
                      {lbl}
                      <select
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-sm text-text"
                      >
                        {scenes.map((s) => (
                          <option key={s.sceneName} value={s.sceneName}>
                            {fmtDate(s.date)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Only dates taken from the same orbit position, with the same sharpness and data version, are offered, so
                  the comparison is fair.
                </p>
              </>
            )}
          </Step>

          <Step n={3} title="Get the answer">
            {phase === "running" ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  <span>Working… {elapsed}s</span>
                </div>
                <ul className="mt-2 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted">
                  {(job?.log ?? ["Starting"]).slice(-6).map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                <button
                  onClick={analyze}
                  disabled={phase !== "choose" || !from || !to || from === to}
                  className="w-full rounded-lg bg-accent px-4 py-2 font-medium text-ink hover:brightness-110 disabled:opacity-40"
                >
                  Show me the water
                </button>
                {from === to && phase === "choose" && <p className="text-xs text-amber-300">Pick two different dates.</p>}
              </>
            )}
          </Step>
        </div>

        <p className="text-xs text-muted">
          Place search uses OpenStreetMap Nominatim. Radar data: NASA–ISRO NISAR Level-2 GCOV from the Alaska Satellite
          Facility, read directly from the source files for every check.
        </p>
      </div>
    </>
  );
}
