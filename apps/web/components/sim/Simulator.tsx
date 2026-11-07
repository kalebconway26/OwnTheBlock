"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useReducedMotion } from "framer-motion";
import {
  ASSETS,
  AssetId,
  DEFAULT_CONFIG,
  EVENT_LABELS,
  EventType,
  MAX_MONTHS,
  PRESETS,
  SimConfig,
  SimEvent,
  assetById,
  monthLabel,
  portfolioValue,
  simulate,
  totalReturn,
} from "@/lib/sim";
import { ExplainKey, explain } from "@/lib/sim/explain";
import { dollars, fmt, fmt0, pct } from "@/lib/finance";
import { Button, Card, Disclosure, Progress, Sheet } from "@/components/ui";
import { BoxIcon, DoorIcon, FlameIcon, HammerIcon, InfoIcon, PauseIcon, PlayIcon, SnowIcon, TagIcon, VoteIcon } from "@/components/icons";
import Photo from "@/components/Photo";
import Street, { statusText } from "./Street";
import MoneyFlow from "./MoneyFlow";
import Ledger from "./Ledger";
import Story from "./Story";

const STORY_KEY = "otb-story-done";
const EVENTS: EventType[] = ["vacancy", "roof", "rentIncrease", "bestMonth", "slowWinter", "sale", "businessCloses"];
const EVENT_ICON: Record<EventType, (p: { className?: string }) => React.ReactElement> = {
  vacancy: BoxIcon,
  roof: HammerIcon,
  rentIncrease: VoteIcon,
  bestMonth: FlameIcon,
  slowWinter: SnowIcon,
  sale: TagIcon,
  businessCloses: DoorIcon,
};
const BAD_EVENTS: EventType[] = ["vacancy", "roof", "slowWinter", "businessCloses"];

// Photos for each building on the simulated street (openly licensed stand-ins).
const ASSET_PHOTO: Record<AssetId, string> = {
  "sample-st": "sample-st",
  "corner-cuts": "corner-cuts",
  "corner-store": "corner-store",
  "example-ave": "example-ave",
  laundromat: "laundromat",
  "market-lot": "street",
  "demo-ct": "demo-ct",
};

// Community slider runs on a log scale so 10 → 5,000 feels even under a thumb.
const toCommunity = (v: number) => Math.round(Math.pow(10, 1 + (v / 100) * Math.log10(500)) / 10) * 10 || 10;
const fromCommunity = (n: number) => (100 * (Math.log10(n) - 1)) / Math.log10(500);

type UrlState = { config: Partial<SimConfig>; events: SimEvent[]; month: number; fromLink: boolean };

function readUrl(): UrlState {
  const out: UrlState = { config: {}, events: [], month: 0, fromLink: false };
  if (typeof window === "undefined") return out;
  const q = new URLSearchParams(window.location.search);
  const shared = q.get("s");
  if (shared) {
    try {
      const parsed = JSON.parse(atob(shared));
      out.config = parsed.c ?? {};
      out.events = parsed.e ?? [];
      out.fromLink = true;
    } catch {
      /* ignore a broken link and start fresh */
    }
  }
  const amount = Number(q.get("amount"));
  if (amount >= 10 && amount <= 1000) {
    out.config.amount = dollars(amount);
    out.fromLink = true;
  }
  const focus = q.get("focus");
  if (focus === "homes") out.config.alloc = { homes: 1, business: 0, fund: 0 };
  if (focus === "business") out.config.alloc = { homes: 0, business: 1, fund: 0 };
  if (focus === "fund") out.config.alloc = { homes: 0, business: 0, fund: 1 };
  if (focus) out.fromLink = true;
  // ?month=36 jumps straight to year 3, handy for demos.
  const month = Number(q.get("month"));
  if (month > 0 && month <= MAX_MONTHS) {
    out.month = Math.round(month);
    out.fromLink = true;
  }
  return out;
}

