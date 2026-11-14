"use client";

// Small SVG histogram of backscatter (dB) for the two dates, with the water-like threshold marked.

import { useState } from "react";

type Props = {
  bins: number[];
  before: number[];
  after: number[];
  threshold: number;
  beforeLabel: string;
  afterLabel: string;
  xLabel: string;
};

const W = 360;
const H = 170;
const PAD = { l: 34, r: 8, t: 10, b: 28 };

export default function Histogram({ bins, before, after, threshold, beforeLabel, afterLabel, xLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const step = bins[1] - bins[0];
  const x0 = bins[0];
  const x1 = bins[bins.length - 1] + step;
  const yMax = Math.max(...before, ...after) * 1.1;
  const sx = (v: number) => PAD.l + ((v - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);

  const path = (series: number[]) =>
    series.map((v, i) => `${i === 0 ? "M" : "L"}${sx(bins[i] + step / 2).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const area = (series: number[]) =>
    `${path(series)} L${sx(bins[bins.length - 1] + step / 2)},${sy(0)} L${sx(bins[0] + step / 2)},${sy(0)} Z`;

  const xTicks = [];
  for (let v = Math.ceil(x0 / 5) * 5; v <= x1; v += 5) xTicks.push(v);
  const yTicks = [0, yMax / 2.2, yMax / 1.1].map((v) => Math.round(v * 10) / 10);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const v = x0 + ((x - PAD.l) / (W - PAD.l - PAD.r)) * (x1 - x0);
    const i = Math.floor((v - x0) / step);
    setHover(i >= 0 && i < bins.length ? i : null);
  };

  return (
    <figure className="select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Histogram of ${xLabel} for ${beforeLabel} and ${afterLabel}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} stroke="var(--line)" strokeWidth={1} />
            <text x={PAD.l - 5} y={sy(t) + 3} textAnchor="end" fontSize={9} fill="var(--muted)">
              {t}%
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={sx(t)} y={H - PAD.b + 13} textAnchor="middle" fontSize={9} fill="var(--muted)">
            {t}
          </text>
        ))}
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 3} textAnchor="middle" fontSize={9} fill="var(--muted)">
          {xLabel}
        </text>

        <rect x={PAD.l} y={PAD.t} width={sx(threshold) - PAD.l} height={H - PAD.t - PAD.b} fill="var(--water)" opacity={0.08} />
        <line x1={sx(threshold)} x2={sx(threshold)} y1={PAD.t} y2={H - PAD.b} stroke="var(--water)" strokeDasharray="3 3" />
        <text x={sx(threshold) - 4} y={PAD.t + 9} textAnchor="end" fontSize={9} fill="#93c5fd">
          water-like
        </text>

        <path d={area(before)} fill="#94a3b8" opacity={0.18} />
        <path d={path(before)} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
        <path d={area(after)} fill="var(--accent)" opacity={0.14} />
        <path d={path(after)} fill="none" stroke="var(--accent)" strokeWidth={1.5} />

        {hover !== null && (
          <g>
            <line x1={sx(bins[hover] + step / 2)} x2={sx(bins[hover] + step / 2)} y1={PAD.t} y2={H - PAD.b} stroke="#fff" opacity={0.35} />
            <circle cx={sx(bins[hover] + step / 2)} cy={sy(before[hover])} r={3} fill="#cbd5e1" />
            <circle cx={sx(bins[hover] + step / 2)} cy={sy(after[hover])} r={3} fill="var(--accent)" />
          </g>
        )}
      </svg>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-[#cbd5e1]" /> {beforeLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-accent" /> {afterLabel}
        </span>
        <span className="ml-auto font-mono tabular-nums">
          {hover !== null
            ? `${bins[hover]}…${bins[hover] + step} dB: ${before[hover].toFixed(2)}% → ${after[hover].toFixed(2)}%`
            : "hover for values"}
        </span>
      </figcaption>
    </figure>
  );
}
