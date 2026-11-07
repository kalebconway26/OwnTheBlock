// OwnTheBlock pitch deck, "clean" edition: one idea per slide (Airbnb / Uber style), every rubric item covered,
// app demo images at the end. Run: NODE_PATH=./node_modules node clean.js out.pptx
const pptxgen = require("pptxgenjs");
const path = require("path");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fi = require("react-icons/fi");
const { applyTheme } = require("/home/kaleb/.claude/skills/synced/274981fa-adcd-4129-954d-21ad20077f36_650b4839-abbd-46e9-8a31-40481531fc9e/pptx/scripts/apply_theme.js");

const OUT = process.argv[2] || "OwnTheBlock_Pitch_Clean.pptx";
const photo = (k) => path.join("/home/kaleb/owntheblock/apps/web/public/photos", k + ".jpg");
const DEMO = "/mnt/c/Users/kaleb/Downloads/OwnTheBlock_App_Demo";
const phoneImg = (k) => path.join(DEMO, "phones", k + ".png");
const PHONE_RATIO = 1084 / 2128; // framed phone PNG width / height (includes shadow padding)

const HEX = { navy: "0B2341", steel: "4F7CAC", gold: "B38B2D", green: "2E7D5B", brick: "A23B2C", gray: "6B7280", ink: "1F2937", mist: "F1F4F8", white: "FFFFFF", line: "D5DAE1", ice: "C9D7E8" };
const THEME = {
  name: "OwnTheBlock Clean",
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
const W = 13.333, H = 7.5, M = 0.75;

// ---------------------------------------------------------------- icons (outline, Uber-style)
const cache = {};
async function icon(name, hex = HEX.navy) {
  const k = name + hex;
  if (!cache[k]) {
    const svg = renderToStaticMarkup(React.createElement(fi[name], { color: "#" + hex, size: 256, strokeWidth: 1.6 }));
    cache[k] = "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
  }
  return cache[k];
}

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "PLAIN",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.6, w: 7.5, h: 0.9, fontSize: 38, bold: true, color: C.accent1, valign: "bottom", margin: 0, align: "left" }, text: "" } },
  ],
  slideNumber: { x: W - 0.9, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6, align: "right", margin: 0 },
});
pres.defineSlideMaster({
  title: "DARK",
  background: { color: C.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.6, w: 7.5, h: 0.9, fontSize: 38, bold: true, color: C.background1, valign: "bottom", margin: 0, align: "left" }, text: "" } },
  ],
  slideNumber: { x: W - 0.9, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.background1, align: "right", margin: 0 },
});
pres.defineSlideMaster({ title: "IMAGE", background: { color: C.background1 }, objects: [] });

