/**
 * Block Simulator engine (spec section 4.6).
 *
 * `step(state, config, events) → state` advances the neighborhood by one month.
 * It is deterministic: the same config, seed and event list always produce the
 * same history, so a scenario can be shared by link and replayed exactly.
 * The UI never computes money itself; it only renders what this module returns.
 */
import {
  BusinessInputs,
  Cents,
  HomeInputs,
  SAMPLE_BUSINESS,
  SAMPLE_HOME,
  businessNoteValue,
  businessPayment,
  cashRealValue,
  dollars,
  fmt,
  fmt0,
  homeMonthly,
  repaymentCap,
  saleTotal,
  savingsBalance,
  totalTokens,
} from "../finance";

// ---------------------------------------------------------------------------
// The block: seven fictional buildings, funded in this order
// ---------------------------------------------------------------------------

export type AssetId = "sample-st" | "corner-cuts" | "corner-store" | "example-ave" | "laundromat" | "market-lot" | "demo-ct";

export interface AssetDef {
  id: AssetId;
  name: string;
  short: string;
  kind: "home" | "business";
  raise: Cents;
  home?: HomeInputs;
  business?: BusinessInputs;
  jobs: number; // permanent local jobs once operating
}

const biz = (raise: number, revenue: number, share: number, cap: number): BusinessInputs => ({
  ...SAMPLE_BUSINESS,
  raise: dollars(raise),
  annualRevenue: dollars(revenue),
  revenueShare: share,
  capMultiple: cap,
});

export const ASSETS: AssetDef[] = [
  { id: "sample-st", name: "1204 Sample St", short: "Sample St", kind: "home", raise: SAMPLE_HOME.totalRaise, home: SAMPLE_HOME, jobs: 0 },
  { id: "corner-cuts", name: "Corner Cuts Barbershop", short: "Barbershop", kind: "business", raise: SAMPLE_BUSINESS.raise, business: SAMPLE_BUSINESS, jobs: 3 },
  { id: "corner-store", name: "Aggie Corner Market", short: "Corner store", kind: "business", raise: dollars(40_000), business: biz(40_000, 300_000, 0.05, 1.4), jobs: 4 },
  { id: "example-ave", name: "88 Example Ave", short: "Example Ave", kind: "home", raise: SAMPLE_HOME.totalRaise, home: SAMPLE_HOME, jobs: 0 },
  { id: "laundromat", name: "Spin City Laundromat", short: "Laundromat", kind: "business", raise: dollars(60_000), business: biz(60_000, 180_000, 0.07, 1.5), jobs: 3 },
  { id: "market-lot", name: "Market Lot (vacant)", short: "Vacant lot", kind: "business", raise: dollars(15_000), business: biz(15_000, 96_000, 0.06, 1.3), jobs: 5 },
  { id: "demo-ct", name: "310 Demo Ct", short: "Demo Ct", kind: "home", raise: SAMPLE_HOME.totalRaise, home: SAMPLE_HOME, jobs: 0 },
];

export const assetById = (id: AssetId) => ASSETS.find((a) => a.id === id)!;

/** The house and business the user's own money goes into. */
export const YOUR_HOME: AssetId = "sample-st";
export const YOUR_BUSINESS: AssetId = "corner-cuts";

const RAISE_WINDOW = 12; // months before an unfunded raise refunds everyone
const RENOVATION_MONTHS = 2; // funded → renovating → tenant moves in
const RESIDENT_SHARE = 0.4; // share of investors who live in the zip code (assumption)
const LOCAL_SHARE = 0.6; // share of payouts that go to local wallets (assumption)
const FIRST_LOSS = 0.1; // first-loss partner covers 10% of a failed business raise
export const BUSINESS_DISCOUNT_RATE = 0.2;
const START = new Date(Date.UTC(2026, 10, 1)); // month 0 = Nov 2026

// ---------------------------------------------------------------------------
// Config, events and state
// ---------------------------------------------------------------------------

export interface SimConfig {
  amount: Cents; // your starting investment
  alloc: { homes: number; business: number; fund: number }; // fractions summing to 1
  reinvest: boolean;
  community: number; // neighbors investing, including you
  neighborMonthly: Cents; // average monthly contribution per neighbor (assumption)
  appreciation: number; // g
  savingsApy: number;
  inflation: number;
  seed: number;
  randomEvents: boolean;
}

export const PRESETS = {
  Safe: { homes: 0.6, business: 0, fund: 0.4 },
  Balanced: { homes: 0.4, business: 0.2, fund: 0.4 },
  Growth: { homes: 0.3, business: 0.5, fund: 0.2 },
} as const;

