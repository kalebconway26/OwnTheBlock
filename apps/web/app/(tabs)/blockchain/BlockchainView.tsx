"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import HowItWorks from "@/components/chain/HowItWorks";
import HowWeUseIt from "@/components/chain/HowWeUseIt";

type View = "how" | "use";

export default function BlockchainView() {
  // Deep link: /blockchain?view=use opens "How we use it".
  const initial: View = useSearchParams().get("view") === "use" ? "use" : "how";
  const [view, setView] = useState<View>(initial);
  return (
    <main className="px-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Blockchain</h1>
        <p className="mt-0.5 text-muted">Why you can trust OwnTheBlock without trusting us.</p>
      </header>
      <div role="tablist" aria-label="Blockchain sections" className="mt-4 mb-4 grid grid-cols-2 rounded-xl bg-card p-1 text-sm font-bold">
        {(
          [
            ["how", "How it works"],
            ["use", "How we use it"],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`min-h-11 rounded-lg ${view === v ? "bg-paper text-green shadow-sm" : "text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {view === "how" ? <HowItWorks /> : <HowWeUseIt />}
    </main>
  );
}
