/**
 * "How is this calculated?" (spec 4.6): every number the simulator shows maps to a
 * formula from section 6, returned here with the current values filled in.
 */
import { SAMPLE_HOME, fmt, homeMonthly, pct, repaymentCap, totalTokens } from "../finance";
import { ASSETS, SimConfig, SimState, YOUR_BUSINESS, YOUR_HOME, assetById, holdingValue, portfolioValue, totalReturn } from ".";

export type ExplainKey = "invested" | "earned" | "value" | "return" | "home" | "business" | "savings" | "cash" | "impact";

export interface Explanation {
  title: string;
  formula: string;
  lines: string[];
  source: string;
}

export function explain(key: ExplainKey, s: SimState, c: SimConfig): Explanation {
  const home = s.assets.find((a) => a.id === YOUR_HOME)!;
  const shop = s.assets.find((a) => a.id === YOUR_BUSINESS)!;
  switch (key) {
    case "invested":
      return {
        title: "Invested",
        formula: "Invested = the dollars you put in",
        lines: [
          `You started with ${fmt(c.amount)}: ${pct(c.alloc.homes, 0)} to 1204 Sample St, ${pct(c.alloc.business, 0)} to Corner Cuts and ${pct(c.alloc.fund, 0)} to the Neighborhood Fund.`,
          "Reinvested payouts are not counted here. They show up in Value instead.",
        ],
        source: "Spec 3.3",
      };
    case "earned":
      return {
        title: "Earned",
        formula: "Earned = Σ every monthly payout you received",
        lines: s.holdings
          .map((h) => `${h.assetId === "fund" ? "Neighborhood Fund" : assetById(h.assetId).name}: ${fmt(h.earned)}`)
          .concat(
            `Total: ${fmt(s.earned)}`,
            "Barbershop payments include your own money coming back (1× of the 1.4×), so its value shrinks as it pays. Total return counts that correctly.",
          ),
        source: "Spec 6.1, 6.2, 6.3",
      };
    case "value": {
      const lines = s.holdings.map((h) => {
        const v = holdingValue(s, h, c);
        const name = h.assetId === "fund" ? "Neighborhood Fund" : assetById(h.assetId).name;
        if (h.status !== "active" && h.status !== "escrow") return `${name}: ${h.status}, now worth $0.00 (any money returned is in your wallet)`;
        if (h.assetId === "fund") return `${name}: ${fmt(v)} (what you put in, plus reinvested payouts, minus losses)`;
        const def = assetById(h.assetId);
        if (def.kind === "home")
          return `${name}: ${h.tokens.toFixed(2)} tokens × $10 × (1 + ${pct(c.appreciation, 0)})^years = ${fmt(v)} (estimate)`;
        return `${name}: remaining payments discounted at 20% a year (risk-adjusted) = ${fmt(v)}`;
      });
      return {
        title: "Current value",
        formula: "Value = wallet cash + Σ value of each holding",
        lines: [`Wallet cash (payouts, refunds, sale money): ${fmt(s.cash)}`, ...lines, `Total: ${fmt(portfolioValue(s, c))}`],
        source: "Spec 6.1 (appreciation), 6.3 (discounting)",
      };
    }
    case "return":
      return {
        title: "Total return",
        formula: "Return = (Value − Invested) ÷ Invested",
        lines: [`(${fmt(portfolioValue(s, c))} − ${fmt(s.invested)}) ÷ ${fmt(s.invested)} = ${pct(totalReturn(s, c))}`, "Includes estimated home appreciation, which you only get in cash if the house is sold."],
        source: "Spec 3.4",
      };
    case "home": {
      const b = homeMonthly(SAMPLE_HOME, home.rent);
      const N = totalTokens(SAMPLE_HOME);
      const yours = s.holdings.find((h) => h.assetId === YOUR_HOME);
      return {
        title: "1204 Sample St payout",
        formula: "D = R − (v + m + r + f)·R − T,   payout = D ÷ N × your tokens",
        lines: [
          `R (rent) = ${fmt(b.rent)}`,
          `v + m + r + f = 5% + 8% + 10% + 2% = 25% → ${fmt(b.vacancy + b.management + b.reserve + b.platformFee)}`,
          `T (taxes + insurance) = ${fmt(b.taxesInsurance)}`,
          `D = ${fmt(b.distributable)} a month to all ${N.toLocaleString()} tokens`,
          `Per token: ${fmt(b.distributable / N)} → yours (${(yours?.tokens ?? 0).toFixed(2)} tokens): ${fmt((b.distributable / N) * (yours?.tokens ?? 0))}`,
          `Reserve balance now: ${fmt(home.reserve)}. In a vacant month or after a big repair, D can drop to $0.`,
        ],
        source: "Spec 6.1",
      };
    }
    case "business": {
      const def = assetById(YOUR_BUSINESS);
      const b = def.business!;
      const cap = repaymentCap(b);
      return {
        title: "Corner Cuts payout",
        formula: "P = min(k × monthly revenue, Cap − paid so far),   Cap = 1.4 × raise",
        lines: [
          `k = ${pct(b.revenueShare, 0)}, monthly revenue ≈ ${fmt((b.annualRevenue / 12) * shop.revenueMult)}`,
          `Cap = 1.4 × ${fmt(b.raise)} = ${fmt(cap)}`,
          `Paid so far: ${fmt(shop.repaid)} · left: ${fmt(Math.max(0, cap - shop.repaid))}`,
          "Investors receive the payment minus a 2% platform fee, split across 2,500 tokens.",
        ],
        source: "Spec 6.2",
      };
    }
    case "savings":
      return {
        title: "Savings account",
        formula: "Balance × (1 + APY ÷ 12)^months",
        lines: [`${fmt(s.invested)} × (1 + ${pct(c.savingsApy, 1)} ÷ 12)^${s.month} = ${fmt(s.history[s.history.length - 1].savings)}`],
        source: "Spec 6.7",
      };
    case "cash":
      return {
        title: "Cash under the mattress",
        formula: "Real value = balance ÷ (1 + inflation)^years",
        lines: [`${fmt(s.invested)} ÷ (1 + ${pct(c.inflation, 0)})^${(s.month / 12).toFixed(1)} = ${fmt(s.history[s.history.length - 1].cash)} in today's dollars`],
        source: "Spec 6.7",
      };
    case "impact": {
      const funded = s.assets.filter((a) => a.fundedMonth !== null).map((a) => assetById(a.id).short);
      return {
        title: "Community impact",
        formula: "Counted from funded buildings in this simulation",
        lines: [
          `Funded so far: ${funded.length ? funded.join(", ") : "nothing yet"} (of ${ASSETS.length}).`,
          "Homes kept affordable: funded homes with the 3% yearly rent cap.",
          "Local jobs: permanent jobs at funded businesses, plus 4 local contractors per building being renovated.",
          "Dollars kept in the neighborhood: 60% of payouts (local investors) plus 70% of renovation budgets (local contractors). These shares are assumptions.",
          `Residents who are owners: 40% of the ${c.community.toLocaleString()} investors are assumed to live in the zip code.`,
        ],
        source: "Spec 5.3",
      };
    }
  }
}
