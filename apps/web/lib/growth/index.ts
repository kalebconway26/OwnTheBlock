/**
 * "Grow the app": what happens if OwnTheBlock actually catches on.
 *
 * A month-by-month projection of investors, money invested, homes and businesses
 * funded, wealth created, community impact and the company's own finances. It reuses
 * the per-home and per-business economics from spec section 6. It's a projection,
 * not a promise: every input is an assumption the user can change.
 */
import { Cents, SAMPLE_HOME, dollars, homeMonthly } from "../finance";

export interface GrowthInputs {
  // Adoption
  pilotInvestors: number;
  newPerCommunityMonthly: number; // new investors a community adds each month
  maxPerCommunity: number; // investors a community levels off at
  expansionStartMonth: number; // when the first new community launches
  monthsPerNewCommunity: number;
  maxCommunities: number;
  monthlyChurn: number;
  // Money
  firstDeposit: Cents;
  monthlyContribution: Cents; // average per active investor
  reinvestShare: number; // share of payouts investors put back in
  homeShare: number; // share of new money going to homes (rest to businesses)
  // Deals
  homeCost: Cents; // purchase + renovation + reserve
  offeringCosts: number; // funding portal, legal, closing (paid by each raise)
  raiseFee: number; // OwnTheBlock's 3% raise fee (paid by each raise)
  maxHomesPerCommunity: number; // how many good homes a neighborhood can supply
  dealSize: Cents; // average business raise
  maxDealsPerCommunity: number;
  businessFailureRate: number; // yearly share of active business deals that close
  appreciation: number;
  marketRent: Cents;
  // Company costs
  fixedCostsMonthly: Cents; // team, compliance, audits, software
  costPerCommunityMonthly: Cents; // local outreach and property oversight
  kycPerInvestor: Cents;
  assetFee: number; // optional yearly asset-management fee on holdings (not in the spec; common in the industry)
  // Stress tests
  housingDip: boolean; // home values fall 10% in year 3
  recession: boolean; // years 3–4: double business failures, more vacancies, fewer new investors
}

export const BASE: GrowthInputs = {
  pilotInvestors: 500,
  newPerCommunityMonthly: 60,
  maxPerCommunity: 3_000,
  expansionStartMonth: 12,
  monthsPerNewCommunity: 3,
  maxCommunities: 100,
  monthlyChurn: 0.01,
  firstDeposit: dollars(50),
  monthlyContribution: dollars(40),
  reinvestShare: 0.5,
  homeShare: 0.75,
  homeCost: SAMPLE_HOME.totalRaise,
  offeringCosts: 0.05,
  raiseFee: 0.03,
  maxHomesPerCommunity: 40,
  dealSize: dollars(30_000),
  maxDealsPerCommunity: 15,
  businessFailureRate: 0.08,
  appreciation: 0.03,
  marketRent: dollars(1_600),
  fixedCostsMonthly: dollars(45_000),
  costPerCommunityMonthly: dollars(2_500),
  kycPerInvestor: dollars(3),
  assetFee: 0,
  housingDip: false,
  recession: false,
};

export const SCENARIOS: Record<"Slow" | "Base" | "Breakout", GrowthInputs> = {
  Slow: { ...BASE, newPerCommunityMonthly: 30, monthsPerNewCommunity: 6, monthlyContribution: dollars(25), monthlyChurn: 0.02, appreciation: 0.02, businessFailureRate: 0.12 },
  Base: BASE,
  Breakout: { ...BASE, newPerCommunityMonthly: 120, monthsPerNewCommunity: 2, monthlyContribution: dollars(50), monthlyChurn: 0.008, appreciation: 0.035, businessFailureRate: 0.06 },
};

const HOME = homeMonthly(SAMPLE_HOME); // $850 to investors from $1,400 rent
const RENT = SAMPLE_HOME.monthlyRent;
const BIZ_TERM = 42; // months to repay the 1.4× cap (spec 6.2)
const BIZ_CAP = 1.4;
const FIRST_LOSS = 0.1;
const LOCAL_SHARE = 0.6;
const TRADING_TURNOVER = 0.1; // share of holdings resold each year once lockups end
const TRADING_FEE = 0.005;

