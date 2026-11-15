"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analysis } from "@/data/study";
import { formatNumber } from "@/lib/format";

export function ChangeChart() {
  return (
    <div
      className="chart-frame"
      role="img"
      aria-label="Histogram of full-resolution paired backscatter differences in decibels. Exact counts are provided in the table below."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={analysis.histogram}
          margin={{ top: 16, right: 18, bottom: 14, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            interval={4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "var(--accent-soft)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--foreground)",
              fontSize: 12,
            }}
            formatter={(value) => [formatNumber(Number(value)), "Paired pixels"]}
            labelFormatter={(label) => `${label} dB`}
          />
          <Bar
            dataKey="pixels"
            fill="var(--accent)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
