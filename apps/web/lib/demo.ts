/**
 * Demo projects (spec 8.6). Every project is fictional: names, addresses and numbers are made up,
 * and photos are openly licensed stand-ins (see lib/photos.ts), labeled "Demo data" in the UI.
 * History reports are generated with the real finance formulas so every number is traceable.
 */
import {
  BusinessInputs,
  Cents,
  HomeInputs,
  SAMPLE_BUSINESS,
  SAMPLE_HOME,
  businessPayment,
  dollars,
  homeMonthly,
  repaymentCap,
} from "./finance";

export type ProjectType = "home" | "business" | "space" | "fund";
export type Risk = "Low" | "Medium" | "High";
export type Stage = "Proposed" | "Under review" | "Community vote" | "Raising" | "Renovating" | "Operating" | "Paid off" | "Refunded";

export interface MonthlyReport {
  month: string; // "Jan 2026"
  gross: Cents;
  expenses: { label: string; amount: Cents }[];
  reserveAdded: Cents;
  distributed: Cents;
  note?: string;
}

export interface Project {
  id: string;
  type: ProjectType;
  name: string;
  address: string;
  neighborhood: string;
  photos: string[]; // keys in /public/photos; first is the cover
  story: string;
  tokenPrice: Cents;
  yieldRange: [number, number];
  risk: Risk;
  impactTags: string[];
  riskFactors: string[];
  documents: string[];
  history: MonthlyReport[]; // before the demo starts
  ownerQuote?: string;
  jobs: number;
  // Economics used by the demo world engine
  home?: HomeInputs;
  business?: BusinessInputs;
  raiseGoal: Cents; // 0 for the open-ended fund
  // Where the project is when the demo starts, and its pipeline after that
  start: {
    stage: Stage;
    raised: Cents;
    investors: number;
    monthsOperating?: number; // already operating before the demo starts
    opensMonth?: number; // pipeline: month the raise opens
    raiseMonths?: number; // how long the raise stays open before automatic refunds
  };
}

