// OwnTheBlock 5-minute pitch deck (corporate style). Run: node pitch.js out.pptx
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { applyTheme } = require("/home/kaleb/.claude/skills/synced/274981fa-adcd-4129-954d-21ad20077f36_650b4839-abbd-46e9-8a31-40481531fc9e/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "OwnTheBlock_5min_Pitch.pptx";
const photo = (k) => path.join("/home/kaleb/owntheblock/apps/web/public/photos", k + ".jpg");

// ---------------------------------------------------------------- theme
const HEX = { navy: "0B2341", steel: "4F7CAC", gold: "B38B2D", green: "2E7D5B", brick: "A23B2C", gray: "6B7280", ink: "1F2937", mist: "F1F4F8", white: "FFFFFF", line: "D5DAE1", ice: "C9D7E8" };
const THEME = {
  name: "OwnTheBlock Corporate",
  headFontFace: "Cambria",
  bodyFontFace: "Arial",
  colors: { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.mist, accent1: HEX.navy, accent2: HEX.steel, accent3: HEX.gold, accent4: HEX.green, accent5: HEX.brick, accent6: HEX.gray, hlink: HEX.steel, folHlink: HEX.gray },
};
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "OwnTheBlock: Pitch";
pres.author = "Kaleb Conway";
const C = pres.SchemeColor;
const W = 13.333, H = 7.5, M = 0.55, CW = W - 2 * M;
const FOOT = "OwnTheBlock   |   Own Your Future Challenge   |   November 10, 2026";

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "COVER",
  background: { color: C.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M + 0.25, y: 2.35, w: 7.0, h: 1.1, fontSize: 54, bold: true, color: C.background1, valign: "bottom", margin: 0, align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M + 0.25, y: 3.6, w: 6.6, h: 1.0, fontSize: 20, color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.68, w: CW, h: 0.95, fontSize: 24, bold: true, color: C.accent1, valign: "top", margin: 0, align: "left" }, text: "" } },
    { text: { text: FOOT, options: { x: M, y: 7.02, w: 8, h: 0.28, fontSize: 9, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.09, w: 0.6, h: 0.28, fontSize: 9, color: C.accent6, align: "right", margin: 0 },
});

let section = "";
function slide(master, sec, tracker) {
  if (sec !== section) { pres.addSection({ title: sec }); section = sec; }
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  if (tracker) s.addText(tracker.toUpperCase(), { isTextBox: true, x: M, y: 0.32, w: 8, h: 0.28, margin: 0, fontSize: 11, bold: true, charSpacing: 1.5, color: C.accent2, objectName: "section tracker" });
  return s;
}
const title = (s, t) => s.addText(t, { placeholder: "title" });
const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 13, color: C.text1, valign: "top", ...o });
const source = (s, t) => txt(s, t, { x: M, y: 6.66, w: CW, h: 0.3, fontSize: 9, italic: true, color: C.accent6, objectName: "source" });
const box = (s, x, y, w, h, fill = C.background2, name = "panel") => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { type: "none" }, objectName: name });
const disc = (s, n, x, y, d = 0.42, fill = C.accent1) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: "disc " + n });
  txt(s, String(n), { x, y, w: d, h: d, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: "Cambria" });
};
const label = (s, t, x, y, w) => txt(s, t.toUpperCase(), { x, y, w, h: 0.28, fontSize: 11, bold: true, charSpacing: 1, color: C.accent2 });
/** Navy "so what" box. */
const takeaway = (s, t, y = 5.95, h = 0.6) => {
  box(s, M, y, CW, h, C.accent1, "takeaway box");
  txt(s, [{ text: "Key takeaway   ", options: { bold: true, color: HEX.gold } }, { text: t, options: { color: C.background1 } }], { x: M + 0.25, y, w: CW - 0.5, h, fontSize: 14, valign: "middle", objectName: "takeaway" });
};
const th = (t, al = "left") => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, align: al } });
const TABLE = { fontSize: 12, color: HEX.ink, border: { type: "solid", pt: 0.5, color: HEX.line }, valign: "middle", margin: [0.03, 0.1, 0.03, 0.1], fontFace: "Arial" };
const CHART = { catAxisLabelColor: HEX.ink, valAxisLabelColor: HEX.gray, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 10, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 12, dataLabelColor: HEX.ink, titleFontFace: "+mn-lt", titleFontSize: 13, titleColor: HEX.ink, showLegend: false, catGridLine: { style: "none" } };

// ---------------------------------------------------------------- demo data from the contract run
const DEP = "/home/kaleb/owntheblock/contracts/deployments";
const depFile = ["baseSepolia", "hardhat"].map((n) => path.join(DEP, n + ".json")).find((f) => fs.existsSync(f));
const dep = JSON.parse(fs.readFileSync(depFile, "utf8"));
const LIVE = dep.network === "baseSepolia";
const events = [
  ["Ms. Jenkins commits", "Ms. Jenkins commits $2,000 in the residents-first window"],
  ["Alumna in Atlanta tries", "Out-of-town investor tries to buy before residents"],
  ["Raise closes", "Raise hits its goal; tokens issued to every investor"],
  ["Steward co-signs", "Steward co-signs the $3,000 roof payment"],
  ["Manager deposits $700", "One $700 rent deposit pays every owner"],
  ["Jasmine tries to sell", "Owner tries to sell during the 12-month lockup"],
  ["Manager tries to raise rent", "Manager tries a 10% rent increase (cap is 3%)"],
  ["Rule change executed", "Rule change attempted before the 30-day wait"],
].map(([k, l]) => ({ label: l, ok: dep.transactions.find((t) => t.step.startsWith(k)).status === "ok" }));

