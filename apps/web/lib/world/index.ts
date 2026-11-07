/**
 * The demo world: a pretend-money version of OwnTheBlock that actually runs.
 *
 * You get test dollars, invest them, and advance a demo clock one month at a time.
 * Each month neighbors invest too, raises complete or refund, houses get renovated,
 * tenants move in, and rent and revenue are paid out with the same formulas as the
 * real product (lib/finance). Every function is pure: (world, input) → new world.
 */
import {
  Cents,
  businessNoteValue,
  businessPayment,
  dollars,
  floorCents,
  fmt,
  fmt0,
  homeMonthly,
  repaymentCap,
  totalTokens,
} from "../finance";
import { CORNER_CUTS_REPAID, PROJECTS, Project, SEASON, Stage, projectById } from "../demo";

export const START_MONTH_LABEL_OFFSET = 10; // month 0 = Nov 2026
export const FAUCET_TAP = dollars(100);
export const FAUCET_DAILY_CAP = dollars(500); // spec: MockUSDC faucet capped at $500 per wallet per day
export const REG_CF_YEARLY_LIMIT = dollars(2_500); // non-accredited limit at lower incomes (verify with counsel)
const NEIGHBOR_INFLOW = dollars(40_000); // community money arriving in month 0
const INFLOW_GROWTH = 0.04; // the app grows 4% a month
const FUND_SHARE = 0.15; // share of neighbor money that goes into the Neighborhood Fund
const AVG_TICKET = dollars(180); // average neighbor investment, used to count investors
const RESIDENT_SHARE = 0.4;
const LOCAL_SHARE = 0.6;
const HOME_RENOVATION_MONTHS = 2; // tenant moves in the month after renovation ends
const BUSINESS_SETUP_MONTHS = 1;
const APPRECIATION = 0.03;
const BUSINESS_DISCOUNT = 0.2; // risk-adjusted, so a new note is worth what you paid

export type TxKind = "faucet" | "buy" | "release" | "closing" | "tenant" | "payout" | "claim" | "refund" | "news" | "vote";

export interface Tx {
  id: number;
  month: number;
  kind: TxKind;
  projectId?: string;
  amount: Cents;
  title: string;
  detail: string;
  from: string;
  to: string;
  onchain: boolean;
  mine: boolean;
  block: number;
  hash: string;
}

export interface ProjectState {
  id: string;
  stage: Stage;
  raised: Cents;
  investors: number;
  openedMonth: number | null;
  deadline: number | null;
  fundedMonth: number | null;
  rent: Cents;
  reserve: Cents;
  repaid: Cents; // business: toward the repayment cap
  vacantLeft: number;
  paidThisMonth: Cents; // to all investors
  totalPaid: Cents;
}

export interface Position {
  projectId: string;
  tokens: number; // whole tokens ($10 each); for the fund, fund units ($10 each)
  invested: Cents;
  earned: Cents;
  claimable: Cents;
  status: "escrow" | "active" | "refunded" | "paidOff";
  boughtMonth: number;
}

export interface World {
  v: 2;
  month: number;
  cash: Cents;
  positions: Position[];
  projects: ProjectState[];
  txs: Tx[];
  autoClaim: boolean;
  faucetDay: string;
  faucetToday: Cents;
  votes: Record<string, "yes" | "no">;
  nextId: number;
  block: number;
  /** Total test dollars added from the faucet (so the Home chart never counts deposits as gains). Optional for older saves. */
  deposited?: Cents;
  history: { month: number; value: Cents; earned: Cents; deposited?: Cents }[];
}

// ---------------------------------------------------------------------------
// Addresses and labels
// ---------------------------------------------------------------------------