export default function Simulator() {
  const reduceMotion = useReducedMotion();
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [month, setMonth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  const [compare, setCompare] = useState(false);
  const [story, setStory] = useState<boolean | null>(null);
  const [why, setWhy] = useState<ExplainKey | null>(null);
  const [building, setBuilding] = useState<AssetId | null>(null);
  const [copied, setCopied] = useState(false);

  // Read deep links once, after hydration, and decide whether to show story mode.
  useEffect(() => {
    const { config: c, events: e, month: m, fromLink } = readUrl();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL and storage after mount */
    if (Object.keys(c).length) setConfig((prev) => ({ ...prev, ...c }));
    if (e.length) setEvents(e);
    if (m) setMonth(m);
    let done = false;
    try {
      done = localStorage.getItem(STORY_KEY) === "1";
    } catch {
      /* private mode: just show the story */
    }
    setStory(!done && !fromLink);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const run = useMemo(() => simulate(config, events), [config, events]);
  const s = run[month];
  const monthMs = fast ? 250 : 1000;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setMonth((m) => {
        if (m >= MAX_MONTHS) {
          setPlaying(false);
          return m;
        }
        return m + 1;
      });
    }, monthMs);
    return () => clearInterval(t);
  }, [playing, monthMs]);

  const update = useCallback((patch: Partial<SimConfig>) => setConfig((c) => ({ ...c, ...patch })), []);

  const trigger = (type: EventType) => {
    // An event happens next month; anything planned after now is replaced by this new timeline.
    const at = Math.min(MAX_MONTHS, month + 1);
    setEvents((ev) => [...ev.filter((e) => e.month <= month), { month: at, type }]);
    setMonth(at);
    navigator.vibrate?.(15);
  };

  const setAlloc = (key: keyof SimConfig["alloc"], value: number) => {
    const others = (Object.keys(config.alloc) as (keyof SimConfig["alloc"])[]).filter((k) => k !== key);
    const rest = others.reduce((sum, k) => sum + config.alloc[k], 0);
    const remaining = 1 - value;
    const alloc = { ...config.alloc, [key]: value };
    for (const k of others) alloc[k] = rest > 0 ? (config.alloc[k] / rest) * remaining : remaining / others.length;
    update({ alloc });
  };

  const finishStory = (startWithTen: boolean) => {
    try {
      localStorage.setItem(STORY_KEY, "1");
    } catch {
      /* fine */
    }
    if (startWithTen) {
      update({ amount: dollars(10) });
      setMonth(0);
      setPlaying(true);
    }
    setStory(false);
    window.scrollTo({ top: 0 });
  };

  const share = async () => {
    const link = `${window.location.origin}/simulate?s=${btoa(JSON.stringify({ c: config, e: events }))}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", link);
    }
  };

  if (story === null) return <div className="h-96" aria-busy="true" />;
  if (story) return <Story onDone={finishStory} />;

  const value = portfolioValue(s, config);
  const ret = totalReturn(s, config);
  const history = s.history.map((p) => ({
    m: p.month,
    value: p.value / 100,
    savings: p.savings / 100,
    cash: p.cash / 100,
  }));
  const sel = building ? s.assets.find((a) => a.id === building) : null;
  const selDef = building ? assetById(building) : null;

  return (
    <div className="pb-40">
      <header className="flex items-center justify-between px-4 pt-3">
        <div>
          <h1 className="text-xl font-extrabold">Block Simulator</h1>
          <p className="text-sm text-muted">{monthLabel(month)} · month {month} of 120</p>
        </div>
        <button onClick={() => setStory(true)} className="min-h-11 rounded-full bg-green-soft px-4 text-sm font-semibold text-green">
          ▶ Story
        </button>
      </header>

      <section aria-label="Your block" className="mt-2 border-y border-line">
        <Street assets={s.assets} onSelect={setBuilding} />
      </section>

      <div className="min-h-14 px-4 pt-2" aria-live="polite">
        {s.notes.slice(0, 2).map((n, i) => (
          <p key={i} className="text-sm leading-snug">
            {n}
          </p>
        ))}
        {!s.notes.length && <p className="text-sm text-muted">Tap a building to see its story. Press play to watch the months go by.</p>}
      </div>

      <section aria-label="Money flow" className="px-2">
        <MoneyFlow flows={s.flows} tick={month} duration={Math.min(0.9, (monthMs / 1000) * 0.32)} />
      </section>

      <section aria-label="Ledger" className="mt-1">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="text-sm font-bold">Blockchain ledger</h2>
          <span className="text-xs text-muted">Gold = your wallet</span>
        </div>
        <Ledger blocks={s.ledger.slice(-20)} />
      </section>

      {/* My Results */}
      <section className="px-4" aria-label="My results">
        <h2 className="mb-2 mt-4 text-lg font-bold">My results</h2>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Invested" value={fmt(s.invested)} onWhy={() => setWhy("invested")} />
          <Stat label="Earned" value={fmt(s.earned)} tone="gold" onWhy={() => setWhy("earned")} />
          <Stat label="Current value" value={fmt(value)} onWhy={() => setWhy("value")} />
          <Stat label="Total return" value={`${ret >= 0 ? "+" : ""}${pct(ret)}`} tone={ret < 0 ? "brick" : "green"} onWhy={() => setWhy("return")} />
        </div>
        <Card className="mt-2 p-2">
          <div className="h-36" aria-label="Chart of your value over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#5d6678" }} tickFormatter={(m) => `${Math.floor(m / 12)}y`} interval={23} />
                <YAxis tick={{ fontSize: 10, fill: "#5d6678" }} tickFormatter={(v) => `$${Math.round(v)}`} width={44} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} labelFormatter={(m) => monthLabel(Number(m))} />
                <Line type="monotone" dataKey="value" name="OwnTheBlock" stroke="#14306b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                {compare && <Line type="monotone" dataKey="savings" name="Savings" stroke="#6d8fb3" strokeWidth={2} dot={false} isAnimationActive={false} />}
                {compare && <Line type="monotone" dataKey="cash" name="Cash" stroke="#b4372a" strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {compare && (
            <div className="grid grid-cols-3 gap-1 px-1 pb-1 text-center text-xs">
              <button onClick={() => setWhy("value")} className="min-h-11 rounded-lg bg-green-soft p-1">
                <span className="block font-bold text-green">{fmt(value)}</span>OwnTheBlock
              </button>
              <button onClick={() => setWhy("savings")} className="min-h-11 rounded-lg bg-sky p-1">
                <span className="block font-bold">{fmt(s.history[s.history.length - 1].savings)}</span>Savings {pct(config.savingsApy, 1)}
              </button>
              <button onClick={() => setWhy("cash")} className="min-h-11 rounded-lg bg-brick-soft p-1">
                <span className="block font-bold text-brick">{fmt(s.history[s.history.length - 1].cash)}</span>Cash
              </button>
            </div>
          )}
        </Card>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <button onClick={() => setWhy("home")} className="min-h-11 rounded-full border border-line bg-paper px-3 font-semibold text-green">
            How is the house payout calculated?
          </button>
          <button onClick={() => setWhy("business")} className="min-h-11 rounded-full border border-line bg-paper px-3 font-semibold text-green">
            …the barbershop payout?
          </button>
        </div>
      </section>

      {/* Impact */}
      <section className="px-4" aria-label="Community impact">
        <div className="mb-2 mt-6 flex items-end justify-between">
          <h2 className="text-lg font-bold">Neighborhood impact</h2>
          <button onClick={() => setWhy("impact")} className="flex min-h-11 items-center gap-1 text-sm font-semibold text-green">
            <InfoIcon /> How?
          </button>
        </div>
        <Card className="space-y-3">
          <Meter label="Homes kept affordable" value={`${s.impact.homesAffordable} of 3`} frac={s.impact.homesAffordable / 3} />
          <Meter label="Local jobs supported" value={String(s.impact.jobs)} frac={s.impact.jobs / 30} />
          <Meter label="Dollars kept in the neighborhood" value={fmt0(s.impact.dollarsKept)} frac={s.impact.dollarsKept / dollars(500_000)} />
          <Meter label="Residents who are owners" value={s.impact.residentOwners.toLocaleString()} frac={s.impact.residentOwners / 2000} />
          <Meter label="Repairs completed" value={String(s.impact.repairs)} frac={s.impact.repairs / 15} />
        </Card>
      </section>

      {/* Controls */}
      <section className="px-4" aria-label="Simulator controls">
        <h2 className="mb-2 mt-6 text-lg font-bold">Try it your way</h2>
        <Card className="space-y-4">
          <Slider
            label="Your investment"
            value={fmt0(config.amount)}
            min={10}
            max={1000}
            step={10}
            v={config.amount / 100}
            onChange={(v) => update({ amount: dollars(v) })}
          />
          <div>
            <p className="mb-2 text-sm font-semibold">Where it goes</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((name) => {
                const p = PRESETS[name];
                const on = Math.abs(p.homes - config.alloc.homes) < 0.01 && Math.abs(p.business - config.alloc.business) < 0.01;
                return (
                  <button
                    key={name}
                    onClick={() => update({ alloc: { ...p } })}
                    aria-pressed={on}
                    className={`min-h-11 rounded-xl border-2 text-sm font-semibold ${on ? "border-green bg-green-soft text-green" : "border-line bg-paper"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="mt-1">
              <Slider label="Homes" value={pct(config.alloc.homes, 0)} min={0} max={100} step={5} v={Math.round(config.alloc.homes * 100)} onChange={(v) => setAlloc("homes", v / 100)} compact />
              <Slider label="Businesses" value={pct(config.alloc.business, 0)} min={0} max={100} step={5} v={Math.round(config.alloc.business * 100)} onChange={(v) => setAlloc("business", v / 100)} compact />
              <Slider label="Neighborhood Fund" value={pct(config.alloc.fund, 0)} min={0} max={100} step={5} v={Math.round(config.alloc.fund * 100)} onChange={(v) => setAlloc("fund", v / 100)} compact />
            </div>
          </div>
          <Slider
            label="Neighbors investing"
            value={config.community.toLocaleString()}
            min={0}
            max={100}
            step={1}
            v={fromCommunity(config.community)}
            onChange={(v) => update({ community: Math.max(10, Math.min(5000, toCommunity(v))) })}
            hint="More neighbors fund more buildings, faster."
          />
          <Toggle label="Reinvest my earnings" hint="Payouts buy more tokens, so earnings compound." on={config.reinvest} onChange={(reinvest) => update({ reinvest })} />
          <Toggle label="Random life events" hint="Vacancies, repairs and slow months happen on their own." on={config.randomEvents} onChange={(randomEvents) => update({ randomEvents })} />
          <Toggle label="Compare with savings and cash" on={compare} onChange={setCompare} />
          {compare && (
            <Slider label="Savings account APY" value={pct(config.savingsApy, 1)} min={0} max={8} step={0.25} v={config.savingsApy * 100} onChange={(v) => update({ savingsApy: v / 100 })} compact />
          )}
        </Card>

        <h2 className="mb-2 mt-6 text-lg font-bold">What if…</h2>
        <p className="mb-2 text-sm text-muted">Tap an event and it happens next month. Losses show up as clearly as gains.</p>
        <div className="grid grid-cols-2 gap-2">
          {EVENTS.map((e) => {
            const Icon = EVENT_ICON[e];
            const bad = BAD_EVENTS.includes(e);
            return (
              <button key={e} onClick={() => trigger(e)} className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-left text-sm font-semibold active:bg-green-soft">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${bad ? "bg-brick-soft text-brick" : "bg-green-soft text-green"}`}>
                  <Icon />
                </span>
                {EVENT_LABELS[e]}
              </button>
            );
          })}
        </div>
        {events.length > 0 && (
          <button onClick={() => setEvents([])} className="mt-2 min-h-11 text-sm font-semibold text-brick underline">
            Clear {events.length} event{events.length > 1 ? "s" : ""}
          </button>
        )}

        <details className="mt-4 rounded-2xl border border-line bg-paper p-4">
          <summary className="min-h-8 cursor-pointer font-semibold">Assumptions</summary>
          <div className="mt-2 space-y-1">
            <Slider label="Home value growth per year" value={pct(config.appreciation, 1)} min={-3} max={8} step={0.5} v={config.appreciation * 100} onChange={(v) => update({ appreciation: v / 100 })} compact />
            <Slider label="Each neighbor adds per month" value={fmt0(config.neighborMonthly)} min={0} max={100} step={5} v={config.neighborMonthly / 100} onChange={(v) => update({ neighborMonthly: dollars(v) })} compact />
            <Slider label="Inflation" value={pct(config.inflation, 1)} min={0} max={8} step={0.5} v={config.inflation * 100} onChange={(v) => update({ inflation: v / 100 })} compact />
            <p className="text-xs text-muted">Neighbors invest the same starting amount as you, then the monthly amount above. 40% of investors are assumed to live in the zip code.</p>
          </div>
        </details>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={share} className="flex-1">
            {copied ? "Link copied ✓" : "Share this scenario"}
          </Button>
          <Button variant="gold" href="/explore" className="flex-1">
            Invest for real
          </Button>
        </div>
        <div className="mt-4">
          <Disclosure />
          <p className="mt-2 text-xs text-muted">Simulation: pretend money. Projects are fictional demo data.</p>
        </div>
      </section>

      {/* Sticky player */}
      <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-md px-3">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper/95 p-2 shadow-lg backdrop-blur">
          <button
            onClick={() => {
              if (month >= MAX_MONTHS) setMonth(0);
              setPlaying((p) => !p);
            }}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-green text-white"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={MAX_MONTHS}
              value={month}
              onChange={(e) => {
                setPlaying(false);
                setMonth(Number(e.target.value));
              }}
              aria-label="Month"
              aria-valuetext={`${monthLabel(month)}, month ${month}`}
              className="!h-8"
            />
            <div className="flex justify-between text-[11px] text-muted">
              <span>Year {Math.floor(month / 12)}</span>
              <span className="font-semibold text-gold-ink">{fmt(value)}</span>
            </div>
          </div>
          <button onClick={() => setFast((f) => !f)} className="min-h-12 min-w-12 rounded-xl bg-card px-2 text-sm font-bold" aria-label={fast ? "Normal speed" : "Fast speed"}>
            {fast ? "4×" : "1×"}
          </button>
        </div>
        <p className="mx-auto mt-1 w-fit rounded-full bg-gold-soft px-3 text-center text-[11px] font-semibold text-gold-ink">SIMULATION · pretend money{reduceMotion ? " · reduced motion" : ""}</p>
      </div>

      <Sheet open={!!why} onClose={() => setWhy(null)} title={why ? explain(why, s, config).title : ""}>
        {why &&
          (() => {
            const e = explain(why, s, config);
            return (
              <>
                <p className="rounded-xl bg-green-soft p-3 font-mono text-sm text-green">{e.formula}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {e.lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted">Source: {e.source} of the OwnTheBlock financial model. Values shown are for {monthLabel(month)}.</p>
              </>
            );
          })()}
      </Sheet>

      <Sheet open={!!sel} onClose={() => setBuilding(null)} title={selDef?.name ?? ""}>
        {sel && selDef && (
          <>
            <Photo id={ASSET_PHOTO[sel.id]} alt={selDef.name} className="h-44 rounded-2xl" />
            {(sel.status === "unfunded" || sel.status === "raising") && <p className="text-xs text-muted">Demo photo. Funding pays for the renovation.</p>}
            <p className="font-semibold">{statusText(sel.status)}</p>
            {sel.status === "raising" && (
              <div>
                <Progress value={sel.raised / selDef.raise} label="Raise progress" />
                <p className="mt-1 text-sm text-muted">
                  {fmt0(sel.raised)} of {fmt0(selDef.raise)} raised
                  {sel.raiseOpenedMonth !== null && ` · ${Math.max(0, 12 - (month - sel.raiseOpenedMonth))} months left before automatic refunds`}
                </p>
              </div>
            )}
            {selDef.kind === "home" ? (
              <p>Rent {fmt(sel.rent)}/month · reserve {fmt(sel.reserve)} · paid to investors so far {fmt(sel.totalDistributed)}.</p>
            ) : (
              <p>
                Revenue share {pct(selDef.business!.revenueShare, 0)} of sales until investors get {selDef.business!.capMultiple}× back. Repaid so far {fmt(sel.repaid)} of{" "}
                {fmt(selDef.raise * selDef.business!.capMultiple)}.
              </p>
            )}
            <p className="text-sm text-muted">
              Funding order on this block: {ASSETS.map((a) => a.short).join(" → ")}. Money from new neighbors fills one raise at a time.
            </p>
          </>
        )}
      </Sheet>
    </div>
  );
}

function Stat({ label, value, tone = "ink", onWhy }: { label: string; value: string; tone?: "ink" | "gold" | "green" | "brick"; onWhy: () => void }) {
  const color = { ink: "text-ink", gold: "text-gold-ink", green: "text-green", brick: "text-brick" }[tone];
  return (
    <button onClick={onWhy} className="rounded-2xl border border-line bg-paper p-3 text-left shadow-sm active:bg-card">
      <span className="flex items-center gap-1 text-xs text-muted">
        {label} <InfoIcon className="size-3.5" />
      </span>
      <span className={`block text-xl font-extrabold tabular-nums ${color}`}>{value}</span>
      <span className="sr-only">Tap to see how this is calculated</span>
    </button>
  );
}

function Meter({ label, value, frac }: { label: string; value: string; frac: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold tabular-nums">{value}</span>
      </div>
      <Progress value={frac} label={label} tone="gold" />
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  v,
  onChange,
  hint,
  compact,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  onChange: (v: number) => void;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className={`flex justify-between ${compact ? "text-sm" : "font-semibold"}`}>
        <span>{label}</span>
        <span className="font-bold tabular-nums text-green">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={value} />
      {hint && <span className="-mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex min-h-12 w-full items-center justify-between gap-3 text-left">
      <span>
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-green" : "bg-line"}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
