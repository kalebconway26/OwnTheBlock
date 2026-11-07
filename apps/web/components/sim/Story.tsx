"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ADDR, ASSETS, AssetId, Block, BuildingStatus, Flow, NodeId, short } from "@/lib/sim";
import { SAMPLE_HOME, dollars, fmt, homeMonthly } from "@/lib/finance";
import { Button } from "@/components/ui";
import Street from "./Street";
import MoneyFlow from "./MoneyFlow";
import Ledger from "./Ledger";
import Photo from "@/components/Photo";

type Scene = {
  caption: string;
  status: Partial<Record<AssetId, BuildingStatus>>;
  raised?: number; // fraction of 1204 Sample St raised
  flows: Flow[];
  pulse?: NodeId;
  blocks: number; // how many story blocks are visible
  you: { cash: number; invested: number; earned: number };
};

const b = homeMonthly(SAMPLE_HOME);
const bills = b.management + b.taxesInsurance + b.platformFee;
const saved = b.reserve + b.vacancy;
const yourShare = b.distributable / 15_000;

const STORY_BLOCKS: Block[] = [
  {
    number: 18_234_571,
    month: 0,
    date: "Nov 2026",
    action: "Buy 1 token · 1204 Sample St",
    from: short(ADDR.you),
    to: short(ADDR.escrow),
    amount: dollars(10),
    hash: "0x8c1f4e0b9a7d3c2e5f6a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e",
    explain: "This block recorded that you bought 1 token of 1204 Sample St. Anyone in the world can check this, and nobody can erase it.",
    mine: true,
  },
  {
    number: 18_998_204,
    month: 0,
    date: "Nov 2026",
    action: "Raise complete · Sample St",
    from: short(ADDR.escrow),
    to: short(ADDR["sample-st"]),
    amount: dollars(150_000),
    hash: "0x2a9e7c5b3d1f0e8a6c4b2d0f9e7a5c3b1d9f7e5a3c1b9d7f5e3a1c9b7d5f3e1a",
    explain: "The raise hit its $150,000 goal, so the escrow contract released the money to the property's LLC. If the goal hadn't been reached, every investor would have been refunded automatically.",
    mine: true,
  },
  {
    number: 22_121_090,
    month: 3,
    date: "Feb 2027",
    action: `Rent deposit ${fmt(b.distributable)} · Sample St`,
    from: short(ADDR["sample-st"]),
    to: short(ADDR.distributor),
    amount: b.distributable,
    hash: "0x5d3b1f9e7c5a3e1d9b7f5c3a1e9d7b5f3c1a9e7d5b3f1c9a7e5d3b1f9c7a5e3d",
    explain: `The manager collected ${fmt(b.rent)} rent, paid ${fmt(bills)} in bills, saved ${fmt(saved)} for repairs and vacancies, and deposited ${fmt(b.distributable)} for token holders. The expense report's fingerprint is stored here so nobody can change it later.`,
    mine: false,
  },
  {
    number: 22_121_093,
    month: 3,
    date: "Feb 2027",
    action: `Payout ${fmt(yourShare)}`,
    from: short(ADDR.distributor),
    to: short(ADDR.you),
    amount: yourShare,
    hash: "0x9f7d5b3a1c9e7f5d3b1a9c7e5f3d1b9a7c5e3f1d9b7a5c3e1f9d7b5a3c1e9f7d",
    explain: "Your share this month: about 6 cents for 1 token. Small, but it's real ownership. OwnTheBlock paid the transaction fee.",
    mine: true,
  },
];

const base: Partial<Record<AssetId, BuildingStatus>> = {};

