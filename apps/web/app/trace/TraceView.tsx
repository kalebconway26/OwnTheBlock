"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, DemoBanner, PageHeader, Pill } from "@/components/ui";
import Photo from "@/components/Photo";
import { PROJECTS, projectById } from "@/lib/demo";
import { monthLabel, positionValue } from "@/lib/world";
import { useWorld } from "@/lib/world/store";
import { fmt } from "@/lib/finance";

/** Money Trail (spec 5.1): every step your money took, oldest first, with honest trust labels. */
export default function TraceView() {
  const w = useWorld();
  const q = useSearchParams().get("project");
  const owned = PROJECTS.filter((p) => w.positions.some((x) => x.projectId === p.id));
  const p = projectById(q ?? "") ?? owned[0];
  const pos = p ? w.positions.filter((x) => x.projectId === p.id) : [];
  const firstBuy = p ? w.txs.find((t) => t.kind === "buy" && t.projectId === p.id) : undefined;
  const source = firstBuy ? w.txs.filter((t) => t.kind === "faucet" && t.id < firstBuy.id).at(-1) : undefined;
  const steps = p ? [...(source ? [source] : []), ...w.txs.filter((t) => t.projectId === p.id && (t.mine || t.kind === "news"))] : [];

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-12">
      <DemoBanner />
      <PageHeader title="Money Trail" subtitle="Where is my money right now? Follow every step." back="/me" />
      <div className="px-4">
        {owned.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {owned.map((o) => (
              <Link key={o.id} href={`/trace?project=${o.id}`} className={`min-h-11 shrink-0 content-center rounded-xl border-2 px-4 text-sm font-semibold ${o.id === p?.id ? "border-green bg-green text-white" : "border-line bg-paper"}`}>
                {o.name}
              </Link>
            ))}
          </div>
        )}

        {!p || !pos.length ? (
          <Card>
            <p className="font-semibold">You haven&apos;t invested yet.</p>
            <p className="mt-1 text-sm text-muted">Once you do, every step your money takes shows up here: on-chain steps anyone can verify, and real-world steps proven by documents.</p>
            <Button href="/explore" className="mt-3 w-full">
              Find a project
            </Button>
          </Card>
        ) : (
          <>
            <Card className="mb-4 flex items-center gap-3 p-3">
              <Photo id={p.photos[0]} alt="" className="size-14 shrink-0 rounded-xl" sizes="56px" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{p.name}</p>
                <p className="text-sm text-muted">
                  Put in {fmt(pos.reduce((s, x) => s + x.invested, 0))} · now worth {fmt(pos.reduce((s, x) => s + positionValue(w, x), 0))} · earned {fmt(pos.reduce((s, x) => s + x.earned, 0))}
                </p>
              </div>
            </Card>
            <Card className="mb-4 bg-green-soft text-sm">
              <b>Honest labels:</b> some steps happen in code and anyone can verify them. Others, like buying the house or a tenant moving in, happen in the real world and are proven with documents and audits.
            </Card>
            <ol className="relative ml-3 border-l-2 border-line">
              {steps.map((t) => (
                <li key={t.id} className="mb-5 ml-5">
                  <span className={`absolute -left-[9px] mt-1.5 size-4 rounded-full border-2 border-paper ${t.onchain ? "bg-green" : "bg-gold"}`} aria-hidden />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{monthLabel(t.month)}</span>
                    <Pill tone={t.onchain ? "green" : "gold"}>{t.onchain ? "On-chain · verified by code" : "Off-chain · verified by documents"}</Pill>
                  </div>
                  <p className="mt-1 font-semibold">{t.title}</p>
                  <p className="mt-0.5 text-sm">{t.detail}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {t.from} → {t.to}
                    {t.onchain && ` · block #${t.block.toLocaleString()}`}
                  </p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted">Demo transactions. With testnet on (Milestone 5), each on-chain step links to a real Base Sepolia transaction.</p>
          </>
        )}
      </div>
    </div>
  );
}
