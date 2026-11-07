import { describe, expect, it } from "vitest";
import { changeOverRange, historyInRange } from "./range";

const hist = (n: number) => Array.from({ length: n }, (_, m) => ({ month: m, value: m * 100, earned: 0 }));

describe("historyInRange", () => {
  const h = hist(25); // months 0..24
  it("slices by range", () => {
    expect(historyInRange(h, 24, "1M").length).toBe(2);
    expect(historyInRange(h, 24, "3M").length).toBe(4);
    expect(historyInRange(h, 24, "1Y").length).toBe(13);
    expect(historyInRange(h, 24, "ALL").length).toBe(25);
  });
  it("YTD starts at the most recent January (month 0 = Nov 2026, so Jan = month 2, 14, 26…)", () => {
    expect(historyInRange(h, 24, "YTD")[0].month).toBe(14);
  });
  it("shows everything when the range is longer than the history", () => {
    expect(historyInRange(hist(3), 2, "1Y").length).toBe(3);
  });
  it("always keeps at least the last point", () => {
    expect(historyInRange(hist(1), 0, "1M").length).toBe(1);
    expect(historyInRange(hist(1), 0, "YTD").length).toBe(1);
  });
});

describe("changeOverRange", () => {
  it("is 0% when the starting value is 0", () => {
    expect(changeOverRange([{ month: 0, value: 0, earned: 0 }, { month: 1, value: 500, earned: 0 }])).toEqual({ cents: 500, pct: 0 });
  });
  it("computes the percent change", () => {
    expect(changeOverRange([{ month: 0, value: 1000, earned: 0 }, { month: 1, value: 1100, earned: 0 }]).pct).toBeCloseTo(0.1);
  });
  it("handles a single point", () => {
    expect(changeOverRange([{ month: 0, value: 700, earned: 0 }])).toEqual({ cents: 0, pct: 0 });
  });
});

describe("changeOverRange ignores deposits", () => {
  it("adding cash is not a gain", () => {
    expect(changeOverRange([{ month: 0, value: 0, earned: 0, deposited: 0 }, { month: 1, value: 10000, earned: 0, deposited: 10000 }])).toEqual({ cents: 0, pct: 0 });
  });
  it("measures growth on top of deposits", () => {
    const r = changeOverRange([{ month: 0, value: 10000, earned: 0, deposited: 10000 }, { month: 3, value: 21000, earned: 0, deposited: 20000 }]);
    expect(r.cents).toBe(1000);
    expect(r.pct).toBeCloseTo(1000 / 20000);
  });
});

describe("changeOverRange all-time from an empty start", () => {
  it("measures % against deposits when the first point is $0", () => {
    expect(changeOverRange([{ month: 0, value: 0, earned: 0, deposited: 0 }, { month: 6, value: 10500, earned: 0, deposited: 10000 }]).pct).toBeCloseTo(0.05);
  });
});
