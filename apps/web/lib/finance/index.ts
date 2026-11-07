/**
 * OwnTheBlock financial model (spec section 6).
 *
 * Every function here is pure: same inputs, same outputs, no side effects.
 * Money is passed around as integer cents. Rates are plain decimals (0.05 = 5%).
 * Intermediate results such as "payout per token" can be fractional cents; we
 * only round when money actually lands in someone's balance, and we round DOWN
 * so the sum of everyone's payouts can never exceed what was deposited.
 */

export type Cents = number;

export const dollars = (d: number): Cents => Math.round(d * 100);
export const toDollars = (c: Cents): number => c / 100;

/** Round down to whole cents: used whenever money is credited to a person. */
export const floorCents = (c: number): Cents => Math.floor(c + 1e-9);

// ---------------------------------------------------------------------------
// 6.1 Rental home
// ---------------------------------------------------------------------------

export interface HomeInputs {
  purchasePrice: Cents;
  renovationBudget: Cents;
  startingReserve: Cents;
  totalRaise: Cents;
  tokenPrice: Cents;
  monthlyRent: Cents;
  vacancyRate: number;
  managementRate: number;
  reserveRate: number;
  platformFeeRate: number;
  taxesInsurance: Cents; // monthly
}

/** Fictional sample property used across the demo (spec 6.1). */
export const SAMPLE_HOME: HomeInputs = {
  purchasePrice: dollars(132_000),
  renovationBudget: dollars(15_000),
  startingReserve: dollars(3_000),
  totalRaise: dollars(150_000),
  tokenPrice: dollars(10),
  monthlyRent: dollars(1_400),
  vacancyRate: 0.05,
  managementRate: 0.08,
  reserveRate: 0.1,
  platformFeeRate: 0.02,
  taxesInsurance: dollars(200),
};

export const totalTokens = (h: Pick<HomeInputs, "totalRaise" | "tokenPrice">) =>
  Math.round(h.totalRaise / h.tokenPrice);

export interface HomeBreakdown {
  rent: Cents;
  vacancy: Cents;
  management: Cents;
  reserve: Cents;
  platformFee: Cents;
  taxesInsurance: Cents;
  distributable: Cents;
}

/**
 * Monthly distributable cash: D = R − (v + m + r + f)·R − T.
 * `rent` can be overridden for months where actual rent differs (rent increase).
 */
export function homeMonthly(h: HomeInputs, rent: Cents = h.monthlyRent): HomeBreakdown {
  const vacancy = rent * h.vacancyRate;
  const management = rent * h.managementRate;
  const reserve = rent * h.reserveRate;
  const platformFee = rent * h.platformFeeRate;
  const distributable = rent - vacancy - management - reserve - platformFee - h.taxesInsurance;
  return {
    rent,
    vacancy,
    management,
    reserve,
    platformFee,
    taxesInsurance: h.taxesInsurance,
    distributable: Math.max(0, distributable),
  };
}

/** Payout per token per month: p = D / N (fractional cents). */
export const payoutPerToken = (distributable: Cents, tokens: number) => distributable / tokens;

/** What one investor receives: floor(p × t). */
export const investorPayout = (distributable: Cents, totalTokenCount: number, held: number): Cents =>
  floorCents(payoutPerToken(distributable, totalTokenCount) * held);

/** Annual cash yield: y = 12·D / total raise. */
export const cashYield = (distributable: Cents, totalRaise: Cents) => (12 * distributable) / totalRaise;

export interface SaleInputs {
  startValue: Cents; // V0 = purchase + renovation
  appreciation: number; // g
  years: number; // n
  sellingCosts: number; // s
  reserve: Cents;
  tokens: number; // N
}

/** Proceeds per token = (V0·(1+g)^n·(1−s) + Reserve) / N. */
export function saleProceedsPerToken(s: SaleInputs): Cents {
  return (s.startValue * Math.pow(1 + s.appreciation, s.years) * (1 - s.sellingCosts) + s.reserve) / s.tokens;
}

export function saleTotal(s: SaleInputs): Cents {
  return s.startValue * Math.pow(1 + s.appreciation, s.years) * (1 - s.sellingCosts) + s.reserve;
}

// ---------------------------------------------------------------------------
// 6.2 Business revenue share
// ---------------------------------------------------------------------------

