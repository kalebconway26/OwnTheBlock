import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, SimConfig, portfolioValue, simulate } from ".";
import { dollars } from "../finance";

const cfg = (over: Partial<SimConfig> = {}): SimConfig => ({ ...DEFAULT_CONFIG, ...over });
const status = (s: ReturnType<typeof simulate>[number], id: string) => s.assets.find((a) => a.id === id)!.status;

describe("Block Simulator engine", () => {
  it("is deterministic for the same seed and events", () => {
    const a = simulate(cfg({ randomEvents: true }), [{ month: 20, type: "roof" }]);
    const b = simulate(cfg({ randomEvents: true }), [{ month: 20, type: "roof" }]);
    expect(a[120].history).toEqual(b[120].history);
    expect(a[120].ledger.map((x) => x.hash)).toEqual(b[120].ledger.map((x) => x.hash));
  });

  it("funds 1204 Sample St with 500 neighbors and starts paying rent", () => {
    const run = simulate(cfg());
    const funded = run.findIndex((s) => status(s, "sample-st") !== "raising" && status(s, "sample-st") !== "unfunded");
    expect(funded).toBeGreaterThan(0);
    expect(funded).toBeLessThanOrEqual(12);
    expect(run[funded + 3].assets[0].status).toBe("operating");
    expect(run[funded + 4].earnedThisMonth).toBeGreaterThan(0);
  });

  it("refunds you automatically when the community is too small", () => {
    const run = simulate(cfg({ community: 10 }));
    const s = run[13];
    expect(s.holdings.find((h) => h.assetId === "sample-st")!.status).toBe("refunded");
    expect(s.cash).toBeGreaterThanOrEqual(dollars(40));
  });

  it("transforms more of the block with more neighbors", () => {
    const funded = (n: number) => simulate(cfg({ community: n }))[24].assets.filter((a) => a.fundedMonth !== null).length;
    expect(funded(5000)).toBeGreaterThan(funded(500));
    expect(funded(500)).toBeGreaterThan(funded(10));
  });

  it("pays nothing from the house during a vacancy", () => {
    const base = simulate(cfg({ alloc: { homes: 1, business: 0, fund: 0 } }));
    const op = base.findIndex((s) => s.assets[0].status === "operating") + 2;
    const run = simulate(cfg({ alloc: { homes: 1, business: 0, fund: 0 } }), [{ month: op, type: "vacancy" }]);
    expect(base[op].earnedThisMonth).toBeGreaterThan(0);
    expect(run[op].earnedThisMonth).toBe(0);
    expect(run[op + 1].earnedThisMonth).toBe(0);
    expect(run[op + 2].earnedThisMonth).toBeGreaterThan(0);
  });

  it("never pays you more than your share of what was deposited", () => {
    const run = simulate(cfg({ amount: dollars(1000), alloc: { homes: 1, business: 0, fund: 0 } }));
    const s = run[120];
    const deposited = s.assets[0].totalDistributed;
    const yourShare = deposited * (100 / 15_000);
    expect(s.earned).toBeLessThanOrEqual(yourShare);
    expect(s.earned).toBeGreaterThan(yourShare - 120); // floor loses under a cent a month
  });

  it("keeps fund returns realistic (single-digit yearly income)", () => {
    const s = simulate(cfg({ amount: dollars(1000), alloc: { homes: 0, business: 0, fund: 1 }, community: 5000 }))[60];
    const fund = s.holdings[0];
    const yearlyIncomeRate = fund.earned / fund.invested / 5;
    expect(yearlyIncomeRate).toBeGreaterThan(0.04);
    expect(yearlyIncomeRate).toBeLessThan(0.1);
  });

  it("blocks a second rent increase within 12 months", () => {
    const base = simulate(cfg());
    const op = base.findIndex((s) => s.assets[0].status === "operating") + 1;
    const run = simulate(cfg(), [
      { month: op, type: "rentIncrease" },
      { month: op + 3, type: "rentIncrease" },
    ]);
    expect(run[op + 5].assets[0].rent).toBe(dollars(1_442));
    expect(run[op + 3].notes.join(" ")).toMatch(/Blocked/);
  });

  it("turns tokens into cash when the house sells", () => {
    const run = simulate(cfg({ alloc: { homes: 1, business: 0, fund: 0 } }), [{ month: 90, type: "sale" }]);
    const s = run[90];
    expect(s.holdings[0].status).toBe("sold");
    expect(s.cash).toBeGreaterThan(dollars(100));
    expect(portfolioValue(s, cfg())).toBe(s.cash);
  });

  it("shows a loss when the business closes", () => {
    const run = simulate(cfg({ alloc: { homes: 0, business: 1, fund: 0 } }), [{ month: 18, type: "businessCloses" }]);
    const s = run[18];
    expect(s.holdings[0].status).toBe("closed");
    expect(portfolioValue(s, cfg())).toBeLessThan(dollars(100));
  });
});
