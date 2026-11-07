"use client";

import Link from "next/link";
import { useState } from "react";
import { Pill, SectionTitle, Sheet } from "@/components/ui";
import { Activity } from "@/components/demo";
import { ArrowRightIcon } from "@/components/icons";
import { BASE_GAS_PRICE_GWEI, ETH_USD, RUN, explorerUrl, feed, isLive, networkLabel, ownersPaidInOneDeposit, payoutCostUsd, refusals, shortHash } from "@/lib/chain";
import { useWorld } from "@/lib/world/store";
import { CONTRACTS, ContractInfo } from "./contracts";

const ICON: Record<ContractInfo["id"], string> = { identity: "🪪", raise: "🤝", token: "🏠", treasury: "🔑", governor: "🗳️" };

export default function HowWeUseIt() {
  const w = useWorld();
  const [open, setOpen] = useState<ContractInfo | null>(null);
  const cost = payoutCostUsd();
  const no = refusals();
  const label = networkLabel();
  const live = isLive();

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xl font-extrabold text-gold-ink">{cost < 0.01 ? "<1¢" : `$${cost.toFixed(2)}`}</p>
          <p className="text-[11px] leading-tight text-muted">per payout, est. at typical Base fees</p>
        </div>
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xl font-extrabold text-green">{ownersPaidInOneDeposit()}</p>
          <p className="text-[11px] leading-tight text-muted">owners paid from one rent deposit (test run)</p>
        </div>
        <div className="rounded-2xl bg-card p-3">
          <p className="text-xl font-extrabold text-green">{no.length}</p>
          <p className="text-[11px] leading-tight text-muted">rule-breaking attempts blocked</p>
        </div>
      </div>

      <SectionTitle>Our 5 smart contracts</SectionTitle>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card">
        {CONTRACTS.map((c) => (
          <li key={c.id}>
            <button onClick={() => setOpen(c)} className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper text-lg" aria-hidden>
                {ICON[c.id]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{c.name}</span>
                <span className="block truncate text-sm text-muted">{c.rule}</span>
              </span>
              <Pill tone={live ? "pos" : "gray"}>{live ? "Live" : "Test network"}</Pill>
            </button>
          </li>
        ))}
      </ul>

      <SectionTitle action={<span className="text-xs font-bold text-muted">{label}</span>}>Live proof</SectionTitle>
      <p className="-mt-1 mb-2 text-sm text-muted">The real transactions from our end-to-end contract run, newest first. Red ones are where the code said no.</p>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {feed(RUN, 10).map((t, i) => {
          const url = t.hash ? explorerUrl(t.hash) : null;
          const row = (
            <>
              <span className={`size-2.5 shrink-0 rounded-full ${t.ok ? "bg-pos" : "bg-brick"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug">{t.label}</span>
                {t.hash ? <code className="text-xs text-muted">{shortHash(t.hash)}</code> : <code className="text-xs text-brick">refused: {t.reason}</code>}
              </span>
              <span className={`shrink-0 text-xs font-extrabold ${t.ok ? "text-pos" : "text-brick"}`}>{t.ok ? "Done" : "Blocked"}</span>
            </>
          );
          return (
            <li key={`${i}-${t.label}`}>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 px-3 py-2">
                  {row}
                </a>
              ) : (
                <div className="flex min-h-14 items-center gap-3 px-3 py-2">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      {!live && <p className="mt-2 text-xs text-muted">Recorded on a local test blockchain. Links to a public block explorer appear once the contracts are deployed to Base Sepolia.</p>}

      <SectionTitle>Your demo activity</SectionTitle>
      <p className="-mt-1 mb-2 text-sm text-muted">Pretend money, not on-chain. In the real app these become transactions like the ones above.</p>
      <Activity world={w} limit={4} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/trace" className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 font-bold text-green">
          Money Trail <ArrowRightIcon />
        </Link>
        <Link href="/impact" className="flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 font-bold text-green">
          Impact <ArrowRightIcon />
        </Link>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Payout cost = measured {RUN.gas.claimAverage.toLocaleString()} gas per claim × {BASE_GAS_PRICE_GWEI} gwei × ${ETH_USD.toLocaleString()}/ETH (typical Base
        fees; actual fees vary). In the full app, OwnTheBlock&apos;s paymaster will cover it, so owners pay $0 (coming in the next milestone).
      </p>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""}>
        {open && (
          <>
            <p>{open.plain}</p>
            <div className="rounded-xl bg-card p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">The rule it enforces</p>
              <p className="mt-1 font-semibold">{open.rule}</p>
            </div>
            {(() => {
              const mine = no.filter((r) => open.refusalMatch.test(r.label));
              return mine.length > 0 ? (
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Times it said no (test run)</p>
                  <ul className="mt-1 space-y-1.5">
                    {mine.map((r) => (
                      <li key={r.label} className="flex items-start gap-2 rounded-xl bg-brick-soft p-2.5 text-sm">
                        <span className="font-extrabold text-brick">Blocked</span>
                        <span>
                          {r.label} <code className="text-xs text-muted">({r.reason})</code>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null;
            })()}
            <p className="text-xs text-muted">
              Contract: <code>{open.code}</code> · {label}
            </p>
          </>
        )}
      </Sheet>
    </div>
  );
}
