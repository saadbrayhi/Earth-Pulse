"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analysis, formatNumber } from "@/lib/analysis";

export function ChangeChart() {
  return (
    <div className="chart-frame" role="img" aria-label="Histogram of full-resolution paired backscatter differences in decibels. Exact counts are provided in the table below.">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={analysis.histogram} margin={{ top: 16, right: 18, bottom: 14, left: 0 }} accessibilityLayer>
          <CartesianGrid stroke="#243247" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={4} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
          <Tooltip cursor={{ fill: "#ffffff06" }} contentStyle={{ background: "#101c2d", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} formatter={(value) => [formatNumber(Number(value)), "Paired pixels"]} labelFormatter={(label) => `${label} dB`} />
          <Bar dataKey="pixels" fill="#5eead4" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
