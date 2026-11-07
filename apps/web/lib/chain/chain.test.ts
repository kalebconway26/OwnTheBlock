import { describe, expect, it } from "vitest";
import { RUN, explorerUrl, feed, networkLabel, ownersPaidInOneDeposit, payoutCostUsd, refusals } from "./index";

const live = { ...RUN, network: "baseSepolia" };

describe("chain proof data", () => {
  it("labels the local run honestly", () => {
    expect(networkLabel(RUN)).toBe("Test network");
    expect(networkLabel(live)).toBe("Live on Base Sepolia");
  });

  it("only links to an explorer when live", () => {
    expect(explorerUrl("0xabc", RUN)).toBeNull();
    expect(explorerUrl("0xabc", live)).toBe("https://sepolia.basescan.org/tx/0xabc");
  });

  it("estimates a payout claim at under one cent", () => {
    expect(payoutCostUsd(67067)).toBeLessThan(0.01);
    expect(payoutCostUsd(67067)).toBeGreaterThan(0);
  });

  it("lists every refusal from the recorded run", () => {
    const r = refusals(RUN);
    expect(r.length).toBe(6);
    expect(r.some((x) => x.label.startsWith("Manager tries to raise rent 10%"))).toBe(true);
    expect(r.every((x) => !x.label.includes(": refused"))).toBe(true);
  });

  it("counts owners paid by the single rent deposit", () => {
    expect(ownersPaidInOneDeposit(RUN)).toBe(5);
  });

  it("returns the most recent transactions first", () => {
    const f = feed(RUN, 3);
    expect(f.length).toBe(3);
    expect(f[0].label.startsWith("Rule change executed before the 30-day wait")).toBe(true);
    expect(f[0].ok).toBe(false);
  });
});
