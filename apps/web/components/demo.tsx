"use client";

import { useState } from "react";
import { Tx, World, advance, monthLabel } from "@/lib/world";
import { setWorld, useWorld } from "@/lib/world/store";
import { fmt } from "@/lib/finance";
import { Card, Sheet } from "./ui";
import { ChainIcon, ClockIcon } from "./icons";

/**
 * The demo clock. Real money takes months to work; this lets you skip ahead and
 * see what happens: raises close, tenants move in, payouts arrive.
 */
export function DemoClock({ compact }: { compact?: boolean }) {
  const w = useWorld();
  const [news, setNews] = useState<Tx[] | null>(null);

  const skip = (months: number) => {
    const next = advance(w, months);
    setWorld(next);
    navigator.vibrate?.(10);
    const happened = next.txs.filter((t) => t.id >= w.nextId && (t.mine || t.kind === "news"));
    setNews(happened.length ? happened.slice(-6).reverse() : []);
  };

  return (
    <>
      <Card className={`flex items-center gap-3 ${compact ? "p-3" : ""}`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-green-soft text-green">
          <ClockIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Demo clock</p>
          <p className="whitespace-nowrap font-bold">{monthLabel(w.month)}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          {(
            [
              [1, "+1 mo", "Skip ahead 1 month"],
              [6, "+6 mo", "Skip ahead 6 months"],
              [12, "+1 yr", "Skip ahead 1 year"],
            ] as const
          ).map(([n, label, aria]) => (
            <button key={label} onClick={() => skip(n)} className="min-h-11 rounded-lg bg-green px-2.5 text-sm font-bold whitespace-nowrap text-white active:bg-green-2" aria-label={aria}>
              {label}
            </button>
          ))}
        </div>
      </Card>
      <Sheet open={news !== null} onClose={() => setNews(null)} title={`Now it's ${monthLabel(w.month)}`}>
        {news && news.length === 0 && <p>A quiet stretch: no news for your money. Invest in a raise to see things happen.</p>}
        {news?.map((t) => (
          <TxRow key={t.id} t={t} />
        ))}
      </Sheet>
    </>
  );
}

const KIND_STYLE: Record<Tx["kind"], { dot: string; sign: "+" | "−" | "" }> = {
  faucet: { dot: "bg-gold", sign: "+" },
  buy: { dot: "bg-green", sign: "−" },
  release: { dot: "bg-green", sign: "" },
  closing: { dot: "bg-gold", sign: "" },
  tenant: { dot: "bg-gold", sign: "" },
  payout: { dot: "bg-gold", sign: "+" },
  claim: { dot: "bg-gold", sign: "+" },
  refund: { dot: "bg-brick", sign: "+" },
  news: { dot: "bg-muted", sign: "" },
  vote: { dot: "bg-green", sign: "" },
};

export function TxRow({ t, onOpen }: { t: Tx; onOpen?: (t: Tx) => void }) {
  const st = KIND_STYLE[t.kind];
  const body = (
    <>
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${st.dot}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{t.title}</span>
        <span className="text-xs text-muted">
          {monthLabel(t.month)} · {t.onchain ? "on-chain" : "off-chain, proven by documents"}
        </span>
      </span>
      {st.sign && <span className={`shrink-0 font-bold tabular-nums ${st.sign === "+" ? "text-gold-ink" : ""}`}>{st.sign + fmt(t.amount)}</span>}
    </>
  );
  if (!onOpen) return <div className="flex gap-3 py-2">{body}</div>;
  return (
    <button onClick={() => onOpen(t)} className="flex w-full gap-3 py-2.5 text-left">
      {body}
    </button>
  );
}

/** Recent activity with a tap-to-explain sheet (spec 3.2 activity feed). */
export function Activity({ world, limit = 6, filter }: { world: World; limit?: number; filter?: (t: Tx) => boolean }) {
  const [open, setOpen] = useState<Tx | null>(null);
  const items = world.txs.filter(filter ?? ((t) => t.mine || t.kind === "news")).slice(-limit).reverse();
  return (
    <>
      <Card className="divide-y divide-line py-1">
        {items.map((t) => (
          <TxRow key={t.id} t={t} onOpen={setOpen} />
        ))}
        {!items.length && <p className="py-3 text-sm text-muted">Nothing yet. Get test dollars to start.</p>}
      </Card>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""}>
        {open && (
          <>
            <p>{open.detail}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-card p-3 text-sm">
              <dt className="text-muted">When</dt>
              <dd>{monthLabel(open.month)}</dd>
              {open.amount > 0 && (
                <>
                  <dt className="text-muted">Amount</dt>
                  <dd>{fmt(open.amount)}</dd>
                </>
              )}
              <dt className="text-muted">From</dt>
              <dd className="font-mono">{open.from}</dd>
              <dt className="text-muted">To</dt>
              <dd className="font-mono">{open.to}</dd>
              {open.onchain && (
                <>
                  <dt className="text-muted">Block</dt>
                  <dd className="font-mono">#{open.block.toLocaleString()}</dd>
                  <dt className="text-muted">Tx hash</dt>
                  <dd className="break-all font-mono text-xs">{open.hash}</dd>
                  <dt className="text-muted">Fee</dt>
                  <dd>$0.00 (OwnTheBlock paid the gas)</dd>
                </>
              )}
            </dl>
            <p className="flex items-start gap-2 rounded-xl bg-gold-soft p-3 text-sm text-gold-ink">
              <ChainIcon className="mt-0.5 size-4 shrink-0" />
              {open.onchain
                ? "Demo transaction, formatted like a real Base transaction. With testnet turned on (Milestone 4), this links to the Base Sepolia block explorer."
                : "This step happens in the real world. It's proven with documents and audits, not code, and the app says so honestly."}
            </p>
          </>
        )}
      </Sheet>
    </>
  );
}
