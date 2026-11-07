"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button, Card, DemoBanner, Disclosure, PageHeader } from "@/components/ui";
import Photo from "@/components/Photo";
import { ShieldIcon } from "@/components/icons";
import { projectById } from "@/lib/demo";
import { ESCROW, REG_CF_YEARLY_LIMIT, Tx, YOU, canInvest, faucet, invest, investedLast12, short, tokenCount, treasury } from "@/lib/world";
import { setWorld, today, useWorld } from "@/lib/world/store";
import { dollars, fmt, fmt0 } from "@/lib/finance";

type Step = "amount" | "review" | "explain" | "confirm" | "done";
const QUICK = [10, 25, 50, 100];

/** The buy flow (spec 3.3), moving pretend money through the demo world. */
export default function InvestFlow({ id }: { id: string }) {
  const w = useWorld();
  const p = projectById(id)!;
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Tx | null>(null);
  const [coolingAck, setCoolingAck] = useState(false);
  const check = canInvest(w, id);
  const max = Math.max(10, Math.floor(check.maxCents / 1000) * 10);
  const tokens = Math.floor((amount * 100) / p.tokenPrice);
  const isFund = p.type === "fund";
  const firstBig = amount > 100 && !w.positions.some((x) => x.invested > dollars(100));

  if (!check.ok && step !== "done") {
    return (
      <div className="mx-auto min-h-dvh max-w-md pb-10">
        <DemoBanner />
        <PageHeader title={`Invest in ${p.name}`} back={`/project/${p.id}`} />
        <div className="space-y-4 px-4">
          <Photo id={p.photos[0]} alt={p.name} className="h-40 rounded-2xl" />
          <Card>
            <p className="font-semibold">{check.reason}</p>
            {w.cash < p.tokenPrice && (
              <Button
                variant="gold"
                className="mt-3 w-full"
                onClick={() => {
                  const r = faucet(w, today());
                  if (r.ok) setWorld(r.world);
                  else setError(r.reason);
                }}
              >
                + $100 test dollars
              </Button>
            )}
            {error && <p className="mt-2 text-sm text-brick">{error}</p>}
          </Card>
        </div>
      </div>
    );
  }

  const confirm = () => {
    const r = invest(w, id, dollars(amount));
    if (!r.ok) {
      setError(r.reason);
      setStep("review");
      return;
    }
    setWorld(r.world);
    setReceipt(r.world.txs.filter((t) => t.kind === "buy").at(-1) ?? null);
    navigator.vibrate?.([10, 40, 20]);
    setStep("done");
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-10">
      <DemoBanner />
      <PageHeader title={`Invest in ${p.name}`} back={`/project/${p.id}`} />
      <div className="px-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === "amount" && (
              <>
                <div className="flex items-center gap-3">
                  <Photo id={p.photos[0]} alt="" className="size-16 shrink-0 rounded-xl" sizes="64px" />
                  <p className="text-sm text-muted">
                    Wallet: <b className="text-ink">{fmt(w.cash)}</b> test dollars. Minimum $10, up to {fmt0(dollars(max))} here.
                  </p>
                </div>
                <div className="my-6 text-center text-6xl font-extrabold tabular-nums text-green">${amount}</div>
                <input type="range" min={10} max={max} step={10} value={Math.min(amount, max)} onChange={(e) => setAmount(Number(e.target.value))} aria-label="Amount in dollars" />
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(q)}
                      disabled={q > max}
                      aria-pressed={amount === q}
                      className={`min-h-12 rounded-xl border-2 font-semibold disabled:opacity-30 ${amount === q ? "border-green bg-green-soft text-green" : "border-line bg-paper"}`}
                    >
                      ${q}
                    </button>
                  ))}
                </div>
                <Card className="mt-4 text-sm">
                  Only invest money you won&apos;t need soon, and keep an emergency fund first. Yearly limit for most first-time investors: {fmt0(REG_CF_YEARLY_LIMIT)} (
                  {fmt0(REG_CF_YEARLY_LIMIT - investedLast12(w))} left).
                </Card>
                <Button onClick={() => setStep("review")} className="mt-6 w-full">
                  Continue
                </Button>
              </>
            )}

            {step === "review" && (
              <>
                <Card className="p-0">
                  <dl className="divide-y divide-line text-sm">
                    {[
                      ["You pay", fmt(dollars(amount))],
                      ["You get", `${tokens} ${isFund ? "fund " : ""}token${tokens === 1 ? "" : "s"} at ${fmt(p.tokenPrice)} each`],
                      ...(isFund ? [] : [["You'll own", `${((tokens / tokenCount(p)) * 100).toFixed(4)}% of ${p.name}`]]),
                      ["Fees to you", "$0.00. The project pays a 3% raise fee; gas is sponsored"],
                      ["Ongoing fee", "2% of rent or revenue, before payouts"],
                      ["Can I sell?", "Not for 12 months (federal crowdfunding rule)"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-4 py-3">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right font-semibold">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                {firstBig && (
                  <Card className="mt-3 bg-gold-soft text-sm text-gold-ink">
                    <p>Your first investment over $100 has a 24-hour cooling-off period in the real app, so you can sleep on it.</p>
                    <label className="mt-2 flex min-h-11 items-center gap-2 font-semibold">
                      <input type="checkbox" checked={coolingAck} onChange={(e) => setCoolingAck(e.target.checked)} className="size-5 accent-green" />
                      Demo: skip the wait
                    </label>
                  </Card>
                )}
                {error && <p className="mt-3 rounded-xl bg-brick-soft p-3 text-sm text-brick">{error}</p>}
                <div className="mt-3">
                  <Disclosure />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="secondary" onClick={() => setStep("amount")} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep("explain")} disabled={firstBig && !coolingAck} className="flex-[2]">
                    Looks good
                  </Button>
                </div>
              </>
            )}

            {step === "explain" && (
              <>
                <h2 className="text-xl font-bold">What happens when you confirm</h2>
                <ol className="mt-4 space-y-3">
                  {(isFund
                    ? [
                        `${fmt(dollars(amount))} in USDC moves from your wallet into the Neighborhood Fund.`,
                        "The fund spreads it across every funded home and business on the block.",
                        "Each month you get your share of what they all pay out. You can claim it or turn on auto-claim.",
                        "Every step is recorded on the Base blockchain. You can check it any time.",
                      ]
                    : [
                        `${fmt(dollars(amount))} in USDC moves from your wallet to the raise's escrow contract.`,
                        `The escrow holds it until ${p.name} reaches its ${fmt0(p.raiseGoal)} goal. If it doesn't, you're refunded automatically.`,
                        `You get ${tokens} token${tokens === 1 ? "" : "s"}. Once it's earning, payouts arrive monthly.`,
                        "Every step is recorded on the Base blockchain. You can check it any time.",
                      ]
                  ).map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-green text-sm font-bold text-white">{i + 1}</span>
                      <span className="pt-1">{t}</span>
                    </li>
                  ))}
                </ol>
                <Button onClick={() => setStep("confirm")} className="mt-8 w-full">
                  Got it
                </Button>
              </>
            )}

            {step === "confirm" && (
              <div className="pt-6 text-center">
                <p className="text-muted">Confirm with Face ID or fingerprint</p>
                <button
                  onClick={confirm}
                  className="mx-auto mt-6 grid size-32 place-items-center rounded-full bg-green text-white shadow-xl active:scale-95"
                  aria-label={`Confirm investing $${amount}`}
                >
                  <ShieldIcon className="size-14" />
                </button>
                <p className="mt-4 text-lg font-bold">Tap to confirm ${amount}</p>
                <p className="mt-2 text-xs text-muted">Demo: pretend money, no passkey yet.</p>
              </div>
            )}

            {step === "done" && (
              <div className="pt-2 text-center">
                <div className="relative mx-auto h-44 w-full overflow-hidden rounded-2xl">
                  <Photo id={p.photos[0]} alt={p.name} className="absolute inset-0" />
                  <motion.div
                    className="absolute left-3 top-16 grid size-12 place-items-center rounded-full border-2 border-white bg-gold text-lg font-black text-gold-ink shadow-lg"
                    initial={{ x: 0, opacity: 1, scale: 1 }}
                    animate={{ x: 260, opacity: [1, 1, 0], scale: [1, 1.1, 0.6] }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    aria-hidden
                  >
                    $
                  </motion.div>
                </div>
                <h2 className="mt-4 text-2xl font-extrabold">You own a piece of the block!</h2>
                <p className="mt-2 text-muted">
                  {isFund
                    ? `$${amount} is in the Neighborhood Fund. Payouts start with the next month on the demo clock.`
                    : `$${amount} is in escrow for ${p.name}. Your ${tokens} token${tokens === 1 ? "" : "s"} start earning once the raise completes and the property is up and running.`}
                </p>
                {receipt && (
                  <Card className="mt-4 text-left text-sm">
                    <p className="font-semibold">See it on the blockchain</p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {short(YOU)} → {short(isFund ? treasury("fund") : ESCROW)} · block #{receipt.block.toLocaleString()}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-muted">{receipt.hash}</p>
                  </Card>
                )}
                <div className="mt-6 space-y-2">
                  <Button href="/home" className="w-full">
                    Skip ahead on the demo clock
                  </Button>
                  <Button href={`/trace?project=${p.id}`} variant="secondary" className="w-full">
                    Trace my money
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
