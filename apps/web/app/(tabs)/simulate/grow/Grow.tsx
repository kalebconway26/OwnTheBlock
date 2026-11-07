"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Card, Disclosure, Sheet } from "@/components/ui";
import Photo from "@/components/Photo";
import { InfoIcon } from "@/components/icons";
import { BASE, GrowthInputs, GrowthMonth, SCENARIOS, project, stack } from "@/lib/growth";
import { dollars, fmt, fmt0, pct } from "@/lib/finance";

type ScenarioName = keyof typeof SCENARIOS;

/** $1.2M style labels for big numbers. */
const money = (c: number) => {
  const d = c / 100;
  if (Math.abs(d) >= 1e9) return `$${(d / 1e9).toFixed(1)}B`;
  if (Math.abs(d) >= 1e6) return `$${(d / 1e6).toFixed(1)}M`;
  if (Math.abs(d) >= 1e3) return `$${Math.round(d / 1e3)}K`;
  return `$${Math.round(d)}`;
};
const count = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : Math.round(n).toLocaleString());

const EXPLAIN: Record<string, (m: GrowthMonth, i: GrowthInputs) => string> = {
  investors: (m, i) => `Greensboro starts with ${i.pilotInvestors} investors. From month ${i.expansionStartMonth}, a new HBCU community launches every ${i.monthsPerNewCommunity} months (up to ${i.maxCommunities}). Each adds about ${i.newPerCommunityMonthly} investors a month until it levels off at ${i.maxPerCommunity.toLocaleString()}, and ${pct(i.monthlyChurn)} leave each month. Now: ${m.communities} communities.`,
  invested: (_m, i) => `Each new investor puts in ${fmt0(i.firstDeposit)}, then everyone adds ${fmt(i.monthlyContribution)} a month on average, plus ${pct(i.reinvestShare, 0)} of their payouts are reinvested.`,
  homes: (m, i) => `${pct(i.homeShare, 0)} of new money goes to homes. Each home needs ${fmt0(i.homeCost)} plus ${pct(i.offeringCosts + i.raiseFee, 0)} in raise fees and legal costs. A neighborhood can only supply about ${i.maxHomesPerCommunity} good homes, so money can end up waiting for deals (${money(m.waiting)} right now).`,
  businesses: (m, i) => `${pct(1 - i.homeShare, 0)} of new money funds revenue-share deals of about ${fmt0(i.dealSize)}. They repay 1.4× over 42 months; about ${pct(i.businessFailureRate, 0)} close each year (losses after a 10% first-loss cover). ${m.activeBusinesses} are active and ${m.businessesClosed} have closed.`,
  wealth: (m) => `Payouts ${money(m.payoutsTotal)} + home appreciation ${money(m.appreciation)} (on paper until a sale) − business losses ${money(m.losses)}.`,
  tenants: (m, i) => `Tenants pay $1,400 instead of a ${fmt0(i.marketRent)} market rent, saving ${money(m.tenantSavings)} so far, and earn rent-to-own tokens worth 2% of rent: ${money(m.tenantEquity)} of ownership.`,
  jobs: () => "3 jobs per active business deal plus a quarter of a job per home for maintenance and management. Assumptions, based on small-business averages.",
  local: () => "60% of payouts go to local investors, 70% of renovation budgets go to local contractors, plus what tenants save on rent.",
};

