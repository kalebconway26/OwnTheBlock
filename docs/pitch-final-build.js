// OwnTheBlock final pitch deck: 8 lean slides that hit every rubric category, then the app demo images.
// Run: NODE_PATH=./node_modules node final.js out.pptx
const pptxgen = require("pptxgenjs");
const path = require("path");
const fs = require("fs");
const { applyTheme } = require("/home/kaleb/.claude/skills/synced/274981fa-adcd-4129-954d-21ad20077f36_650b4839-abbd-46e9-8a31-40481531fc9e/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "OwnTheBlock_Pitch_Final.pptx";
const photo = (k) => path.join("/home/kaleb/owntheblock/apps/web/public/photos", k + ".jpg");
const DEMO = "/mnt/c/Users/kaleb/Downloads/OwnTheBlock_App_Demo";

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
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;
const FOOT = "OwnTheBlock   |   Own Your Future Challenge   |   November 10, 2026";

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "COVER",
  background: { color: C.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M + 0.2, y: 2.35, w: 7.0, h: 1.1, fontSize: 54, bold: true, color: C.background1, valign: "bottom", margin: 0, align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M + 0.2, y: 3.6, w: 6.6, h: 1.0, fontSize: 20, color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.7, w: CW, h: 1.0, fontSize: 28, bold: true, color: C.accent1, valign: "top", margin: 0, align: "left" }, text: "" } },
    { text: { text: FOOT, options: { x: M, y: 7.02, w: 8, h: 0.28, fontSize: 9, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.09, w: 0.6, h: 0.28, fontSize: 9, color: C.accent6, align: "right", margin: 0 },
});
pres.defineSlideMaster({ title: "IMAGE", background: { color: C.background1 }, objects: [] });

let section = "";
function slide(master, sec, tracker) {
  if (sec !== section) { pres.addSection({ title: sec }); section = sec; }
  const s = pres.addSlide({ masterName: master, sectionTitle: sec });
  if (tracker) s.addText(tracker.toUpperCase(), { isTextBox: true, x: M, y: 0.34, w: 8, h: 0.28, margin: 0, fontSize: 12, bold: true, charSpacing: 1.5, color: C.accent2, objectName: "section tracker" });
  return s;
}
const title = (s, t) => s.addText(t, { placeholder: "title" });
const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 16, color: C.text1, valign: "top", ...o });
const source = (s, t) => txt(s, t, { x: M, y: 6.66, w: CW, h: 0.3, fontSize: 10, italic: true, color: C.accent6, objectName: "source" });
const box = (s, x, y, w, h, fill = C.background2, name = "panel") => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { type: "none" }, objectName: name });
const disc = (s, n, x, y, d = 0.5, fill = C.accent1) => {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: "disc " + n });
  txt(s, String(n), { x, y, w: d, h: d, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: "Cambria" });
};
const label = (s, t, x, y, w) => txt(s, t.toUpperCase(), { x, y, w, h: 0.3, fontSize: 12, bold: true, charSpacing: 1, color: C.accent2 });
const takeaway = (s, t, y = 5.95) => {
  box(s, M, y, CW, 0.62, C.accent1, "takeaway box");
  txt(s, t, { x: M + 0.3, y, w: CW - 0.6, h: 0.62, fontSize: 16, bold: true, color: C.background1, valign: "middle", objectName: "takeaway" });
};
const th = (t, al = "left") => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, align: al } });
const TABLE = { fontSize: 15, color: HEX.ink, border: { type: "solid", pt: 0.5, color: HEX.line }, valign: "middle", margin: [0.05, 0.14, 0.05, 0.14], fontFace: "Arial" };
const CHART = { catAxisLabelColor: HEX.ink, valAxisLabelColor: HEX.gray, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 14, valAxisLabelFontSize: 11, dataLabelFontFace: "+mn-lt", dataLabelFontSize: 14, dataLabelColor: HEX.ink, titleFontFace: "+mn-lt", titleFontSize: 14, titleColor: HEX.ink, showLegend: false, catGridLine: { style: "none" } };

