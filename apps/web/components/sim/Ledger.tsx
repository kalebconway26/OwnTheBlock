"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Block } from "@/lib/sim";
import { fmt } from "@/lib/finance";
import { Sheet } from "@/components/ui";

/** Horizontally scrolling chain of blocks, newest on the right (spec 4.2 #3). */
export default function Ledger({ blocks, simulated = true }: { blocks: Block[]; simulated?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Block | null>(null);
  const last = blocks[blocks.length - 1]?.number;

  useEffect(() => {
    ref.current?.scrollTo({ left: ref.current.scrollWidth, behavior: "smooth" });
  }, [last]);

  return (
    <>
      <div ref={ref} className="no-scrollbar flex snap-x gap-0 overflow-x-auto px-4 py-2" aria-label="Blockchain ledger">
        {blocks.length === 0 && <p className="py-6 text-sm text-muted">No blocks yet. Every money movement will appear here.</p>}
        <AnimatePresence initial={false}>
          {blocks.map((b, i) => (
            <motion.div key={b.number + b.action} className="flex shrink-0 snap-end items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              {i > 0 && <div className="h-1 w-3 bg-line" aria-hidden />}
              <button
                onClick={() => setOpen(b)}
                className={`w-40 rounded-xl border-2 bg-paper p-2.5 text-left text-xs leading-snug shadow-sm ${b.mine ? "border-gold" : "border-line"}`}
              >
                <div className="flex justify-between font-mono text-[11px] text-muted">
                  <span>#{b.number.toLocaleString()}</span>
                  <span>{b.date}</span>
                </div>
                <div className="mt-1 line-clamp-2 min-h-8 font-semibold text-ink">{b.action}</div>
                <div className="mt-1 font-mono text-[11px] text-muted">
                  {b.from} → {b.to}
                </div>
                <div className="mt-0.5 text-[11px] text-green">Fee $0.00 · sponsored</div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `Block #${open.number.toLocaleString()}` : ""}>
        {open && (
          <>
            <p className="text-base">{open.explain}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-card p-3 text-sm">
              <dt className="text-muted">Action</dt>
              <dd className="font-semibold">{open.action}</dd>
              <dt className="text-muted">Amount</dt>
              <dd>{fmt(open.amount)}</dd>
              <dt className="text-muted">From</dt>
              <dd className="font-mono">{open.from}</dd>
              <dt className="text-muted">To</dt>
              <dd className="font-mono">{open.to}</dd>
              <dt className="text-muted">When</dt>
              <dd>{open.date}</dd>
              <dt className="text-muted">Fee</dt>
              <dd>$0.00 (OwnTheBlock paid the gas)</dd>
              <dt className="text-muted">Tx hash</dt>
              <dd className="break-all font-mono text-xs">{open.hash}</dd>
            </dl>
            {simulated ? (
              <p className="rounded-xl bg-gold-soft p-3 text-sm text-gold-ink">
                Simulation: this block is pretend, but it&apos;s formatted exactly like a real Base transaction. In Live testnet mode, this
                links to the Base Sepolia block explorer.
              </p>
            ) : null}
          </>
        )}
      </Sheet>
    </>
  );
}
