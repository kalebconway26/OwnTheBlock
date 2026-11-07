import { describe, expect, it } from "vitest";
import {
  SAMPLE_BUSINESS,
  SAMPLE_HOME,
  businessPayment,
  businessPerToken,
  cashRealValue,
  cashYield,
  communityWeight,
  dollars,
  financialWeight,
  fundNav,
  homeMonthly,
  investorPayout,
  paybackMonths,
  payoutPerToken,
  reinvestTokens,
  repaymentCap,
  saleProceedsPerToken,
  savingsBalance,
  tenantTokensPerMonth,
  totalTokens,
} from ".";

// Each test reproduces a worked example from spec section 6, to the cent.

describe("6.1 rental home", () => {
  const N = totalTokens(SAMPLE_HOME);

  it("has 15,000 tokens", () => expect(N).toBe(15_000));

  it("distributes $850 a month", () => {
    const b = homeMonthly(SAMPLE_HOME);
    expect(b.vacancy + b.management + b.reserve + b.platformFee).toBe(dollars(350));
    expect(b.distributable).toBe(dollars(850));
  });

  it("pays about $0.0567 per token per month", () => {
    const p = payoutPerToken(dollars(850), N);
    expect(p / 100).toBeCloseTo(0.0567, 4);
  });

  it("pays a $10 investor about $0.06 a month and $0.68 a year", () => {
    expect(Math.round(payoutPerToken(dollars(850), N))).toBe(6);
    expect(Math.round(payoutPerToken(dollars(850), N) * 12)).toBe(68);
    // Actual credited amount is floored so payouts never exceed deposits.
    expect(investorPayout(dollars(850), N, 1)).toBe(5);
  });

  it("yields 6.8% a year", () => expect(cashYield(dollars(850), SAMPLE_HOME.totalRaise)).toBeCloseTo(0.068, 6));

  it("sells at year 7 for about $172,950, $11.53 per token", () => {
    const perToken = saleProceedsPerToken({
      startValue: dollars(147_000),
      appreciation: 0.03,
      years: 7,
      sellingCosts: 0.06,
      reserve: dollars(3_000),
      tokens: N,
    });
    expect(Math.round(perToken * N / 100 / 10) * 10).toBe(172_940); // spec rounds to "about $172,950"
    expect(Math.round(perToken)).toBe(1153);
    // $4.76 rent over 7 years + $11.53 at sale ≈ $16.29
    expect(Math.round(payoutPerToken(dollars(850), N) * 84) + Math.round(perToken)).toBe(1629);
  });
});

describe("6.2 business revenue share", () => {
  it("caps at $35,000", () => expect(repaymentCap(SAMPLE_BUSINESS)).toBe(dollars(35_000)));

  it("pays about $833 a month and reaches the cap in 42 months", () => {
    const pay = businessPayment(0.05, dollars(200_000) / 12, repaymentCap(SAMPLE_BUSINESS), 0);
    expect(Math.round(pay / 100)).toBe(833);
    expect(paybackMonths(SAMPLE_BUSINESS)).toBe(42);
  });

  it("stretches to about 56 months if revenue drops 25%", () =>
    expect(paybackMonths(SAMPLE_BUSINESS, 0.75)).toBe(56));

  it("pays about $0.33 per token per month", () => expect(Math.round(businessPerToken(SAMPLE_BUSINESS))).toBe(33));

  it("never pays past the cap", () => {
    const cap = repaymentCap(SAMPLE_BUSINESS);
    expect(businessPayment(0.05, dollars(20_000), cap, cap - dollars(100))).toBe(dollars(100));
    expect(businessPayment(0.05, dollars(20_000), cap, cap)).toBe(0);
  });
});

describe("6.3 – 6.7", () => {
  it("computes fund NAV", () => expect(fundNav(dollars(100), [dollars(400), dollars(500)], 100)).toBe(dollars(10)));

  it("reinvests payouts into more tokens", () => expect(reinvestTokens(10, 5.6667, 1000)).toBeCloseTo(10.056667, 5));

  it("gives tenants 2.8 tokens a month, $336 a year", () => {
    const t = tenantTokensPerMonth(dollars(1_400), dollars(10));
    expect(t).toBeCloseTo(2.8, 10);
    expect(Math.round(t * 12 * dollars(10))).toBe(dollars(336));
  });

  it("weights votes", () => {
    expect(communityWeight(true)).toBe(1.5);
    expect(communityWeight(false)).toBe(1);
    expect(financialWeight(100)).toBe(10);
  });

  it("computes compare baselines", () => {
    expect(Math.round(savingsBalance(dollars(100), 0.04, 12))).toBe(10407);
    expect(Math.round(cashRealValue(dollars(100), 0.03, 12))).toBe(9709);
  });
});