let section = "";
function slide(master, sec) {
  if (sec !== section) { pres.addSection({ title: sec }); section = sec; }
  return pres.addSlide({ masterName: master, sectionTitle: sec });
}
const title = (s, t) => s.addText(t, { placeholder: "title" });
const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 20, color: C.text1, valign: "top", ...o });
const sub = (s, t, w = 11.8) => txt(s, t, { x: M, y: 1.6, w, h: 0.5, fontSize: 20, color: HEX.steel });
const source = (s, t) => txt(s, t, { x: M, y: 6.95, w: 10.5, h: 0.3, fontSize: 10, italic: true, color: C.accent6 });
/** OwnTheBlock mark: four rounded blocks, bottom-right gold. */
function mark(s, x, y, size, light) {
  const c = size / 2 - 0.03;
  for (let i = 0; i < 4; i++)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + (i % 2) * (c + 0.06), y: y + Math.floor(i / 2) * (c + 0.06), w: c, h: c, rectRadius: c * 0.25, fill: { color: i === 3 ? HEX.gold : light ? HEX.white : HEX.navy }, line: { type: "none" }, objectName: "logo block" });
}
/** Icon + text row (Uber "Problem" style). `hl` is the highlighted phrase, drawn in color. */
async function iconRow(s, ic, before, hl, after, x, y, w, o = {}) {
  s.addImage({ data: await icon(ic, o.iconHex || HEX.navy), x, y, w: 0.7, h: 0.7, altText: ic });
  const runs = [];
  if (before) runs.push({ text: before });
  if (hl) runs.push({ text: hl, options: { bold: true, color: o.hlHex || HEX.steel } });
  if (after) runs.push({ text: after });
  txt(s, runs, { x: x + 1.05, y: y - 0.1, w: w - 1.05, h: 0.95, fontSize: o.fontSize || 21, valign: "middle", color: o.textHex || HEX.ink });
}
/** Icon over a short caption (Airbnb "Solution" style). */
async function iconCol(s, ic, t, cx, y, w, o = {}) {
  s.addImage({ data: await icon(ic, o.iconHex || HEX.navy), x: cx - 0.45, y, w: 0.9, h: 0.9, altText: ic });
  txt(s, t, { x: cx - w / 2, y: y + 1.1, w, h: 1.0, fontSize: o.fontSize || 19, align: "center", color: o.textHex || HEX.ink });
}
const phone = (s, k, x, y, h) => s.addImage({ path: phoneImg(k), x, y, w: h * PHONE_RATIO, h, altText: "OwnTheBlock app screen: " + k });
const halfPhoto = (s, k, side = "right", w = 5.4) => {
  const x = side === "right" ? W - w : 0;
  s.addImage({ path: photo(k), x, y: 0, w, h: H, sizing: { type: "cover", w, h: H }, altText: "Neighborhood photo" });
};
const bigStat = (s, n, label, x, y, w, color = HEX.navy, labelHex = HEX.ink) => {
  txt(s, n, { x, y, w, h: 1.0, fontSize: 54, bold: true, fontFace: "Cambria", color });
  txt(s, label, { x, y: y + 1.0, w, h: 0.8, fontSize: 18, color: labelHex });
};

