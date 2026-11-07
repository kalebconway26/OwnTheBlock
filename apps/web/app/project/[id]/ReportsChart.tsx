"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { MonthlyReport } from "@/lib/demo";

export default function ReportsChart({ reports }: { reports: MonthlyReport[] }) {
  const data = reports.map((r) => ({ month: r.month.slice(0, 3), paid: r.distributed / 100, gross: r.gross / 100 }));
  return (
    <div className="h-40" aria-label="Bar chart of monthly payouts to investors">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#5d6678" }} interval={2} />
          <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Bar dataKey="paid" name="Paid to investors" fill="#14306b" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