(async () => {
  // ============================================================ 1. Cover
  {
    const s = slide("COVER", "Pitch");
    const px = 8.35;
    s.addImage({ path: photo("street"), x: px, y: 0, w: W - px, h: H, sizing: { type: "cover", w: W - px, h: H }, altText: "A residential street in a historic neighborhood" });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 0, w: W - px, h: H, fill: { color: HEX.navy, transparency: 45 }, line: { type: "none" }, objectName: "photo tint" });
    txt(s, "OWN YOUR FUTURE CHALLENGE   |   PITCH PRESENTATION", { x: M + 0.25, y: 1.85, w: 7.4, h: 0.3, fontSize: 12, bold: true, charSpacing: 1.5, color: HEX.ice });
    title(s, "OwnTheBlock");
    s.addText("Community ownership of neighborhood homes, from $10, with the rules enforced by smart contracts on Base", { placeholder: "body" });
    txt(s, [
      { text: "Kaleb Conway", options: { bold: true, breakLine: true } },
      { text: "Annual HBCU AI & Fintech Conference   ·   Nashville, TN   ·   November 10, 2026" },
    ], { x: M + 0.25, y: 5.55, w: 7.5, h: 0.7, fontSize: 13, color: C.background1 });
    s.addNotes(
      "TIMING: 5:00 total. Cover + hook 0:40, problem 0:20, solution 0:40, blockchain 0:55, proof 0:25, innovation & impact 0:40, plan 0:45, risks & ask 0:35. Finish by 4:45.\n\n" +
        "SAY (hook, over this slide): \"Walk two blocks from A&T and count how many homes are owned by people who live there. Meet Ms. Jenkins: forty years on the same block in East Greensboro. The house next door is boarded up. The heirs live out of state, can't afford repairs, and no bank will lend on it. Then the cash offers start from out-of-town investors. Her neighbors would gladly chip in, but there's no way to turn $10 here and $50 there into owning a house.\""
    );
  }

  // ============================================================ 2. Problem
  {
    const s = slide("CONTENT", "Pitch", "01   The problem");
    title(s, "Neighbors have the will and small amounts of money, but no way to pool it into ownership");
    const y0 = 1.85, colW = 3.85, g = 0.33;
    const xA = M, xB = M + colW + g, xC = M + 2 * (colW + g);
    // A: the case
    label(s, "The case", xA, y0, colW);
    s.addImage({ path: photo("demo-ct"), x: xA, y: y0 + 0.38, w: colW, h: 1.75, sizing: { type: "cover", w: colW, h: 1.75 }, altText: "Boarded-up houses on a residential street" });
    txt(s, [
      { text: "Ms. Jenkins, 40 years on her block in East Greensboro", options: { bold: true, color: HEX.navy, breakLine: true } },
      { text: "The house next door is vacant: out-of-state heirs, no bank loan for a boarded-up home. Outside investors make cash offers; rent profits leave the block." },
    ], { x: xA, y: y0 + 2.25, w: colW, h: 1.7, fontSize: 13, paraSpaceAfter: 4 });
    // B: the data
    label(s, "The data", xB, y0, colW);
    s.addChart(pres.charts.BAR, [{ name: "Homeownership rate", labels: ["Black households", "White households"], values: [45, 74] }], {
      ...CHART, x: xB - 0.1, y: y0 + 0.3, w: colW + 0.2, h: 2.75, barDir: "col", barGapWidthPct: 70,
      chartColors: [HEX.gold, HEX.navy], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0"%"', dataLabelFontBold: true, dataLabelFontSize: 16,
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 90, valAxisMinVal: 0,
      showTitle: true, title: "U.S. homeownership rate, by race",
    });
    txt(s, "A 29-point ownership gap becomes a wealth gap that is passed down, because a home is most families' largest asset.", { x: xB, y: y0 + 3.15, w: colW, h: 0.85, fontSize: 13 });
    // C: the root cause
    label(s, "Why it persists", xC, y0, colW);
    const rows = [
      ["Who it hurts", "Long-time residents of Black neighborhoods near HBCUs"],
      ["Root cause", "Ownership needs a down payment, credit and one big check"],
      ["The gap", "Pooling many $10–$500 checks has been too costly to run"],
    ];
    rows.forEach((r, i) => {
      const y = y0 + 0.42 + i * 1.18;
      disc(s, i + 1, xC, y);
      txt(s, [{ text: r[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: r[1] }], { x: xC + 0.58, y: y - 0.02, w: colW - 0.58, h: 1.0, fontSize: 13, paraSpaceAfter: 2 });
    });
    takeaway(s, "Outside capital decides the future of these blocks because it is the only capital that can act.");
    source(s, "Source: U.S. Census Bureau, Housing Vacancies and Homeownership Survey (rates rounded; confirm latest quarter). Ms. Jenkins is a composite case based on common heirs'-property situations.");
    s.addNotes(
      "SAY: \"Black homeownership is 45%; white homeownership is 74%. Homes are how families build wealth, so that gap gets passed down. The problem: neighbors have the will and small amounts of money, but no way to pool it into ownership, so outsiders decide what happens to their block.\"\n\n" +
        "Rubric: Problem Articulation (5). Who / root cause / impact are the three critical elements."
    );
  }

  // ============================================================ 3. Solution
  {
    const s = slide("CONTENT", "Pitch", "02   The solution");
    title(s, "OwnTheBlock lets ~1,250 neighbors co-own a renovated home, starting at $10 a token");
    const steps = [
      ["Raise", "Weeks 1–10", "Neighbors buy $10 tokens in the app. Residents get the first 7 days. Goal missed = automatic refund."],
      ["Buy & fix", "Months 5–9", "The house's LLC buys at the as-is appraisal. Local contractors are paid in inspected stages."],
      ["Rent & pay", "Month 10+", "A licensed manager leases to a local family. Net rent is paid to every owner monthly."],
      ["Govern & exit", "Ongoing", "Owners vote on the Charter. The tenant can buy the home in years 3–7."],
    ];
    const sw = (CW - 3 * 0.12) / 4;
    steps.forEach((st, i) => {
      const x = M + i * (sw + 0.12);
      s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, { x, y: 1.85, w: sw, h: 0.62, fill: { color: i === 3 ? HEX.gold : HEX.navy }, line: { type: "none" }, objectName: "step " + (i + 1) });
      txt(s, [{ text: `${i + 1}  ${st[0]}`, options: { bold: true } }], { x: x + (i ? 0.38 : 0.2), y: 1.85, w: sw - 0.7, h: 0.62, fontSize: 15, color: C.background1, valign: "middle" });
      txt(s, st[1].toUpperCase(), { x: x + 0.05, y: 2.6, w: sw - 0.2, h: 0.26, fontSize: 10, bold: true, color: C.accent2, charSpacing: 1 });
      txt(s, st[2], { x: x + 0.05, y: 2.88, w: sw - 0.25, h: 1.05, fontSize: 13 });
    });
    // structure
    const yS = 4.15, hS = 1.6;
    box(s, M, yS, 7.45, hS, C.background2, "structure panel");
    label(s, "Legal structure: one LLC per house", M + 0.25, yS + 0.15, 6);
    const nodes = [["Neighbors", "14,400 tokens at $10 = $144,000"], ["House LLC", "1 token = 1 membership unit"], ["The home", "LLC holds the deed and the lease"]];
    nodes.forEach((n, i) => {
      const x = M + 0.25 + i * 2.38;
      s.addShape(pres.shapes.RECTANGLE, { x, y: yS + 0.52, w: 1.98, h: 0.9, fill: { color: HEX.white }, line: { color: HEX.line, width: 0.75 }, objectName: n[0] + " node" });
      txt(s, [{ text: n[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: n[1], options: { fontSize: 11 } }], { x: x + 0.1, y: yS + 0.56, w: 1.8, h: 0.82, fontSize: 13, valign: "middle", align: "center" });
      if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.02, y: yS + 0.84, w: 0.32, h: 0.26, fill: { color: HEX.steel }, line: { type: "none" }, objectName: "flow arrow" });
    });
    // rules
    const xR = M + 7.75, wR = CW - 7.75;
    box(s, xR, yS, wR, hS, C.accent1, "charter panel");
    txt(s, "COMMUNITY CHARTER, ENFORCED IN CODE", { x: xR + 0.25, y: yS + 0.15, w: wR - 0.4, h: 0.28, fontSize: 11, bold: true, charSpacing: 1, color: HEX.gold });
    txt(s, ["Max 2% of tokens per person", "Rent increases capped at 3% a year", "Steward co-signs every payment", "Rule changes: 2/3 vote + 30-day wait"].map((t, i, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < a.length - 1 } })),
      { x: xR + 0.25, y: yS + 0.5, w: wR - 0.45, h: 1.05, fontSize: 13, color: C.background1, paraSpaceAfter: 3 });
    takeaway(s, "Every neighbor who chips in owns a piece, votes on the rules and is paid monthly; the tenant can buy.");
    source(s, "Illustrative pilot: one two-unit home in East Greensboro, $144,000 raise under Regulation Crowdfunding. Figures are planning estimates; detail in Appendix A.");
    s.addNotes(
      "SAY: \"OwnTheBlock lets about 1,250 neighbors, students, alumni and churches put in $10 to $2,000 each on their phones: $144,000 to buy and fix one house. Each $10 token is one unit of an LLC that owns the deed. Residents go first and no one can own more than 2%. A local family rents it with a path to buy it. Every owner votes on the rules and gets paid monthly.\"\n\n" +
        "If asked why an LLC: people can't legally own 1/14,400th of a house, but an LLC can own the house and have thousands of members. Investors can't lose more than they put in."
    );
  }

  // ============================================================ 4. Why blockchain
  {
    const s = slide("CONTENT", "Pitch", "03   Why blockchain");
    title(s, "Blockchain solves what a database can't: penny-sized payouts and rules no one can quietly change");
    const wL = 4.9;
    label(s, "Reason 1: the payout math", M, 1.85, wL);
    s.addChart(pres.charts.BAR, [{ name: "Monthly cost", labels: ["Bank ACH (high est.)", "Bank ACH (low est.)", "OwnTheBlock on Base"], values: [720, 288, 14] }], {
      ...CHART, x: M - 0.1, y: 2.15, w: wL + 0.2, h: 2.55, barDir: "bar", barGapWidthPct: 55,
      chartColors: [HEX.gray, HEX.gray, HEX.green], invertedColors: [HEX.gray, HEX.gray, HEX.green],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0', dataLabelFontBold: true,
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 900, valAxisMinVal: 0,
      showTitle: true, title: "Monthly cost to pay $700 rent to 1,440 owners",
    });
    txt(s, [
      { text: "A $100 owner earns $0.49 a month. ", options: { bold: true, color: HEX.navy } },
      { text: "Bank transfers would eat 41–100%+ of the payout. On Base, one deposit splits it for everyone; each claim costs under 1¢, and we pay it." },
    ], { x: M, y: 4.8, w: wL, h: 1.0, fontSize: 13 });
    // table
    const xT = M + wL + 0.4, wT = CW - wL - 0.4;
    label(s, "Reason 2: trust that doesn't depend on us", xT, 1.85, wT);
    const rows = [
      [th("Neighborhood needs"), th("Database + bank"), th("OwnTheBlock on Base")],
      ["Rules no one can quietly change", "Whoever runs the database can edit them", "Rent cap and limits change only by 2/3 vote + 30-day wait"],
      ["Ownership stays local and fair", "Staff check by hand, after the fact", "Every transfer checks ID, 2% cap and local share"],
      ["Proof of where money went", "Trust a monthly PDF", "Every payment traceable on a public ledger"],
      ["Two keys on the house's money", "Bank signers, invisible to owners", "Manager proposes, steward must co-sign"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { color: HEX.gray } }, { text: r[2], options: { bold: true, color: HEX.green } }] : r));
    s.addTable(rows, { ...TABLE, x: xT, y: 2.2, w: wT, colW: [2.15, 2.15, wT - 4.3], rowH: [0.4, 0.78, 0.7, 0.62, 0.62], fontSize: 12 });
    takeaway(s, "Thousands of tiny owners, micro-payouts and tamper-proof rules: exactly what a blockchain is built for.");
    source(s, "ACH range assumes $0.20–$0.50 per payment (bank quote pending). Base cost = measured 67,067 gas per claim at typical Base fees (<$0.01), covered by our paymaster; rounded up to $14 for 1,440 claims.");
    s.addNotes(
      "WORTH 20 POINTS. Slow down.\n\nSAY: \"Why does this need a blockchain? Two reasons. First, the payments. A $100 owner earns 49 cents a month. A bank transfer to each of 1,440 owners costs 20 to 50 cents, so fees eat most of the payout. On Base, the manager makes one deposit and the contract splits it for everyone. Each claim costs under a cent, and we cover it. Second, trust. Whoever runs a normal database can change the rules. Our rent cap, ownership limits and local share are written into the code; changing them takes a two-thirds vote and a 30-day wait. Every payment needs a community steward's co-signature, and anyone can trace every dollar.\"\n\n" +
        "IF ASKED 'Why not a database?': \"A database can store the list. It can't make tiny payments cheap, and it can't stop its own operator from changing the rules.\"\n" +
        "IF ASKED 'Aren't you still using a bank?': \"Yes, where the law requires: an escrow agent during the raise and a transfer agent for the official owner list, which mirrors the chain.\""
    );
  }

  // ============================================================ 5. Proof
  {
    const s = slide("CONTENT", "Pitch", "04   Proof it works");
    title(s, "The prototype works today: five smart contracts, 22 passing tests and the full story run on-chain");
    const kpis = [["5", "smart contracts in Solidity"], ["22", "automated tests passing"], [String(dep.transactions.length), LIVE ? "live transactions on Base Sepolia" : "transactions in the end-to-end run"], ["<1¢", "measured cost of one payout claim"]];
    const kw = 2.25, kh = 1.45;
    kpis.forEach((k, i) => {
      const x = M + (i % 2) * (kw + 0.25), y = 1.85 + Math.floor(i / 2) * (kh + 0.25);
      box(s, x, y, kw, kh, i === 3 ? C.accent1 : C.background2, "kpi " + i);
      txt(s, k[0], { x: x + 0.2, y: y + 0.15, w: kw - 0.4, h: 0.7, fontSize: 36, bold: true, fontFace: "Cambria", color: i === 3 ? HEX.gold : HEX.navy });
      txt(s, k[1], { x: x + 0.2, y: y + 0.85, w: kw - 0.35, h: 0.5, fontSize: 12, color: i === 3 ? HEX.white : HEX.ink });
    });
    txt(s, [
      { text: "Contracts: ", options: { bold: true, color: HEX.navy } },
      { text: "IdentityRegistry · Raise · BlockToken · Treasury · CharterGovernor" },
    ], { x: M, y: 5.25, w: 2 * kw + 0.25, h: 0.55, fontSize: 12 });
    const xT = M + 2 * kw + 0.6, wT = CW - (2 * kw + 0.6);
    label(s, "Ms. Jenkins' story, replayed on the blockchain", xT, 1.85, wT);
    const rows = [[th("What happened"), th("Result", "center")]].concat(
      events.map((e) => [{ text: e.label }, { text: e.ok ? "Executed" : "Blocked by code", options: { bold: true, align: "center", color: e.ok ? HEX.green : HEX.brick } }]),
    );
    s.addTable(rows, { ...TABLE, x: xT, y: 2.2, w: wT, colW: [wT - 1.85, 1.85], rowH: 0.395, fontSize: 12 });
    takeaway(s, "The red rows matter most: the code refused to break the community's rules, and no one, including us, can override it.");
    source(s, LIVE ? "Run on Base Sepolia (test network); every transaction is public on the block explorer." : "Run on a local Hardhat test chain (Solidity 0.8.24, OpenZeppelin 5). Base Sepolia public deployment pending testnet funds; independent audit before any real money.");
    s.addNotes(
      "SAY: \"This isn't a slide. We've written five smart contracts, with 22 automated tests passing. We ran Ms. Jenkins' whole story on a test blockchain: the residents-first window, the raise, the steward co-signing a repair, one rent deposit paying every owner. And the code refused an early sale, a 10% rent hike and a rushed rule change.\"\n\n" +
        "Be precise: it ran on a test chain, not real money. Real dollars only move after securities counsel signs off and an independent audit passes."
    );
  }

  // ============================================================ 6. Innovation + impact
  {
    const s = slide("CONTENT", "Pitch", "05   Innovation & impact");
    title(s, "No one else combines local ownership, rules in code and a tenant path to own, and the model scales");
    const wL = 7.25;
    label(s, "Competitive landscape", M, 1.85, wL);
    const Y = "●", P = "◐", N = "○";
    const feats = ["On-chain", "$10–$100 minimum", "Neighbors first", "Rules in code", "Path to own"];
    const data = [
      ["Arrived, Fundrise", [N, Y, N, N, N]],
      ["RealT, Lofty", [Y, Y, N, P, N]],
      ["Community Investment Trust", [N, Y, Y, P, N]],
      ["Community land trusts", [N, N, Y, P, P]],
      ["OwnTheBlock", [Y, Y, Y, Y, Y]],
    ];
    const fw = (wL - 2.35) / 5;
    const rows = [[th(""), ...feats.map((f) => ({ text: f, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, align: "center", fontSize: 11 } }))]].concat(
      data.map(([n, v], r) => {
        const us = r === data.length - 1;
        const fill = us ? { fill: { color: "E3EBF4" } } : {};
        return [{ text: n, options: { bold: true, color: HEX.navy, ...fill } }, ...v.map((m) => ({ text: m, options: { align: "center", fontSize: 16, color: m === N ? "AEB4BD" : us ? HEX.green : HEX.steel, ...fill } }))];
      }),
    );
    s.addTable(rows, { ...TABLE, x: M, y: 2.2, w: wL, colW: [2.35, ...Array(5).fill(fw)], rowH: [0.58, 0.5, 0.5, 0.5, 0.5, 0.55], fontSize: 12 });
    txt(s, "●  yes     ◐  partly     ○  no", { x: M, y: 5.45, w: 4, h: 0.3, fontSize: 10, color: C.accent6 });
    const xR = M + wL + 0.4, wR = CW - wL - 0.4;
    label(s, "Impact at scale: 100 communities × 5 homes", xR, 1.85, wR);
    const big = [["500", "families housed at capped rents"], ["$72M", "of homes owned by their neighborhoods"], ["$4.2M", "a year of rent income staying local"], ["600K+", "ownership stakes, most first investments"]];
    const bw = (wR - 0.25) / 2;
    big.forEach((b, i) => {
      const x = xR + (i % 2) * (bw + 0.25), y = 2.2 + Math.floor(i / 2) * 1.62;
      box(s, x, y, bw, 1.42, C.background2, "impact " + i);
      txt(s, b[0], { x: x + 0.18, y: y + 0.12, w: bw - 0.3, h: 0.65, fontSize: 30, bold: true, fontFace: "Cambria", color: i % 2 ? HEX.green : HEX.navy });
      txt(s, b[1], { x: x + 0.18, y: y + 0.78, w: bw - 0.3, h: 0.55, fontSize: 12 });
    });
    box(s, M, 5.95, CW, 0.6, C.accent1, "mission box");
    txt(s, [{ text: "Coinbase's mission: increase economic freedom in the world.   ", options: { bold: true, color: HEX.gold } }, { text: "Ours starts with the block you live on, from $10.", options: { color: HEX.white } }], { x: M + 0.25, y: 5.95, w: CW - 0.5, h: 0.6, fontSize: 14, valign: "middle" });
    source(s, "Competitor features from public descriptions, Nov 2026. Scale: 500 homes × $144,000 = $72M; 500 × $700 × 12 = $4.2M; ~1,250 investors per home (targets, not forecasts).");
    s.addNotes(
      "SAY: \"Others do pieces of this. Fundrise has small minimums but no community control; RealT and Lofty put homes on a blockchain, but owners are global. Nobody keeps ownership local, writes the community's rules into code and gives the tenant a path to own. At 100 communities with 5 homes each, that's $72 million of homes owned by the neighborhoods around them and $4.2 million a year in rent staying local. It fits Coinbase's mission: increase economic freedom, starting with the block you live on.\"\n\n" +
        "Rubric: Innovation (15) + Benefits (15), including alignment with Coinbase's mission. Say the mission out loud."
    );
  }

  // ============================================================ 7. Action plan + budget
  {
    const s = slide("CONTENT", "Pitch", "06   Action plan & budget");
    title(s, "We will prove one house end to end in 18 months on a $180,000 pilot budget");
    const ph = [
      ["Done", "Prototype", ["App and Block Simulator", "5 contracts, 22 tests"], "Prototype works"],
      ["Months 0–3", "Set up", ["Securities counsel + audit", "Sign steward and Reg CF portal"], "Audit passed"],
      ["Months 3–9", "First raise", ["Source house: city surplus or heirs", "File Form C; raise $144,000"], "Raise fully funded"],
      ["Months 9–18", "First payouts", ["Renovate, lease, pay monthly", "Houses 2–3 on Base mainnet"], "3 homes, 12 payouts"],
    ];
    const pw = CW / 4;
    s.addShape(pres.shapes.LINE, { x: M + 0.21, y: 2.06, w: CW - pw, h: 0, line: { color: HEX.line, width: 1.5 }, objectName: "timeline" });
    ph.forEach((p, i) => {
      const x = M + i * pw;
      s.addShape(pres.shapes.OVAL, { x, y: 1.85, w: 0.42, h: 0.42, fill: { color: i === 0 ? HEX.green : HEX.navy }, line: { type: "none" }, objectName: "milestone " + i });
      txt(s, i === 0 ? "✓" : String(i), { x, y: 1.85, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, p[0].toUpperCase(), { x, y: 2.4, w: pw - 0.3, h: 0.26, fontSize: 11, bold: true, color: i === 0 ? HEX.green : HEX.steel, charSpacing: 1 });
      txt(s, p[1], { x, y: 2.66, w: pw - 0.25, h: 0.35, fontSize: 15, bold: true, color: HEX.navy });
      txt(s, p[2].map((t, j) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < p[2].length - 1 } })), { x, y: 3.04, w: pw - 0.3, h: 0.75, fontSize: 12, paraSpaceAfter: 2 });
      txt(s, [{ text: "Success: ", options: { bold: true } }, { text: p[3] }], { x, y: 3.82, w: pw - 0.3, h: 0.3, fontSize: 12, color: HEX.green });
    });
    const yB = 4.3;
    label(s, "Pilot budget (18 months)", M, yB, 6);
    const rows = [
      [th("Use of funds"), th("Amount", "right")],
      ["Team stipends (part-time)", "$65,000"],
      ["Securities attorney: LLC, Form C, Charter", "$35,000"],
      ["Independent smart contract audit", "$30,000"],
      ["CPA, portal, transfer agent, insurance", "$26,000"],
      ["Outreach, money lessons, app costs", "$24,000"],
      [{ text: "Total", options: { bold: true } }, { text: "$180,000", options: { bold: true } }],
    ].map((r, i) => (i ? r.map((c, j) => (typeof c === "string" ? { text: c, options: { align: j ? "right" : "left" } } : { ...c, options: { ...c.options, align: j ? "right" : "left" } })) : r));
    s.addTable(rows, { ...TABLE, x: M, y: yB + 0.33, w: 6.3, colW: [4.9, 1.4], rowH: 0.27, fontSize: 11, margin: [0.01, 0.1, 0.01, 0.1] });
    const xF = M + 6.75, wF = CW - 6.75;
    label(s, "Funding sources", xF, yB, wF);
    s.addChart(pres.charts.BAR, [
      { name: "Grants & competitions (incl. Base Builder)", labels: ["$180K"], values: [50] },
      { name: "CDFI / bank CRA program", labels: ["$180K"], values: [50] },
      { name: "Impact angels", labels: ["$180K"], values: [80] },
    ], {
      ...CHART, x: xF - 0.1, y: yB + 0.25, w: wF + 0.2, h: 1.45, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 30,
      chartColors: [HEX.gold, HEX.steel, HEX.navy], showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: '"$"0"K"', dataLabelColor: HEX.white, dataLabelFontBold: true,
      valAxisHidden: true, catAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 180,
      showLegend: true, legendPos: "b", legendFontSize: 10, legendFontFace: "+mn-lt", legendColor: HEX.ink,
    });
    txt(s, [{ text: "House money is separate: ", options: { bold: true, color: HEX.navy } }, { text: "each home is funded by its own $144,000 raise, never this budget." }], { x: xF, y: yB + 1.75, w: wF, h: 0.5, fontSize: 12 });
    source(s, "Budget lines are planning estimates pending quotes (typical ranges: first Reg CF offering counsel $20–50K; audit $15–50K). Partners listed in Appendix C are targets, not yet signed.");
    s.addNotes(
      "SAY: \"Our plan proves one house in 18 months. Months 0–3: securities attorney, independent security audit, sign a community steward and a crowdfunding portal. Months 3–9: source a house from city surplus or an heirs'-property family and run the raise under SEC crowdfunding rules. Months 9–18: renovate, lease, start monthly payouts, then houses two and three. The pilot costs $180,000, mostly legal work, the audit and team stipends. Each house is paid for by its own raise, never this budget.\"\n\n" +
        "Rubric: Action Plan (20): objectives, resources, budget, timeline. Legal and security work comes BEFORE any real money.\n" +
        "Revenue if asked: 2% of each raise ($2,880/house), 2% of rent, and licensing the platform to land trusts, CDCs and cities."
    );
  }

  // ============================================================ 8. Risks + ask
  {
    const s = slide("CONTENT", "Pitch", "07   Risks & the ask");
    title(s, "The key risks are identified and mitigated; we're asking for a steward partner, $180,000 and mentorship");
    const wL = 7.7;
    label(s, "Key risks and mitigations", M, 1.85, wL);
    const rows = [
      [th("Risk"), th("Mitigation")],
      ["Can't fill a $144K raise", "~1,260 investors across four groups (App. B); all-or-nothing refunds"],
      ["Securities law", "Reg CF via registered portal; one LLC per house; 12-month lockup in code"],
      ["Code bug or hack", "22 tests + independent audit before real money; two keys on every payment"],
      ["Repairs run over / vacancy", "15% repair cushion, staged payments, 10% reserve, 5% vacancy buffer"],
      ["Home values fall", "Buy below repaired value, no mortgage, first-loss partner covers first 10%"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }] : r));
    s.addTable(rows, { ...TABLE, x: M, y: 2.2, w: wL, colW: [2.45, wL - 2.45], rowH: [0.4, 0.62, 0.62, 0.62, 0.62, 0.62], fontSize: 12 });
    const xA = M + wL + 0.35, wA = CW - wL - 0.35;
    box(s, xA, 1.85, wA, 4.65, C.accent1, "ask panel");
    txt(s, "OUR ASK", { x: xA + 0.3, y: 2.05, w: wA - 0.6, h: 0.3, fontSize: 12, bold: true, charSpacing: 1.5, color: HEX.gold });
    const asks = [["A steward partner", "and a first house in East Greensboro"], ["$180,000", "to fund the 18-month pilot"], ["Mentorship", "from Base and Coinbase for the audit and launch"]];
    asks.forEach((a, i) => {
      const y = 2.5 + i * 0.95;
      disc(s, i + 1, xA + 0.3, y, 0.42, HEX.gold);
      txt(s, [{ text: a[0], options: { bold: true, breakLine: true } }, { text: a[1], options: { fontSize: 12, color: HEX.ice } }], { x: xA + 0.88, y: y - 0.04, w: wA - 1.15, h: 0.85, fontSize: 15, color: C.background1 });
    });
    txt(s, "Fix the block. Own the block.", { x: xA + 0.3, y: 5.4, w: wA - 0.6, h: 0.45, fontSize: 20, bold: true, italic: true, fontFace: "Cambria", color: HEX.white });
    txt(s, "Thank you  ·  Questions", { x: xA + 0.3, y: 5.88, w: wA - 0.6, h: 0.35, fontSize: 13, color: HEX.ice });
    txt(s, "Estimates, not guarantees: investors can lose money, and the app shows the downside as clearly as the upside. Every Charter is reviewed by counsel; rules favor residency, never race or any protected class.", { x: M, y: 5.95, w: wL, h: 0.6, fontSize: 11, italic: true, color: HEX.gray });
    source(s, "Full risk register, investor mix and unit economics in the Appendix.");
    s.addNotes(
      "SAY: \"Our biggest risks are filling the raise, securities law and code bugs. We handle them with all-or-nothing refunds, a registered crowdfunding portal and an independent audit before any real money moves. Our ask: a steward partner, $180,000 for the pilot, and mentorship from Base. Ms. Jenkins doesn't have to leave. Fix the block. Own the block. Thank you.\"\n\n" +
        "Q&A one-liners:\n- Legal? Each house's LLC raises under Reg CF via a registered portal; 12-month lockup in code.\n- 49 cents is nothing? The impact is the house, its rent and its rising value staying in the neighborhood, and a tenant becoming an owner.\n- Fill $144K? 300 residents × $50, 400 students × $25, 540 alumni × $150, 19 churches/orgs × $2,000 (Appendix B).\n- Revenue? 2% of each raise, 2% of rent, then platform licensing.\n- Gentrification? Residents buy first, rent is capped at 3%/yr in code, and the tenant can buy the home."
    );
  }

  // ============================================================ Appendix A: unit economics
  {
    const s = slide("CONTENT", "Appendix", "Appendix A   One-house economics");
    title(s, "One house: a $144,000 raise backs a $150,000 home and pays owners $700 a month");
    const wL = 6.3;
    label(s, "Uses of the $144,000 raise", M, 1.85, wL);
    const rows = [
      [th("Use"), th("Amount", "right")],
      ["Purchase at as-is appraisal", "$90,000"],
      ["Repairs + 15% contingency", "$40,250"],
      ["Closing costs and repair reserve", "$5,110"],
      ["Legal, CPA review, crowdfunding portal", "$5,760"],
      ["OwnTheBlock raise fee (2%)", "$2,880"],
      [{ text: "Total: 14,400 tokens at $10", options: { bold: true } }, { text: "$144,000", options: { bold: true } }],
    ].map((r, i) => (i ? r.map((c, j) => (typeof c === "string" ? { text: c, options: { align: j ? "right" : "left" } } : { ...c, options: { ...c.options, align: j ? "right" : "left" } })) : r));
    s.addTable(rows, { ...TABLE, x: M, y: 2.2, w: wL, colW: [4.8, 1.5], rowH: 0.42, fontSize: 12 });
    const st = [["$10.63", "of repaired value behind each $10 token on day one"], ["5.8%", "cash yield ($8,400 net rent a year)"], ["~8.7%", "est. annual total return over 5 years (not guaranteed)"]];
    st.forEach((k, i) => {
      const x = M + i * 2.15;
      txt(s, k[0], { x, y: 5.3, w: 2.0, h: 0.5, fontSize: 24, bold: true, fontFace: "Cambria", color: HEX.navy });
      txt(s, k[1], { x, y: 5.8, w: 2.0, h: 0.6, fontSize: 11 });
    });
    const xR = M + wL + 0.45, wR = CW - wL - 0.45;
    label(s, "Where each month's $1,400 rent goes", xR, 1.85, wR);
    s.addChart(pres.charts.BAR, [{ name: "Monthly", labels: ["Net to owners", "Taxes & insurance", "Repair reserve (10%)", "Management (8%)", "Admin", "Vacancy (5%)", "Platform (2%)"], values: [700, 270, 140, 112, 80, 70, 28] }], {
      ...CHART, x: xR - 0.1, y: 2.15, w: wR + 0.2, h: 3.9, barDir: "bar", barGapWidthPct: 40,
      chartColors: [HEX.green, HEX.steel, HEX.steel, HEX.steel, HEX.steel, HEX.steel, HEX.steel], invertedColors: [HEX.green, HEX.steel, HEX.steel, HEX.steel, HEX.steel, HEX.steel, HEX.steel],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0', valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 850, catAxisOrientation: "maxMin",
    });
    source(s, "Planning estimates. $100 = 10 tokens → $0.49/month. 5-year case assumes 3% annual appreciation; a ~25% value drop is roughly break-even. Buying at full price would start each token at $8.55 of value (~3.5% return).");
    s.addNotes("Use in Q&A for finance questions. Jasmine: $100 → ~$116 at exit + ~$29 payouts ≈ $145 after 5 years (~8.7%/yr). Why distressed homes: that's where value is created; full-price purchase returns ~3.5%, below a savings account.");
  }

  // ============================================================ Appendix B: filling the raise
  {
    const s = slide("CONTENT", "Appendix", "Appendix B   Filling the raise");
    title(s, "The $144,000 raise is filled by ~1,260 investors across four groups, with no one above the 2% cap");
    const groups = [["Alumni & supporters", 540, 150, 81000], ["Churches & local orgs", 19, 2000, 38000], ["Residents", 300, 50, 15000], ["A&T / Bennett students", 400, 25, 10000]];
    s.addChart(pres.charts.BAR, [{ name: "Raised", labels: groups.map((g) => g[0]), values: groups.map((g) => g[3] / 1000) }], {
      ...CHART, x: M - 0.1, y: 1.85, w: 6.4, h: 3.9, barDir: "bar", barGapWidthPct: 45, chartColors: [HEX.navy],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"0"K"', valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 100, catAxisOrientation: "maxMin",
      showTitle: true, title: "Amount raised by investor group",
    });
    const xT = M + 6.75, wT = CW - 6.75;
    const rows = [[th("Group"), th("Investors", "right"), th("Avg.", "right"), th("Total", "right")]].concat(
      groups.map((g) => [{ text: g[0], options: { bold: true, color: HEX.navy } }, { text: g[1].toLocaleString(), options: { align: "right" } }, { text: "$" + g[2].toLocaleString(), options: { align: "right" } }, { text: "$" + g[3].toLocaleString(), options: { align: "right" } }]),
      [[{ text: "Total", options: { bold: true } }, { text: "1,259", options: { bold: true, align: "right" } }, { text: "", options: {} }, { text: "$144,000", options: { bold: true, align: "right" } }]],
    );
    s.addTable(rows, { ...TABLE, x: xT, y: 1.95, w: wT, colW: [2.3, 1.0, 0.95, wT - 4.25], rowH: 0.45, fontSize: 12 });
    txt(s, ["Residents get an exclusive first 7 days", "Per-person cap: 2% ($2,880), enforced on every transfer", "Goal missed = every investor refunded automatically"].map((t, i, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < a.length - 1 } })), { x: xT, y: 4.85, w: wT, h: 0.95, fontSize: 13, paraSpaceAfter: 3 });
    source(s, "Illustrative investor mix for the pilot raise; to be validated with pre-launch interest surveys before filing Form C.");
    s.addNotes("If asked whether 14,400 $10 checks is realistic: the plan doesn't rely on $10 checks alone. Alumni and churches provide most of the dollars; residents and students provide most of the owners.");
  }

  // ============================================================ Appendix C: resources
  {
    const s = slide("CONTENT", "Appendix", "Appendix C   Resources");
    title(s, "Resources: a lean founding team, advisors to recruit and the partners each house needs");
    const rows = [
      [th("Role"), th("Partner type"), th("Why it's needed"), th("Status", "center")],
      ["Community steward", "Neighborhood association, church or land trust", "Co-signs every payment; the community's check on us", "Pursuing"],
      ["Deal pipeline", "City of Greensboro / Guilford County surplus; heirs'-property legal aid", "Below-market homes where the returns work", "Pursuing"],
      ["Regulated rails", "Reg CF portal, SEC-registered transfer agent, escrow bank", "Legally required for a crowdfunding offering", "Pursuing"],
      ["First-loss capital", "CDFI or bank earning CRA credit", "Protects small investors from the first 10% of losses", "Pursuing"],
      ["Investor base", "NC A&T and Bennett students and alumni networks", "Fills the raise; first investments for students", "Pursuing"],
      ["Base ecosystem", "Base Builder grants, Coinbase Developer Platform", "Funds the audit; Smart Wallet, paymaster, onramp", "Applying"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2] }, { text: r[3], options: { align: "center", bold: true, color: HEX.gold } }] : r));
    s.addTable(rows, { ...TABLE, x: M, y: 1.85, w: CW, colW: [2.2, 4.3, 4.3, CW - 10.8], rowH: [0.4, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55], fontSize: 12 });
    box(s, M, 5.75, CW, 0.75, C.background2, "team panel");
    txt(s, [
      { text: "Team: ", options: { bold: true, color: HEX.navy } },
      { text: "Kaleb Conway, founder (finance, financial model, smart contracts and app).  " },
      { text: "Advisors to recruit: ", options: { bold: true, color: HEX.navy } },
      { text: "securities attorney, Greensboro real-estate broker, CPA." },
    ], { x: M + 0.25, y: 5.75, w: CW - 0.5, h: 0.75, fontSize: 13, valign: "middle" });
    source(s, "Partners are targets; none signed as of November 2026.");
    s.addNotes("Be honest that partners are targets. If you have any real conversation (one email reply from the city or a neighborhood association), cite it.");
  }

  // ============================================================ Appendix D: Coinbase stack
  {
    const s = slide("CONTENT", "Appendix", "Appendix D   Technology");
    title(s, "Built on Coinbase's stack, with the crypto invisible to the user");
    const rows = [
      [th("Component"), th("What it does for the user"), th("Status", "center")],
      ["Base", "Low fees make 49-cent payouts possible", "Built (test chain)"],
      ["USDC", "Payouts in digital dollars, not a volatile coin", "Built (test USDC)"],
      ["Smart Wallet", "Sign in with Face ID; no seed phrase to lose", "Next 90 days"],
      ["Paymaster", "We pay network fees; owners never need crypto", "Next 90 days"],
      ["Onramp / Offramp", "Fund from and cash out to a bank account", "Next 90 days"],
      ["Coinbase Verifications", "Reusable on-chain ID check, no personal data on-chain", "Evaluating"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }, { text: r[2], options: { align: "center", bold: true, color: r[2].startsWith("Built") ? HEX.green : HEX.gold } }] : r));
    s.addTable(rows, { ...TABLE, x: M, y: 1.85, w: CW, colW: [3.0, 6.7, CW - 9.7], rowH: [0.42, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55], fontSize: 13 });
    takeaway(s, "Someone like Ms. Jenkins sees balances in dollars, logs in with Face ID and never pays a network fee.", 5.75, 0.7);
    source(s, "USDC usage is limited to payouts; the house, not the token, is the asset. Stablecoins are federally regulated under the GENIUS Act (2025).");
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