export const DEFAULT_CONFIG: SimConfig = {
  amount: dollars(100),
  alloc: { ...PRESETS.Balanced },
  reinvest: false,
  community: 500,
  neighborMonthly: dollars(25),
  appreciation: 0.03,
  savingsApy: 0.04,
  inflation: 0.03,
  seed: 42,
  randomEvents: false,
};

export type EventType = "vacancy" | "roof" | "rentIncrease" | "bestMonth" | "slowWinter" | "sale" | "businessCloses";

export const EVENT_LABELS: Record<EventType, string> = {
  vacancy: "Tenant moves out",
  roof: "Roof repair",
  rentIncrease: "Rent increase vote passes",
  bestMonth: "Barbershop's best month",
  slowWinter: "Slow winter",
  sale: "Sell the house",
  businessCloses: "Business closes",
};

export interface SimEvent {
  month: number;
  type: EventType;
}

export type BuildingStatus = "unfunded" | "raising" | "renovating" | "operating" | "vacant" | "sold" | "closed" | "paidOff";

export interface AssetState {
  id: AssetId;
  status: BuildingStatus;
  raised: Cents;
  raiseOpenedMonth: number | null;
  fundedMonth: number | null;
  reserve: Cents;
  rent: Cents;
  lastRentIncreaseMonth: number;
  vacantMonthsLeft: number;
  revenueMult: number;
  revenueMultMonthsLeft: number;
  repaid: Cents; // business: total repaid toward the cap
  distributedThisMonth: Cents; // to all investors
  totalDistributed: Cents;
}

export interface Holding {
  assetId: AssetId | "fund";
  tokens: number; // for the fund: dollars of fund value, in cents
  invested: Cents;
  earned: Cents;
  status: "escrow" | "active" | "refunded" | "sold" | "closed" | "paidOff";
}

export type NodeId = "you" | "escrow" | "llc" | "tenants" | "expenses" | "reserve" | "distributor" | "investors";

export interface Flow {
  from: NodeId;
  to: NodeId;
  amount: Cents;
  label: string;
}

export interface Block {
  number: number;
  month: number;
  date: string;
  action: string;
  from: string;
  to: string;
  amount: Cents;
  hash: string;
  explain: string;
  mine: boolean; // involves the user's wallet
}

export interface Impact {
  homesAffordable: number;
  jobs: number;
  dollarsKept: Cents;
  residentOwners: number;
  repairs: number;
}

export interface MonthPoint {
  month: number;
  value: Cents;
  earned: Cents;
  savings: Cents;
  cash: Cents;
}