export interface BusinessInputs {
  raise: Cents;
  tokenPrice: Cents;
  revenueShare: number; // k
  capMultiple: number; // c
  annualRevenue: Cents;
  platformFeeRate: number; // taken from each repayment before it reaches investors
}

export const SAMPLE_BUSINESS: BusinessInputs = {
  raise: dollars(25_000),
  tokenPrice: dollars(10),
  revenueShare: 0.05,
  capMultiple: 1.4,
  annualRevenue: dollars(200_000),
  platformFeeRate: 0.02,
};

export const repaymentCap = (b: Pick<BusinessInputs, "raise" | "capMultiple">): Cents => b.raise * b.capMultiple;

/** P_m = min(k · Rev_m, C − Σpaid). */
export const businessPayment = (revenueShare: number, monthRevenue: Cents, cap: Cents, paidSoFar: Cents): Cents =>
  Math.max(0, Math.min(revenueShare * monthRevenue, cap - paidSoFar));

/** Months until the cap is reached at a steady monthly revenue. */
export function paybackMonths(b: BusinessInputs, revenueMultiplier = 1): number {
  const monthly = b.revenueShare * (b.annualRevenue / 12) * revenueMultiplier;
  if (monthly <= 0) return Infinity;
  return Math.ceil(repaymentCap(b) / monthly - 1e-9);
}

/** Per-token monthly payout after the platform fee. */
export function businessPerToken(b: BusinessInputs, revenueMultiplier = 1): Cents {
  const tokens = Math.round(b.raise / b.tokenPrice);
  const monthly = b.revenueShare * (b.annualRevenue / 12) * revenueMultiplier;
  return (monthly * (1 - b.platformFeeRate)) / tokens;
}

// ---------------------------------------------------------------------------
// 6.3 Neighborhood Fund
// ---------------------------------------------------------------------------

/** NAV per token = (cash + Σ holding values) / fund tokens outstanding. */
export const fundNav = (cash: Cents, holdingValues: Cents[], tokensOutstanding: number): Cents =>
  tokensOutstanding === 0 ? 0 : (cash + holdingValues.reduce((a, b) => a + b, 0)) / tokensOutstanding;

/**
 * Value of a business note = remaining expected payments discounted at
 * `annualRate` (10% by default), paid monthly until the cap is reached.
 */
export function businessNoteValue(monthlyPayment: Cents, remainingCap: Cents, annualRate = 0.1): Cents {
  if (monthlyPayment <= 0 || remainingCap <= 0) return 0;
  const r = annualRate / 12;
  let value = 0;
  let left = remainingCap;
  for (let m = 1; left > 0 && m <= 600; m++) {
    const pay = Math.min(monthlyPayment, left);
    value += pay / Math.pow(1 + r, m);
    left -= pay;
  }
  return value;
}

// ---------------------------------------------------------------------------
// 6.4 Reinvesting
// ---------------------------------------------------------------------------

/** t_{m+1} = t_m + (p · t_m) / token price. */
export const reinvestTokens = (tokens: number, perTokenPayout: Cents, tokenPrice: Cents) =>
  tokens + (perTokenPayout * tokens) / tokenPrice;

// ---------------------------------------------------------------------------
// 6.5 Rent-to-own
// ---------------------------------------------------------------------------

export const tenantTokensPerMonth = (rent: Cents, tokenPrice: Cents, rate = 0.02) => (rate * rent) / tokenPrice;

// ---------------------------------------------------------------------------
// 6.6 Governance weight
// ---------------------------------------------------------------------------

export const communityWeight = (verifiedResident: boolean) => (verifiedResident ? 1.5 : 1);
export const financialWeight = (tokens: number) => Math.sqrt(Math.max(0, tokens));

// ---------------------------------------------------------------------------
// 6.7 Compare mode baselines
// ---------------------------------------------------------------------------

/** Savings account compounding monthly: balance × (1 + APY/12)^months. */
export const savingsBalance = (start: Cents, apy: number, months: number): Cents =>
  start * Math.pow(1 + apy / 12, months);

/** Cash under the mattress, in today's dollars: balance ÷ (1 + inflation)^years. */
export const cashRealValue = (start: Cents, inflation: number, months: number): Cents =>
  start / Math.pow(1 + inflation, months / 12);

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Always dollars with cents (spec 8.5). */
export const fmt = (c: Cents) => usd.format(c / 100);
/** Whole dollars, for large headline figures like a $150,000 raise. */
export const fmt0 = (c: Cents) => usd0.format(c / 100);
export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