function hex(seed: number, len: number) {
  let s = seed >>> 0 || 1;
  let out = "";
  while (out.length < len) {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    out += s.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
export const YOU = "0x3f" + hex(11, 34) + "a91c";
export const ESCROW = "0x7a" + hex(12, 38);
export const DISTRIBUTOR = "0xd1" + hex(13, 38);
export const FAUCET = "0x5c" + hex(14, 38);
export const treasury = (id: string) => "0x" + hex(id.length * 7919 + id.charCodeAt(0), 40);

export function monthLabel(month: number) {
  return new Date(Date.UTC(2026, START_MONTH_LABEL_OFFSET + month, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const tokenCount = (p: Project) => (p.home ? totalTokens(p.home) : Math.round(p.raiseGoal / p.tokenPrice));

// ---------------------------------------------------------------------------
// Creating the world
// ---------------------------------------------------------------------------

export function initialWorld(): World {
  const projects: ProjectState[] = PROJECTS.map((p) => {
    const operating = p.start.monthsOperating;
    const setup = p.home ? HOME_RENOVATION_MONTHS + 1 : BUSINESS_SETUP_MONTHS + 1;
    return {
      id: p.id,
      stage: p.start.stage,
      raised: p.start.raised,
      investors: p.start.investors,
      openedMonth: p.start.stage === "Raising" ? 0 : null,
      deadline: p.start.stage === "Raising" ? (p.start.raiseMonths ?? 3) : null,
      fundedMonth: operating !== undefined ? -(operating + setup) : null,
      rent: p.home ? (p.id === "sample-st" ? Math.round(p.home.monthlyRent * 1.03) : p.home.monthlyRent) : 0,
      reserve: p.home ? (operating ? dollars(4_100) : p.home.startingReserve) : 0,
      repaid: p.id === "corner-cuts" ? CORNER_CUTS_REPAID : 0,
      vacantLeft: 0,
      paidThisMonth: 0,
      totalPaid: 0,
    };
  });
  return {
    v: 2,
    month: 0,
    cash: 0,
    positions: [],
    projects,
    txs: [],
    autoClaim: true,
    faucetDay: "",
    faucetToday: 0,
    votes: {},
    nextId: 1,
    block: 18_234_567,
    deposited: 0,
    history: [{ month: 0, value: 0, earned: 0, deposited: 0 }],
  };
}

// Small helpers that copy before changing, so React sees a new object every time.
function clone(w: World): World {
  return {
    ...w,
    positions: w.positions.map((p) => ({ ...p })),
    projects: w.projects.map((p) => ({ ...p })),
    txs: [...w.txs],
    votes: { ...w.votes },
    history: [...w.history],
  };
}

function addTx(w: World, t: Omit<Tx, "id" | "month" | "block" | "hash">) {
  w.block += 1_000 + (w.nextId % 97) * 37;
  w.txs.push({ ...t, id: w.nextId, month: w.month, block: w.block, hash: "0x" + hex(w.nextId * 2654435761, 64) });
  w.nextId++;
  if (w.txs.length > 400) w.txs = w.txs.slice(-400);
}

export const projectState = (w: World, id: string) => w.projects.find((p) => p.id === id)!;

// ---------------------------------------------------------------------------
// User actions
// ---------------------------------------------------------------------------

export type Result = { ok: true; world: World } | { ok: false; reason: string };

/** "Get test dollars": mints pretend USDC, capped per day like the testnet faucet. */
export function faucet(world: World, today: string): Result {
  const w = clone(world);
  if (w.faucetDay !== today) {
    w.faucetDay = today;
    w.faucetToday = 0;
  }
  if (w.faucetToday + FAUCET_TAP > FAUCET_DAILY_CAP) return { ok: false, reason: `The test faucet gives up to ${fmt0(FAUCET_DAILY_CAP)} a day. Come back tomorrow.` };
  w.faucetToday += FAUCET_TAP;
  w.cash += FAUCET_TAP;
  w.deposited = (w.deposited ?? 0) + FAUCET_TAP;
  addTx(w, {
    kind: "faucet",
    amount: FAUCET_TAP,
    title: `Got ${fmt0(FAUCET_TAP)} test dollars`,
    detail: "The test faucet created 100 pretend USDC in your wallet. On the real app this is where you'd add money by debit card or Apple Pay.",
    from: short(FAUCET),
    to: short(YOU),
    onchain: true,
    mine: true,
  });
  w.history[w.history.length - 1] = snapshot(w);
  return { ok: true, world: w };
}

export function investedLast12(w: World) {
  return w.positions.reduce((s, p) => s + (w.month - p.boughtMonth < 12 && p.status !== "refunded" ? p.invested : 0), 0);
}

export function canInvest(w: World, projectId: string): { ok: boolean; reason?: string; maxCents: Cents } {
  const p = projectById(projectId);
  const s = projectState(w, projectId);
  if (!p) return { ok: false, reason: "Unknown project", maxCents: 0 };
  const open = p.type === "fund" || s.stage === "Raising";
  if (!open) {
    if (s.stage === "Operating" || s.stage === "Renovating" || s.stage === "Paid off")
      return { ok: false, reason: "This raise is complete. Resale between members opens 12 months after a raise (federal crowdfunding rule).", maxCents: 0 };
    return { ok: false, reason: `Not open yet: ${s.stage.toLowerCase()}.`, maxCents: 0 };
  }
  const room = p.type === "fund" ? Infinity : p.raiseGoal - s.raised;
  const limitLeft = REG_CF_YEARLY_LIMIT - investedLast12(w);
  const max = Math.min(w.cash, room, limitLeft);
  return { ok: max >= p.tokenPrice, reason: max < p.tokenPrice ? (w.cash < p.tokenPrice ? "Add test dollars first." : "You've reached your yearly investment limit.") : undefined, maxCents: max };
}

/** Buy tokens. Money moves to escrow (or straight into the fund). */
export function invest(world: World, projectId: string, amount: Cents): Result {
  const p = projectById(projectId);
  if (!p) return { ok: false, reason: "Unknown project" };
  if (amount < p.tokenPrice) return { ok: false, reason: "The minimum is $10." };
  const check = canInvest(world, projectId);
  if (!check.ok) return { ok: false, reason: check.reason! };
  const tokens = Math.floor(amount / p.tokenPrice);
  const cost = tokens * p.tokenPrice;
  if (cost > check.maxCents) {
    if (cost > world.cash) return { ok: false, reason: "Not enough test dollars in your wallet." };
    if (cost > REG_CF_YEARLY_LIMIT - investedLast12(world))
      return { ok: false, reason: `That's over your ${fmt0(REG_CF_YEARLY_LIMIT)} yearly investment limit (federal crowdfunding rule for most first-time investors).` };
    return { ok: false, reason: `Only ${fmt0(check.maxCents)} is left in this raise.` };
  }
  const w = clone(world);
  const s = projectState(w, projectId);
  w.cash -= cost;
  s.raised += cost;
  s.investors += w.positions.some((x) => x.projectId === projectId) ? 0 : 1;
  const isFund = p.type === "fund";
  const existing = w.positions.find((x) => x.projectId === projectId && x.status === (isFund ? "active" : "escrow"));
  if (existing) {
    existing.tokens += tokens;
    existing.invested += cost;
  } else {
    w.positions.push({ projectId, tokens, invested: cost, earned: 0, claimable: 0, status: isFund ? "active" : "escrow", boughtMonth: w.month });
  }
  addTx(w, {
    kind: "buy",
    projectId,
    amount: cost,
    title: `Bought ${tokens} token${tokens === 1 ? "" : "s"} · ${p.name}`,
    detail: isFund
      ? `${fmt(cost)} went into the Neighborhood Fund. Your ${tokens} fund token${tokens === 1 ? "" : "s"} own a slice of every funded project.`
      : `${fmt(cost)} moved from your wallet to the raise's escrow contract. It stays there until ${p.name} hits its ${fmt0(p.raiseGoal)} goal, or comes back to you automatically if it doesn't.`,
    from: short(YOU),
    to: short(isFund ? treasury("fund") : ESCROW),
    onchain: true,
    mine: true,
  });
  // Your purchase might be the one that completes the raise.
  settleRaise(w, p, s);
  w.history[w.history.length - 1] = snapshot(w);
  return { ok: true, world: w };
}

export function claim(world: World): Result {
  const total = world.positions.reduce((s, p) => s + p.claimable, 0);
  if (total <= 0) return { ok: false, reason: "Nothing to claim yet." };
  const w = clone(world);
  w.positions.forEach((p) => (p.claimable = 0));
  w.cash += total;
  addTx(w, {
    kind: "claim",
    amount: total,
    title: `Claimed ${fmt(total)}`,
    detail: "You pulled your payouts from the distribution contract into your wallet. OwnTheBlock paid the gas fee.",
    from: short(DISTRIBUTOR),
    to: short(YOU),
    onchain: true,
    mine: true,
  });
  return { ok: true, world: w };
}

export function setAutoClaim(world: World, on: boolean): World {
  return { ...clone(world), autoClaim: on };
}

export function vote(world: World, projectId: string, choice: "yes" | "no"): World {
  const w = clone(world);
  w.votes[projectId] = choice;
  addTx(w, {
    kind: "vote",
    projectId,
    amount: 0,
    title: `Voted ${choice} · ${projectById(projectId)?.name}`,
    detail: "Your vote was recorded by the community governor contract. Verified residents of the zip code count 1.5×.",
    from: short(YOU),
    to: "Governor",
    onchain: true,
    mine: true,
  });
  return w;
}

// ---------------------------------------------------------------------------
// The monthly step
// ---------------------------------------------------------------------------

export function advance(world: World, months = 1): World {
  let w = world;
  for (let i = 0; i < months; i++) w = step(w);
  return w;
}

function step(world: World): World {
  const w = clone(world);
  w.month += 1;
  const m = w.month;
  w.projects.forEach((s) => (s.paidThisMonth = 0));

  // 1. Pipeline: proposals become live raises.
  for (const p of PROJECTS) {
    const s = projectState(w, p.id);
    if (p.start.opensMonth === m && (s.stage === "Proposed" || s.stage === "Under review" || s.stage === "Community vote")) {
      s.stage = "Raising";
      s.openedMonth = m;
      s.deadline = m + (p.start.raiseMonths ?? 4);
      addTx(w, {
        kind: "news",
        projectId: p.id,
        amount: p.raiseGoal,
        title: `New raise open · ${p.name}`,
        detail: `${p.name} passed due diligence${p.id === "laundromat" ? " and the community vote" : ""}. It's raising ${fmt0(p.raiseGoal)} and closes ${monthLabel(s.deadline)}. Local residents get first access for 7 days.`,
        from: "OwnTheBlock",
        to: "Community",
        onchain: false,
        mine: false,
      });
    }
  }

  // 2. Neighbors invest. Raises closing soonest get money first; a slice goes to the fund.
  let pool = Math.round(NEIGHBOR_INFLOW * Math.pow(1 + INFLOW_GROWTH, m));
  const fund = projectState(w, "fund");
  const toFund = Math.round(pool * FUND_SHARE);
  fund.raised += toFund;
  fund.investors += Math.round(toFund / AVG_TICKET / 3);
  pool -= toFund;
  const raising = PROJECTS.filter((p) => p.type !== "fund" && projectState(w, p.id).stage === "Raising").sort(
    (a, b) => (projectState(w, a.id).deadline ?? 99) - (projectState(w, b.id).deadline ?? 99),
  );
  for (const p of raising) {
    const s = projectState(w, p.id);
    const take = Math.min(pool, p.raiseGoal - s.raised);
    s.raised += take;
    s.investors += Math.round(take / AVG_TICKET);
    pool -= take;
    settleRaise(w, p, s);
  }
  fund.raised += pool; // anything left over waits in the fund

  // 3. Run every funded building and business.
  let yourPayout = 0;
  const lines: string[] = [];
  for (const p of PROJECTS) {
    const s = projectState(w, p.id);
    if (s.fundedMonth === null) continue;
    const age = m - s.fundedMonth;
    if (s.stage === "Renovating") {
      const ready = p.home ? age > HOME_RENOVATION_MONTHS : age > BUSINESS_SETUP_MONTHS;
      if (ready) {
        s.stage = "Operating";
        if (w.positions.some((x) => x.projectId === p.id && x.status === "active"))
          addTx(w, {
            kind: "tenant",
            projectId: p.id,
            amount: s.rent,
            title: p.home ? `A family moved into ${p.name}` : `${p.name} opened`,
            detail: p.home
              ? `Renovation finished and a tenant signed a lease at ${fmt(s.rent)} a month. Proven by the signed lease (stored as a document, not on-chain).`
              : `${p.name} opened its doors. Revenue-share payments start next month.`,
            from: "Property manager",
            to: p.name,
            onchain: false,
            mine: true,
          });
      }
      continue;
    }
    if (s.stage !== "Operating") continue;
    const paid = p.home ? runHome(w, p, s) : p.business ? runBusiness(w, p, s) : 0;
    s.paidThisMonth = paid;
    s.totalPaid += paid;
    const N = tokenCount(p);
    for (const pos of w.positions) {
      if (pos.projectId !== p.id || pos.status !== "active") continue;
      const mine = floorCents((paid * pos.tokens) / N);
      if (mine > 0) {
        pos.earned += mine;
        pos.claimable += mine;
        yourPayout += mine;
        lines.push(`${p.name}: ${fmt(mine)}`);
      }
      if (s.stage === ("Paid off" as Stage)) pos.status = "paidOff";
    }
  }

  // 4. The Neighborhood Fund earns its slice of everything that paid out.
  const fundPos = w.positions.find((x) => x.projectId === "fund" && x.status === "active");
  if (fundPos) {
    let base = 0;
    let income = 0;
    for (const p of PROJECTS) {
      const s = projectState(w, p.id);
      if (p.type === "fund" || s.fundedMonth === null || (s.stage !== "Operating" && s.stage !== "Paid off" && s.stage !== "Renovating")) continue;
      base += p.raiseGoal;
      // Business repayments are mostly principal; only the part above 1× is income.
      income += p.business ? s.paidThisMonth * (1 - 1 / p.business.capMultiple) : s.paidThisMonth;
    }
    const mine = base ? floorCents((fundPos.tokens * 1000 * income) / base) : 0;
    if (mine > 0) {
      fundPos.earned += mine;
      fundPos.claimable += mine;
      yourPayout += mine;
      lines.push(`Neighborhood Fund: ${fmt(mine)}`);
    }
  }

  if (yourPayout > 0) {
    if (w.autoClaim) {
      w.positions.forEach((p) => (p.claimable = 0));
      w.cash += yourPayout;
    }
    addTx(w, {
      kind: "payout",
      amount: yourPayout,
      title: `Earned ${fmt(yourPayout)} in payouts`,
      detail: `${lines.join(" · ")}. ${w.autoClaim ? "Auto-claim is on, so it went straight to your wallet." : "Tap Claim to move it to your wallet."} This is your share of rent and revenue after every bill was paid.`,
      from: short(DISTRIBUTOR),
      to: short(YOU),
      onchain: true,
      mine: true,
    });
  }

  w.history.push(snapshot(w));
  if (w.history.length > 240) w.history = w.history.slice(-240);
  return w;
}

/** Complete or refund a raise when its goal or deadline is reached. */
function settleRaise(w: World, p: Project, s: ProjectState) {
  if (s.stage !== "Raising" || p.type === "fund") return;
  if (s.raised >= p.raiseGoal) {
    s.raised = p.raiseGoal;
    s.stage = "Renovating";
    s.fundedMonth = w.month;
    const mine = w.positions.filter((x) => x.projectId === p.id && x.status === "escrow");
    mine.forEach((x) => (x.status = "active"));
    addTx(w, {
      kind: mine.length ? "release" : "news",
      projectId: p.id,
      amount: p.raiseGoal,
      title: `Raise complete · ${p.name}`,
      detail: `${p.name} hit its ${fmt0(p.raiseGoal)} goal${mine.length ? ", and you own part of it" : ""}. The escrow contract released the money to ${p.home ? "the property's LLC to buy and renovate the house" : "the business"}.`,
      from: short(ESCROW),
      to: short(treasury(p.id)),
      onchain: true,
      mine: mine.length > 0,
    });
    if (mine.length && p.home)
      addTx(w, {
        kind: "closing",
        projectId: p.id,
        amount: p.home.purchasePrice,
        title: `LLC closed on ${p.name}`,
        detail: `The LLC bought the house for ${fmt0(p.home.purchasePrice)}, set aside ${fmt0(p.home.renovationBudget)} for renovation with local contractors and ${fmt0(p.home.startingReserve)} for the repair reserve. Proven by the closing documents, not code.`,
        from: short(treasury(p.id)),
        to: "Seller + contractors",
        onchain: false,
        mine: true,
      });
    return;
  }
  if (s.deadline !== null && w.month >= s.deadline) {
    s.stage = "Refunded";
    for (const x of w.positions) {
      if (x.projectId !== p.id || x.status !== "escrow") continue;
      x.status = "refunded";
      w.cash += x.invested;
      addTx(w, {
        kind: "refund",
        projectId: p.id,
        amount: x.invested,
        title: `Refunded ${fmt(x.invested)} · ${p.name}`,
        detail: `${p.name} didn't reach its goal by the deadline, so the escrow contract sent your money back automatically. Nobody had to approve it.`,
        from: short(ESCROW),
        to: short(YOU),
        onchain: true,
        mine: true,
      });
    }
  }
}

// Planned ups and downs so the demo shows real-life bumps (spec: honest about risk).
const VACANCIES: Record<string, number[]> = { "sample-st": [5, 6], "example-ave": [17] };
const REPAIRS: Record<string, { month: number; cost: Cents; what: string }[]> = {
  "example-ave": [{ month: 11, cost: dollars(1_800), what: "water heater" }],
  "sample-st": [{ month: 15, cost: dollars(6_000), what: "roof" }],
};

function runHome(w: World, p: Project, s: ProjectState): Cents {
  const h = p.home!;
  const m = w.month;
  const yours = w.positions.some((x) => x.projectId === p.id && x.status === "active");
  for (const r of REPAIRS[p.id] ?? [])
    if (r.month === m) {
      s.reserve -= r.cost;
      if (yours)
        addTx(w, {
          kind: "news",
          projectId: p.id,
          amount: r.cost,
          title: `Repair: ${r.what} at ${p.name}`,
          detail: `The property treasury paid ${fmt(r.cost)} for a ${r.what} from the repair reserve (2 of 3 signatures). ${s.reserve < 0 ? "The reserve ran short, so payouts will refill it first." : "The reserve covered it, so payouts keep coming."}`,
          from: short(treasury(p.id)),
          to: "Local contractor",
          onchain: true,
          mine: false,
        });
    }
  if ((VACANCIES[p.id] ?? []).includes(m)) {
    s.reserve -= h.taxesInsurance;
    if (yours && !(VACANCIES[p.id] ?? []).includes(m - 1))
      addTx(w, {
        kind: "news",
        projectId: p.id,
        amount: 0,
        title: `${p.name} is empty for now`,
        detail: "The tenant moved out. No rent means no payout from this house until a new family moves in. The reserve covers taxes and insurance meanwhile.",
        from: "Property manager",
        to: p.name,
        onchain: false,
        mine: false,
      });
    return 0;
  }
  const b = homeMonthly(h, s.rent);
  s.reserve += b.reserve + b.vacancy;
  let out = b.distributable;
  if (s.reserve < 0) {
    const refill = Math.min(out, -s.reserve);
    s.reserve += refill;
    out -= refill;
  }
  return out;
}

function runBusiness(w: World, p: Project, s: ProjectState): Cents {
  const b = p.business!;
  const cal = (START_MONTH_LABEL_OFFSET + w.month) % 12;
  const age = w.month - (s.fundedMonth ?? 0);
  const rampUp = p.id === "laundromat" || p.id === "corner-market" ? Math.min(1, 0.55 + 0.09 * age) : 1; // new businesses grow into their numbers
  const revenue = (b.annualRevenue / 12) * SEASON[cal] * rampUp;
  const cap = repaymentCap(b);
  const pay = businessPayment(b.revenueShare, revenue, cap, s.repaid);
  s.repaid += pay;
  if (s.repaid >= cap - 0.5) s.stage = "Paid off";
  return pay * (1 - b.platformFeeRate);
}

// ---------------------------------------------------------------------------
// Reading the world
// ---------------------------------------------------------------------------

export function positionValue(w: World, pos: Position): Cents {
  if (pos.status === "refunded" || pos.status === "paidOff") return 0;
  if (pos.status === "escrow") return pos.invested;
  const p = projectById(pos.projectId)!;
  if (p.type === "fund") return pos.tokens * p.tokenPrice;
  const s = projectState(w, p.id);
  if (p.home) return pos.tokens * p.tokenPrice * Math.pow(1 + APPRECIATION, Math.max(0, w.month - (s.fundedMonth ?? w.month)) / 12);
  const b = p.business!;
  const N = tokenCount(p);
  const monthly = (b.revenueShare * (b.annualRevenue / 12) * (1 - b.platformFeeRate)) / N;
  const left = ((repaymentCap(b) - s.repaid) * (1 - b.platformFeeRate)) / N;
  if (s.stage === "Renovating") return pos.invested;
  return pos.tokens * businessNoteValue(monthly, left, BUSINESS_DISCOUNT);
}

/** One point of portfolio history for the Home chart. */
const snapshot = (w: World) => ({ month: w.month, value: portfolioValue(w), earned: totalEarned(w), deposited: w.deposited ?? 0 });

export const portfolioValue = (w: World) => w.cash + w.positions.reduce((s, p) => s + positionValue(w, p) + p.claimable, 0);
export const totalEarned = (w: World) => w.positions.reduce((s, p) => s + p.earned, 0);
export const totalInvested = (w: World) => w.positions.reduce((s, p) => s + (p.status === "refunded" ? 0 : p.invested), 0);
export const totalClaimable = (w: World) => w.positions.reduce((s, p) => s + p.claimable, 0);
export const earnedThisMonth = (w: World) => w.txs.filter((t) => t.kind === "payout" && t.month === w.month).reduce((s, t) => s + t.amount, 0);

/** Neighborhood-wide numbers for the Impact page (spec 5.3), computed from the demo world. */
export function impact(w: World) {
  let homes = 0;
  let businesses = 0;
  let businessCapital = 0;
  let jobs = 0;
  let investors = 0;
  let raisedTotal = 0;
  let paidTotal = 0;
  let renovation = 0;
  let tenantMonths = 0;
  for (const p of PROJECTS) {
    const s = projectState(w, p.id);
    if (p.type === "fund") continue;
    investors += s.investors;
    if (s.fundedMonth === null) continue;
    raisedTotal += p.raiseGoal;
    paidTotal += s.totalPaid + (p.id === "sample-st" ? dollars(13_600) : p.id === "corner-cuts" ? CORNER_CUTS_REPAID * 0.98 : 0);
    if (p.home) {
      homes++;
      renovation += p.home.renovationBudget;
      if (s.stage === "Operating") tenantMonths += Math.max(0, w.month - s.fundedMonth - HOME_RENOVATION_MONTHS);
    } else {
      businesses++;
      businessCapital += p.raiseGoal;
      if (s.stage === "Operating" || s.stage === "Paid off") jobs += p.jobs;
    }
  }
  const tenantTokens = (tenantMonths + 14) * 2.8; // 2% of rent in tokens, $1,400 rent / $10 tokens
  return {
    localDollars: Math.round((raisedTotal + projectState(w, "fund").raised) * RESIDENT_SHARE * 1.2),
    dollarsKept: Math.round(paidTotal * LOCAL_SHARE + renovation * 0.7),
    residentOwners: Math.round(investors * RESIDENT_SHARE),
    investors,
    homes,
    businesses,
    businessCapital,
    jobs: jobs + homes, // + one local property-management job per home (assumption)
    tenantTokens,
    rentVsMarket: 0.86, // our average rent ÷ neighborhood median (demo assumption)
  };
}
