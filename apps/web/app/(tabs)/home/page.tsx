"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, Pill, Progress, SectionTitle, Sheet } from "@/components/ui";
import { Activity, DemoClock } from "@/components/demo";
import Photo from "@/components/Photo";
import Logo from "@/components/Logo";
import PortfolioChart from "@/components/PortfolioChart";
import { ArrowRightIcon, BellIcon, InfoIcon, PlayIcon, SearchIcon } from "@/components/icons";
import { PROJECTS, projectById } from "@/lib/demo";
import { claim, earnedThisMonth, faucet, impact, portfolioValue, positionValue, projectState, totalClaimable } from "@/lib/world";
import { RANGES, Range, changeOverRange, historyInRange } from "@/lib/world/range";
import { setWorld, today, useWorld } from "@/lib/world/store";
import { fmt, fmt0, pct } from "@/lib/finance";

const RANGE_LABEL: Record<Range, string> = { "1M": "past month", "3M": "past 3 months", YTD: "this year", "1Y": "past year", ALL: "all time" };

export default function HomePage() {
  const w = useWorld();
  const [usdc, setUsdc] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("ALL");
  const value = portfolioValue(w);
  const owed = totalClaimable(w);
  const thisMonth = earnedThisMonth(w);
  const live = w.positions.filter((p) => p.status === "active" || p.status === "escrow");
  const featured = PROJECTS.find((p) => p.type !== "fund" && projectState(w, p.id).stage === "Raising");
  const imp = impact(w);
  const points = historyInRange(w.history, w.month, range);
  const change = changeOverRange(points);
  const up = change.cents >= 0;

  const getDollars = () => {
    const r = faucet(w, today());
    if (r.ok) {
      setWorld(r.world);
      navigator.vibrate?.(10);
      setMsg(null);
    } else setMsg(r.reason);
  };
  const doClaim = () => {
    const r = claim(w);
    if (r.ok) setWorld(r.world);
  };

  return (
    <main className="px-4">
      <header className="flex items-center justify-between pt-4">
        <Logo />
        <div className="flex gap-2">
          <Link href="/explore" aria-label="Search properties" className="grid size-11 place-items-center rounded-xl bg-card text-ink">
            <SearchIcon />
          </Link>
          <Link href="/me" aria-label="Notifications and account" className="grid size-11 place-items-center rounded-xl bg-card text-ink">
            <BellIcon />
          </Link>
        </div>
      </header>

      <section aria-label="Portfolio" className="mt-5">
        <button onClick={() => setUsdc(true)} className="flex min-h-8 items-center gap-1 text-sm font-medium text-muted">
          Portfolio balance <InfoIcon />
        </button>
        <p className="text-[34px] font-extrabold leading-tight tracking-tight tabular-nums">{fmt(value)}</p>
        <p className={`text-sm font-bold tabular-nums ${up ? "text-pos" : "text-brick"}`}>
          {up ? "▲" : "▼"} {fmt(Math.abs(change.cents))} ({pct(Math.abs(change.pct), 2)}) <span className="font-medium text-muted">{RANGE_LABEL[range]}</span>
        </p>
        <div className="mt-2">
          <PortfolioChart points={points} />
        </div>
        <div role="group" aria-label="Chart range" className="mt-1 flex justify-between">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`min-h-10 min-w-12 rounded-lg px-2 text-xs font-extrabold ${range === r ? "bg-green text-white" : "text-muted"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Card className="p-3">
          <p className="text-xs text-muted">Rent income this month</p>
          <p className="text-lg font-extrabold tabular-nums text-gold-ink">{fmt(thisMonth)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">Cash</p>
          <p className="text-lg font-extrabold tabular-nums">{fmt(w.cash)}</p>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Link href="/explore" className="grid min-h-12 place-items-center rounded-xl bg-green text-sm font-bold text-white active:bg-green-2">
          Invest
        </Link>
        <button onClick={getDollars} className="min-h-12 rounded-xl bg-card text-sm font-bold text-green active:bg-green-soft">
          Add cash
        </button>
        <button
          onClick={doClaim}
          disabled={owed === 0}
          className="min-h-12 rounded-xl bg-gold-soft text-sm font-bold text-gold-ink active:brightness-95 disabled:bg-card disabled:text-muted disabled:opacity-70"
        >
          {owed > 0 ? `Claim ${fmt(owed)}` : "Claim"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-brick">{msg}</p>}
      <p className="mt-2 text-xs text-muted">&ldquo;Add cash&rdquo; adds $100 of test dollars (pretend money, up to $500 a day).</p>

      <div className="mt-3">
        <DemoClock />
      </div>

      {w.cash === 0 && w.positions.length === 0 && (
        <Card className="mt-3 bg-green-soft">
          <p className="font-extrabold text-green">Try the demo in 3 steps</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink">
            <li>Tap <b>Add cash</b> for $100 of pretend money.</li>
            <li>Invest $10 or more in a raise on <b>Explore</b>.</li>
            <li>Skip ahead with the demo clock and watch your money work.</li>
          </ol>
        </Card>
      )}

      {live.length > 0 && (
        <>
          <SectionTitle action={<Link href="/me" className="min-h-11 content-center text-sm font-bold text-green">See all</Link>}>Your properties</SectionTitle>
          <ul className="space-y-2">
            {live.map((h) => {
              const p = projectById(h.projectId)!;
              const v = positionValue(w, h);
              const ch = h.invested > 0 ? (v + h.earned - h.invested) / h.invested : 0;
              return (
                <li key={h.projectId + h.status}>
                  <Link href={`/project/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-card p-2.5">
                    <Photo id={p.photos[0]} alt="" className="size-12 shrink-0 rounded-xl" sizes="48px" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{p.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {h.tokens} tokens · {h.status === "escrow" ? "in escrow" : projectState(w, p.id).stage.toLowerCase()}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-extrabold tabular-nums">{fmt(v)}</span>
                      {h.status === "escrow" ? (
                        <span className="text-sm font-semibold text-muted">escrow</span>
                      ) : (
                        <span className={`text-sm font-bold tabular-nums ${ch >= 0 ? "text-pos" : "text-brick"}`}>
                          {ch >= 0 ? "+" : "−"}
                          {pct(Math.abs(ch))}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {featured && (
        <>
          <SectionTitle action={<Link href="/explore" className="min-h-11 content-center text-sm font-bold text-green">See all</Link>}>Raising now</SectionTitle>
          <Link href={`/project/${featured.id}`} className="block overflow-hidden rounded-2xl">
            <Photo id={featured.photos[0]} alt={featured.name} className="h-44">
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 pt-10 text-white">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold leading-tight">
                    {featured.name} <span className="font-medium text-white/80">· {featured.neighborhood}</span>
                  </p>
                  <Pill tone="gold">Raising</Pill>
                </div>
                <p className="mt-1 text-sm tabular-nums">
                  <b>{fmt0(projectState(w, featured.id).raised)}</b> of {fmt0(featured.raiseGoal)} · refunded automatically if it misses
                </p>
                <div className="mt-2">
                  <Progress value={projectState(w, featured.id).raised / featured.raiseGoal} tone="gold" label="Raise progress" />
                </div>
              </div>
            </Photo>
          </Link>
        </>
      )}

      <SectionTitle>Activity</SectionTitle>
      <Activity world={w} />

      <SectionTitle>Tools</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/simulate" className="flex min-h-28 flex-col justify-between rounded-2xl bg-green p-3.5 text-white">
          <span className="grid size-9 place-items-center rounded-lg bg-white/15">
            <PlayIcon className="size-5" />
          </span>
          <span>
            <span className="block font-extrabold">Block Simulator</span>
            <span className="text-xs text-white/80">Fix a house, watch the money move</span>
          </span>
        </Link>
        <Link href="/simulate/grow" className="flex min-h-28 flex-col justify-between rounded-2xl bg-card p-3.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-gold-ink">
            <ArrowRightIcon className="size-5" />
          </span>
          <span>
            <span className="block font-extrabold">Grow the app</span>
            <span className="text-xs text-muted">What if thousands used it?</span>
          </span>
        </Link>
      </div>

      <SectionTitle action={<Link href="/impact" className="min-h-11 content-center text-sm font-bold text-green">See impact</Link>}>Your neighborhood</SectionTitle>
      <Link href="/impact" className="block overflow-hidden rounded-2xl bg-card">
        <Photo id="street" alt="Tree-lined residential street" className="h-28" />
        <div className="grid grid-cols-3 gap-2 p-3 text-center">
          <div>
            <p className="text-xl font-extrabold text-green">{imp.residentOwners.toLocaleString()}</p>
            <p className="text-xs text-muted">residents are owners</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-green">{imp.homes}</p>
            <p className="text-xs text-muted">homes owned by the block</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-gold-ink">{fmt0(imp.dollarsKept)}</p>
            <p className="text-xs text-muted">kept local</p>
          </div>
        </div>
      </Link>

      <Sheet open={usdc} onClose={() => setUsdc(false)} title="What is USDC?">
        <p>Your balance is held in USDC, a digital dollar designed to always be worth $1. We show it in dollars because that&apos;s what it is.</p>
        <p>It lives in a smart wallet that only you control, secured with your face or fingerprint. No seed phrase to lose, and OwnTheBlock pays every transaction fee.</p>
        <p className="rounded-xl bg-gold-soft p-3 text-sm text-gold-ink">In this demo the dollars are pretend. Total value = wallet + what your holdings are worth + payouts waiting to be claimed.</p>
        <Link href="/learn/what-is-usdc" className="font-semibold text-green underline">
          2-minute lesson: What is USDC?
        </Link>
      </Sheet>
    </main>
  );
}