export default function Grow() {
  const [scenario, setScenario] = useState<ScenarioName>("Base");
  const [over, setOver] = useState<Partial<GrowthInputs>>({});
  const [year, setYear] = useState(5);
  const [why, setWhy] = useState<string | null>(null);
  const [tune, setTune] = useState(false);
  const inputs: GrowthInputs = useMemo(() => ({ ...SCENARIOS[scenario], ...over }), [scenario, over]);
  const result = useMemo(() => project(inputs, 120), [inputs]);
  const m = result.months[year * 12 - 1];
  const data = result.months.filter((x) => x.month % 3 === 0).map((x) => ({
    y: x.month / 12,
    investors: x.investors,
    homes: x.homes,
    payouts: x.payoutsTotal / 100,
    appreciation: Math.max(0, x.appreciation) / 100,
    wealth: x.wealthCreated / 100,
    revenue: x.revenue / 100,
    costs: x.costs / 100,
  }));
  const jasmine = stack(dollars(40), year, result.annualReturn);
  const jEnd = jasmine[jasmine.length - 1];
  const savingsEnd = stack(dollars(40), year, 0.04)[jasmine.length - 1];
  const set = (patch: Partial<GrowthInputs>) => setOver((o) => ({ ...o, ...patch }));

  return (
    <div className="px-4 pb-10">
      <header className="pt-3">
        <h1 className="text-xl font-extrabold">Grow the app</h1>
        <p className="text-sm text-muted">What happens to neighborhoods, investors and OwnTheBlock itself if real money pours in and the app spreads to HBCU communities across the country?</p>
      </header>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(SCENARIOS) as ScenarioName[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setScenario(s);
              setOver((o) => ({ housingDip: o.housingDip, recession: o.recession, assetFee: o.assetFee }));
            }}
            aria-pressed={scenario === s}
            className={`min-h-11 rounded-xl border-2 text-sm font-semibold ${scenario === s ? "border-green bg-green-soft text-green" : "border-line bg-paper"}`}
          >
            {s === "Slow" ? "Slow growth" : s === "Base" ? "Base case" : "Breakout"}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
        {[
          ["housingDip", "Housing dip (−10%)"],
          ["recession", "Recession (years 3–4)"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => set({ [k]: !inputs[k as "housingDip" | "recession"] })}
            aria-pressed={!!inputs[k as "housingDip" | "recession"]}
            className={`min-h-11 shrink-0 rounded-full border-2 px-3 text-sm font-semibold ${inputs[k as "housingDip"] ? "border-brick bg-brick-soft text-brick" : "border-line bg-paper"}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => set({ assetFee: inputs.assetFee ? 0 : 0.01 })}
          aria-pressed={inputs.assetFee > 0}
          className={`min-h-11 shrink-0 rounded-full border-2 px-3 text-sm font-semibold ${inputs.assetFee ? "border-green bg-green-soft text-green" : "border-line bg-paper"}`}
        >
          +1% yearly asset fee
        </button>
      </div>

      <label className="mt-3 block">
        <span className="flex justify-between font-semibold">
          <span>Look ahead</span>
          <span className="text-green">Year {year}</span>
        </span>
        <input type="range" min={1} max={10} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-valuetext={`Year ${year}`} />
      </label>

      <Card className="overflow-hidden p-0">
        <Photo id="fund" alt="A neighborhood of single-family homes" className="h-36">
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-1 p-3 text-center text-white">
            <div>
              <p className="text-2xl font-extrabold">{count(m.investors)}</p>
              <p className="text-xs text-white/85">investors</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{m.communities}</p>
              <p className="text-xs text-white/85">communities</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{count(m.homes)}</p>
              <p className="text-xs text-white/85">homes owned</p>
            </div>
          </div>
        </Photo>
      </Card>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Tile label="Money invested" value={money(m.invested)} onWhy={() => setWhy("invested")} />
        <Tile label="Wealth created for investors" value={money(m.wealthCreated)} tone="gold" onWhy={() => setWhy("wealth")} />
        <Tile label="Businesses funded" value={count(m.businessesFunded)} onWhy={() => setWhy("businesses")} />
        <Tile label="Investors (how they grow)" value={count(m.investors)} onWhy={() => setWhy("investors")} />
        <Tile label="Tenant rent savings + equity" value={money(m.tenantSavings + m.tenantEquity)} onWhy={() => setWhy("tenants")} />
        <Tile label="Local jobs supported" value={count(m.jobs)} onWhy={() => setWhy("jobs")} />
        <Tile label="Dollars kept local" value={money(m.dollarsKept)} onWhy={() => setWhy("local")} />
        <Tile label="Homes (and the limit)" value={count(m.homes)} onWhy={() => setWhy("homes")} />
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Growth</h2>
      <Card className="p-2">
        <p className="px-2 pt-1 text-sm font-semibold">Investors and homes owned</p>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis dataKey="y" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={(v) => `Y${v}`} tick={{ fontSize: 10, fill: "#5d6678" }} />
              <YAxis yAxisId="a" tickFormatter={count} tick={{ fontSize: 10, fill: "#5d6678" }} width={40} />
              <YAxis yAxisId="b" orientation="right" tickFormatter={count} tick={{ fontSize: 10, fill: "#8a6400" }} width={36} />
              <Tooltip formatter={(v, n) => [count(Number(v)), n === "investors" ? "Investors" : "Homes"]} labelFormatter={(v) => `Year ${Number(v).toFixed(1)}`} />
              <ReferenceLine yAxisId="a" x={year} stroke="#d9a21b" strokeDasharray="3 3" />
              <Line yAxisId="a" dataKey="investors" stroke="#14306b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="b" dataKey="homes" stroke="#8a6400" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="px-2 pb-1 text-xs text-muted">
          <b className="text-green">●</b> Investors (left) <b className="ml-2 text-gold-ink">●</b> Homes (right)
        </p>
      </Card>

      <h2 className="mb-2 mt-6 text-lg font-bold">Wealth created</h2>
      <Card className="p-2">
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <XAxis dataKey="y" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={(v) => `Y${v}`} tick={{ fontSize: 10, fill: "#5d6678" }} />
              <YAxis tickFormatter={(v) => money(Number(v) * 100)} tick={{ fontSize: 10, fill: "#5d6678" }} width={44} />
              <Tooltip formatter={(v, n) => [money(Number(v) * 100), n === "payouts" ? "Cash payouts" : "Home appreciation"]} labelFormatter={(v) => `Year ${Number(v).toFixed(1)}`} />
              <ReferenceLine x={year} stroke="#d9a21b" strokeDasharray="3 3" />
              <Area dataKey="payouts" stackId="w" stroke="#8a6400" fill="#fbefd2" isAnimationActive={false} />
              <Area dataKey="appreciation" stackId="w" stroke="#14306b" fill="#e2efe5" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="px-2 pb-1 text-xs text-muted">
          Cash payouts (gold) + home appreciation (green). Projected return on money invested: <b>{pct(result.annualReturn)} a year</b>, after business losses.
        </p>
      </Card>

      <h2 className="mb-2 mt-6 text-lg font-bold">One investor&apos;s story</h2>
      <Card className="overflow-hidden p-0">
        <Photo id="bungalow-2" alt="A brick bungalow" className="h-28" />
        <div className="p-4">
          <p>
            Jasmine puts <b>$40 a month</b> into OwnTheBlock for {year} year{year > 1 ? "s" : ""} and reinvests everything.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-card p-2">
              <p className="font-extrabold">{fmt0(jEnd.putIn)}</p>
              <p className="text-xs text-muted">she put in</p>
            </div>
            <div className="rounded-xl bg-green-soft p-2">
              <p className="font-extrabold text-green">{fmt0(jEnd.balance)}</p>
              <p className="text-xs text-muted">OwnTheBlock*</p>
            </div>
            <div className="rounded-xl bg-sky p-2">
              <p className="font-extrabold">{fmt0(savingsEnd.balance)}</p>
              <p className="text-xs text-muted">4% savings</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            *At the projected {pct(result.annualReturn)} a year, including paper gains on homes. Plus what isn&apos;t in the number: lessons, credit-building and a voice on her block. $0.68 a year from one $10 token is the start; stacking is how it grows.
          </p>
        </div>
      </Card>

      <h2 className="mb-2 mt-6 text-lg font-bold">Can OwnTheBlock pay its own bills?</h2>
      <Card className="p-2">
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <XAxis dataKey="y" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={(v) => `Y${v}`} tick={{ fontSize: 10, fill: "#5d6678" }} />
              <YAxis tickFormatter={(v) => money(Number(v) * 100)} tick={{ fontSize: 10, fill: "#5d6678" }} width={44} />
              <Tooltip formatter={(v, n) => [money(Number(v) * 100) + "/mo", n === "revenue" ? "Revenue" : "Costs"]} labelFormatter={(v) => `Year ${Number(v).toFixed(1)}`} />
              <ReferenceLine x={year} stroke="#d9a21b" strokeDasharray="3 3" />
              <Line dataKey="revenue" stroke="#14306b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line dataKey="costs" stroke="#b4372a" strokeWidth={2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2 text-center text-sm">
          <div className={`rounded-xl p-2 ${result.breakEvenMonth ? "bg-green-soft" : "bg-brick-soft"}`}>
            <p className={`font-extrabold ${result.breakEvenMonth ? "text-green" : "text-brick"}`}>
              {result.breakEvenMonth ? `Year ${(result.breakEvenMonth / 12).toFixed(1)}` : "Not in 10 years"}
            </p>
            <p className="text-xs text-muted">breaks even</p>
          </div>
          <div className="rounded-xl bg-card p-2">
            <p className="font-extrabold">{money(result.fundingNeeded)}</p>
            <p className="text-xs text-muted">startup funding needed first</p>
          </div>
        </div>
        <p className="px-2 pb-2 text-xs text-muted">
          <b className="text-green">●</b> Revenue: 3% raise fee + 2% of rent and business repayments + 0.5% trading fee{inputs.assetFee ? " + 1% yearly asset fee" : ""}.{" "}
          <b className="text-brick">●</b> Costs: a {fmt0(inputs.fixedCostsMonthly)}/mo core team and compliance, {fmt0(inputs.costPerCommunityMonthly)}/mo per community, ID checks.
          {!inputs.assetFee && " Try the +1% yearly asset fee to see how much the fee model matters."}
        </p>
      </Card>

      <h2 className="mb-2 mt-6 text-lg font-bold">What limits growth</h2>
      <Card className="space-y-2 text-sm">
        <p>
          <b>Deal supply.</b> Money waiting for a home or business to fund in year {year}: <b>{money(m.waiting)}</b>. Each neighborhood only has so many good deals, so growth means more
          communities, not just more money.
        </p>
        <p>
          <b>Business risk.</b> {m.businessesClosed} of {m.businessesFunded} businesses closed by year {year}, losing {money(m.losses)} after first-loss cover.
        </p>
        <p>
          <b>Thin fees.</b> 2% of $1,400 rent is $28 a month per home. The company needs a lot of homes, or a different fee, to pay a team.
        </p>
      </Card>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => setTune(true)} className="flex-1">
          Change assumptions
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setOver({});
            setScenario("Base");
          }}
          className="flex-1"
        >
          Reset
        </Button>
      </div>
      <div className="mt-4">
        <Disclosure />
        <p className="mt-2 text-xs text-muted">A projection, not a promise. Built from the per-home and per-business formulas in the spec plus the assumptions above.</p>
      </div>

      <Sheet open={!!why} onClose={() => setWhy(null)} title="How is this calculated?">
        {why && <p>{EXPLAIN[why](m, inputs)}</p>}
        <p className="text-xs text-muted">Values for year {year} of the {scenario.toLowerCase()} scenario.</p>
      </Sheet>

      <Sheet open={tune} onClose={() => setTune(false)} title="Assumptions">
        <Slide label="New investors per community each month" v={inputs.newPerCommunityMonthly} min={10} max={200} step={5} show={String(inputs.newPerCommunityMonthly)} on={(v) => set({ newPerCommunityMonthly: v })} />
        <Slide label="Months between new communities" v={inputs.monthsPerNewCommunity} min={1} max={12} step={1} show={String(inputs.monthsPerNewCommunity)} on={(v) => set({ monthsPerNewCommunity: v })} />
        <Slide label="Average monthly contribution" v={inputs.monthlyContribution / 100} min={5} max={150} step={5} show={fmt0(inputs.monthlyContribution)} on={(v) => set({ monthlyContribution: dollars(v) })} />
        <Slide label="Investors leaving each month" v={inputs.monthlyChurn * 100} min={0} max={5} step={0.25} show={pct(inputs.monthlyChurn)} on={(v) => set({ monthlyChurn: v / 100 })} />
        <Slide label="Share of money going to homes" v={inputs.homeShare * 100} min={0} max={100} step={5} show={pct(inputs.homeShare, 0)} on={(v) => set({ homeShare: v / 100 })} />
        <Slide label="Home value growth per year" v={inputs.appreciation * 100} min={-3} max={8} step={0.5} show={pct(inputs.appreciation)} on={(v) => set({ appreciation: v / 100 })} />
        <Slide label="Businesses closing per year" v={inputs.businessFailureRate * 100} min={0} max={30} step={1} show={pct(inputs.businessFailureRate, 0)} on={(v) => set({ businessFailureRate: v / 100 })} />
        <Slide label="Good homes per neighborhood" v={inputs.maxHomesPerCommunity} min={5} max={150} step={5} show={String(inputs.maxHomesPerCommunity)} on={(v) => set({ maxHomesPerCommunity: v })} />
        <Slide label="Company core costs per month" v={inputs.fixedCostsMonthly / 100} min={10000} max={150000} step={5000} show={fmt0(inputs.fixedCostsMonthly)} on={(v) => set({ fixedCostsMonthly: dollars(v) })} />
        <p className="text-xs text-muted">Base case defaults: {BASE.newPerCommunityMonthly} new investors per community a month, a new community every {BASE.monthsPerNewCommunity} months, {fmt0(BASE.monthlyContribution)} a month each.</p>
      </Sheet>
    </div>
  );
}

function Tile({ label, value, tone, onWhy }: { label: string; value: string; tone?: "gold"; onWhy: () => void }) {
  return (
    <button onClick={onWhy} className="rounded-2xl border border-line bg-paper p-3 text-left shadow-sm active:bg-card">
      <span className="flex items-center gap-1 text-xs text-muted">
        {label} <InfoIcon className="size-3.5 shrink-0" />
      </span>
      <span className={`block text-xl font-extrabold tabular-nums ${tone === "gold" ? "text-gold-ink" : "text-green"}`}>{value}</span>
    </button>
  );
}

function Slide({ label, v, min, max, step, show, on }: { label: string; v: number; min: number; max: number; step: number; show: string; on: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span>{label}</span>
        <b className="text-green">{show}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(Number(e.target.value))} aria-valuetext={show} />
    </label>
  );
}
