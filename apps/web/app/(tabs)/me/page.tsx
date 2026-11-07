"use client";

import Link from "next/link";
import { useState } from "react";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button, Card, Progress, SectionTitle, Sheet } from "@/components/ui";
import { Activity, DemoClock } from "@/components/demo";
import Photo from "@/components/Photo";
import { ChainIcon } from "@/components/icons";
import { projectById } from "@/lib/demo";
import { claim, monthLabel, portfolioValue, positionValue, projectState, setAutoClaim, tokenCount, totalClaimable, totalEarned, totalInvested } from "@/lib/world";
import { resetWorld, setWorld, useWorld } from "@/lib/world/store";
import { SAMPLE_HOME, dollars, fmt, tenantTokensPerMonth } from "@/lib/finance";

const COLORS: Record<string, string> = { home: "#14306b", business: "#b4372a", fund: "#d9a21b" };
const TENANT_MONTHS = 14;
const DOWN_PAYMENT_GOAL = dollars(7_500);

export default function MePage() {
  const w = useWorld();
  const [confirmReset, setConfirmReset] = useState(false);
  const invested = totalInvested(w);
  const earned = totalEarned(w);
  const value = portfolioValue(w);
  const owed = totalClaimable(w);
  const live = w.positions.filter((p) => p.status !== "refunded");
  const alloc = (["home", "business", "fund"] as const).map((type) => ({
    name: type === "home" ? "Homes" : type === "business" ? "Businesses" : "Fund",
    type,
    value: live.filter((h) => projectById(h.projectId)!.type === type).reduce((s, h) => s + positionValue(w, h), 0) / 100,
  }));
  const tashaTokens = TENANT_MONTHS * tenantTokensPerMonth(SAMPLE_HOME.monthlyRent, SAMPLE_HOME.tokenPrice);
  const tashaValue = tashaTokens * SAMPLE_HOME.tokenPrice;

  return (
    <main className="px-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Account</h1>
        <p className="text-muted">Portfolio, wallet and your Money Trail</p>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Card className="p-3">
          <p className="text-xs text-muted">Invested</p>
          <p className="font-extrabold tabular-nums">{fmt(invested)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">Earned</p>
          <p className="font-extrabold tabular-nums text-gold-ink">{fmt(earned)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">Holdings worth</p>
          <p className="font-extrabold tabular-nums">{fmt(value - w.cash)}</p>
        </Card>
      </div>

      <div className="mt-3">
        <DemoClock compact />
      </div>

      <SectionTitle>Wallet</SectionTitle>
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Available</p>
            <p className="text-3xl font-extrabold tabular-nums">{fmt(w.cash)}</p>
          </div>
          <p className="font-mono text-xs text-muted">USDC · Base</p>
        </div>
        {owed > 0 && (
          <Button variant="gold" className="mt-3 w-full" onClick={() => { const r = claim(w); if (r.ok) setWorld(r.world); }}>
            Claim {fmt(owed)} in payouts
          </Button>
        )}
        <button role="switch" aria-checked={w.autoClaim} onClick={() => setWorld(setAutoClaim(w, !w.autoClaim))} className="mt-3 flex min-h-12 w-full items-center justify-between gap-3 text-left">
          <span>
            <span className="block font-semibold">Auto-claim payouts</span>
            <span className="block text-xs text-muted">Payouts land in your wallet automatically. OwnTheBlock pays the fees.</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${w.autoClaim ? "bg-green" : "bg-line"}`}>
            <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${w.autoClaim ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>
        <button disabled className="mt-2 min-h-12 w-full rounded-xl bg-card text-sm font-semibold text-muted">
          Withdraw to bank (off in the demo)
        </button>
        <p className="mt-2 text-xs text-muted">On the real app, withdrawals go to your bank or debit card through Coinbase. The demo uses pretend dollars, so there&apos;s nothing to withdraw.</p>
      </Card>

      {w.history.length > 1 && (
        <>
          <SectionTitle>Your value over time</SectionTitle>
          <Card className="p-2">
            <div className="h-40" aria-label="Chart of your portfolio value over time">
              <ResponsiveContainer>
                <AreaChart data={w.history.map((h) => ({ m: monthLabel(h.month), value: h.value / 100, earned: h.earned / 100 }))} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#5d6678" }} minTickGap={40} />
                  <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  <Area type="monotone" dataKey="value" name="Total value" stroke="#14306b" fill="#e2efe5" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="earned" name="Earned" stroke="#8a6400" fill="#fbefd2" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {live.length > 0 && (
        <>
          <SectionTitle>Where your money is</SectionTitle>
          <Card className="flex items-center gap-4">
            <div className="size-32 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={alloc.filter((a) => a.value > 0)} dataKey="value" innerRadius={34} outerRadius={60} paddingAngle={2} isAnimationActive={false}>
                    {alloc.filter((a) => a.value > 0).map((a) => (
                      <Cell key={a.type} fill={COLORS[a.type]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-sm">
              {alloc.map((a) => (
                <li key={a.type} className="flex items-center gap-2">
                  <span className="size-3 rounded-full" style={{ background: COLORS[a.type] }} />
                  {a.name}: <b>{fmt(dollars(a.value))}</b>
                </li>
              ))}
            </ul>
          </Card>

          <SectionTitle>Holdings</SectionTitle>
          <div className="space-y-2">
            {live.map((h) => {
              const p = projectById(h.projectId)!;
              const s = projectState(w, p.id);
              return (
                <Card key={h.projectId + h.status} className="p-3">
                  <div className="flex gap-3">
                    <Photo id={p.photos[0]} alt="" className="size-16 shrink-0 rounded-xl" sizes="64px" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/project/${p.id}`} className="font-bold leading-tight text-green">
                          {p.name}
                        </Link>
                        <span className="font-bold tabular-nums">{fmt(positionValue(w, h))}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {h.tokens} tokens{p.type !== "fund" && ` · owns ${((h.tokens / tokenCount(p)) * 100).toFixed(3)}%`} · put in {fmt(h.invested)} · earned {fmt(h.earned)}
                      </p>
                      <p className="text-xs font-semibold text-gold-ink">{h.status === "escrow" ? "In escrow until the raise completes" : h.status === "paidOff" ? "Paid back in full" : s.stage}</p>
                    </div>
                  </div>
                  <Link href={`/trace?project=${p.id}`} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-green">
                    <ChainIcon className="size-4" /> Trace my money
                  </Link>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle>All activity</SectionTitle>
      <Activity world={w} limit={30} filter={(t) => t.mine} />

      <SectionTitle>Rent-to-own (a tenant&apos;s view)</SectionTitle>
      <Card className="overflow-hidden p-0">
        <Photo id="porch" alt="Front steps of a house" className="h-28" />
        <div className="p-4">
          <p className="text-sm text-muted">Tenants in OwnTheBlock homes earn tokens worth 2% of every on-time rent payment.</p>
          <p className="mt-2 text-2xl font-extrabold text-green">{tashaTokens.toFixed(1)} tokens</p>
          <p className="text-sm">
            worth {fmt(tashaValue)} after {TENANT_MONTHS} on-time payments at $1,400 · 2.8 tokens a month
          </p>
          <div className="mt-3">
            <Progress value={tashaValue / DOWN_PAYMENT_GOAL} label="Progress to down payment" tone="gold" />
            <p className="mt-1 text-xs text-muted">
              {fmt(tashaValue)} of a {fmt(DOWN_PAYMENT_GOAL)} down-payment goal. Right of first refusal if the home is ever sold.
            </p>
          </div>
        </div>
      </Card>

      <SectionTitle>More</SectionTitle>
      <Card className="divide-y divide-line p-0">
        {[
          ["/impact", "Community impact"],
          ["/simulate/grow", "Grow the app: the economics at scale"],
          ["/simulate", "Block Simulator"],
          ["/credits", "Photo credits"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="flex min-h-12 items-center justify-between px-4 font-semibold">
            {label} <span className="text-green">→</span>
          </Link>
        ))}
        <button onClick={() => setConfirmReset(true)} className="flex min-h-12 w-full items-center px-4 font-semibold text-brick">
          Reset demo
        </button>
      </Card>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Start the demo over?">
        <p>This clears your pretend wallet, investments and the demo clock on this phone. Nothing real is affected.</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfirmReset(false)} className="flex-1">
            Cancel
          </Button>
          <button
            onClick={() => {
              resetWorld();
              setConfirmReset(false);
            }}
            className="min-h-12 flex-1 rounded-xl bg-brick font-semibold text-white"
          >
            Reset
          </button>
        </div>
      </Sheet>
    </main>
  );
}
