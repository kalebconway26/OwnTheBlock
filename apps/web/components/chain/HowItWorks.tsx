import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

const STEPS = [
  ["Everyone has the same copy", "Thousands of computers keep the same record. No single company, including us, owns it."],
  ["Blocks are chained together", "Each block is sealed with a fingerprint of the one before it. Changing an old entry breaks every block after it, so cheating is obvious."],
  ["Smart contracts are rules that run themselves", "A smart contract is code on the blockchain. It decides whether a payment, sale or vote is allowed, the same way every time."],
  ["Anyone can check", "Every transaction is public. You don't have to trust our monthly report: you can see where every dollar went."],
];

const BLOCKS = [
  ["#1041", "rent $700"],
  ["#1042", "claim $0.49"],
  ["#1043", "vote ✓"],
];

const COMPARE = [
  ["Who can change the rules?", "Whoever runs the database", "Only a 2/3 owner vote + 30-day wait"],
  ["Paying 1,440 owners $0.49", "Bank fees eat the payout", "One deposit, under 1¢ per claim"],
  ["Seeing where money went", "Trust a monthly PDF", "Check any time, in public"],
  ["Spending the house's money", "Signers you never see", "Manager + steward, both visible"],
];

export default function HowItWorks() {
  return (
    <div>
      <section className="rounded-2xl bg-green p-4 text-white">
        <h2 className="text-lg font-extrabold leading-snug">A shared record nobody can secretly edit</h2>
        <p className="mt-1 text-sm text-white/85">
          A blockchain is a list of transactions that thousands of computers keep in sync. New entries are grouped into blocks, and each block is linked to the
          one before it.
        </p>
        <div className="mt-4 flex items-center" aria-hidden>
          {BLOCKS.map(([n, t], i) => (
            <div key={n} className="flex flex-1 items-center">
              <div className={`flex-1 rounded-xl border p-2 text-[11px] leading-tight ${i === 2 ? "border-gold bg-white/10" : "border-white/30 bg-white/5"}`}>
                <span className="block font-extrabold">Block {n}</span>
                <span className="text-white/80">{t}</span>
              </div>
              {i < BLOCKS.length - 1 && <span className="h-0.5 w-3 shrink-0 bg-gold" />}
            </div>
          ))}
        </div>
      </section>

      <SectionTitle>How it works, in 4 steps</SectionTitle>
      <ol className="space-y-2">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-2xl bg-card p-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-green text-sm font-extrabold text-white">{i + 1}</span>
            <span>
              <span className="block font-bold">{t}</span>
              <span className="text-sm text-muted">{d}</span>
            </span>
          </li>
        ))}
      </ol>

      <SectionTitle>Why not a regular bank database?</SectionTitle>
      <div className="overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-green text-white">
            <tr>
              <th className="p-2.5 font-bold">
                <span className="sr-only">Question</span>
              </th>
              <th className="p-2.5 font-bold">Bank database</th>
              <th className="p-2.5 font-bold">OwnTheBlock</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map(([q, a, b]) => (
              <tr key={q} className="border-t border-line align-top">
                <th scope="row" className="p-2.5 font-bold">{q}</th>
                <td className="p-2.5 text-muted">{a}</td>
                <td className="p-2.5 font-semibold text-pos">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/learn/what-is-a-blockchain" className="mt-3 flex min-h-14 items-center justify-between rounded-2xl bg-gold-soft px-4 font-bold text-gold-ink">
        2-minute lesson: What is a blockchain?
        <ArrowRightIcon />
      </Link>
    </div>
  );
}
