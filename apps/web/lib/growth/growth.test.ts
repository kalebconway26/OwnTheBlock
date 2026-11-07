import { describe, expect, it } from "vitest";
import { BASE, SCENARIOS, project, stack } from ".";
import { dollars } from "../finance";

describe("growth projection", () => {
  const base = project(BASE);

  it("grows investors and expands to new communities", () => {
    expect(base.months[0].communities).toBe(1);
    expect(base.months[119].communities).toBeGreaterThan(10);
    expect(base.months[119].investors).toBeGreaterThan(base.months[11].investors);
  });

  it("never buys more homes than the money allows", () => {
    for (const m of base.months) expect(m.homes * BASE.homeCost * 1.08).toBeLessThanOrEqual(m.invested + 1);
  });

  it("respects how many deals each neighborhood can supply", () => {
    const tight = project({ ...BASE, maxHomesPerCommunity: 2 });
    for (const m of tight.months) expect(m.homes).toBeLessThanOrEqual(m.communities * 2);
    expect(tight.months[119].waiting).toBeGreaterThan(base.months[119].waiting);
  });

  it("orders the scenarios sensibly", () => {
    const slow = project(SCENARIOS.Slow).months[119];
    const fast = project(SCENARIOS.Breakout).months[119];
    expect(fast.homes).toBeGreaterThan(base.months[119].homes);
    expect(base.months[119].homes).toBeGreaterThan(slow.homes);
  });

  it("shows stress tests hurting results", () => {
    const hard = project({ ...BASE, recession: true, housingDip: true }).months[119];
    expect(hard.wealthCreated).toBeLessThan(base.months[119].wealthCreated);
    // Fewer deals get funded in a recession, so compare losses per deal, not in total.
    const b = base.months[119];
    expect(hard.losses / hard.businessesFunded).toBeGreaterThan(b.losses / b.businessesFunded);
  });

  it("breaks even sooner with an asset-management fee", () => {
    const withFee = project({ ...BASE, assetFee: 0.01 });
    expect(withFee.breakEvenMonth ?? 999).toBeLessThan(base.breakEvenMonth ?? 999);
  });

  it("stacks monthly contributions", () => {
    const pts = stack(dollars(40), 5, 0.07);
    expect(pts[59].putIn).toBe(dollars(2_400));
    expect(pts[59].balance).toBeGreaterThan(dollars(2_800));
    expect(pts[59].balance).toBeLessThan(dollars(2_950));
  });
});