export interface SimState {
  month: number;
  rng: number;
  pool: Cents; // community money waiting for the next raise
  assets: AssetState[];
  holdings: Holding[];
  cash: Cents; // in your wallet: refunds, payouts not reinvested, sale proceeds
  invested: Cents;
  earned: Cents; // cumulative income paid to you
  earnedThisMonth: Cents;
  flows: Flow[];
  ledger: Block[];
  notes: string[]; // plain-English things that happened this month
  impact: Impact;
  history: MonthPoint[];
  blockNumber: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** mulberry32: tiny seeded random number generator. Returns [value, nextState]. */
export function rand(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

function hexFrom(seed: number, len: number): string {
  let s = seed | 0;
  let out = "";
  while (out.length < len) {
    const [v, n] = rand(s);
    s = n;
    out += Math.floor(v * 16).toString(16);
  }
  return out;
}

export const short = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;

export const ADDR: Record<string, string> = {
  you: "0x3f" + hexFrom(1, 34) + "a91c",
  escrow: "0x7a" + hexFrom(2, 38),
  distributor: "0xd1" + hexFrom(3, 38),
  neighbors: "0x5e" + hexFrom(4, 38),
  fund: "0xf0" + hexFrom(5, 38),
};
ASSETS.forEach((a, i) => (ADDR[a.id] = "0x" + (i + 10).toString(16) + hexFrom(10 + i, 38)));

export function monthDate(month: number): Date {
  return new Date(Date.UTC(START.getUTCFullYear(), START.getUTCMonth() + month, 1));
}

export const monthLabel = (month: number) =>
  monthDate(month).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

const BLOCKS_PER_MONTH = 1_296_000; // Base makes a block every 2 seconds
const MAX_LEDGER = 80;

function homeTokenValue(def: AssetDef, a: AssetState, month: number, g: number): Cents {
  const price = def.home!.tokenPrice;
  if (a.fundedMonth === null) return price;
  return price * Math.pow(1 + g, (month - a.fundedMonth) / 12);
}

function businessTokenValue(def: AssetDef, a: AssetState): Cents {
  const b = def.business!;
  const tokens = Math.round(b.raise / b.tokenPrice);
  if (a.fundedMonth === null) return b.tokenPrice;
  const monthly = (b.revenueShare * (b.annualRevenue / 12) * (1 - b.platformFeeRate)) / tokens;
  const remaining = ((repaymentCap(b) - a.repaid) * (1 - b.platformFeeRate)) / tokens;
  // Risk-adjusted 20% discount rate: a brand-new note is worth about what you paid,
  // not an instant paper gain. (The spec says 10%; see the notes in the README.)
  return businessNoteValue(monthly, remaining, BUSINESS_DISCOUNT_RATE);
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function initialState(config: SimConfig): SimState {
  const assets: AssetState[] = ASSETS.map((d) => ({
    id: d.id,
    status: "unfunded",
    raised: 0,
    raiseOpenedMonth: null,
    fundedMonth: null,
    reserve: d.home ? d.home.startingReserve : 0,
    rent: d.home ? d.home.monthlyRent : 0,
    lastRentIncreaseMonth: -999,
    vacantMonthsLeft: 0,
    revenueMult: 1,
    revenueMultMonthsLeft: 0,
    repaid: 0,
    distributedThisMonth: 0,
    totalDistributed: 0,
  }));
  // The first two raises are open on day one.
  assets[0].status = "raising";
  assets[0].raiseOpenedMonth = 0;
  assets[1].status = "raising";
  assets[1].raiseOpenedMonth = 0;

  const homeAmt = Math.round(config.amount * config.alloc.homes);
  const bizAmt = Math.round(config.amount * config.alloc.business);
  const fundAmt = config.amount - homeAmt - bizAmt;
  const holdings: Holding[] = [];
  const ledger: Block[] = [];
  const flows: Flow[] = [];
  let blockNumber = 18_234_567;

  const addBlock = (b: Omit<Block, "number" | "month" | "date" | "hash">) => {
    blockNumber += 1 + (blockNumber % 7);
    ledger.push({ ...b, number: blockNumber, month: 0, date: monthLabel(0), hash: "0x" + hexFrom(blockNumber, 64) });
  };

  addBlock({
    action: `Add ${fmt(config.amount)}`,
    from: "Debit card",
    to: short(ADDR.you),
    amount: config.amount,
    explain: `You added ${fmt(config.amount)}. It became ${config.amount / 100} digital dollars (USDC) in your wallet. USDC is a stablecoin: 1 USDC is designed to always equal $1.`,
    mine: true,
  });

  if (homeAmt > 0) {
    const t = homeAmt / SAMPLE_HOME.tokenPrice;
    holdings.push({ assetId: YOUR_HOME, tokens: t, invested: homeAmt, earned: 0, status: "escrow" });
    assets[0].raised += homeAmt;
    addBlock({
      action: `Buy ${t.toFixed(t % 1 ? 1 : 0)} token${t === 1 ? "" : "s"} · 1204 Sample St`,
      from: short(ADDR.you),
      to: short(ADDR.escrow),
      amount: homeAmt,
      explain: `This block recorded that you bought ${t.toFixed(t % 1 ? 1 : 0)} token(s) of 1204 Sample St. Your ${fmt(homeAmt)} sits in an escrow smart contract until the raise hits its goal. If it doesn't, you get it all back automatically. Anyone in the world can check this, and nobody can erase it.`,
      mine: true,
    });
    flows.push({ from: "you", to: "escrow", amount: homeAmt, label: fmt(homeAmt) });
  }
  if (bizAmt > 0) {
    const t = bizAmt / SAMPLE_BUSINESS.tokenPrice;
    holdings.push({ assetId: YOUR_BUSINESS, tokens: t, invested: bizAmt, earned: 0, status: "escrow" });
    assets[1].raised += bizAmt;
    addBlock({
      action: `Buy ${t.toFixed(t % 1 ? 1 : 0)} token${t === 1 ? "" : "s"} · Corner Cuts`,
      from: short(ADDR.you),
      to: short(ADDR.escrow),
      amount: bizAmt,
      explain: `You bought a revenue-share note in Corner Cuts Barbershop. The shop will pay investors 5% of monthly sales until they get back 1.4× what they put in. The owner keeps 100% ownership.`,
      mine: true,
    });
    flows.push({ from: "you", to: "escrow", amount: bizAmt, label: fmt(bizAmt) });
  }
  if (fundAmt > 0) {
    holdings.push({ assetId: "fund", tokens: fundAmt, invested: fundAmt, earned: 0, status: "active" });
    addBlock({
      action: `Deposit ${fmt(fundAmt)} · Neighborhood Fund`,
      from: short(ADDR.you),
      to: short(ADDR.fund),
      amount: fundAmt,
      explain: `You put ${fmt(fundAmt)} into the Neighborhood Fund. One fund token spreads your money across every funded project on the block, so one bad month (or one closed business) hurts less.`,
      mine: true,
    });
  }

  // Your neighbors invest alongside you (same starting amount on average).
  const neighbors = Math.max(0, config.community - 1);
  const neighborMoney = neighbors * config.amount;
  if (neighbors > 0) {
    addBlock({
      action: `${neighbors.toLocaleString()} neighbors invest`,
      from: short(ADDR.neighbors),
      to: short(ADDR.escrow),
      amount: neighborMoney,
      explain: `${neighbors.toLocaleString()} other neighbors and alumni invested too. On a real chain this is ${neighbors.toLocaleString()} separate transactions; we group them so the strip stays readable.`,
      mine: false,
    });
    flows.push({ from: "investors", to: "escrow", amount: neighborMoney, label: fmt(neighborMoney) });
  }

  const s: SimState = {
    month: 0,
    rng: config.seed,
    pool: neighborMoney + fundAmt,
    assets,
    holdings,
    cash: 0,
    invested: config.amount,
    earned: 0,
    earnedThisMonth: 0,
    flows,
    ledger,
    notes: ["You invested. Your money is in escrow until each raise reaches its goal."],
    impact: { homesAffordable: 0, jobs: 0, dollarsKept: 0, residentOwners: 0, repairs: 0 },
    history: [],
    blockNumber,
  };
  fillRaises(s, config, 0);
  s.impact = computeImpact(s, config);
  s.history = [point(s, config)];
  return s;
}

// ---------------------------------------------------------------------------
// The monthly step
// ---------------------------------------------------------------------------

export function step(prev: SimState, config: SimConfig, events: SimEvent[]): SimState {
  // Copy everything we mutate so earlier states stay intact (the scrubber needs them).
  const s: SimState = {
    ...prev,
    month: prev.month + 1,
    assets: prev.assets.map((a) => ({ ...a, distributedThisMonth: 0 })),
    holdings: prev.holdings.map((h) => ({ ...h })),
    ledger: [...prev.ledger],
    flows: [],
    notes: [],
    earnedThisMonth: 0,
    history: prev.history,
  };
  const m = s.month;

  const block = (b: Omit<Block, "number" | "month" | "date" | "hash">) => {
    s.blockNumber += BLOCKS_PER_MONTH / 4 + (s.blockNumber % 997);
    s.ledger.push({ ...b, number: s.blockNumber, month: m, date: monthLabel(m), hash: "0x" + hexFrom(s.blockNumber, 64) });
  };

  // 1. Events chosen by the user this month, plus random ones.
  const todays = events.filter((e) => e.month === m).map((e) => e.type);
  if (config.randomEvents) {
    const roll = () => {
      const [v, n] = rand(s.rng);
      s.rng = n;
      return v;
    };
    if (roll() < 0.025) todays.push("vacancy");
    if (roll() < 0.015) todays.push("roof");
    if (roll() < 0.03) todays.push("bestMonth");
    const cal = monthDate(m).getUTCMonth();
    if ((cal === 0 || cal === 1) && roll() < 0.5) todays.push("slowWinter");
  }
  for (const type of todays) applyEvent(s, config, type, block);

  // 2. New community money arrives and fills open raises.
  s.pool += Math.max(0, config.community - 1) * config.neighborMonthly;
  fillRaises(s, config, m, block);

  // 3. Run every funded building for the month.
  for (const a of s.assets) {
    const def = assetById(a.id);
    if (a.status === "renovating" && a.fundedMonth !== null && m - a.fundedMonth > RENOVATION_MONTHS) {
      a.status = "operating";
      s.notes.push(def.kind === "home" ? `A family moved into ${def.name}.` : `${def.name} reopened with new equipment.`);
    }
    if (def.kind === "home" && (a.status === "operating" || a.status === "vacant")) runHome(s, def, a, m, block);
    if (def.kind === "business" && a.status === "operating") runBusiness(s, def, a, block);
  }

  // 4. Pay the Neighborhood Fund its slice of everything that paid out.
  payFund(s);

  // 5. Reinvest or keep cash.
  if (config.reinvest && s.earnedThisMonth > 0) reinvest(s);
  else s.cash += s.earnedThisMonth;
  s.earned += s.earnedThisMonth;

  if (s.earnedThisMonth > 0) {
    block({
      action: `Payout ${fmt(s.earnedThisMonth)}`,
      from: short(ADDR.distributor),
      to: short(ADDR.you),
      amount: s.earnedThisMonth,
      explain: `You were paid ${fmt(s.earnedThisMonth)} this month: your share of rent and revenue after every bill was paid. ${config.reinvest ? "Reinvest is on, so it bought more tokens automatically." : "It went straight to your wallet."} Gas fees were paid by OwnTheBlock.`,
      mine: true,
    });
  }

  if (s.ledger.length > MAX_LEDGER) s.ledger = s.ledger.slice(-MAX_LEDGER);
  s.impact = computeImpact(s, config, prev.impact);
  s.history = [...prev.history, point(s, config)];
  return s;
}

type BlockFn = (b: Omit<Block, "number" | "month" | "date" | "hash">) => void;

function fillRaises(s: SimState, config: SimConfig, m: number, block?: BlockFn) {
  for (let i = 0; i < s.assets.length; i++) {
    const a = s.assets[i];
    const def = ASSETS[i];
    if (a.status !== "raising") continue;
    const need = def.raise - a.raised;
    const take = Math.min(need, s.pool);
    a.raised += take;
    s.pool -= take;

    if (a.raised >= def.raise) {
      a.status = "renovating";
      a.fundedMonth = m;
      for (const h of s.holdings) if (h.assetId === a.id && h.status === "escrow") h.status = "active";
      s.notes.push(`${def.name} hit its ${fmt0(def.raise)} goal. Escrow released the money.`);
      s.flows.push({ from: "escrow", to: "llc", amount: def.raise, label: fmt(def.raise) });
      block?.({
        action: `Raise complete · ${def.short}`,
        from: short(ADDR.escrow),
        to: short(ADDR[a.id]),
        amount: def.raise,
        explain: `${def.name} reached its ${fmt0(def.raise)} goal, so the escrow contract released the money to ${def.kind === "home" ? "the property's LLC to buy and fix the house" : "the business"}. Buying the house itself happens in the real world and is proven with closing documents, not code.`,
        mine: s.holdings.some((h) => h.assetId === a.id),
      });
      openNext(s, m);
    } else if (a.raiseOpenedMonth !== null && m - a.raiseOpenedMonth >= RAISE_WINDOW) {
      // Missed the deadline: everyone is refunded automatically.
      s.pool += a.raised;
      for (const h of s.holdings) {
        if (h.assetId === a.id && h.status === "escrow") {
          h.status = "refunded";
          s.cash += h.invested;
          s.pool -= h.invested;
          block?.({
            action: `Refund ${fmt(h.invested)} · ${def.short}`,
            from: short(ADDR.escrow),
            to: short(ADDR.you),
            amount: h.invested,
            explain: `${def.name} didn't reach its goal in ${RAISE_WINDOW} months, so the escrow contract automatically sent your ${fmt(h.invested)} back. Nobody had to approve it.`,
            mine: true,
          });
        }
      }
      s.notes.push(`${def.name} missed its goal. Everyone was refunded.`);
      a.raised = 0;
      a.raiseOpenedMonth = m + 1; // it tries again
    }
  }
}

function openNext(s: SimState, m: number) {
  const next = s.assets.find((a) => a.status === "unfunded");
  if (next) {
    next.status = "raising";
    next.raiseOpenedMonth = m;
  }
}

function runHome(s: SimState, def: AssetDef, a: AssetState, m: number, block: BlockFn) {
  const h = def.home!;
  const N = totalTokens(h);
  if (a.vacantMonthsLeft > 0) {
    a.vacantMonthsLeft--;
    a.status = a.vacantMonthsLeft > 0 ? "vacant" : "operating";
    // No rent, but taxes and insurance are still due. The reserve covers them.
    a.reserve -= h.taxesInsurance;
    s.flows.push({ from: "reserve", to: "expenses", amount: h.taxesInsurance, label: fmt(h.taxesInsurance) });
    if (a.id === YOUR_HOME) s.notes.push(`${def.name} is empty this month. No rent, so no payout; the reserve paid the bills.`);
    return;
  }
  const b = homeMonthly(h, a.rent);
  // The vacancy allowance is kept as a buffer inside the reserve.
  a.reserve += b.reserve + b.vacancy;
  let distributable = b.distributable;
  if (a.reserve < 0) {
    // After a big repair, rebuild the reserve before paying investors.
    const refill = Math.min(distributable, -a.reserve);
    a.reserve += refill;
    distributable -= refill;
    if (a.id === YOUR_HOME) s.notes.push(`Payouts were reduced to refill the repair reserve.`);
  }
  a.distributedThisMonth = distributable;
  a.totalDistributed += distributable;

  if (a.id === YOUR_HOME) {
    s.flows.push(
      { from: "tenants", to: "llc", amount: b.rent, label: fmt(b.rent) },
      { from: "llc", to: "expenses", amount: b.management + b.taxesInsurance + b.platformFee, label: fmt(b.management + b.taxesInsurance + b.platformFee) },
      { from: "llc", to: "reserve", amount: b.reserve + b.vacancy, label: fmt(b.reserve + b.vacancy) },
      { from: "llc", to: "distributor", amount: distributable, label: fmt(distributable) },
    );
    block({
      action: `Rent deposit ${fmt(distributable)} · ${def.short}`,
      from: short(ADDR[a.id]),
      to: short(ADDR.distributor),
      amount: distributable,
      explain: `The property manager collected ${fmt(b.rent)} rent, paid the bills and saved for repairs, then deposited ${fmt(distributable)} into the distribution contract. The expense report's fingerprint (hash) is stored with this deposit so nobody can change it later.`,
      mine: false,
    });
  }

  const share = distributable / N;
  for (const hold of s.holdings) {
    if (hold.assetId !== a.id || hold.status !== "active") continue;
    const pay = Math.floor(share * hold.tokens);
    hold.earned += pay;
    s.earnedThisMonth += pay;
    if (pay > 0) {
      s.flows.push({ from: "distributor", to: "you", amount: pay, label: fmt(pay) });
      s.flows.push({ from: "distributor", to: "investors", amount: distributable - pay, label: fmt(distributable - pay) });
    }
  }
  void m;
}

function runBusiness(s: SimState, def: AssetDef, a: AssetState, block: BlockFn) {
  const b = def.business!;
  const cap = repaymentCap(b);
  const tokens = Math.round(b.raise / b.tokenPrice);
  const revenue = (b.annualRevenue / 12) * a.revenueMult;
  if (a.revenueMultMonthsLeft > 0 && --a.revenueMultMonthsLeft === 0) a.revenueMult = 1;

  const pay = businessPayment(b.revenueShare, revenue, cap, a.repaid);
  a.repaid += pay;
  const toInvestors = pay * (1 - b.platformFeeRate);
  a.distributedThisMonth = toInvestors;
  a.totalDistributed += toInvestors;

  if (a.id === YOUR_BUSINESS) {
    s.flows.push({ from: "llc", to: "distributor", amount: toInvestors, label: fmt(toInvestors) });
    block({
      action: `Revenue share ${fmt(pay)} · ${def.short}`,
      from: short(ADDR[a.id]),
      to: short(ADDR.distributor),
      amount: pay,
      explain: `${def.name} reported ${fmt(revenue)} in sales and paid ${Math.round(b.revenueShare * 100)}% of it (${fmt(pay)}) to investors. ${fmt(cap - a.repaid)} is left before the 1.4× cap is reached and the note closes.`,
      mine: false,
    });
  }
  for (const hold of s.holdings) {
    if (hold.assetId !== a.id || hold.status !== "active") continue;
    const p = Math.floor((toInvestors / tokens) * hold.tokens);
    hold.earned += p;
    s.earnedThisMonth += p;
    if (p > 0) s.flows.push({ from: "distributor", to: "you", amount: p, label: fmt(p) });
  }
  if (a.repaid >= cap - 0.5) {
    a.status = "paidOff";
    for (const h of s.holdings) if (h.assetId === a.id && h.status === "active") h.status = "paidOff";
    s.notes.push(`${def.name} paid investors back in full (1.4×). The note closed and the owner keeps 100% of the business.`);
  }
}

/** Fund value earns the average payout rate of everything operating, weighted by size. */
function payFund(s: SimState) {
  const fund = s.holdings.find((h) => h.assetId === "fund" && h.status === "active");
  if (!fund) return;
  let raised = 0;
  let paid = 0;
  s.assets.forEach((a, i) => {
    if (a.fundedMonth === null || a.status === "sold" || a.status === "closed" || a.status === "paidOff") return;
    raised += ASSETS[i].raise;
    // A business repayment is mostly principal coming back. Only the part above
    // 1× (0.4 of every 1.4) is income; the fund redeploys the principal, so its NAV holds.
    const b = ASSETS[i].business;
    paid += b ? a.distributedThisMonth * (1 - 1 / b.capMultiple) : a.distributedThisMonth;
  });
  if (raised === 0) return;
  const pay = Math.floor((fund.tokens * paid) / raised);
  fund.earned += pay;
  s.earnedThisMonth += pay;
  if (pay > 0) s.flows.push({ from: "distributor", to: "you", amount: pay, label: fmt(pay) });
}

function reinvest(s: SimState) {
  // Home payouts buy more of the same home; everything else goes into the fund.
  let fund = s.holdings.find((h) => h.assetId === "fund");
  if (!fund) {
    fund = { assetId: "fund", tokens: 0, invested: 0, earned: 0, status: "active" };
    s.holdings.push(fund);
  }
  const home = s.holdings.find((h) => h.assetId === YOUR_HOME && h.status === "active");
  const homeAsset = s.assets.find((a) => a.id === YOUR_HOME)!;
  let left = s.earnedThisMonth;
  if (home && homeAsset.status !== "sold") {
    const fromHome = Math.floor((homeAsset.distributedThisMonth / totalTokens(SAMPLE_HOME)) * home.tokens);
    home.tokens += fromHome / SAMPLE_HOME.tokenPrice;
    left -= fromHome;
  }
  fund.tokens += left;
}

function applyEvent(s: SimState, config: SimConfig, type: EventType, block: BlockFn) {
  const home = s.assets.find((a) => a.id === YOUR_HOME)!;
  const shop = s.assets.find((a) => a.id === YOUR_BUSINESS)!;
  const homeLive = home.status === "operating" || home.status === "vacant";
  const shopLive = shop.status === "operating";
  const m = s.month;

  switch (type) {
    case "vacancy":
      if (!homeLive) return void s.notes.push("Nobody lives in 1204 Sample St yet, so there's no tenant to move out.");
      home.vacantMonthsLeft = 2;
      home.status = "vacant";
      s.notes.push("The tenant at 1204 Sample St moved out. The house will be empty for 2 months.");
      return;
    case "roof": {
      if (!homeLive) return void s.notes.push("The house isn't operating yet, so the repair is part of the renovation budget.");
      const cost = dollars(6_000);
      home.reserve -= cost;
      s.flows.push({ from: "reserve", to: "expenses", amount: cost, label: fmt(cost) });
      s.notes.push(`Roof repair: ${fmt(cost)} came out of the reserve. ${home.reserve < 0 ? "The reserve ran short, so payouts will refill it first." : "The reserve covered it, so payouts keep going."}`);
      block({
        action: `Treasury spend ${fmt(cost)} · roof`,
        from: short(ADDR[home.id]),
        to: "Roofing contractor",
        amount: cost,
        explain: `The property's treasury paid ${fmt(cost)} for a roof repair. Spending needs 2 of 3 signatures (manager, OwnTheBlock and a community steward), and the memo "roof repair" is stored on-chain.`,
        mine: false,
      });
      return;
    }
    case "rentIncrease":
      if (!homeLive) return void s.notes.push("There's no tenant yet, so there's no rent to raise.");
      if (m - home.lastRentIncreaseMonth < 12) {
        s.notes.push("Blocked: rent already went up in the last 12 months. The 3% yearly cap is written into the RulesRegistry contract.");
        return;
      }
      home.rent = Math.round(home.rent * 1.03);
      home.lastRentIncreaseMonth = m;
      s.notes.push(`The community voted for a 3% rent increase (the maximum allowed). New rent: ${fmt(home.rent)}.`);
      return;
    case "bestMonth":
      if (!shopLive) return void s.notes.push("The barbershop isn't funded yet.");
      shop.revenueMult = 1.4;
      shop.revenueMultMonthsLeft = 1;
      s.notes.push("Corner Cuts had its best month ever: +40% sales, so a bigger payout.");
      return;
    case "slowWinter":
      if (!shopLive) return;
      shop.revenueMult = 0.75;
      shop.revenueMultMonthsLeft = 3;
      s.notes.push("Slow winter: barbershop sales are down 25% for 3 months, so payouts shrink and payback takes longer.");
      return;
    case "sale": {
      if (!homeLive || home.fundedMonth === null) return void s.notes.push("The house has to be bought and operating before it can be sold.");
      const def = assetById(YOUR_HOME);
      const years = (m - home.fundedMonth) / 12;
      const total = saleTotal({
        startValue: def.home!.purchasePrice + def.home!.renovationBudget,
        appreciation: config.appreciation,
        years,
        sellingCosts: 0.06,
        reserve: Math.max(0, home.reserve),
        tokens: totalTokens(def.home!),
      });
      const perToken = total / totalTokens(def.home!);
      home.status = "sold";
      for (const h of s.holdings) {
        if (h.assetId !== YOUR_HOME || h.status !== "active") continue;
        const proceeds = Math.floor(perToken * h.tokens);
        s.cash += proceeds;
        h.status = "sold";
        h.earned += proceeds - h.invested;
        s.flows.push({ from: "llc", to: "you", amount: proceeds, label: fmt(proceeds) });
        block({
          action: `Sale proceeds ${fmt(proceeds)}`,
          from: short(ADDR[home.id]),
          to: short(ADDR.you),
          amount: proceeds,
          explain: `Token holders voted to sell. After ${years.toFixed(1)} years at ${Math.round(config.appreciation * 100)}% yearly appreciation, minus 6% selling costs, plus the reserve, each token got ${fmt(perToken)}. The tenant had the right of first refusal.`,
          mine: true,
        });
      }
      s.notes.push(`1204 Sample St was sold. Each token received about ${fmt(perToken)} (an estimate).`);
      return;
    }
    case "businessCloses": {
      if (!shopLive) return void s.notes.push("The barbershop isn't operating, so it can't close.");
      const def = assetById(YOUR_BUSINESS);
      const b = def.business!;
      shop.status = "closed";
      const tokens = Math.round(b.raise / b.tokenPrice);
      // The first-loss partner covers part of the money investors haven't gotten back yet.
      const unrecovered = Math.max(0, b.raise - shop.repaid * (1 - b.platformFeeRate));
      const cover = Math.min(unrecovered, FIRST_LOSS * b.raise);
      for (const h of s.holdings) {
        if (h.assetId !== YOUR_BUSINESS || h.status !== "active") continue;
        const got = Math.floor((cover / tokens) * h.tokens);
        s.cash += got;
        h.status = "closed";
        if (got > 0)
          block({
            action: `First-loss cover ${fmt(got)}`,
            from: "First-loss partner",
            to: short(ADDR.you),
            amount: got,
            explain: `Corner Cuts closed. The rest of the 1.4× cap won't be paid, but a first-loss partner covered ${fmt(got)} of your unrecovered money. This is a real loss: it's why the Neighborhood Fund spreads money across many projects.`,
            mine: true,
          });
      }
      // The fund loses its slice of the barbershop too, but it's only one of many holdings.
      const fund = s.holdings.find((h) => h.assetId === "fund" && h.status === "active");
      if (fund) {
        let raised = 0;
        s.assets.forEach((a, i) => {
          if (a.fundedMonth !== null && a.status !== "sold" && a.status !== "paidOff") raised += ASSETS[i].raise;
        });
        const weight = raised ? b.raise / (raised + b.raise) : 0;
        const loss = Math.floor(fund.tokens * weight * ((unrecovered - cover) / b.raise));
        fund.tokens -= loss;
        if (loss > 0) s.notes.push(`Your Neighborhood Fund lost ${fmt(loss)}: the barbershop was only part of it.`);
      }
      s.notes.push("Corner Cuts Barbershop closed. Investors lost the rest of what it owed them.");
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export function holdingValue(s: SimState, h: Holding, config: SimConfig): Cents {
  if (h.status === "refunded" || h.status === "sold" || h.status === "closed" || h.status === "paidOff") return 0;
  if (h.assetId === "fund") return h.tokens;
  const def = assetById(h.assetId);
  const a = s.assets.find((x) => x.id === h.assetId)!;
  if (h.status === "escrow") return h.invested;
  const per = def.kind === "home" ? homeTokenValue(def, a, s.month, config.appreciation) : businessTokenValue(def, a);
  return per * h.tokens;
}

export function portfolioValue(s: SimState, config: SimConfig): Cents {
  return s.cash + s.holdings.reduce((sum, h) => sum + holdingValue(s, h, config), 0);
}

export const totalReturn = (s: SimState, config: SimConfig) =>
  s.invested === 0 ? 0 : (portfolioValue(s, config) - s.invested) / s.invested;

function point(s: SimState, config: SimConfig): MonthPoint {
  return {
    month: s.month,
    value: portfolioValue(s, config),
    earned: s.earned,
    savings: savingsBalance(s.invested, config.savingsApy, s.month),
    cash: cashRealValue(s.invested, config.inflation, s.month),
  };
}

function computeImpact(s: SimState, config: SimConfig, prev?: Impact): Impact {
  let homes = 0;
  let jobs = 0;
  // Each newly funded building gets a renovation; each roof event is another repair.
  let repairs = (prev?.repairs ?? 0) + s.notes.filter((n) => n.startsWith("Roof repair")).length;
  let localDollars = prev?.dollarsKept ?? 0;
  s.assets.forEach((a, i) => {
    const def = ASSETS[i];
    if (a.fundedMonth === null) return;
    if (def.kind === "home" && a.status !== "sold") homes++;
    if (a.status === "operating" || a.status === "paidOff") jobs += def.jobs;
    if (a.status === "renovating") jobs += 4; // local contractors during renovation
    if (a.fundedMonth === s.month) {
      repairs++;
      if (def.home) localDollars += def.home.renovationBudget * 0.7; // spent with local contractors
    }
    localDollars += a.distributedThisMonth * LOCAL_SHARE;
  });
  const anyFunded = s.assets.some((a) => a.fundedMonth !== null);
  return {
    homesAffordable: homes,
    jobs,
    dollarsKept: localDollars,
    residentOwners: anyFunded ? Math.round(config.community * RESIDENT_SHARE) : 0,
    repairs,
  };
}

// ---------------------------------------------------------------------------
// Run a whole scenario (used by the scrubber)
// ---------------------------------------------------------------------------

export const MAX_MONTHS = 120;

/** Every state from month 0 to `months`. Cheap: 120 steps take well under a millisecond each. */
export function simulate(config: SimConfig, events: SimEvent[] = [], months = MAX_MONTHS): SimState[] {
  const out = [initialState(config)];
  for (let m = 1; m <= months; m++) out.push(step(out[m - 1], config, events));
  return out;
}