const monthName = (offsetFromOct2026: number) =>
  new Date(Date.UTC(2026, 9 + offsetFromOct2026, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** 18 months of 1204 Sample St, with one vacancy month and one roof repair. */
function sampleStReports(): MonthlyReport[] {
  const out: MonthlyReport[] = [];
  let rent = SAMPLE_HOME.monthlyRent;
  let reserveDebt = 0;
  for (let i = 0; i < 18; i++) {
    const label = monthName(i - 17);
    if (i === 12) rent = Math.round(rent * 1.03);
    if (i === 7) {
      out.push({
        month: label,
        gross: 0,
        expenses: [{ label: "Taxes + insurance (paid from reserve)", amount: SAMPLE_HOME.taxesInsurance }],
        reserveAdded: -SAMPLE_HOME.taxesInsurance,
        distributed: 0,
        note: "Vacant: previous tenant moved out. New family moved in the next month.",
      });
      continue;
    }
    const b = homeMonthly(SAMPLE_HOME, rent);
    let distributed = b.distributable;
    let reserveAdded = b.reserve + b.vacancy;
    let note: string | undefined;
    if (i === 13) {
      reserveAdded -= dollars(6_000);
      reserveDebt = Math.max(0, dollars(6_000) - dollars(3_000) - 7 * (b.reserve + b.vacancy));
      note = "Roof repair: $6,000 from the reserve. Signed by manager + community steward.";
    }
    if (reserveDebt > 0) {
      const refill = Math.min(reserveDebt, distributed);
      reserveDebt -= refill;
      distributed -= refill;
      reserveAdded += refill;
    }
    if (i === 12) note = "Community vote passed: rent +3% (the yearly maximum).";
    out.push({
      month: label,
      gross: rent,
      expenses: [
        { label: "Property management (8%)", amount: b.management },
        { label: "Taxes + insurance", amount: b.taxesInsurance },
        { label: "Platform fee (2%)", amount: b.platformFee },
      ],
      reserveAdded,
      distributed,
      note,
    });
  }
  return out;
}

/** Seasonal swing in sales by calendar month (Jan = 0): slow winters, back-to-school rush. */
export const SEASON = [0.78, 0.8, 0.95, 1.02, 1.05, 1.0, 0.97, 1.18, 1.1, 1.0, 1.02, 1.12];

/** 22 months of Corner Cuts revenue-share repayments. */
function cornerCutsReports(): MonthlyReport[] {
  const out: MonthlyReport[] = [];
  const cap = repaymentCap(SAMPLE_BUSINESS);
  let paid = 0;
  for (let i = 0; i < 22; i++) {
    const offset = i - 21;
    const cal = (9 + offset + 120) % 12;
    const revenue = Math.round((SAMPLE_BUSINESS.annualRevenue / 12) * SEASON[cal] * (i === 15 ? 1.4 : 1));
    const pay = businessPayment(SAMPLE_BUSINESS.revenueShare, revenue, cap, paid);
    paid += pay;
    out.push({
      month: monthName(offset),
      gross: revenue,
      expenses: [
        { label: "Revenue share paid (5%)", amount: Math.round(pay) },
        { label: "Platform fee (2% of payment)", amount: Math.round(pay * 0.02) },
      ],
      reserveAdded: 0,
      distributed: Math.round(pay * 0.98),
      note: i === 15 ? "Best month ever: back-to-school rush (+40%)." : cal === 0 ? "Slow winter month." : undefined,
    });
  }
  return out;
}

const homeDocs = ["LLC operating agreement", "Offering memo", "Inspection report", "Insurance certificate"];
const homeRisks = [
  "Vacancies mean no rent and no payout that month.",
  "Big repairs can pause payouts while the reserve refills.",
  "Home values can go down as well as up.",
  "You can't sell your tokens for 12 months after the raise.",
];
const bizRisks = [
  "Slow months mean smaller payouts and a longer payback.",
  "If the business closes, the rest of the cap is lost (partly covered by a first-loss partner).",
  "Repayment depends on revenue the owner reports; admins verify it monthly.",
];

const CORNER_CUTS_HISTORY = cornerCutsReports();
export const CORNER_CUTS_REPAID = CORNER_CUTS_HISTORY.reduce((s, r) => s + r.expenses[0].amount, 0);

const market: BusinessInputs = { ...SAMPLE_BUSINESS, raise: dollars(40_000), annualRevenue: dollars(300_000), revenueShare: 0.05, capMultiple: 1.4 };
const laundromat: BusinessInputs = { ...SAMPLE_BUSINESS, raise: dollars(60_000), annualRevenue: dollars(180_000), revenueShare: 0.07, capMultiple: 1.5 };
const duplex: HomeInputs = { ...SAMPLE_HOME, monthlyRent: dollars(1_450) }; // two units, $725 each

export const PROJECTS: Project[] = [
  {
    id: "sample-st",
    type: "home",
    name: "1204 Sample St",
    address: "1204 Sample St, Greensboro, NC 27405",
    neighborhood: "East Greensboro",
    photos: ["sample-st", "renovation", "sample-st-alt"],
    story:
      "A 3-bedroom bungalow two blocks from campus that sat empty for two years. Neighbors bought it, fixed it up with local contractors, and now rent it to a family at below-market rent.",
    tokenPrice: SAMPLE_HOME.tokenPrice,
    yieldRange: [0.055, 0.07],
    risk: "Low",
    impactTags: ["Affordable housing", "Rent-to-own"],
    riskFactors: homeRisks,
    documents: homeDocs,
    history: sampleStReports(),
    jobs: 0,
    home: SAMPLE_HOME,
    raiseGoal: SAMPLE_HOME.totalRaise,
    start: { stage: "Operating", raised: SAMPLE_HOME.totalRaise, investors: 540, monthsOperating: 18 },
  },
  {
    id: "corner-cuts",
    type: "business",
    name: "Corner Cuts Barbershop",
    address: "Market St, Greensboro, NC 27401",
    neighborhood: "Near A&T",
    photos: ["corner-cuts", "corner-cuts-alt"],
    story:
      "Marcus has cut hair near campus for 12 years. He raised $25,000 for two more chairs and a new storefront without a predatory loan. Investors get 5% of monthly sales until they're repaid 1.4×. Marcus keeps 100% ownership.",
    tokenPrice: SAMPLE_BUSINESS.tokenPrice,
    yieldRange: [0.08, 0.12],
    risk: "Medium",
    impactTags: ["Black-owned business", "Local jobs"],
    riskFactors: bizRisks,
    documents: ["Revenue-share agreement", "12 months of sales", "Use of funds"],
    history: CORNER_CUTS_HISTORY,
    ownerQuote: "The bank wanted my house as collateral. My neighbors just wanted a fair deal.",
    jobs: 3,
    business: SAMPLE_BUSINESS,
    raiseGoal: SAMPLE_BUSINESS.raise,
    start: { stage: "Operating", raised: SAMPLE_BUSINESS.raise, investors: 249, monthsOperating: 22 },
  },
  {
    id: "example-ave",
    type: "home",
    name: "88 Example Ave",
    address: "88 Example Ave, Greensboro, NC 27405",
    neighborhood: "East Greensboro",
    photos: ["example-ave", "renovation"],
    story:
      "A two-unit house an out-of-state buyer was about to flip. If the raise succeeds, both units stay rentals for local families, with the 3% yearly rent cap written into the contract.",
    tokenPrice: dollars(10),
    yieldRange: [0.055, 0.07],
    risk: "Low",
    impactTags: ["Affordable housing", "Stops a flip"],
    riskFactors: ["If the goal isn't reached in time, everyone is refunded automatically.", "Renovation could cost more than planned.", ...homeRisks.slice(0, 2)],
    documents: homeDocs,
    history: [],
    jobs: 0,
    home: duplex,
    raiseGoal: dollars(150_000),
    start: { stage: "Raising", raised: dollars(96_000), investors: 352, opensMonth: 0, raiseMonths: 3 },
  },
  {
    id: "fund",
    type: "fund",
    name: "Greensboro Neighborhood Fund",
    address: "Every funded OwnTheBlock project in Greensboro",
    neighborhood: "Greensboro",
    photos: ["fund", "street"],
    story: "One token that spreads your money across every funded project in the neighborhood: homes and businesses. If one has a bad month, the others soften the hit. Always open; buy any amount from $10.",
    tokenPrice: dollars(10),
    yieldRange: [0.06, 0.08],
    risk: "Low",
    impactTags: ["Diversified", "Whole neighborhood"],
    riskFactors: ["You still share in every project's losses, just in smaller pieces.", "Business holdings are valued with estimates."],
    documents: ["Fund policy"],
    history: [],
    jobs: 0,
    raiseGoal: 0,
    start: { stage: "Operating", raised: dollars(31_400), investors: 497 },
  },
  {
    id: "laundromat",
    type: "business",
    name: "Spin City Laundromat",
    address: "Bennett area, Greensboro, NC 27401",
    neighborhood: "Near Bennett College",
    photos: ["laundromat", "laundromat-alt"],
    story:
      "Proposed by students: the nearest laundromat is a 25-minute bus ride. A revenue-share raise would reopen a closed laundromat with a study lounge. Investors get 7% of sales until they're repaid 1.5×.",
    tokenPrice: dollars(10),
    yieldRange: [0.08, 0.12],
    risk: "Medium",
    impactTags: ["Essential service", "Student-proposed"],
    riskFactors: ["New business with no sales history.", "Equipment can break down.", ...bizRisks.slice(1)],
    documents: ["Pitch", "Equipment quote"],
    history: [],
    jobs: 3,
    business: laundromat,
    raiseGoal: laundromat.raise,
    start: { stage: "Community vote", raised: 0, investors: 0, opensMonth: 1, raiseMonths: 4 },
  },
  {
    id: "demo-ct",
    type: "home",
    name: "310 Demo Ct",
    address: "310 Demo Ct, Greensboro, NC 27406",
    neighborhood: "Southside",
    photos: ["demo-ct", "renovation"],
    story: "A boarded-up house proposed by a neighbor. OwnTheBlock is checking the title, inspection and repair costs before the raise opens.",
    tokenPrice: dollars(10),
    yieldRange: [0.05, 0.065],
    risk: "Medium",
    impactTags: ["Affordable housing", "Vacant home"],
    riskFactors: ["Repair costs are still estimates.", ...homeRisks],
    documents: ["Title search (in progress)"],
    history: [],
    jobs: 0,
    home: { ...SAMPLE_HOME, monthlyRent: dollars(1_350) },
    raiseGoal: dollars(150_000),
    start: { stage: "Under review", raised: 0, investors: 0, opensMonth: 2, raiseMonths: 5 },
  },
  {
    id: "corner-market",
    type: "business",
    name: "Aggie Corner Market",
    address: "Dudley St, Greensboro, NC 27406",
    neighborhood: "Near A&T",
    photos: ["corner-store"],
    story: "A fresh-food corner market in a neighborhood where the closest full grocery store is 2 miles away. 5% of sales go to investors until they're repaid 1.4×.",
    tokenPrice: dollars(10),
    yieldRange: [0.08, 0.11],
    risk: "Medium",
    impactTags: ["Food access", "Local jobs"],
    riskFactors: ["Grocery margins are thin.", ...bizRisks],
    documents: ["Business plan"],
    history: [],
    jobs: 4,
    business: market,
    raiseGoal: market.raise,
    start: { stage: "Proposed", raised: 0, investors: 0, opensMonth: 4, raiseMonths: 4 },
  },
  {
    id: "placeholder-ln",
    type: "home",
    name: "42 Placeholder Ln",
    address: "42 Placeholder Ln, Greensboro, NC 27405",
    neighborhood: "East Greensboro",
    photos: ["bungalow-3", "renovation"],
    story: "A solid brick bungalow whose owner wants to sell to the neighborhood instead of an investor. The current tenant gets rent-to-own from day one.",
    tokenPrice: dollars(10),
    yieldRange: [0.055, 0.07],
    risk: "Low",
    impactTags: ["Affordable housing", "Rent-to-own"],
    riskFactors: homeRisks,
    documents: [],
    history: [],
    jobs: 0,
    home: SAMPLE_HOME,
    raiseGoal: dollars(150_000),
    start: { stage: "Proposed", raised: 0, investors: 0, opensMonth: 6, raiseMonths: 5 },
  },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
