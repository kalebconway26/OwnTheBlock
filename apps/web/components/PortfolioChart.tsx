"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { fmt } from "@/lib/finance";
import { monthLabel } from "@/lib/world";

type Point = { month: number; value: number };

/** Portfolio value over time: navy line with a soft fade, no axes (Coinbase-style). */
export default function PortfolioChart({ points }: { points: Point[] }) {
  const empty = points.length < 2 || points.every((p) => p.value === 0);
  if (empty)
    return (
      <div className="grid h-36 place-items-center rounded-2xl bg-card text-sm text-muted">
        Your chart starts after your first investment
      </div>
    );
  const data = points.map((p) => ({ m: monthLabel(p.month), v: p.value }));
  return (
    <div className="h-36" role="img" aria-label={`Portfolio value from ${data[0].m} to ${data[data.length - 1].m}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#14306b" stopOpacity={0.18} />
              <stop offset="1" stopColor="#14306b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            cursor={{ stroke: "#5d6678", strokeDasharray: "3 3" }}
            formatter={(v) => [fmt(Number(v)), "Value"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e7e9ef", fontSize: 13 }}
          />
          <Area type="monotone" dataKey="v" stroke="#14306b" strokeWidth={2.2} fill="url(#pf)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
