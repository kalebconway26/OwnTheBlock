import { describe, expect, it } from "vitest";
import {
  FAUCET_DAILY_CAP,
  World,
  advance,
  claim,
  faucet,
  impact,
  initialWorld,
  invest,
  portfolioValue,
  projectState,
  totalEarned,
} from ".";
import { dollars } from "../finance";

const ok = (r: ReturnType<typeof invest>): World => {
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};
const funded = (n = 5) => {
  let w = initialWorld();
  for (let i = 0; i < n; i++) w = ok(faucet(w, "day"));
  return w;
};

describe("demo world", () => {
  it("caps the faucet at $500 a day", () => {
    const w = funded(5);
    expect(w.cash).toBe(FAUCET_DAILY_CAP);
    expect(faucet(w, "day").ok).toBe(false);
    expect(faucet(w, "next-day").ok).toBe(true);
  });

  it("moves money into escrow and grows the raise", () => {
    const before = projectState(initialWorld(), "example-ave").raised;
    const w = ok(invest(funded(), "example-ave", dollars(50)));
    expect(w.cash).toBe(dollars(450));
    expect(projectState(w, "example-ave").raised).toBe(before + dollars(50));
    expect(w.positions[0]).toMatchObject({ tokens: 5, status: "escrow" });
  });

  it("enforces the $10 minimum, cash on hand and the yearly limit", () => {
    expect(invest(funded(), "example-ave", dollars(5)).ok).toBe(false);
    expect(invest(initialWorld(), "example-ave", dollars(10)).ok).toBe(false);
    let w = funded(5);
    for (const d of ["a", "b", "c", "d", "e", "f"]) for (let i = 0; i < 5; i++) w = ok(faucet(w, d));
    expect(invest(w, "fund", dollars(2_600)).ok).toBe(false);
    expect(invest(w, "fund", dollars(2_500)).ok).toBe(true);
  });

  it("won't sell tokens in a completed raise", () => {
    expect(invest(funded(), "sample-st", dollars(10)).ok).toBe(false);
  });

  it("completes the raise, renovates, then pays rent", () => {
    let w = ok(invest(funded(), "example-ave", dollars(100)));
    w = advance(w, 2);
    expect(projectState(w, "example-ave").stage).toBe("Renovating");
    expect(w.positions[0].status).toBe("active");
    w = advance(w, 3);
    expect(projectState(w, "example-ave").stage).toBe("Operating"); // tenant moves in
    expect(totalEarned(w)).toBe(0);
    w = advance(w, 1); // first rent payout the month after
    expect(totalEarned(w)).toBeGreaterThan(0);
    expect(w.txs.some((t) => t.kind === "closing")).toBe(true);
    expect(w.txs.some((t) => t.kind === "tenant")).toBe(true);
  });

  it("pays you exactly your share of the rent, rounded down", () => {
    let w = ok(invest(funded(), "example-ave", dollars(150)));
    w = advance(w, 8);
    const s = projectState(w, "example-ave");
    expect(w.positions[0].earned).toBeLessThanOrEqual((s.totalPaid * 15) / 15_000);
    expect(w.positions[0].earned).toBeGreaterThan((s.totalPaid * 15) / 15_000 - 8);
  });

  it("holds payouts until you claim when auto-claim is off", () => {
    let w = ok(invest(funded(), "fund", dollars(200)));
    w = { ...w, autoClaim: false };
    w = advance(w, 3);
    const owed = w.positions[0].claimable;
    expect(owed).toBeGreaterThan(0);
    const after = claim(w);
    expect(after.ok && after.world.cash).toBe(w.cash + owed);
  });

  it("opens new raises from the pipeline and keeps growing the neighborhood", () => {
    const w = advance(initialWorld(), 12);
    expect(projectState(w, "laundromat").stage).not.toBe("Community vote");
    expect(impact(w).homes).toBeGreaterThan(impact(initialWorld()).homes);
  });

  it("refunds automatically if a raise misses its deadline", () => {
    // Make the raise impossible to fill in time: almost nothing raised, deadline next month.
    let w = ok(invest(funded(), "example-ave", dollars(40)));
    w = { ...w, projects: w.projects.map((p) => (p.id === "example-ave" ? { ...p, deadline: 1, raised: dollars(40) } : p)) };
    w = advance(w, 1);
    expect(projectState(w, "example-ave").stage).toBe("Refunded");
    expect(w.positions[0].status).toBe("refunded");
    expect(w.cash).toBe(dollars(500));
  });

  it("values the portfolio as cash plus holdings", () => {
    const w = ok(invest(funded(), "fund", dollars(100)));
    expect(portfolioValue(w)).toBe(dollars(500));
  });
});

describe("history records deposits (Home chart gain)", () => {
  it("cash from the faucet is tracked so it doesn't read as profit", () => {
    let w = initialWorld();
    const r = faucet(w, "2026-11-04");
    if (!r.ok) throw new Error(r.reason);
    w = advance(r.world, 1);
    const last = w.history[w.history.length - 1];
    expect(last.deposited).toBe(FAUCET_DAILY_CAP / 5);
    expect(last.value - (last.deposited ?? 0)).toBe(0);
  });
});
