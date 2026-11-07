"use client";

import { Card, DemoBanner, PageHeader, Pill } from "@/components/ui";
import Photo from "@/components/Photo";
import { DemoClock } from "@/components/demo";
import { impact, monthLabel } from "@/lib/world";
import { useWorld } from "@/lib/world/store";
import { fmt0 } from "@/lib/finance";

export default function ImpactPage() {
  const w = useWorld();
  const i = impact(w);
  const metrics = [
    { label: "Dollars invested by locals", value: fmt0(i.localDollars), how: "Investments from resident and HBCU wallets", src: "On-chain" },
    { label: "Dollars kept in the neighborhood", value: fmt0(i.dollarsKept), how: "Payouts to local wallets + renovation spending with local contractors", src: "On-chain" },
    { label: "Residents who are owners", value: i.residentOwners.toLocaleString(), how: "Verified zip-code residents holding at least 1 token", src: "On-chain + KYC" },
    { label: "Homes owned by the community", value: String(i.homes), how: "Funded homes, all with the 3% yearly rent cap", src: "On-chain" },
    { label: "Average rent vs market", value: `${Math.round(i.rentVsMarket * 100)}%`, how: "Our average rent ÷ neighborhood median rent", src: "Admin data" },
    { label: "Local jobs supported", value: String(i.jobs), how: "Jobs at funded businesses + property management", src: "Admin data" },
    { label: "Businesses funded", value: `${i.businesses} · ${fmt0(i.businessCapital)}`, how: "Count and total capital, no predatory loans", src: "On-chain" },
    { label: "Tenant ownership", value: `${i.tenantTokens.toFixed(1)} tokens`, how: "Tokens earned by tenants through rent-to-own", src: "On-chain" },
  ];
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-12">
      <DemoBanner />
      <PageHeader title="Community impact" subtitle={`East Greensboro · as of ${monthLabel(w.month)}`} back="/home" />
      <div className="space-y-2 px-4">
        <Photo id="fund" alt="A residential street of single-family homes" className="h-40 rounded-2xl" />
        <DemoClock compact />
        <p className="pt-1 text-sm text-muted">Skip ahead and watch these numbers grow as more raises complete.</p>
        {metrics.map((m) => (
          <Card key={m.label} className="p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">{m.label}</p>
              <p className="text-right text-lg font-extrabold text-green">{m.value}</p>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{m.how}</p>
              <Pill tone={m.src.startsWith("On-chain") ? "green" : "gray"}>{m.src}</Pill>
            </div>
          </Card>
        ))}
        <p className="pt-2 text-xs text-muted">Demo data from the demo world. Shares like &ldquo;40% of investors live in the zip code&rdquo; are assumptions.</p>
      </div>
    </div>
  );
}