export interface GrowthMonth {
  month: number;
  communities: number;
  investors: number;
  newInvestors: number;
  invested: Cents; // cumulative money put in by investors (new deposits + reinvested)
  homes: number;
  businessesFunded: number;
  activeBusinesses: number;
  businessesClosed: number;
  waiting: Cents; // money waiting for a deal
  payoutsMonth: Cents;
  payoutsTotal: Cents; // income paid to investors (rent + business profit)
  appreciation: Cents; // home value gains, on paper
  losses: Cents; // business money lost after first-loss cover
  wealthCreated: Cents; // payouts + appreciation − losses
  homeValue: Cents;
  tenantSavings: Cents; // cumulative: market rent − our rent
  tenantEquity: Cents; // cumulative rent-to-own tokens
  jobs: number;
  dollarsKept: Cents;
  revenue: Cents; // OwnTheBlock, this month
  costs: Cents;
  profit: Cents;
  cumulativeProfit: Cents;
}

export interface GrowthResult {
  months: GrowthMonth[];
  breakEvenMonth: number | null; // first month the company makes money
  fundingNeeded: Cents; // deepest cumulative loss before that
  annualReturn: number; // wealth created ÷ average money invested, per year
}

export function project(inp: GrowthInputs, months = 120): GrowthResult {
  const communities: number[] = [inp.pilotInvestors]; // investors per community
  const cohorts: { start: number; count: number; raise: Cents }[] = []; // business deals
  let homes = 0;
  let homesAgeWeightedValue = 0; // current value of all homes
  let homeCostTotal = 0;
  let poolHomes = 0;
  let poolBiz = 0;
  let invested = 0;
  let payoutsTotal = 0;
  let losses = 0;
  let businessesFunded = 0;
  let businessesClosed = 0;
  let tenantSavings = 0;
  let tenantEquity = 0;
  let renovationLocal = 0;
  let cumulativeProfit = 0;
  let minCumulative = 0;
  let breakEven: number | null = null;
  let investedMonths = 0;
  let lastPayouts = 0;
  const homeCapital = inp.homeCost * (1 + inp.offeringCosts + inp.raiseFee);
  const out: GrowthMonth[] = [];

  for (let m = 1; m <= months; m++) {
    const year = Math.ceil(m / 12);
    const hardTimes = inp.recession && (year === 3 || year === 4);

    // 1. Communities and investors
    const target = 1 + Math.max(0, Math.floor((m - inp.expansionStartMonth) / inp.monthsPerNewCommunity) + (m >= inp.expansionStartMonth ? 1 : 0));
    while (communities.length < Math.min(inp.maxCommunities, target)) communities.push(0);
    let newInvestors = 0;
    for (let c = 0; c < communities.length; c++) {
      const room = inp.maxPerCommunity - communities[c];
      const add = Math.max(0, Math.min(room, Math.round(inp.newPerCommunityMonthly * (hardTimes ? 0.5 : 1))));
      const churn = Math.round(communities[c] * inp.monthlyChurn);
      communities[c] = communities[c] + add - churn;
      newInvestors += add;
    }
    const investors = communities.reduce((a, b) => a + b, 0);

    // 2. New money: first deposits, monthly contributions, reinvested payouts
    const fresh = newInvestors * inp.firstDeposit + investors * inp.monthlyContribution;
    const reinvested = lastPayouts * inp.reinvestShare;
    const money = fresh + reinvested;
    invested += money;
    poolHomes += money * inp.homeShare;
    poolBiz += money * (1 - inp.homeShare);

    // 3. Deploy money into deals, limited by how many deals the neighborhoods can supply
    let raisedThisMonth = 0;
    const homeCap = communities.length * inp.maxHomesPerCommunity;
    while (poolHomes >= homeCapital && homes < homeCap) {
      poolHomes -= homeCapital;
      homes++;
      homeCostTotal += inp.homeCost;
      homesAgeWeightedValue += inp.homeCost;
      renovationLocal += SAMPLE_HOME.renovationBudget * 0.7;
      raisedThisMonth += homeCapital;
    }
    const activeBiz = cohorts.reduce((s, c) => s + (m - c.start < BIZ_TERM ? c.count : 0), 0);
    const bizRoom = Math.floor(communities.length * inp.maxDealsPerCommunity - activeBiz);
    const dealCapital = inp.dealSize * (1 + inp.offeringCosts + inp.raiseFee);
    const newDeals = Math.max(0, Math.min(bizRoom, Math.floor(poolBiz / dealCapital)));
    if (newDeals > 0) {
      cohorts.push({ start: m, count: newDeals, raise: inp.dealSize });
      poolBiz -= newDeals * dealCapital;
      businessesFunded += newDeals;
      raisedThisMonth += newDeals * dealCapital;
    }

    // 4. Homes pay rent and gain (or lose) value
    const occupancy = hardTimes ? 0.9 : 0.97; // the 5% vacancy buffer covers normal turnover
    const homePayouts = homes * HOME.distributable * occupancy;
    const homeRentGross = homes * RENT * occupancy;
    const g = Math.pow(1 + inp.appreciation, 1 / 12) - 1;
    homesAgeWeightedValue *= 1 + g;
    if (inp.housingDip && m === 30) homesAgeWeightedValue *= 0.9;
    tenantSavings += homes * occupancy * (inp.marketRent - RENT);
    tenantEquity += homes * occupancy * RENT * 0.02;

    // 5. Businesses repay 1.4× over 42 months; some close
    let bizRepay = 0;
    let bizProfit = 0;
    const failMonthly = (inp.businessFailureRate * (hardTimes ? 2 : 1)) / 12;
    let stillActive = 0;
    for (const c of cohorts) {
      const age = m - c.start;
      if (age <= 0 || age > BIZ_TERM || c.count <= 0) continue;
      const failed = c.count * failMonthly;
      if (failed > 0) {
        const repaidSoFar = (c.raise * BIZ_CAP * (age - 1)) / BIZ_TERM;
        const unrecovered = Math.max(0, c.raise - repaidSoFar);
        const lossPerDeal = Math.max(0, unrecovered - FIRST_LOSS * c.raise);
        losses += failed * lossPerDeal;
        businessesClosed += failed;
        c.count -= failed;
      }
      const pay = (c.count * c.raise * BIZ_CAP) / BIZ_TERM;
      bizRepay += pay;
      bizProfit += pay * (1 - 1 / BIZ_CAP); // the rest is principal coming back
      poolBiz += pay * (1 / BIZ_CAP) * 0.98 * inp.reinvestShare; // returned principal gets reinvested
      stillActive += c.count;
    }
    const assetFees = ((homesAgeWeightedValue + stillActive * inp.dealSize) * inp.assetFee) / 12;
    const payouts = Math.max(0, homePayouts + bizProfit * 0.98 - assetFees);
    payoutsTotal += payouts;
    lastPayouts = payouts;
    investedMonths += invested;

    // 6. OwnTheBlock's own books
    const lockedUp = m > 12 ? 1 : 0;
    const holdings = homesAgeWeightedValue + stillActive * inp.dealSize;
    const revenue =
      raisedThisMonth * (inp.raiseFee / (1 + inp.offeringCosts + inp.raiseFee)) +
      homeRentGross * 0.02 +
      bizRepay * 0.02 +
      (lockedUp * holdings * TRADING_TURNOVER * TRADING_FEE) / 12 +
      assetFees;
    const costs = inp.fixedCostsMonthly + inp.costPerCommunityMonthly * communities.length + inp.kycPerInvestor * newInvestors;
    const profit = revenue - costs;
    cumulativeProfit += profit;
    minCumulative = Math.min(minCumulative, cumulativeProfit);
    if (breakEven === null && profit >= 0) breakEven = m;

    const appreciation = homesAgeWeightedValue - homeCostTotal;
    out.push({
      month: m,
      communities: communities.length,
      investors,
      newInvestors,
      invested,
      homes,
      businessesFunded,
      activeBusinesses: Math.round(stillActive),
      businessesClosed: Math.round(businessesClosed),
      waiting: poolHomes + poolBiz,
      payoutsMonth: payouts,
      payoutsTotal,
      appreciation,
      losses,
      wealthCreated: payoutsTotal + appreciation - losses,
      homeValue: homesAgeWeightedValue,
      tenantSavings,
      tenantEquity,
      jobs: Math.round(stillActive * 3 + homes * 0.25),
      dollarsKept: payoutsTotal * LOCAL_SHARE + renovationLocal + tenantSavings,
      revenue,
      costs,
      profit,
      cumulativeProfit,
    });
  }

  const last = out[out.length - 1];
  const avgInvested = investedMonths / months;
  return {
    months: out,
    breakEvenMonth: breakEven,
    fundingNeeded: -minCumulative,
    annualReturn: avgInvested > 0 ? last.wealthCreated / avgInvested / (months / 12) : 0,
  };
}

/** One investor stacking a monthly amount, earning the projected return (compounded monthly). */
export function stack(monthly: Cents, years: number, annualReturn: number) {
  const r = annualReturn / 12;
  let balance = 0;
  const points: { month: number; balance: Cents; putIn: Cents }[] = [];
  for (let m = 1; m <= years * 12; m++) {
    balance = balance * (1 + r) + monthly;
    points.push({ month: m, balance, putIn: monthly * m });
  }
  return points;
}