const SCENES: Scene[] = [
  {
    caption: "This is your block. Right now, most of these homes are owned by investors who live somewhere else.",
    status: base,
    flows: [],
    blocks: 0,
    you: { cash: 0, invested: 0, earned: 0 },
  },
  {
    caption: "You add $10. It becomes 10 digital dollars (USDC) in your wallet.",
    status: base,
    flows: [],
    pulse: "you",
    blocks: 0,
    you: { cash: dollars(10), invested: 0, earned: 0 },
  },
  {
    caption: "You buy 1 token of 1204 Sample St. Your $10 goes into an escrow smart contract.",
    status: { "sample-st": "raising" },
    raised: 0.02,
    flows: [{ from: "you", to: "escrow", amount: dollars(10), label: "$10.00" }],
    blocks: 1,
    you: { cash: 0, invested: dollars(10), earned: 0 },
  },
  {
    caption:
      "About 500 neighbors and alumni join in, averaging $300 each. The $150,000 goal is reached, and the money goes to the property's LLC to buy and fix the house.",
    status: { "sample-st": "renovating" },
    raised: 1,
    flows: [
      { from: "investors", to: "escrow", amount: dollars(149_990), label: "" },
      { from: "escrow", to: "llc", amount: dollars(150_000), label: "" },
    ],
    blocks: 2,
    you: { cash: 0, invested: dollars(10), earned: 0 },
  },
  {
    caption: "A family rents the home for $1,400 a month.",
    status: { "sample-st": "operating" },
    raised: 1,
    flows: [{ from: "tenants", to: "llc", amount: b.rent, label: fmt(b.rent) }],
    blocks: 2,
    you: { cash: 0, invested: dollars(10), earned: 0 },
  },
  {
    caption: `Bills get paid first: taxes, insurance, management. 10% goes to a repair savings reserve (plus a 5% vacancy buffer).`,
    status: { "sample-st": "operating" },
    raised: 1,
    flows: [
      { from: "llc", to: "expenses", amount: bills, label: fmt(bills) },
      { from: "llc", to: "reserve", amount: saved, label: fmt(saved) },
    ],
    blocks: 3,
    you: { cash: 0, invested: dollars(10), earned: 0 },
  },
  {
    caption:
      "What's left ($850) is split among every token holder. Your share this month: about 6 cents. Small, but it's real ownership, and it grows as you add more and as your neighbors join.",
    status: { "sample-st": "operating" },
    raised: 1,
    flows: [
      { from: "llc", to: "distributor", amount: b.distributable, label: fmt(b.distributable) },
      { from: "distributor", to: "you", amount: yourShare, label: fmt(yourShare) },
      { from: "distributor", to: "investors", amount: b.distributable - yourShare, label: "" },
    ],
    blocks: 4,
    you: { cash: yourShare, invested: dollars(10), earned: yourShare },
  },
  {
    caption: "Every step you just saw is recorded on the blockchain. Tap any block below to check it yourself.",
    status: { "sample-st": "operating" },
    raised: 1,
    flows: [],
    blocks: 4,
    you: { cash: yourShare, invested: dollars(10), earned: yourShare },
  },
];

export default function Story({ onDone }: { onDone: (startWithTen: boolean) => void }) {
  const [i, setI] = useState(0);
  const scene = SCENES[i];
  const last = i === SCENES.length - 1;

  const assets = useMemo(
    () =>
      ASSETS.map((a) => ({
        id: a.id,
        status: scene.status[a.id] ?? "unfunded",
        raised: a.id === "sample-st" ? (scene.raised ?? 0) * a.raise : 0,
      })),
    [scene],
  );

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-sm font-bold text-green">
          Story mode · {i + 1} of {SCENES.length}
        </p>
        <button onClick={() => onDone(false)} className="min-h-11 px-2 text-sm font-semibold text-muted underline">
          Skip
        </button>
      </div>
      <div className="mx-4 mt-1 flex gap-1" aria-hidden>
        {SCENES.map((_, k) => (
          <div key={k} className={`h-1 flex-1 rounded-full ${k <= i ? "bg-green" : "bg-line"}`} />
        ))}
      </div>

      <div className="mt-3 overflow-hidden border-y border-line">
        <Street assets={assets} highlight={i >= 2 && i <= 6 ? "sample-st" : undefined} />
      </div>

      {/* The real-world side of the story: what the house looks like at this step */}
      <div className="mx-4 mt-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i < 3 ? "before" : i === 3 ? "during" : "after"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Photo id={i < 3 ? "demo-ct" : i === 3 ? "renovation" : "sample-st"} alt={i < 3 ? "Run-down houses" : i === 3 ? "A house being renovated" : "A renovated bungalow"} className="h-36 rounded-2xl">
              <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
                {i < 3 ? "Before: owned from out of state" : i === 3 ? "Renovating with local contractors" : "After: a family lives here"}
              </span>
            </Photo>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-4 mt-3 rounded-2xl bg-green p-4 text-white shadow-md"
          aria-live="polite"
        >
          <p className="text-[17px] font-semibold leading-snug">{scene.caption}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-2 px-2">
        <MoneyFlow flows={scene.flows} tick={i} duration={1.1} pulse={scene.pulse} />
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2 px-4 text-center">
        {[
          ["Wallet", scene.you.cash],
          ["Invested", scene.you.invested],
          ["Earned", scene.you.earned],
        ].map(([label, v]) => (
          <div key={label as string} className="rounded-xl bg-paper p-2 shadow-sm">
            <div className="text-xs text-muted">{label}</div>
            <div className="font-bold tabular-nums">{fmt(v as number)}</div>
          </div>
        ))}
      </div>

      <p className="mt-3 px-4 text-sm font-bold">Ledger</p>
      <Ledger blocks={STORY_BLOCKS.slice(0, scene.blocks)} />

      <div className="sticky bottom-24 z-30 mt-3 flex gap-3 px-4">
        {i > 0 && (
          <Button variant="secondary" onClick={() => setI(i - 1)} className="flex-1">
            Back
          </Button>
        )}
        {last ? (
          <Button variant="gold" onClick={() => onDone(true)} className="flex-[2]">
            Ready? Start with $10
          </Button>
        ) : (
          <Button onClick={() => setI(i + 1)} className="flex-[2]">
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
