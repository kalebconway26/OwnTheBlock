"use client";

import Link from "next/link";
import { Button, Card, DemoBanner, Disclosure, Pill, Progress, SectionTitle } from "@/components/ui";
import Photo from "@/components/Photo";
import { projectById } from "@/lib/demo";
import { PHOTO_CREDITS } from "@/lib/photos";
import { canInvest, monthLabel, positionValue, projectState, tokenCount } from "@/lib/world";
import { useWorld } from "@/lib/world/store";
import { cashYield, fmt, fmt0, homeMonthly, paybackMonths, pct, repaymentCap } from "@/lib/finance";
import ReportsChart from "./ReportsChart";

export default function ProjectView({ id }: { id: string }) {
  const w = useWorld();
  const p = projectById(id)!;
  const s = projectState(w, id);
  const mine = w.positions.filter((x) => x.projectId === id && x.status !== "refunded");
  const check = canInvest(w, id);
  const open = p.type === "fund" || s.stage === "Raising";
  const home = p.home ? homeMonthly(p.home, s.rent || p.home.monthlyRent) : null;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-32">
      <DemoBanner />
      {/* Swipeable photo gallery */}
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label="Photos">
          {p.photos.map((ph, i) => (
            <Photo key={ph} id={ph} alt={`${p.name}, photo ${i + 1}`} className="h-64 w-full shrink-0 snap-center" priority={i === 0}>
              {ph === "renovation" && <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">Renovation stage</span>}
            </Photo>
          ))}
        </div>
        <Link href="/explore" className="absolute left-3 top-3 grid size-11 place-items-center rounded-xl bg-paper/90 text-lg font-bold text-green shadow" aria-label="Back to Explore">
          ←
        </Link>
        {p.photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">
            1 / {p.photos.length} · swipe
          </span>
        )}
      </div>

      <div className="px-4">
        <h1 className="mt-4 text-2xl font-extrabold leading-tight">{p.name}</h1>
        <p className="text-muted">{p.address}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill tone={open ? "gold" : s.stage === "Refunded" ? "brick" : "green"}>{p.type === "fund" ? "Always open" : s.stage}</Pill>
          <Pill tone={p.risk === "Low" ? "green" : "gold"}>{p.risk} risk</Pill>
          {p.impactTags.map((t) => (
            <Pill key={t}>{t}</Pill>
          ))}
        </div>
        <p className="mt-3 leading-relaxed">{p.story}</p>
        {p.ownerQuote && <blockquote className="mt-3 rounded-xl bg-gold-soft p-3 italic text-gold-ink">&ldquo;{p.ownerQuote}&rdquo; (Marcus, owner)</blockquote>}

        {mine.length > 0 && (
          <Card className="mt-4 border-gold bg-gold-soft">
            <p className="text-sm font-semibold text-gold-ink">You own part of this</p>
            {mine.map((m) => (
              <p key={m.status} className="mt-1">
                <b>{m.tokens} tokens</b>
                {p.type !== "fund" && ` (${((m.tokens / tokenCount(p)) * 100).toFixed(3)}%)`} · worth {fmt(positionValue(w, m))} · earned {fmt(m.earned)}
                {m.status === "escrow" && " · in escrow until the raise completes"}
              </p>
            ))}
            <Link href={`/trace?project=${p.id}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-green">
              Trace my money →
            </Link>
          </Card>
        )}

        <Card className="mt-4">
          {p.type === "fund" ? (
            <p>
              <b>{fmt0(s.raised)}</b> invested by {s.investors.toLocaleString()} neighbors. Buy any amount from $10.
            </p>
          ) : (
            <>
              <Progress value={s.raised / p.raiseGoal} label="Raise progress" />
              <div className="mt-2 flex justify-between text-sm">
                <span>
                  <b>{fmt0(s.raised)}</b> of {fmt0(p.raiseGoal)}
                </span>
                <span className="text-muted">{s.investors.toLocaleString()} investors</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {s.stage === "Raising" && s.deadline !== null && `Closes ${monthLabel(s.deadline)}. If the goal isn't met, every investor is refunded automatically by the escrow contract.`}
                {s.stage === "Renovating" && (p.home ? "Funded! The house is being renovated by local contractors. Rent starts once a tenant moves in." : "Funded! Getting set up. Payments start soon.")}
                {s.stage === "Operating" && s.fundedMonth !== null && `Funded ${monthLabel(Math.max(s.fundedMonth, -24))} and earning. Paid to investors so far in the demo: ${fmt0(s.totalPaid)}.`}
                {s.stage === "Paid off" && "Investors were repaid in full. The owner keeps 100% of the business."}
                {s.stage === "Refunded" && "This raise missed its goal and everyone was refunded."}
                {(s.stage === "Proposed" || s.stage === "Under review" || s.stage === "Community vote") &&
                  `The raise opens ${p.start.opensMonth !== undefined ? monthLabel(p.start.opensMonth) : "soon"}. Use the demo clock to get there.`}
              </p>
            </>
          )}
        </Card>

        <SectionTitle>The numbers</SectionTitle>
        <Card className="p-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-line">
              {home && p.home && (
                <>
                  <Row k="Token price" v={fmt(p.tokenPrice)} />
                  <Row k="Monthly rent" v={fmt(home.rent)} />
                  <Row k="Vacancy buffer (5%)" v={`− ${fmt(home.vacancy)}`} />
                  <Row k="Management (8%)" v={`− ${fmt(home.management)}`} />
                  <Row k="Repair reserve (10%)" v={`− ${fmt(home.reserve)}`} />
                  <Row k="Platform fee (2%)" v={`− ${fmt(home.platformFee)}`} />
                  <Row k="Taxes + insurance" v={`− ${fmt(home.taxesInsurance)}`} />
                  <Row k="To token holders" v={`${fmt(home.distributable)}/mo`} bold />
                  <Row k="Per $10 token" v={`${fmt(home.distributable / tokenCount(p))}/mo`} />
                  <Row k="Est. cash yield" v={pct(cashYield(home.distributable, p.home.totalRaise))} bold />
                </>
              )}
              {p.business && (
                <>
                  <Row k="Token price" v={fmt(p.tokenPrice)} />
                  <Row k="Revenue share" v={pct(p.business.revenueShare, 0) + " of monthly sales"} />
                  <Row k="Repayment cap" v={`${p.business.capMultiple}× (${fmt0(repaymentCap(p.business))})`} />
                  <Row k="Est. payback" v={`~${paybackMonths(p.business)} months`} />
                  <Row k="If sales drop 25%" v={`~${paybackMonths(p.business, 0.75)} months`} />
                  {s.repaid > 0 && <Row k="Repaid so far" v={fmt0(s.repaid)} />}
                  <Row k="Owner keeps" v="100% ownership" bold />
                </>
              )}
              {p.type === "fund" && (
                <>
                  <Row k="Token price" v={fmt(p.tokenPrice)} />
                  <Row k="Holds" v="Every funded home and business" />
                  <Row k="Est. yield range" v={`${pct(p.yieldRange[0])} – ${pct(p.yieldRange[1])}`} bold />
                </>
              )}
            </tbody>
          </table>
        </Card>

        {p.history.length > 0 && (
          <>
            <SectionTitle>{p.home ? "Rent history" : "Revenue history"}</SectionTitle>
            <Card className="p-2">
              <ReportsChart reports={p.history} />
            </Card>
            <details className="mt-2 rounded-2xl border border-line bg-paper p-4">
              <summary className="cursor-pointer font-semibold">Monthly income statements ({p.history.length})</summary>
              <ul className="mt-2 divide-y divide-line text-sm">
                {[...p.history].reverse().map((r) => (
                  <li key={r.month} className="py-2">
                    <div className="flex justify-between font-semibold">
                      <span>{r.month}</span>
                      <span>{fmt(r.distributed)} paid out</span>
                    </div>
                    <p className="text-muted">
                      Gross {fmt(r.gross)}
                      {r.expenses.map((e) => ` · ${e.label} ${fmt(e.amount)}`).join("")}
                      {p.home && ` · reserve ${r.reserveAdded >= 0 ? "+" : ""}${fmt(r.reserveAdded)}`}
                    </p>
                    {r.note && <p className="text-gold-ink">{r.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}

        <SectionTitle>Risks</SectionTitle>
        <Card>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {p.riskFactors.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Card>

        {p.documents.length > 0 && (
          <>
            <SectionTitle>Documents</SectionTitle>
            <Card className="divide-y divide-line p-0">
              {p.documents.map((d) => (
                <p key={d} className="flex min-h-12 items-center justify-between px-4 text-sm">
                  {d} <span className="text-xs text-muted">sample</span>
                </p>
              ))}
            </Card>
          </>
        )}

        <div className="mt-4 space-y-2">
          <Disclosure />
          <p className="text-xs text-muted">
            Demo project: fictional name, address and numbers. Photos are openly licensed stand-ins:{" "}
            {p.photos.map((ph) => `${PHOTO_CREDITS[ph]?.creator} (${PHOTO_CREDITS[ph]?.license})`).join(", ")}.
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-2 border-t border-line bg-paper/95 px-4 pt-3 pb-4 pb-safe backdrop-blur">
        <Button variant="secondary" href={`/simulate?amount=100&focus=${p.type === "fund" ? "fund" : p.home ? "homes" : "business"}`} className="flex-1">
          Simulate
        </Button>
        {open ? (
          <Button href={`/project/${p.id}/invest`} className="flex-[1.4]">
            Invest from $10
          </Button>
        ) : (
          <p className="flex min-h-12 flex-[1.4] items-center justify-center rounded-xl bg-card px-3 text-center text-xs font-semibold text-muted">{check.reason}</p>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-muted">{k}</td>
      <td className={`px-4 py-2.5 text-right tabular-nums ${bold ? "font-bold text-green" : ""}`}>{v}</td>
    </tr>
  );
}
