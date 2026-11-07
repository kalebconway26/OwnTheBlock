// Proof data from the recorded smart-contract run (contracts/deployments → lib/chain/run.json via `npm run sync:chain`).
// Honesty rule: only a Base Sepolia run is "live"; the local Hardhat run is labeled "Test network".
import run from "./run.json";

export type RunTx = { step: string; hash: string | null; gasUsed: number; status: string; reason?: string };
export type Run = {
  network: string;
  chainId: number;
  contracts: Record<string, string>;
  gas: { distribute: number; claimAverage: number };
  transactions: RunTx[];
};

export const RUN = run as Run;

/** Assumptions for turning measured gas into dollars. Typical Base fees; shown in a footnote. */
export const BASE_GAS_PRICE_GWEI = 0.01;
export const ETH_USD = 3500;

export const isLive = (r: Run = RUN) => r.network === "baseSepolia";
export const networkLabel = (r: Run = RUN) => (isLive(r) ? "Live on Base Sepolia" : "Test network");
export const explorerUrl = (hash: string, r: Run = RUN) => (isLive(r) ? `https://sepolia.basescan.org/tx/${hash}` : null);

/** Estimated dollar cost of one payout claim at typical Base fees. */
export const payoutCostUsd = (gas: number = RUN.gas.claimAverage) => gas * BASE_GAS_PRICE_GWEI * 1e-9 * ETH_USD;

const clean = (step: string) => step.replace(/:\s*refused\b/i, "");

/** Every transaction the contracts refused, in run order. */
export const refusals = (r: Run = RUN) => r.transactions.filter((t) => t.status !== "ok").map((t) => ({ label: clean(t.step), hash: t.hash, reason: t.reason ?? "" }));

/** Owners who claimed from the single rent deposit. */
export function ownersPaidInOneDeposit(r: Run = RUN) {
  const i = r.transactions.findIndex((t) => /deposits \$\d+/.test(t.step));
  if (i < 0) return 0;
  return r.transactions.slice(i + 1).filter((t) => /claims \$/.test(t.step)).length;
}

/** Most recent transactions first. */
export const feed = (r: Run = RUN, n = 8) =>
  [...r.transactions].reverse().slice(0, n).map((t) => ({ label: clean(t.step), hash: t.hash, ok: t.status === "ok", reason: t.reason ?? "" }));

export const shortHash = (h: string | null) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "");