(async () => {
  // ============================================================ 1. Cover (Airbnb style)
  {
    const s = slide("PLAIN", "Pitch");
    s.addImage({ path: photo("street"), x: 0, y: 0, w: 6.4, h: H, sizing: { type: "cover", w: 6.4, h: H }, altText: "A residential street" });
    mark(s, 7.2, 1.6, 0.75);
    txt(s, "OwnTheBlock", { x: 8.15, y: 1.6, w: 4.5, h: 0.75, fontSize: 30, bold: true, color: HEX.navy, valign: "middle" });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.05, y: 3.88, w: 0.7, h: 0.7, fill: { color: HEX.gold }, line: { type: "none" }, objectName: "gold block" });
    txt(s, "Own the homes\non your block", { x: 7.2, y: 3.55, w: 5.6, h: 1.35, fontSize: 36, bold: true, fontFace: "Cambria", color: HEX.navy, valign: "middle" });
    txt(s, "Neighbors pool $10 at a time to buy, fix and own local homes, with the rules run on the blockchain.", { x: 7.2, y: 5.05, w: 5.4, h: 1.0, fontSize: 18, color: HEX.gray });
    txt(s, "Kaleb Conway   ·   Own Your Future Challenge   ·   Nov 10, 2026", { x: 7.2, y: 6.6, w: 5.6, h: 0.4, fontSize: 13, color: HEX.gray });
    s.addNotes(
      "TIMING: about 5:00 across 16 slides, so most slides are 15–25 seconds. Spend the most time on slides 6–7 (blockchain) and 13–14 (plan and budget). The app demo images at the end are for Q&A.\n\n" +
        "SAY: \"Walk two blocks from A&T and count how many homes are owned by people who live there. I'm Kaleb, and this is OwnTheBlock.\""
    );
  }

  // ============================================================ 2. Problem (Uber style)
  {
    const s = slide("PLAIN", "Pitch");
    halfPhoto(s, "demo-ct", "right", 5.2);
    title(s, "Problem");
    await iconRow(s, "FiHome", "Black homeownership is ", "45%", ", vs 74% for white households.", M, 2.2, 6.8);
    await iconRow(s, "FiLock", "Empty houses sit for years: heirs live away and ", "banks won't lend", " on them.", M, 3.6, 6.8);
    await iconRow(s, "FiTrendingUp", "Outside investors buy them, and ", "the rent leaves", " the neighborhood.", M, 5.0, 6.8);
    source(s, "Source: U.S. Census Bureau, Housing Vacancies and Homeownership Survey (rounded).");
    s.addNotes("SAY: \"Meet Ms. Jenkins: forty years on the same block in East Greensboro. The house next door is boarded up; the heirs live out of state and no bank will lend on it. Then the cash offers start. Black homeownership is 45%, white is 74%, and homes are how families build wealth. Her neighbors would chip in, but there's no way to turn $10 here and $50 there into owning a house.\"\n\nRubric: Problem Articulation (5): who, root cause, impact.");
  }

  // ============================================================ 3. Why now
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Why now");
    sub(s, "For the first time, the tools exist to make this legal and cheap.");
    const cols = [
      ["FiUsers", "Anyone can invest small amounts in a local deal (SEC Regulation Crowdfunding)."],
      ["FiZap", "Blockchain payments on Base cost less than 1¢."],
      ["FiShield", "Digital dollars (USDC) are now federally regulated (GENIUS Act, 2025)."],
    ];
    for (let i = 0; i < 3; i++) await iconCol(s, cols[i][0], cols[i][1], 2.4 + i * 4.25, 3.2, 3.6);
    s.addNotes("SAY: \"Why now? Three things changed. Crowdfunding rules let everyday people invest small amounts in a local deal. Blockchain payments on Base cost less than a cent. And digital dollars are now federally regulated. Ten years ago this wasn't possible.\"");
  }

  // ============================================================ 4. Solution (Airbnb style)
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Solution");
    sub(s, "Neighbors buy the house together, on their phones.");
    const cols = [
      ["FiSmartphone", "Pool $10 at a time. Residents get first access."],
      ["FiFileText", "Each $10 token is one piece of the LLC that owns the house."],
      ["FiDollarSign", "Get paid rent every month and vote on the rules."],
    ];
    for (let i = 0; i < 3; i++) await iconCol(s, cols[i][0], cols[i][1], 2.4 + i * 4.25, 2.35, 3.5);
    s.addImage({ path: photo("sample-st"), x: 0, y: 4.85, w: W, h: H - 4.85, sizing: { type: "cover", w: W, h: H - 4.85 }, altText: "A restored house" });
    s.addNotes("SAY: \"OwnTheBlock lets about 1,250 neighbors, students, alumni and churches put in $10 to $2,000 each to raise $144,000: enough to buy and fix one house. Each $10 token is one unit of an LLC that owns the deed. A local family rents it, every owner gets paid monthly and votes on the rules, and the tenant can buy the home.\"\n\nIf asked why an LLC: people can't legally own 1/14,400th of a house, but an LLC can own the house and have thousands of members.");
  }

  // ============================================================ 5. How it works (Uber style, phones)
  {
    const s = slide("PLAIN", "Pitch");
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 5.6, h: H, fill: { color: HEX.mist }, line: { type: "none" }, objectName: "phone panel" });
    txt(s, "How it works", { x: M, y: 0.6, w: 4.5, h: 0.9, fontSize: 38, bold: true, fontFace: "Cambria", color: HEX.navy, valign: "bottom" });
    phone(s, "04-property", 0.45, 1.75, 5.0);
    phone(s, "02-home", 2.55, 2.15, 5.0);
    const steps = [
      ["FiSearch" in fi ? "FiSearch" : "FiMapPin", "Pick a home", " on your block."],
      ["FiDollarSign", "Invest from $10.", " Refunded if the raise misses."],
      ["FiTool", "Local contractors fix it;", " a local family rents it."],
      ["FiTrendingUp", "Get paid rent monthly.", " The tenant can buy it in years 3–7."],
    ];
    for (let i = 0; i < 4; i++) await iconRow(s, steps[i][0], "", steps[i][1], steps[i][2], 6.3, 1.5 + i * 1.3, 6.4, { fontSize: 20 });
    s.addNotes("SAY: \"Here's the app. You pick a home, invest from $10, and if the raise doesn't hit its goal everyone is refunded automatically. Local contractors fix it, a local family rents it, and you get your share of the rent every month.\"");
  }

  // ============================================================ 6. Why blockchain 1: payments
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Why blockchain: payments");
    sub(s, "Paying 1,440 owners their share of $700 rent, every month.");
    s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.6, w: 5.5, h: 3.4, fill: { color: HEX.mist }, line: { type: "none" }, objectName: "bank card" });
    txt(s, "Bank transfers", { x: M + 0.4, y: 2.85, w: 4.8, h: 0.5, fontSize: 20, bold: true, color: HEX.gray });
    txt(s, "~$500", { x: M + 0.4, y: 3.4, w: 4.8, h: 1.2, fontSize: 66, bold: true, fontFace: "Cambria", color: HEX.gray });
    txt(s, "a month in fees. Most of each $0.49 payout is gone.", { x: M + 0.4, y: 4.7, w: 4.7, h: 1.0, fontSize: 18, color: HEX.ink });
    s.addShape(pres.shapes.RECTANGLE, { x: 7.1, y: 2.6, w: 5.5, h: 3.4, fill: { color: HEX.navy }, line: { type: "none" }, objectName: "base card" });
    txt(s, "OwnTheBlock on Base", { x: 7.5, y: 2.85, w: 4.8, h: 0.5, fontSize: 20, bold: true, color: HEX.ice });
    txt(s, "~$14", { x: 7.5, y: 3.4, w: 4.8, h: 1.2, fontSize: 66, bold: true, fontFace: "Cambria", color: "E5C46B" });
    txt(s, "a month. One deposit pays everyone; under 1¢ per owner.", { x: 7.5, y: 4.7, w: 4.7, h: 1.0, fontSize: 18, color: HEX.white });
    source(s, "Bank: ~$0.20–$0.50 per payment (midpoint). Base: measured gas per claim at typical Base fees.");
    s.addNotes("WORTH 20 POINTS (with the next slide). Slow down.\n\nSAY: \"Why does this need a blockchain? Reason one: the payments. A $100 owner earns 49 cents a month. Paying 1,440 owners by bank transfer costs about $500 a month in fees, which eats the payout. On Base, the manager makes one deposit and the contract splits it for everyone, for about $14 total.\"");
  }

  // ============================================================ 7. Why blockchain 2: trust
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Why blockchain: trust");
    sub(s, "The rules live in code, not in our database.", 7.5);
    await iconRow(s, "FiLock", "Rent can only rise ", "3% a year.", " The code won't allow more.", M, 2.55, 7.0);
    await iconRow(s, "FiUsers", "Changing a rule takes a ", "2/3 owner vote", " and a 30-day wait.", M, 3.85, 7.0);
    await iconRow(s, "FiEye", "Every payment is ", "public.", " Anyone can check where the money went.", M, 5.15, 7.0);
    phone(s, "07-chain-use", 8.75, 0.35, 6.8);
    s.addNotes("SAY: \"Reason two: trust. In a normal company, whoever runs the database can change the rules. Here the rent cap, ownership limits and local share are written into smart contracts. Changing them takes a two-thirds vote of owners and a 30-day wait, and every payment is public. For a neighborhood that's been burned before, that's the whole point.\"\n\nIF ASKED 'Why not a database?': \"A database can store the list. It can't make tiny payments cheap, and it can't stop its own operator from changing the rules.\"");
  }

  // ============================================================ 8. Traction: it's built
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "It's already built");
    sub(s, "A working app and smart contracts, tested end to end.");
    const st = [["5", "smart contracts"], ["22", "tests passing"], ["38", "test-run transactions"], ["6", "rule-breaks blocked"]];
    st.forEach((k, i) => bigStat(s, k[0], k[1], M + i * 3.05, 2.9, 2.8, i === 3 ? HEX.gold : HEX.navy));
    txt(s, [{ text: "Blocked by the code: ", options: { bold: true, color: HEX.brick } }, { text: "an early sale, a 10% rent hike, and a rushed rule change." }], { x: M, y: 5.3, w: 11.5, h: 0.6, fontSize: 20 });
    source(s, "Run on a local test blockchain. Base Sepolia deployment next; independent security audit before any real money.");
    s.addNotes("SAY: \"This isn't just an idea. The app works, we wrote five smart contracts with 22 automated tests passing, and we ran Ms. Jenkins' whole story on a test blockchain. The code refused an early sale, a 10% rent hike and a rushed rule change. Nobody, including us, can override it.\"\n\nIf you have any interest data (survey responses, sign-ups), say it here: that's the 'traction' investors look for.");
  }

  // ============================================================ 9. Market opportunity
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Market opportunity");
    sub(s, "Start with one house in Greensboro. Grow through HBCU communities.");
    const st = [["1 home", "Greensboro pilot\n(first 18 months)"], ["25 homes", "5 cities\n(years 2–3)"], ["500 homes", "100 HBCU communities\n× 5 homes"]];
    st.forEach((k, i) => {
      const x = M + i * 4.0;
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.6, w: 3.6, h: 2.6, fill: { color: i === 2 ? HEX.navy : HEX.mist }, line: { type: "none" }, objectName: "stage " + i });
      txt(s, k[0], { x: x + 0.35, y: 2.85, w: 3.0, h: 1.0, fontSize: 40, bold: true, fontFace: "Cambria", color: i === 2 ? "E5C46B" : HEX.navy });
      txt(s, k[1], { x: x + 0.35, y: 3.95, w: 3.0, h: 1.0, fontSize: 18, color: i === 2 ? HEX.white : HEX.ink });
      if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 3.62, y: 3.7, w: 0.35, h: 0.35, fill: { color: HEX.steel }, line: { type: "none" }, objectName: "arrow" });
    });
    txt(s, [{ text: "At 500 homes: ", options: { bold: true, color: HEX.navy } }, { text: "$72M of homes owned by their neighborhoods, and $4.2M a year of rent staying local." }], { x: M, y: 5.55, w: 11.8, h: 0.6, fontSize: 20 });
    source(s, "500 × $144,000 = $72M; 500 × $700 × 12 = $4.2M. Targets, not forecasts.");
    s.addNotes("SAY: \"We start with one house in Greensboro, grow to 25 homes in five cities, and the goal is 100 HBCU communities with five homes each. That's $72 million of homes owned by the people who live around them, and $4.2 million a year in rent staying in those neighborhoods.\"\n\nRubric: Benefits (15): scalability.");
  }

  // ============================================================ 10. Competition
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Competition");
    sub(s, "Others do pieces. No one does all four.");
    const Y = "●", P = "◐", N = "○";
    const feats = ["Invest from $10", "Locals first", "Rules in code", "Tenant can buy"];
    const data = [["Fundrise, Arrived", [Y, N, N, N]], ["RealT, Lofty", [Y, N, P, N]], ["Community land trusts", [N, Y, P, P]], ["OwnTheBlock", [Y, Y, Y, Y]]];
    const th = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.navy }, align: "center", fontSize: 17 } });
    const rows = [[th(""), ...feats.map(th)]].concat(
      data.map(([n, v], r) => {
        const us = r === data.length - 1;
        const fill = us ? { fill: { color: "E3EBF4" } } : {};
        return [{ text: n, options: { bold: true, color: HEX.navy, fontSize: 18, ...fill } }, ...v.map((m) => ({ text: m, options: { align: "center", fontSize: 26, color: m === N ? "AEB4BD" : us ? HEX.green : HEX.steel, ...fill } }))];
      }),
    );
    s.addTable(rows, { x: M, y: 2.5, w: 11.8, colW: [3.8, 2, 2, 2, 2], rowH: [0.7, 0.75, 0.75, 0.75, 0.8], border: { type: "solid", pt: 0.5, color: HEX.line }, valign: "middle", fontFace: "Arial", margin: [0.05, 0.15, 0.05, 0.15] });
    txt(s, "●  yes     ◐  partly     ○  no", { x: M, y: 6.4, w: 5, h: 0.35, fontSize: 14, color: HEX.gray });
    source(s, "Based on each company's public descriptions.");
    s.addNotes("SAY: \"Others do pieces of this. Fundrise and Arrived let you invest small amounts, but from anywhere into homes anywhere. RealT and Lofty put homes on a blockchain, but the owners are global. Land trusts keep homes affordable, but residents can't invest small amounts. Nobody keeps ownership local, puts the rules in code, and gives the tenant a path to own.\"\n\nRubric: Innovation (15). Don't say 'no one has ever done this'; say 'no one combines these four.'");
  }

  // ============================================================ 11. Business model
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "How we make money");
    sub(s, "Small fees per house, then licensing the platform.");
    const cols = [
      ["FiPercent", "2% of each raise\n($2,880 per house)"],
      ["FiHome", "2% of monthly rent\n(~$336 per house a year)"],
      ["FiLayers", "License the platform to land trusts, nonprofits and cities"],
    ];
    for (let i = 0; i < 3; i++) await iconCol(s, cols[i][0], cols[i][1], 2.4 + i * 4.25, 3.0, 3.6, { fontSize: 20 });
    txt(s, "Investors' money for the house never pays for the company.", { x: M, y: 5.8, w: 11.8, h: 0.5, fontSize: 18, italic: true, color: HEX.gray, align: "center" });
    s.addNotes("SAY: \"We earn 2% of each raise and 2% of rent. Fees alone need a few hundred homes to cover a team, so the scale plan is licensing the platform to land trusts, community development nonprofits and cities that already own properties.\"");
  }

  // ============================================================ 12. Impact (benefits)
  {
    const s = slide("PLAIN", "Pitch");
    halfPhoto(s, "porch", "right", 5.2);
    title(s, "Who wins");
    await iconRow(s, "FiHome", "", "Residents", " become owners of their own block.", M, 2.0, 6.8);
    await iconRow(s, "FiKey", "", "The tenant", " gets capped rent and a path to buy the home.", M, 3.3, 6.8);
    await iconRow(s, "FiBookOpen", "", "Students", " make a first investment and learn how ownership works.", M, 4.6, 6.8);
    s.addShape(pres.shapes.RECTANGLE, { x: M, y: 5.95, w: 6.9, h: 0.85, fill: { color: HEX.navy }, line: { type: "none" }, objectName: "mission" });
    txt(s, [{ text: "Coinbase's mission: ", options: { bold: true, color: "E5C46B" } }, { text: "increase economic freedom. Ours starts on your block.", options: { color: HEX.white } }], { x: M + 0.3, y: 5.95, w: 6.4, h: 0.85, fontSize: 17, valign: "middle" });
    s.addNotes("SAY: \"Who wins? Residents become owners. The tenant gets capped rent and a path to buy the home. Students make their first investment and learn how ownership works. And the heirs get a fair price. It fits Coinbase's mission to increase economic freedom, starting on your own block.\"\n\nRubric: Benefits (15): social impact + Coinbase mission.");
  }

  // ============================================================ 13. Team & partners (why us)
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Why us");
    sub(s, "Built by an HBCU student, for HBCU neighborhoods.");
    s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.5, w: 5.4, h: 3.6, fill: { color: HEX.mist }, line: { type: "none" }, objectName: "founder card" });
    s.addImage({ data: await icon("FiUser" in fi ? "FiUser" : "FiUsers"), x: M + 0.4, y: 2.8, w: 0.8, h: 0.8, altText: "founder" });
    txt(s, "Kaleb Conway", { x: M + 0.4, y: 3.75, w: 4.6, h: 0.5, fontSize: 24, bold: true, color: HEX.navy });
    txt(s, "Founder · Finance student\nBuilt the financial model, the smart contracts and the app", { x: M + 0.4, y: 4.3, w: 4.6, h: 1.4, fontSize: 18 });
    txt(s, "Partners we're lining up", { x: 6.85, y: 2.5, w: 5.5, h: 0.45, fontSize: 18, bold: true, color: HEX.steel });
    const p = [["FiHeart", "A community steward", " (church, association or land trust)"], ["FiMapPin", "City & county", " surplus homes"], ["FiBriefcase", "A CDFI or bank", " to cover early losses"], ["FiGlobe", "Base", " grants and mentorship"]];
    for (let i = 0; i < 4; i++) await iconRow(s, p[i][0], "", p[i][1], p[i][2], 6.85, 3.1 + i * 0.85, 5.8, { fontSize: 17 });
    source(s, "Partners are targets, not yet signed. Advisors to recruit: securities attorney, Greensboro broker, CPA.");
    s.addNotes("FILL IN: add your school, year, and any teammates or advisors. One line of credibility each.\n\nSAY: \"I'm a finance student at an HBCU. I built the financial model, the smart contracts and the app myself. To launch, we're lining up a community steward, the city's surplus-home program, a CDFI to cover early losses, and Base for grants and mentorship.\"\n\nBe honest that partners are targets.");
  }

  // ============================================================ 14. Roadmap (action plan: objectives + timeline)
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "The plan");
    sub(s, "Prove one house end to end in 18 months.");
    const ph = [["Done", "Prototype", "App + tested contracts"], ["Months 0–3", "Set up", "Lawyer, security audit, steward"], ["Months 3–9", "First raise", "Find the house, raise $144K"], ["Months 9–18", "First payouts", "Rent it; start 2 more"]];
    const pw = 11.8 / 4;
    s.addShape(pres.shapes.LINE, { x: M + 0.3, y: 3.05, w: 11.8 - pw, h: 0, line: { color: HEX.line, width: 2.5 }, objectName: "timeline" });
    ph.forEach((p, i) => {
      const x = M + i * pw;
      s.addShape(pres.shapes.OVAL, { x, y: 2.75, w: 0.6, h: 0.6, fill: { color: i === 0 ? HEX.green : HEX.navy }, line: { type: "none" }, objectName: "milestone " + i });
      txt(s, i === 0 ? "✓" : String(i), { x, y: 2.75, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: HEX.white, align: "center", valign: "middle" });
      txt(s, p[0].toUpperCase(), { x, y: 3.6, w: pw - 0.3, h: 0.35, fontSize: 14, bold: true, color: i === 0 ? HEX.green : HEX.steel, charSpacing: 1 });
      txt(s, p[1], { x, y: 4.0, w: pw - 0.3, h: 0.55, fontSize: 26, bold: true, fontFace: "Cambria", color: HEX.navy });
      txt(s, p[2], { x, y: 4.6, w: pw - 0.3, h: 0.9, fontSize: 18 });
    });
    txt(s, "Real money only moves after a lawyer signs off and the code passes an independent audit.", { x: M, y: 5.9, w: 11.8, h: 0.5, fontSize: 18, italic: true, color: HEX.gray });
    s.addNotes("SAY: \"The plan proves one house in 18 months. First three months: securities attorney, independent security audit, and sign a community steward. Months three to nine: get a house from city surplus or an heirs'-property family and run the raise. Months nine to eighteen: renovate, lease, start monthly payouts, then houses two and three.\"\n\nRubric: Action Plan (20): objectives + timeline.");
  }

  // ============================================================ 15. Budget (resources)
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Budget: $180,000");
    sub(s, "What the 18-month pilot costs, and who funds it.");
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Uses", labels: ["Team (part-time)", "Securities lawyer", "Security audit", "Compliance", "Outreach & app"], values: [65, 35, 30, 26, 24] }], {
      x: M - 0.2, y: 2.25, w: 6.2, h: 4.4, holeSize: 58, chartColors: [HEX.navy, HEX.steel, HEX.gold, "8FA9C8", HEX.green],
      showValue: true, showPercent: false, dataLabelFormatCode: '"$"0"K"', dataLabelColor: "FFFFFF", dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt",
      showLegend: true, legendPos: "r", legendFontSize: 14, legendFontFace: "+mn-lt", legendColor: HEX.ink,
    });
    txt(s, "Funded by", { x: 7.6, y: 2.5, w: 5, h: 0.45, fontSize: 18, bold: true, color: HEX.steel });
    const f = [["$50K", "grants & competitions"], ["$50K", "a CDFI or bank program"], ["$80K", "impact angels"]];
    f.forEach((k, i) => {
      txt(s, k[0], { x: 7.6, y: 3.05 + i * 0.95, w: 1.7, h: 0.8, fontSize: 34, bold: true, fontFace: "Cambria", color: HEX.navy, valign: "middle" });
      txt(s, k[1], { x: 9.35, y: 3.05 + i * 0.95, w: 3.4, h: 0.8, fontSize: 18, valign: "middle" });
    });
    txt(s, "Each house is paid for by its own $144K raise, never this budget.", { x: 7.6, y: 6.0, w: 5.2, h: 0.6, fontSize: 15, italic: true, color: HEX.gray });
    s.addNotes("SAY: \"The pilot costs $180,000, mostly the team, the securities lawyer and the security audit. It's funded by grants like Base Builder grants, a CDFI or bank community program, and impact angels. The houses themselves are paid for by their own raises.\"\n\nRubric: Action Plan (20): resources + budget. Ranges if asked: Reg CF counsel $20–50K; audit $15–50K.");
  }

  // ============================================================ 16. Risks (feasibility)
  {
    const s = slide("PLAIN", "Pitch");
    title(s, "Risks we've planned for");
    const r = [
      ["FiUsers", "Can't fill the raise → ", "refunds if it misses;", " residents, students, alumni and churches all invest"],
      ["FiFileText", "Securities law → ", "registered crowdfunding portal,", " one LLC per house"],
      ["FiShield", "Code bug or hack → ", "independent audit", " before any real money"],
      ["FiTool", "Repairs or vacancies → ", "15% repair cushion", " and a 10% reserve"],
    ];
    for (let i = 0; i < 4; i++) await iconRow(s, r[i][0], r[i][1], r[i][2], r[i][3], M, 1.95 + i * 1.2, 11.6, { fontSize: 20 });
    source(s, "Estimates, not guarantees: investors can lose money, and the app shows the downside as clearly as the upside.");
    s.addNotes("SAY: \"We've planned for the hard parts. If a raise doesn't fill, everyone is refunded. We use a registered crowdfunding portal and one LLC per house. No real money moves before an independent security audit. And every house keeps a repair cushion and a reserve.\"\n\nRubric: Feasibility (15).\nIf asked 'what if home values fall?': bought below repaired value, no mortgage, and a first-loss partner covers the first 10%.");
  }

  // ============================================================ 17. The ask
  {
    const s = slide("DARK", "Pitch");
    s.addImage({ path: photo("sample-st-alt"), x: 8.3, y: 0, w: W - 8.3, h: H, sizing: { type: "cover", w: W - 8.3, h: H }, altText: "A restored home" });
    title(s, "Our ask");
    const a = [["1", "A steward partner", "and a first house in Greensboro"], ["2", "$180,000", "for the 18-month pilot"], ["3", "Mentorship from Base", "for the audit and launch"]];
    a.forEach((k, i) => {
      const y = 2.1 + i * 1.25;
      s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.65, h: 0.65, fill: { color: HEX.gold }, line: { type: "none" }, objectName: "ask " + k[0] });
      txt(s, k[0], { x: M, y, w: 0.65, h: 0.65, fontSize: 20, bold: true, color: HEX.navy, align: "center", valign: "middle", fontFace: "Cambria" });
      txt(s, [{ text: k[1], options: { bold: true, fontSize: 26, breakLine: true } }, { text: k[2], options: { fontSize: 18, color: HEX.ice } }], { x: M + 0.95, y: y - 0.1, w: 6.4, h: 1.05, color: HEX.white });
    });
    txt(s, "Fix the block. Own the block.", { x: M, y: 5.95, w: 7.4, h: 0.7, fontSize: 30, bold: true, italic: true, fontFace: "Cambria", color: "E5C46B" });
    s.addNotes(
      "SAY: \"Our ask: a steward partner and a first house in Greensboro, $180,000 for the pilot, and mentorship from Base for the audit and launch. Ms. Jenkins doesn't have to leave. Fix the block. Own the block. Thank you.\"\n\n" +
        "Q&A one-liners:\n- Legal? Each house's LLC raises under Reg CF via a registered portal; 12-month lockup in code.\n- 49 cents is nothing? The impact is the house, its rent and its rising value staying in the neighborhood, and a tenant becoming an owner.\n- Fill $144K? 300 residents × $50, 400 students × $25, 540 alumni × $150, 19 churches/orgs × $2,000.\n- Gentrification? Residents buy first, rent is capped at 3%/yr in code, and the tenant can buy the home.\n- Home values fall? Bought below repaired value, no mortgage, a first-loss partner covers the first 10%.\n\nThe next slides are the app demo: use them in Q&A (\"Here's what it looks like on your phone\")."
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