(async () => {
  // ============================================================ 1. Cover
  {
    const s = slide("COVER", "Pitch");
    const px = 8.35;
    s.addImage({ path: photo("street"), x: px, y: 0, w: W - px, h: H, sizing: { type: "cover", w: W - px, h: H }, altText: "A residential street" });
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 0, w: W - px, h: H, fill: { color: HEX.navy, transparency: 45 }, line: { type: "none" }, objectName: "photo tint" });
    txt(s, "OWN YOUR FUTURE CHALLENGE", { x: M + 0.2, y: 1.85, w: 7.4, h: 0.3, fontSize: 13, bold: true, charSpacing: 1.5, color: HEX.ice });
    title(s, "OwnTheBlock");
    s.addText("Neighbors owning the homes on their own block, from $10, on Base", { placeholder: "body" });
    txt(s, [
      { text: "Kaleb Conway", options: { bold: true, breakLine: true } },
      { text: "HBCU AI & Fintech Conference   ·   Nashville   ·   November 10, 2026" },
    ], { x: M + 0.2, y: 5.6, w: 7.5, h: 0.7, fontSize: 14, color: C.background1 });
    s.addNotes(
      "TIMING (5:00): hook 0:40 · problem 0:20 · solution 0:40 · blockchain 0:55 · proof 0:25 · innovation & impact 0:40 · plan 0:45 · risks & ask 0:35. The app demo images at the end are for Q&A or if you have time.\n\n" +
        "SAY: \"Walk two blocks from A&T and count how many homes are owned by people who live there. Meet Ms. Jenkins: forty years on the same block in East Greensboro. The house next door is boarded up. The heirs live out of state, and no bank will lend on it. Then the cash offers start from out-of-town investors. Her neighbors would gladly chip in, but there's no way to turn $10 here and $50 there into owning a house.\""
    );
  }

  // ============================================================ 2. Problem
  {
    const s = slide("CONTENT", "Pitch", "01   The problem");
    title(s, "Neighbors want to own their block, but small money can't buy a house");
    const y0 = 1.95;
    s.addImage({ path: photo("demo-ct"), x: M, y: y0, w: 3.9, h: 2.75, sizing: { type: "cover", w: 3.9, h: 2.75 }, altText: "Boarded-up houses on a residential street" });
    txt(s, "Ms. Jenkins: 40 years on her block. The house next door sits empty.", { x: M, y: y0 + 2.9, w: 3.9, h: 0.75, fontSize: 15, bold: true, color: HEX.navy });
    s.addChart(pres.charts.BAR, [{ name: "Homeownership", labels: ["Black households", "White households"], values: [45, 74] }], {
      ...CHART, x: 4.75, y: y0 - 0.1, w: 3.9, h: 3.6, barDir: "col", barGapWidthPct: 70,
      chartColors: [HEX.gold, HEX.navy], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0"%"', dataLabelFontBold: true, dataLabelFontSize: 22,
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 90, valAxisMinVal: 0, showTitle: true, title: "U.S. homeownership rate",
    });
    const rows = [["Who", "Residents of Black neighborhoods near HBCUs"], ["Why", "Owning takes one big check and good credit"], ["Gap", "No way to pool $10–$500 from many neighbors"]];
    rows.forEach((r, i) => {
      const y = y0 + 0.15 + i * 1.2;
      disc(s, i + 1, 9.05, y);
      txt(s, [{ text: r[0], options: { bold: true, color: HEX.navy, breakLine: true } }, { text: r[1] }], { x: 9.7, y: y - 0.03, w: 3.05, h: 1.05, fontSize: 15 });
    });
    takeaway(s, "So outside investors decide what happens to the block, and the rent leaves the neighborhood.");
    source(s, "Source: U.S. Census Bureau, Housing Vacancies and Homeownership Survey (rounded). Ms. Jenkins is a composite case.");
    s.addNotes("SAY: \"Black homeownership is 45%; white is 74%. Homes are how families build wealth, so that gap gets passed down. Neighbors have the will and small amounts of money, but no way to pool it into ownership, so outsiders decide what happens to their block.\"\n\nRubric: Problem Articulation (5): who, root cause, impact.");
  }

  // ============================================================ 3. Solution
  {
    const s = slide("CONTENT", "Pitch", "02   The solution");
    title(s, "OwnTheBlock lets ~1,250 neighbors co-own a renovated home, starting at $10");
    const steps = [
      ["Raise", "Neighbors buy $10 tokens. Residents go first."],
      ["Buy & fix", "The house's LLC buys it; local contractors fix it."],
      ["Rent & pay", "A local family rents it; owners are paid monthly."],
      ["Govern & own", "Owners vote on rules; the tenant can buy it."],
    ];
    const sw = (CW - 3 * 0.12) / 4;
    steps.forEach((st, i) => {
      const x = M + i * (sw + 0.12);
      s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, { x, y: 1.95, w: sw, h: 0.75, fill: { color: i === 3 ? HEX.gold : HEX.navy }, line: { type: "none" }, objectName: "step " + (i + 1) });
      txt(s, `${i + 1}  ${st[0]}`, { x: x + (i ? 0.42 : 0.22), y: 1.95, w: sw - 0.7, h: 0.75, fontSize: 18, bold: true, color: C.background1, valign: "middle" });
      txt(s, st[1], { x: x + 0.1, y: 2.88, w: sw - 0.3, h: 0.9, fontSize: 15 });
    });
    const yS = 4.05;
    label(s, "How you legally own a piece of a house", M, yS, 8);
    const nodes = [["Neighbors", "14,400 tokens × $10 = $144,000"], ["House LLC", "1 token = 1 ownership unit"], ["The home", "The LLC holds the deed"]];
    const nw = 3.4, gap = (CW - 3 * nw) / 2;
    nodes.forEach((n, i) => {
      const x = M + i * (nw + gap);
      box(s, x, yS + 0.42, nw, 1.15, C.background2, n[0] + " node");
      txt(s, [{ text: n[0], options: { bold: true, color: HEX.navy, fontSize: 18, breakLine: true } }, { text: n[1], options: { fontSize: 14 } }], { x: x + 0.2, y: yS + 0.42, w: nw - 0.4, h: 1.15, valign: "middle", align: "center" });
      if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + nw + gap / 2 - 0.25, y: yS + 0.85, w: 0.5, h: 0.32, fill: { color: HEX.steel }, line: { type: "none" }, objectName: "flow arrow" });
    });
    source(s, "Illustrative pilot: one home in East Greensboro, $144,000 raise under SEC Regulation Crowdfunding. Planning estimates.");
    s.addNotes("SAY: \"OwnTheBlock lets about 1,250 neighbors, students, alumni and churches put in $10 to $2,000 each on their phones: $144,000 to buy and fix one house. Each $10 token is one unit of an LLC that owns the deed. Residents go first and no one can own more than 2%. A local family rents it with a path to buy it. Every owner votes on the rules and gets paid every month.\"\n\nIf asked why an LLC: people can't legally own 1/14,400th of a house, but an LLC can own the house and have thousands of members. Investors can't lose more than they put in. If the raise misses its goal, everyone is refunded automatically.");
  }

  // ============================================================ 4. Why blockchain
  {
    const s = slide("CONTENT", "Pitch", "03   Why blockchain");
    title(s, "Blockchain does two things a bank database can't: penny payouts and rules no one can quietly change");
    label(s, "1. Paying 1,440 owners $700 of rent each month", M, 1.95, 5.6);
    s.addChart(pres.charts.BAR, [{ name: "Monthly cost", labels: ["Bank transfers", "OwnTheBlock on Base"], values: [500, 14] }], {
      ...CHART, x: M - 0.1, y: 2.3, w: 5.6, h: 2.6, barDir: "bar", barGapWidthPct: 50,
      chartColors: [HEX.gray, HEX.green], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0', dataLabelFontBold: true, dataLabelFontSize: 18,
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 650, valAxisMinVal: 0,
    });
    txt(s, "Fees would eat most of a $0.49 payout. On Base, each claim costs under 1¢.", { x: M, y: 5.0, w: 5.4, h: 0.7, fontSize: 15 });
    const xT = 6.75, wT = W - M - xT;
    label(s, "2. Trust that doesn't depend on us", xT, 1.95, wT);
    const rows = [
      [th("What neighbors need"), th("OwnTheBlock on Base")],
      ["Rules no one can quietly change", "Only a 2/3 owner vote + 30-day wait"],
      ["Ownership stays local and fair", "Every transfer checks ID and the 2% cap"],
      ["Proof of where money went", "Every payment is public"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1], options: { bold: true, color: HEX.green } }] : r));
    s.addTable(rows, { ...TABLE, x: xT, y: 2.35, w: wT, colW: [wT / 2, wT / 2], rowH: [0.5, 0.9, 0.9, 0.9] });
    takeaway(s, "Thousands of tiny owners plus tamper-proof rules: exactly what a blockchain is built for.");
    source(s, "Bank cost uses ~$0.20–$0.50 per payment (midpoint shown); Base cost = measured gas per claim at typical Base fees.");
    s.addNotes(
      "WORTH 20 POINTS. Slow down.\n\nSAY: \"Why does this need a blockchain? Two reasons. First, the payments. A $100 owner earns 49 cents a month. A bank transfer to each of 1,440 owners costs 20 to 50 cents, so fees eat most of the payout. On Base, the manager makes one deposit and the contract splits it for everyone, for under a cent per claim. Second, trust. Whoever runs a normal database can change the rules. Our rent cap, ownership limits and local share are written into the code; changing them takes a two-thirds vote and a 30-day wait. And anyone can trace every dollar.\"\n\n" +
        "IF ASKED 'Why not a database?': \"A database can store the list. It can't make tiny payments cheap, and it can't stop its own operator from changing the rules.\""
    );
  }

  // ============================================================ 5. Proof
  {
    const s = slide("CONTENT", "Pitch", "04   Proof it works");
    title(s, "It's built: five smart contracts, 22 passing tests, and the full story run on a test blockchain");
    const kpis = [["5", "smart contracts"], ["22", "tests passing"], ["38", "transactions in the test run"], ["6", "rule-breaking attempts blocked"]];
    const kw = (CW - 3 * 0.25) / 4;
    kpis.forEach((k, i) => {
      const x = M + i * (kw + 0.25);
      box(s, x, 1.95, kw, 1.45, i === 3 ? C.accent1 : C.background2, "kpi " + i);
      txt(s, k[0], { x: x + 0.25, y: 2.05, w: kw - 0.4, h: 0.75, fontSize: 40, bold: true, fontFace: "Cambria", color: i === 3 ? HEX.gold : HEX.navy });
      txt(s, k[1], { x: x + 0.25, y: 2.8, w: kw - 0.4, h: 0.5, fontSize: 15, color: i === 3 ? HEX.white : HEX.ink });
    });
    const rows = [[th("What happened in the test run"), th("Result", "center")]].concat(
      [
        ["Ms. Jenkins invests $2,000 in the residents-first window", true],
        ["An out-of-town investor tries to buy before residents", false],
        ["One $700 rent deposit pays every owner", true],
        ["The manager tries a 10% rent increase (cap is 3%)", false],
      ].map(([l, ok]) => [{ text: l }, { text: ok ? "Done" : "Blocked by code", options: { bold: true, align: "center", color: ok ? HEX.green : HEX.brick } }]),
    );
    s.addTable(rows, { ...TABLE, x: M, y: 3.7, w: CW, colW: [CW - 2.6, 2.6], rowH: 0.45 });
    source(s, "Solidity 0.8.24 + OpenZeppelin 5 on a local test chain. Base Sepolia deployment next; independent audit before any real money.");
    s.addNotes("SAY: \"This isn't just a slide. We've written five smart contracts with 22 automated tests passing, and ran Ms. Jenkins' whole story on a test blockchain. The red rows matter most: the code refused an early sale, a 10% rent hike and a rushed rule change. Nobody, including us, can override it.\"\n\nBe precise: test chain, not real money.");
  }

  // ============================================================ 6. Innovation + impact
  {
    const s = slide("CONTENT", "Pitch", "05   Innovation & impact");
    title(s, "No one else keeps ownership local, puts the rules in code, and gives the tenant a path to own");
    const wL = 7.0;
    const Y = "●", P = "◐", N = "○";
    const feats = ["Small minimum", "Locals first", "Rules in code", "Path to own"];
    const data = [["Fundrise, Arrived", [Y, N, N, N]], ["RealT, Lofty", [Y, N, P, N]], ["Land trusts", [N, Y, P, P]], ["OwnTheBlock", [Y, Y, Y, Y]]];
    const fw = (wL - 2.4) / 4;
    const rows = [[th(""), ...feats.map((f) => ({ text: f, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, align: "center", fontSize: 13 } }))]].concat(
      data.map(([n, v], r) => {
        const us = r === data.length - 1;
        const fill = us ? { fill: { color: "E3EBF4" } } : {};
        return [{ text: n, options: { bold: true, color: HEX.navy, ...fill } }, ...v.map((m) => ({ text: m, options: { align: "center", fontSize: 20, color: m === N ? "AEB4BD" : us ? HEX.green : HEX.steel, ...fill } }))];
      }),
    );
    s.addTable(rows, { ...TABLE, x: M, y: 1.95, w: wL, colW: [2.4, ...Array(4).fill(fw)], rowH: [0.6, 0.62, 0.62, 0.62, 0.66] });
    txt(s, "●  yes    ◐  partly    ○  no", { x: M, y: 5.2, w: 4, h: 0.3, fontSize: 12, color: C.accent6 });
    const xR = M + wL + 0.45, wR = CW - wL - 0.45;
    label(s, "At 100 communities × 5 homes", xR, 1.95, wR);
    const big = [["$72M", "of homes owned by their neighborhoods"], ["$4.2M", "a year of rent staying local"], ["500", "families at capped rents"]];
    big.forEach((b, i) => {
      const y = 2.35 + i * 1.05;
      txt(s, b[0], { x: xR, y, w: 1.9, h: 0.75, fontSize: 32, bold: true, fontFace: "Cambria", color: i === 0 ? HEX.green : HEX.navy, valign: "middle" });
      txt(s, b[1], { x: xR + 1.95, y, w: wR - 1.95, h: 0.75, fontSize: 15, valign: "middle" });
    });
    takeaway(s, "Coinbase's mission is to increase economic freedom. Ours starts with the block you live on.");
    source(s, "Competitor features from public descriptions. Scale figures are targets, not forecasts.");
    s.addNotes("SAY: \"Others do pieces of this. Fundrise has small minimums but no community control; RealT and Lofty put homes on a blockchain, but owners are global. Nobody keeps ownership local, writes the community's rules into code, and gives the tenant a path to own. At 100 communities with 5 homes each, that's $72 million of homes owned by the neighborhoods around them and $4.2 million a year in rent staying local. It fits Coinbase's mission: increase economic freedom, starting with the block you live on.\"\n\nRubric: Innovation (15) + Benefits (15).");
  }

  // ============================================================ 7. Plan + budget
  {
    const s = slide("CONTENT", "Pitch", "06   Action plan & budget");
    title(s, "We prove one house in 18 months on a $180,000 pilot budget");
    const ph = [
      ["Done", "Prototype", "App + 5 tested contracts"],
      ["Months 0–3", "Set up", "Lawyer, security audit, steward"],
      ["Months 3–9", "First raise", "Find the house; raise $144K"],
      ["Months 9–18", "First payouts", "Rent it; houses 2 and 3"],
    ];
    const pw = CW / 4;
    s.addShape(pres.shapes.LINE, { x: M + 0.25, y: 2.2, w: CW - pw, h: 0, line: { color: HEX.line, width: 2 }, objectName: "timeline" });
    ph.forEach((p, i) => {
      const x = M + i * pw;
      s.addShape(pres.shapes.OVAL, { x, y: 1.95, w: 0.5, h: 0.5, fill: { color: i === 0 ? HEX.green : HEX.navy }, line: { type: "none" }, objectName: "milestone " + i });
      txt(s, i === 0 ? "✓" : String(i), { x, y: 1.95, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, p[0].toUpperCase(), { x, y: 2.6, w: pw - 0.3, h: 0.3, fontSize: 12, bold: true, color: i === 0 ? HEX.green : HEX.steel, charSpacing: 1 });
      txt(s, p[1], { x, y: 2.9, w: pw - 0.3, h: 0.4, fontSize: 19, bold: true, color: HEX.navy });
      txt(s, p[2], { x, y: 3.32, w: pw - 0.3, h: 0.6, fontSize: 15 });
    });
    label(s, "Where the $180,000 goes", M, 4.25, 8);
    s.addChart(pres.charts.BAR, [
      { name: "Team (part-time)", labels: ["Budget"], values: [65] },
      { name: "Securities lawyer", labels: ["Budget"], values: [35] },
      { name: "Security audit", labels: ["Budget"], values: [30] },
      { name: "Compliance & insurance", labels: ["Budget"], values: [26] },
      { name: "Outreach & app", labels: ["Budget"], values: [24] },
    ], {
      ...CHART, x: M - 0.1, y: 4.5, w: CW + 0.2, h: 1.55, barDir: "bar", barGrouping: "stacked", barGapWidthPct: 20,
      chartColors: [HEX.navy, HEX.steel, HEX.gold, "8FA9C8", HEX.green], showValue: true, dataLabelPosition: "ctr", dataLabelFormatCode: '"$"0"K"', dataLabelColor: HEX.white, dataLabelFontBold: true,
      valAxisHidden: true, catAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 180,
      showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.ink,
    });
    source(s, "Funded by grants ($50K), a CDFI/bank program ($50K) and impact angels ($80K). Each house is paid for by its own $144K raise, never this budget.");
    s.addNotes("SAY: \"Our plan proves one house in 18 months. Months 0–3: securities attorney, independent security audit, sign a community steward and a crowdfunding portal. Months 3–9: get a house from city surplus or an heirs'-property family and run the raise under SEC crowdfunding rules. Months 9–18: renovate, lease, start monthly payouts, then houses two and three. The pilot costs $180,000, mostly legal work, the audit and team stipends. Each house is paid for by its own raise, never this budget.\"\n\nRubric: Action Plan (20): objectives, resources, budget, timeline. Legal and security work comes BEFORE any real money.\nRevenue if asked: 2% of each raise ($2,880/house), 2% of rent, then licensing the platform to land trusts and cities.");
  }

  // ============================================================ 8. Risks + ask
  {
    const s = slide("CONTENT", "Pitch", "07   Risks & the ask");
    title(s, "We've planned for the hard parts");
    const wL = 7.5;
    const rows = [
      [th("Risk"), th("How we handle it")],
      ["Can't fill the raise", "Residents, students, alumni and churches; refunds if it misses"],
      ["Securities law", "Registered crowdfunding portal; one LLC per house"],
      ["Code bug or hack", "22 tests + independent audit before real money"],
      ["Repairs or vacancies", "15% repair cushion and a 10% reserve"],
    ].map((r, i) => (i ? [{ text: r[0], options: { bold: true, color: HEX.navy } }, { text: r[1] }] : r));
    s.addTable(rows, { ...TABLE, x: M, y: 1.95, w: wL, colW: [2.5, wL - 2.5], rowH: [0.5, 0.85, 0.85, 0.85, 0.85] });
    const xA = M + wL + 0.4, wA = CW - wL - 0.4;
    box(s, xA, 1.95, wA, 4.6, C.accent1, "ask panel");
    txt(s, "OUR ASK", { x: xA + 0.35, y: 2.2, w: wA - 0.7, h: 0.3, fontSize: 13, bold: true, charSpacing: 1.5, color: HEX.gold });
    const asks = [["A steward partner", "and a first house in Greensboro"], ["$180,000", "for the 18-month pilot"], ["Mentorship", "from Base for the audit and launch"]];
    asks.forEach((a, i) => {
      const y = 2.7 + i * 0.95;
      disc(s, i + 1, xA + 0.35, y, 0.48, HEX.gold);
      txt(s, [{ text: a[0], options: { bold: true, breakLine: true } }, { text: a[1], options: { fontSize: 13, color: HEX.ice } }], { x: xA + 0.98, y: y - 0.04, w: wA - 1.2, h: 0.85, fontSize: 17, color: C.background1 });
    });
    txt(s, "Fix the block.\nOwn the block.", { x: xA + 0.35, y: 5.35, w: wA - 0.7, h: 0.8, fontSize: 20, bold: true, italic: true, fontFace: "Cambria", color: HEX.white });
    txt(s, "Thank you", { x: xA + 0.35, y: 6.15, w: wA - 0.7, h: 0.35, fontSize: 14, color: HEX.ice });
    source(s, "Estimates, not guarantees: investors can lose money, and the app shows the downside as clearly as the upside.");
    s.addNotes(
      "SAY: \"Our biggest risks are filling the raise, securities law and code bugs. We handle them with refunds if the goal is missed, a registered crowdfunding portal, and an audit before any real money moves. Our ask: a steward partner, $180,000 for the pilot, and mentorship from Base. Ms. Jenkins doesn't have to leave. Fix the block. Own the block. Thank you.\"\n\n" +
        "Q&A one-liners:\n- Legal? Each house's LLC raises under Reg CF via a registered portal; 12-month lockup in code.\n- 49 cents is nothing? The impact is the house, its rent and its rising value staying in the neighborhood, and a tenant becoming an owner.\n- Fill $144K? 300 residents × $50, 400 students × $25, 540 alumni × $150, 19 churches/orgs × $2,000.\n- Revenue? 2% of each raise, 2% of rent, then platform licensing.\n- Gentrification? Residents buy first, rent is capped at 3%/yr in code, and the tenant can buy the home.\n- Home values fall? Bought below repaired value, no mortgage, a first-loss partner covers the first 10%.\n\nThe next 5 slides are the app demo: use them in Q&A (\"Here's what it looks like on your phone\")."
    );
  }

  // ============================================================ App demo images
  const demo = [
    ["1_Invest_from_10.png", "Welcome, Explore and a property page. Every house shows its photos, the real numbers and the risks before anyone invests."],
    ["2_Invest_in_3_taps.png", "Choose a property, pick an amount from $10, then follow every dollar on the Money Trail."],
    ["3_Get_paid_monthly.png", "Home works like a brokerage app: balance, gains over time, the homes you own, and rent income you claim with one tap."],
    ["4_Blockchain_you_can_check.png", "The Blockchain tab explains blockchain in plain English, then shows our 5 contracts and the real test-run transactions, including the 6 the code blocked."],
    ["5_Learn_and_simulate.png", "Built for first-time investors: practice in the Block Simulator, take 2-minute lessons, and see the impact on the neighborhood."],
  ];
  for (const [f, note] of demo) {
    const s = slide("IMAGE", "App demo");
    s.addImage({ path: path.join(DEMO, f), x: 0, y: 0, w: W, h: H, altText: "OwnTheBlock app demo: " + note });
    s.addNotes("APP DEMO (screens from the working app, pretend money).\n\nSAY: " + note);
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
