// OwnTheBlock story + breakdown deck. Run: NODE_PATH=./node_modules node build.js
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const path = require("path");
const { applyTheme } = require("/home/kaleb/.claude/skills/synced/274981fa-adcd-4129-954d-21ad20077f36_650b4839-abbd-46e9-8a31-40481531fc9e/pptx/scripts/apply_theme.js");

const PHOTOS = "/home/kaleb/owntheblock/apps/web/public/photos";
const photo = (k) => path.join(PHOTOS, k + ".jpg");
const OUT = process.argv[2] || "OwnTheBlock_Story_Deck.pptx";
const fs = require("fs");
const QRCode = require("qrcode");

const HEX = { green: "1F5D3A", gold: "C8962E", brick: "A33A2B", blue: "2B5F8A", taupe: "7A6A55", moss: "8DB360", ink: "1D1D1B", sand: "F3EFE6", white: "FFFFFF", muted: "5E5B55", line: "DDD6C8" };
const THEME = {
  name: "OwnTheBlock",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.green, lt2: HEX.sand, accent1: HEX.green, accent2: HEX.gold, accent3: HEX.brick, accent4: HEX.blue, accent5: HEX.taupe, accent6: HEX.moss, hlink: HEX.blue, folHlink: HEX.taupe },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "OwnTheBlock";
pres.author = "Kaleb";
const C = pres.SchemeColor;
const W = 13.333, H = 7.5, M = 0.6;

// ---------------------------------------------------------------- icons
const iconCache = {};
async function icon(name, hex = "FFFFFF") {
  const key = name + hex;
  if (iconCache[key]) return iconCache[key];
  const svg = renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
}
/** Icon in a filled circle. */
async function badge(slide, name, x, y, d = 0.8, fill = C.accent1, iconHex = "FFFFFF", label = "icon") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: label + " circle" });
  const p = d * 0.26;
  slide.addImage({ data: await icon(name, iconHex), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: label });
}

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "OTB_TITLE",
  background: { color: C.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.8, y: 2.2, w: 8.5, h: 1.5, fontSize: 60, bold: true, color: C.background1, valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.8, w: 8.5, h: 1.6, fontSize: 24, color: C.background1, valign: "top", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "OTB_SECTION",
  background: { color: C.accent1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.8, y: 2.6, w: 11.7, h: 1.4, fontSize: 48, bold: true, color: C.background1, valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.15, w: 11.7, h: 1.0, fontSize: 22, color: C.accent2, valign: "top", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontSize: 11, color: C.background1, align: "right" },
});
pres.defineSlideMaster({
  title: "OTB_STORY",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", align: "left", x: 7.0, y: 0.8, w: 5.7, h: 1.5, fontSize: 38, bold: true, color: C.accent1, valign: "bottom", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 7.0, y: 2.6, w: 5.7, h: 3.9, fontSize: 20, color: C.text1, valign: "top", margin: 0, paraSpaceAfter: 12 }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontSize: 11, color: C.text2, align: "right" },
});
pres.defineSlideMaster({
  title: "OTB_CONTENT",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", align: "left", x: M, y: 0.55, w: W - 2 * M, h: 0.8, fontSize: 30, bold: true, color: C.accent1, valign: "top", margin: 0 }, text: "" } },
    { text: { text: "OwnTheBlock", options: { x: M, y: 6.95, w: 3, h: 0.35, fontSize: 11, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontSize: 11, color: C.accent5, align: "right" },
});

let section = "";
let APPX = false; // once true, every slide goes in the Appendix section
function slide(master, sectionTitle) {
  if (APPX) sectionTitle = "Appendix";
  if (sectionTitle && sectionTitle !== section) {
    pres.addSection({ title: sectionTitle });
    section = sectionTitle;
  }
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  // section label above every content title, so the panel always knows where they are
  if (master === "OTB_CONTENT") s.addText(section.toUpperCase(), { isTextBox: true, x: M, y: 0.24, w: 6, h: 0.28, margin: 0, fontSize: 12, bold: true, charSpacing: 2, color: C.accent2, objectName: "section label" });
  return s;
}
const title = (s, t) => s.addText(t, { placeholder: "title" });
const body = (s, t) => s.addText(t, { placeholder: "body" });
const txt = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 16, color: C.text1, valign: "top", ...o });
const card = (s, x, y, w, h, fill = C.background2, name = "card") =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, objectName: name });
const arrow = (s, x, y, w, color = C.accent2, name = "arrow") =>
  s.addShape(pres.shapes.RIGHT_ARROW, { x, y, w, h: 0.42, fill: { color }, line: { type: "none" }, objectName: name });
const leftPhoto = (s, key, alt) => s.addImage({ path: photo(key), x: 0, y: 0, w: 6.4, h: H, sizing: { type: "cover", w: 6.4, h: H }, altText: alt });
/** Key-takeaway band across the bottom of a content slide. */
const banner = (s, t, y) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: W - 2 * M, h: 0.62, rectRadius: 0.1, fill: { color: "F5E9CF" }, line: { type: "none" }, objectName: "takeaway band" });
  s.addText(t, { isTextBox: true, x: M + 0.3, y, w: W - 2 * M - 0.6, h: 0.62, margin: 0, fontSize: 15, bold: true, italic: true, color: C.accent1, valign: "middle", objectName: "takeaway" });
};
const story = (s, paras) => body(s, paras.map((p, i) => ({ text: p, options: { breakLine: i < paras.length - 1 } })));

// ---------------------------------------------------------------- on-chain demo results
const DEP = "/home/kaleb/owntheblock/contracts/deployments";
const depFile = ["baseSepolia", "hardhat"].map((n) => path.join(DEP, n + ".json")).find((f) => fs.existsSync(f));
const dep = JSON.parse(fs.readFileSync(depFile, "utf8"));
const EXPLORER = "https://sepolia.basescan.org";
const pick = [
  ["Ms. Jenkins commits", "Ms. Jenkins commits $2,000 in the residents' window"],
  ["Alumna in Atlanta tries", "Alumna in Atlanta tries to invest early"],
  ["Raise closes", "Goal met: money to the house, tokens created"],
  ["Steward co-signs", "Steward co-signs the $3,000 roof payment"],
  ["Manager deposits $700", "$700 rent deposit splits across every owner"],
  ["jasmine claims", "Jasmine claims her payout"],
  ["Jasmine tries to sell", "Jasmine tries to sell during the 12-month lockup"],
  ["Manager tries to raise rent", "Manager tries a 10% rent increase"],
  ["Rule change executed", "Rule change before the 30-day wait"],
];
const DEMO = {
  live: dep.network === "baseSepolia",
  contracts: 5,
  tests: 22,
  txCount: dep.transactions.length,
  token: dep.contracts.token,
  payoutCost: "<1¢",
  claimGas: dep.gas.claimAverage,
  highlights: pick.map(([key, label]) => {
    const t = dep.transactions.find((x) => x.step.startsWith(key));
    const live = dep.network === "baseSepolia";
    return { label, ok: t.status === "ok", proof: live && t.hash ? t.hash.slice(0, 8) + "…" + t.hash.slice(-4) : "test chain" };
  }),
  qr: null,
};

(async () => {
  if (DEMO.live) DEMO.qr = "image/png;base64," + (await QRCode.toBuffer(`${EXPLORER}/address/${DEMO.token}`, { width: 600, margin: 1, color: { dark: "#1F5D3A", light: "#F3EFE6" } })).toString("base64");
  // =============================================================== M1. Title
  {
    const s = slide("OTB_TITLE", "The problem");
    s.addImage({ path: photo("street"), x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H }, altText: "A neighborhood street" });
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: C.accent1, transparency: 15 }, line: { type: "none" }, objectName: "green overlay" });
    title(s, "OwnTheBlock");
    body(s, [
      { text: "Fix the block. Own the block.", options: { bold: true, breakLine: true } },
      { text: "Neighbors pool $10 at a time to own the homes on their street, with the rules and payouts run by smart contracts on Base.", options: { fontSize: 18 } },
    ]);
    txt(s, "Own Your Future case competition  ·  Greensboro, NC pilot", { x: 0.8, y: 6.6, w: 9, h: 0.4, fontSize: 14, color: C.background1 });
    s.addNotes(
      "TIMING GUIDE (10-minute version): problem 2 min, solution 1 min, blockchain 3 min, plan and risks 3 min, close 1 min. If you only have 5 minutes, skip slides 5, 11, 14 and 17 and say the details are in the appendix.\n\n" +
        "OPEN WITH THE HOOK (20 seconds). Say: \"Walk two blocks from A&T and count how many homes are owned by people who live there.\" Pause. \"I'm going to tell you about one of those blocks, and how we change its ending.\"\n\n" +
        "One-sentence answer to 'what is it?': a phone app that lets neighbors pool small amounts, from $10, to buy, fix and own the homes on their own block, with ownership, payouts and community rules enforced by smart contracts on Base."
    );
  }

  // =============================================================== M2. Ms. Jenkins
  {
    const s = slide("OTB_STORY", "The problem");
    leftPhoto(s, "demo-ct", "Boarded-up houses on a residential street");
    title(s, "Meet Ms. Jenkins");
    story(s, [
      "Forty years on the same block in East Greensboro.",
      "Her neighbor passed away. The heirs live out of state, can't afford repairs, and no bank will lend on a boarded-up house.",
      "So it sits empty, and every home on the block loses value, including hers.",
    ]);
    txt(s, "Composite character based on common situations.", { x: 7.0, y: 6.55, w: 5.2, h: 0.35, fontSize: 11, color: C.accent5, italic: true });
    s.addNotes(
      "Tell this slowly, like a story. Make the judges picture her.\n\n" +
        "Heirs' property: when an owner dies without a will, every heir inherits a share. All of them must agree before the house can be sold, fixed or borrowed against, which is why these houses sit empty for years.\n\n" +
        "If asked: Ms. Jenkins is a composite built from situations that are common in historically Black neighborhoods near HBCUs."
    );
  }

  // =============================================================== M3. The offer
  {
    const s = slide("OTB_STORY", "The problem");
    leftPhoto(s, "example-ave", "A two-unit house");
    title(s, "Then the cash offers start");
    story(s, [
      "An investor from out of town offers the family cash.",
      "Rents go up, and the profit leaves the neighborhood with every rent check.",
      "Her neighbors would gladly chip in. But there's no way to turn $10 here and $50 there into owning a house.",
    ]);
    s.addNotes(
      "The villain isn't a person; it's a pattern. Outside capital decides the neighborhood's future because it's the only capital that can act.\n\n" +
        "Line to use: \"Why should a developer in another city have more say than a woman who has paid taxes here for 40 years?\"\n\n" +
        "Transition: \"This isn't one block. Here's the pattern.\""
    );
  }

  // =============================================================== M4. Problem defined
  {
    const s = slide("OTB_CONTENT", "The problem");
    title(s, "The problem: small money can't become shared ownership");
    card(s, M, 1.55, 4.7, 4.25, C.accent1, "stat card");
    txt(s, "U.S. homeownership rate", { x: M + 0.35, y: 1.8, w: 4, h: 0.35, fontSize: 15, color: C.background1 });
    txt(s, "45%", { x: M + 0.35, y: 2.2, w: 2, h: 1.0, fontSize: 56, bold: true, color: C.accent2, fontFace: "Cambria" });
    txt(s, "Black households", { x: M + 0.35, y: 3.2, w: 2, h: 0.35, fontSize: 14, color: C.background1 });
    txt(s, "74%", { x: M + 2.45, y: 2.2, w: 2, h: 1.0, fontSize: 56, bold: true, color: C.background1, fontFace: "Cambria" });
    txt(s, "White households", { x: M + 2.45, y: 3.2, w: 2, h: 0.35, fontSize: 14, color: C.background1 });
    txt(s, "A home is the largest source of wealth for most families, so a 29-point ownership gap becomes a wealth gap that's passed down.", { x: M + 0.35, y: 3.8, w: 4.0, h: 1.2, fontSize: 14, color: C.background1 });
    txt(s, "Source: U.S. Census Bureau, Housing Vacancies and Homeownership Survey (check the latest quarter).", { x: M + 0.35, y: 5.1, w: 4.0, h: 0.55, fontSize: 10, italic: true, color: C.background1 });
    const rows = [
      ["FaUsers", "Who it hurts", "Long-time residents of Black neighborhoods near HBCUs, like East Greensboro around A&T and Bennett."],
      ["FaLock", "Why it happens", "Ownership takes a down payment, credit and a big check. Pooling many small checks was too costly to run."],
      ["FaDoorOpen", "What it costs", "Homes and rent profits go to outside owners; residents get priced out of the value they built."],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 1.55 + i * 1.45;
      await badge(s, rows[i][0], 5.75, y + 0.05, 0.75, C.accent1, "FFFFFF", rows[i][1]);
      txt(s, rows[i][1], { x: 6.7, y, w: 6.0, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
      txt(s, rows[i][2], { x: 6.7, y: y + 0.42, w: 6.0, h: 0.85, fontSize: 15 });
    }
    banner(s, "Problem statement: neighbors have the will and small amounts of money, but no way to pool it into ownership, so outsiders decide what happens to their block.", 6.0);
    s.addNotes(
      "This slide is the 5-point Problem Articulation score. Say the problem statement at the bottom out loud, word for word.\n\n" +
        "The three critical elements judges look for: WHO is affected, WHY it happens (the root cause), and WHAT it costs (the impact).\n\n" +
        "Check the latest Census figures before presenting (they're around 45% and 74%). BEFORE THE COMPETITION, add one Greensboro number if you can find it, for example the count of vacant or condemned homes in East Greensboro from the city's code-enforcement data, or the share of recent sales in the 27405/27406 zip codes bought by investors. One local number makes the problem much more concrete."
    );
  }

  // =============================================================== M5. Why existing options fail
  {
    const s = slide("OTB_CONTENT", "The problem");
    title(s, "Why today's options don't fix the house next door");
    const cols = [
      ["FaUniversity", "Banks", "Need a down payment, good credit and a livable house. The heirs have none of those."],
      ["FaChartLine", "$100 real estate apps", "Arrived, Fundrise and others pool small investors, but from anywhere, into homes anywhere. The block gets no say."],
      ["FaUsers", "Neighbors on their own", "Would chip in $10 to $500, but tracking and paying 1,000 tiny owners each month costs more than the payouts."],
    ];
    for (let i = 0; i < 3; i++) {
      const x = M + i * 4.1;
      card(s, x, 1.6, 3.8, 3.9, C.background2, cols[i][1] + " card");
      await badge(s, cols[i][0], x + 0.35, 1.9, 0.85, i === 2 ? C.accent2 : C.accent5, "FFFFFF", cols[i][1]);
      txt(s, cols[i][1], { x: x + 0.35, y: 2.95, w: 3.1, h: 0.5, fontSize: 20, bold: true, color: C.accent1 });
      txt(s, cols[i][2], { x: x + 0.35, y: 3.5, w: 3.1, h: 1.9, fontSize: 15 });
    }
    banner(s, "The missing piece: a cheap, trustworthy way for a whole neighborhood to own, govern and get paid together.", 5.85);
    s.addNotes(
      "The money exists in the neighborhood, in small amounts. Nothing lets small amounts combine into local ownership with local control.\n\n" +
        "The third column is the opening for blockchain: the cost of tracking and paying thousands of tiny owners. Say: \"Hold that thought. It's exactly what blockchain fixes.\"\n\n" +
        "Transition: \"So what if the neighbors bought it together?\""
    );
  }

  // =============================================================== M6. The solution
  {
    const s = slide("OTB_STORY", "The solution");
    leftPhoto(s, "sample-st", "A restored house");
    title(s, "What if the neighbors bought it together?");
    story(s, [
      "About 1,250 neighbors, students, alumni and churches put in $10 to $2,000 each on their phones: $144,000.",
      "The heirs get a fair price. Local contractors fix the house. A local family rents it, with a path to buy it.",
      "Every neighbor who chipped in owns a piece, votes on the rules, and gets paid every month.",
    ]);
    txt(s, "Ms. Jenkins doesn't have to leave. The block is theirs.", { x: 7.0, y: 6.35, w: 5.7, h: 0.5, fontSize: 17, italic: true, bold: true, color: C.accent2 });
    s.addNotes(
      "The turning point. Let it land.\n\n" +
        "$144,000 covers everything: the house at its as-is appraisal ($90,000), repairs ($35,000) plus a 15% cushion, closing, a repair reserve, and legal and platform costs. Details in the appendix.\n\n" +
        "Who invests: residents get first access for 7 days, then students and alumni, then any verified U.S. investor. No one person can own more than 2%.\n\n" +
        "Transition: \"Here's how it works.\""
    );
  }

  // =============================================================== M7. How it works
  {
    const s = slide("OTB_CONTENT", "The solution");
    title(s, "How it works: four steps, one house");
    const steps = [
      ["FaHandHoldingUsd", "Raise", "Neighbors buy $10 tokens in the app. If the goal isn't met, everyone is refunded automatically.", "Weeks 10–20"],
      ["FaHardHat", "Buy and fix", "The house's LLC buys at the as-is appraisal. Contractors are paid in inspected stages.", "Months 5–9"],
      ["FaCoins", "Rent and pay", "A licensed manager rents to a local family. Net rent is paid to every owner monthly.", "Month 10 on"],
      ["FaVoteYea", "Govern and exit", "Owners vote on the rules. The tenant can buy the home in years 3–7.", "Ongoing"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.08;
      card(s, x, 1.6, 2.85, 3.55, C.background2, steps[i][1] + " card");
      await badge(s, steps[i][0], x + 0.3, 1.85, 0.8, C.accent1, "FFFFFF", steps[i][1]);
      txt(s, String(i + 1), { x: x + 2.1, y: 1.85, w: 0.5, h: 0.6, fontSize: 30, bold: true, color: C.accent2, fontFace: "Cambria", align: "right" });
      txt(s, steps[i][1], { x: x + 0.3, y: 2.8, w: 2.4, h: 0.45, fontSize: 19, bold: true, color: C.accent1 });
      txt(s, steps[i][2], { x: x + 0.3, y: 3.3, w: 2.35, h: 1.3, fontSize: 14 });
      txt(s, steps[i][3], { x: x + 0.3, y: 4.65, w: 2.35, h: 0.35, fontSize: 12, bold: true, color: C.accent5 });
      if (i < 3) arrow(s, x + 2.88, 3.2, 0.18, C.accent2, "step arrow " + i);
    }
    // legal structure strip
    const strip = [
      ["FaUsers", "Neighbors hold tokens"],
      ["FaFileContract", "1 token = 1 unit of the house's LLC"],
      ["FaHome", "The LLC owns the deed"],
    ];
    card(s, M, 5.4, W - 2 * M, 1.3, C.accent1, "structure strip");
    for (let i = 0; i < 3; i++) {
      const x = M + 0.35 + i * 4.05;
      await badge(s, strip[i][0], x, 5.68, 0.72, C.accent2, "FFFFFF", strip[i][1]);
      txt(s, strip[i][1], { x: x + 0.88, y: 5.68, w: 2.95, h: 0.72, fontSize: 16, bold: true, color: C.background1, valign: "middle" });
    }
    s.addNotes(
      "THE CORE LEGAL IDEA (bottom strip): people can't legally own 1/14,400th of a house, but an LLC can own the house and have thousands of members. Each token is one membership unit of that LLC. LLC ownership is standard U.S. law, and investors can't lose more than they put in.\n\n" +
        "OwnTheBlock manages the LLC. A local steward (neighborhood association, church, land trust or the city) holds a seat and must co-sign every payment.\n\n" +
        "Timeline: about 9–10 months from finding a house to the first payout. The full 10-step version is in the appendix."
    );
  }

  // =============================================================== M8. Why blockchain
  {
    const s = slide("OTB_CONTENT", "Why blockchain");
    title(s, "Why this only works on a blockchain");
    const hdr = (t, fill, color) => ({ text: t, options: { bold: true, color, fill: { color: fill } } });
    const rows = [
      [hdr("What the neighborhood needs", HEX.green, HEX.white), hdr("Database + bank transfers", HEX.taupe, HEX.white), hdr("OwnTheBlock on Base", HEX.gold, HEX.white)],
      ["Pay 1,440 owners $0.49 each, monthly", "ACH fees of roughly $0.20–$0.50 per payment eat most of the payout", "One deposit splits it for everyone; each claim costs under 1¢, and we cover it"],
      ["Rules the company can't quietly change", "Whoever runs the database can edit the rules", "Changing the rent cap takes a 2/3 owner vote and a 30-day wait, enforced by code"],
      ["Keep ownership local and fair", "Staff check by hand, after the fact", "Every transfer is checked automatically: ID, 2% cap, local share"],
      ["Prove where every dollar went", "Trust our monthly PDF", "Anyone can trace each payment on a public ledger"],
      ["Two keys on the house's money", "Bank signers, invisible to owners", "Manager proposes, steward must co-sign, visible to all"],
      ["A tenant's rent history she owns", "Stays in the landlord's files", "On-time rent recorded on-chain, portable to a lender"],
    ].map((r, i) => (i === 0 ? r : [{ text: r[0], options: { bold: true, color: HEX.green } }, { text: r[1], options: { color: HEX.muted } }, { text: r[2], options: { bold: true } }]));
    s.addTable(rows, { x: M, y: 1.5, w: W - 2 * M, colW: [3.5, 4.0, W - 2 * M - 7.5], fontSize: 14, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: [0.45, 0.66, 0.66, 0.6, 0.6, 0.6, 0.6], valign: "middle", margin: [0.03, 0.12, 0.03, 0.12] });
    banner(s, "Small, frequent, many-owner payments plus rules nobody can quietly change: that's what blockchains are uniquely good at.", 5.95);
    s.addNotes(
      "THIS SLIDE IS WORTH THE MOST POINTS (20). Slow down. Lead with row 1.\n\n" +
        "ROW 1 is the killer argument. Jasmine's share of a month's rent is 49 cents. Paying 1,440 owners by ACH costs roughly $0.20–$0.50 per payment (get a quote from a bank to cite a real number), so $300–$700 of a $700 payout would go to fees. Checks are worse. On Base, the manager makes ONE deposit and the contract divides it among every owner. Each owner's claim costs a fraction of a cent, and our paymaster covers it, so owners pay nothing. Our demo measured it: see the next slide.\n\n" +
        "ROW 2: in a normal company, the people who run the database can change the rules. Here, the rent cap, per-person cap and local share live in the contract; they only change by a 2/3 vote of owners plus a 30-day timelock, and the steward can veto rent-cap changes.\n\n" +
        "ROWS 3–6: checks on every transfer, a public money trail, two-key spending, and a portable rent history.\n\n" +
        "IF ASKED 'Why not just a database?': \"A database could store the list. It can't make tiny payments cheap, and it can't stop its own operator from changing the rules. Those two things are the whole trust problem for a neighborhood that's been burned before.\"\n\n" +
        "IF ASKED 'Aren't you still using a bank and a transfer agent?': \"Yes, for the parts the law requires: an escrow agent holds money during a raise and a transfer agent keeps the official list, which mirrors the chain. Blockchain runs everything after that: ownership rules, payouts, votes and the money trail.\""
    );
  }

  // =============================================================== M9. The contracts
  {
    const s = slide("OTB_CONTENT", "Why blockchain");
    title(s, "Five smart contracts, built and tested");
    const cs = [
      ["FaIdCard", "IdentityRegistry", "Who passed the ID check, with no personal data on-chain"],
      ["FaHandHoldingUsd", "Raise", "Residents first, 48-hour cancel right, refund if the goal is missed"],
      ["FaCoins", "BlockToken", "LLC units with the Charter rules, monthly payouts and the rent cap"],
      ["FaKey", "Treasury", "Every repair payment needs the manager and the steward"],
      ["FaVoteYea", "CharterGovernor", "2/3 vote, 30-day wait, residents count 1.5×"],
    ];
    for (let i = 0; i < 5; i++) {
      const x = M + i * 2.46;
      card(s, x, 1.6, 2.28, 3.1, i === 2 ? C.accent1 : C.background2, cs[i][1] + " card");
      await badge(s, cs[i][0], x + 0.25, 1.85, 0.75, i === 2 ? C.accent2 : C.accent1, "FFFFFF", cs[i][1]);
      txt(s, cs[i][1], { x: x + 0.25, y: 2.75, w: 1.95, h: 0.45, fontSize: 15, bold: true, color: i === 2 ? C.background1 : C.accent1 });
      txt(s, cs[i][2], { x: x + 0.25, y: 3.25, w: 1.85, h: 1.35, fontSize: 13, color: i === 2 ? C.background1 : C.text1 });
    }
    const stats = [
      [String(DEMO.contracts), "contracts written in Solidity"],
      [String(DEMO.tests), "automated tests passing"],
      [String(DEMO.txCount), DEMO.live ? "real transactions on Base Sepolia" : "transactions in the end-to-end demo"],
      [DEMO.payoutCost, "cost of one owner's payout claim"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.08;
      txt(s, stats[i][0], { x, y: 4.95, w: 2.85, h: 0.8, fontSize: 40, bold: true, color: i === 3 ? C.accent2 : C.accent1, fontFace: "Cambria" });
      txt(s, stats[i][1], { x, y: 5.75, w: 2.85, h: 0.5, fontSize: 14 });
    }
    txt(s, DEMO.live ? `Live on Base Sepolia (test network). Contract: ${DEMO.token}` : "Code: owntheblock/contracts  ·  Solidity 0.8.24, OpenZeppelin 5, Hardhat", { x: M, y: 6.35, w: W - 2 * M, h: 0.35, fontSize: 11, color: C.accent5, italic: true });
    s.addNotes(
      "This proves it's real, not a slide. Name each contract and the one rule it enforces.\n\n" +
        "IdentityRegistry: a verification partner checks ID; the contract only stores 'verified', 'local resident' and an anonymous person number, so caps apply per person even across several wallets.\n" +
        "Raise: commitments in test USDC, residents-only window, cancel for a full refund until 48 hours before the deadline (a Regulation Crowdfunding rule), all-or-nothing: goal met means money goes to the house's treasury and tokens are created; goal missed means automatic refunds.\n" +
        "BlockToken: each token is one LLC unit. Every transfer checks ID, the 2% per-person cap, the local-ownership floor and the 12-month legal lockup. The manager deposits net rent once and every owner can claim their share. Rent can rise at most 3% once a year.\n" +
        "Treasury: the manager proposes a payment with the invoice's fingerprint; only the steward can approve it.\n" +
        "CharterGovernor: votes use tokens held when the proposal was made (no buying votes mid-vote), residents count 1.5×, 2/3 supermajority, 30-day wait, steward veto on the rent cap and reserve.\n\n" +
        "Payout cost: measured gas for one claim in our demo, priced at typical Base fees. The platform's paymaster covers it, so owners pay $0.\n\n" +
        "In production, a regulated escrow agent holds investor dollars during a raise; the Raise contract mirrors those commitments. On the test network it holds test USDC itself so the full flow can be shown."
    );
  }

  // =============================================================== M10. Proof on-chain
  {
    const s = slide("OTB_CONTENT", "Why blockchain");
    title(s, DEMO.live ? "The story, live on Base: every step is a public transaction" : "The story, run end to end on the blockchain");
    const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.green } } });
    const rows = [[hdr("What happened"), hdr("Result"), hdr("Proof")]].concat(
      DEMO.highlights.map((h) => [
        { text: h.label },
        { text: h.ok ? "Done" : "Refused by the code", options: { bold: true, color: h.ok ? HEX.green : HEX.brick } },
        { text: h.proof, options: { fontSize: 11, color: HEX.muted, fontFace: "Courier New" } },
      ]),
    );
    s.addTable(rows, { x: M, y: 1.5, w: 8.4, colW: [4.6, 1.95, 1.85], fontSize: 13, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: 0.42, valign: "middle", margin: [0.02, 0.1, 0.02, 0.1] });
    card(s, 9.35, 1.5, 3.38, 5.05, C.background2, "qr card");
    if (DEMO.qr) {
      s.addImage({ data: DEMO.qr, x: 9.69, y: 1.8, w: 2.7, h: 2.7, altText: "QR code linking to the contract on the block explorer" });
      txt(s, "Scan to see every transaction", { x: 9.55, y: 4.65, w: 2.98, h: 0.4, fontSize: 15, bold: true, color: C.accent1, align: "center" });
      txt(s, "Base Sepolia block explorer", { x: 9.55, y: 5.05, w: 2.98, h: 0.35, fontSize: 12, align: "center", color: C.accent5 });
    } else {
      await badge(s, "FaLink", 10.54, 2.1, 1.0, C.accent1, "FFFFFF", "chain");
      txt(s, "QR code to the live contracts appears here after the Base Sepolia deployment", { x: 9.6, y: 3.4, w: 2.9, h: 1.3, fontSize: 14, align: "center", color: C.accent5 });
    }
    txt(s, "The red rows matter most: the code refused to break the community's rules.", { x: 9.6, y: 5.55, w: 2.9, h: 0.9, fontSize: 13, italic: true, bold: true, color: C.accent3, align: "center" });
    s.addNotes(
      "If you can, switch to the block explorer here and click one transaction. Ten seconds of a real transaction beats any slide.\n\n" +
        "Walk the story: Ms. Jenkins and her neighbors commit during the resident window; the alumna in Atlanta is refused until it opens; the raise closes and tokens are created; a roof payment needs the steward's signature; one rent deposit pays every owner; then the code refuses a sale during the lockup, a 10% rent increase, and a rule change before the 30-day wait.\n\n" +
        "Refused transactions still appear on the explorer as 'failed', which is the point: nobody, including us, can break the rules.\n\n" +
        "Full list of transactions with links: contracts/deployments/baseSepolia.md (or hardhat.md for the local run)."
    );
  }

  // =============================================================== M11. Built on Coinbase
  {
    const s = slide("OTB_CONTENT", "Why blockchain");
    title(s, "Built on Coinbase's stack, invisible to the user");
    const tiles = [
      ["FaLink", "Base", "Low fees make 49-cent payouts possible", "Built"],
      ["FaDollarSign", "USDC", "Payouts in digital dollars, not a volatile coin", "Built (test USDC)"],
      ["FaFingerprint", "Smart Wallet", "Sign in with Face ID; no seed phrase to lose", "Next 90 days"],
      ["FaGasPump", "Paymaster", "We pay the network fees; owners never need crypto", "Next 90 days"],
      ["FaExchangeAlt", "Onramp and Offramp", "Fund from and cash out to a bank account", "Next 90 days"],
      ["FaIdCard", "Coinbase Verifications", "A reusable on-chain ID check", "Evaluating"],
    ];
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = M + col * 4.1, y = 1.55 + row * 1.75;
      card(s, x, y, 3.85, 1.55, C.background2, tiles[i][1] + " tile");
      await badge(s, tiles[i][0], x + 0.25, y + 0.3, 0.7, C.accent1, "FFFFFF", tiles[i][1]);
      txt(s, tiles[i][1], { x: x + 1.1, y: y + 0.18, w: 2.6, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
      txt(s, tiles[i][2], { x: x + 1.1, y: y + 0.58, w: 2.6, h: 0.6, fontSize: 13 });
      const built = tiles[i][3].startsWith("Built");
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 1.1, y: y + 1.17, w: 1.55, h: 0.27, rectRadius: 0.13, fill: { color: built ? C.accent1 : C.accent2 }, line: { type: "none" }, objectName: tiles[i][1] + " status" });
      txt(s, tiles[i][3], { x: x + 1.1, y: y + 1.17, w: 1.55, h: 0.27, fontSize: 10, bold: true, color: C.background1, align: "center", valign: "middle" });
    }
    card(s, M, 5.15, W - 2 * M, 1.4, C.accent1, "mission card");
    txt(s, [
      { text: "Coinbase's mission: ", options: { color: C.accent2, bold: true } },
      { text: "increase economic freedom in the world.", options: { color: C.background1, bold: true, italic: true, breakLine: true } },
      { text: "Ours starts with the block you live on: the freedom to own where you live, from $10.", options: { color: C.background1 } },
    ], { x: M + 0.4, y: 5.3, w: W - 2 * M - 0.8, h: 1.1, fontSize: 18, valign: "middle" });
    s.addNotes(
      "Benefits are scored partly on 'alignment with Coinbase's mission'. Say the mission out loud: \"increase economic freedom in the world.\"\n\n" +
        "Be precise about status: Base and the contracts are built and running on the Base test network; USDC is mocked with test USDC. Smart Wallet (passkey login), the paymaster (we pay gas), and Onramp/Offramp are the next 90 days of work (Milestone 4 in the build plan). Coinbase Verifications is an on-chain attestation that a wallet passed Coinbase's ID check; we're evaluating it as one of our verification options.\n\n" +
        "The user never sees crypto: balances show in dollars, login is Face ID, there are no fees and no seed phrases. Someone like Ms. Jenkins can use it."
    );
  }

  // =============================================================== M12. The numbers
  {
    const s = slide("OTB_CONTENT", "The solution");
    title(s, "The numbers for one house");
    const hdr = (t, al = "left") => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.green }, align: al } });
    const rows = [
      [hdr("Where the $144,000 goes"), hdr("Amount", "right")],
      ["Buy the house (as-is appraisal)", "$90,000"],
      ["Repairs + 15% safety cushion", "$40,250"],
      ["Closing costs and repair reserve", "$5,110"],
      ["Legal, CPA review, crowdfunding portal", "$5,760"],
      ["OwnTheBlock raise fee (2%)", "$2,880"],
      [{ text: "Total: 14,400 tokens at $10", options: { bold: true } }, { text: "$144,000", options: { bold: true } }],
    ].map((r) => r.map((c, j) => (typeof c === "string" ? { text: c, options: { align: j ? "right" : "left" } } : { ...c, options: { align: j ? "right" : "left", ...c.options } })));
    s.addTable(rows, { x: M, y: 1.55, w: 6.6, colW: [4.9, 1.7], fontSize: 15, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: 0.5, valign: "middle", margin: [0.03, 0.12, 0.03, 0.12] });
    const st = [
      ["$150,000", "worth after repairs: $10.63 behind each $10 token on day one"],
      ["$700 / mo", "net rent to owners after every bill: Jasmine's $100 earns $0.49 a month"],
      ["~8.7% / yr", "estimated total return over 5 years (cash + exit), not guaranteed"],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 1.55 + i * 1.45;
      card(s, 7.6, y, 5.13, 1.3, i === 2 ? C.accent1 : C.background2, "stat " + i);
      txt(s, st[i][0], { x: 7.85, y: y + 0.15, w: 2.5, h: 1.0, fontSize: 28, bold: true, color: i === 2 ? C.accent2 : C.accent1, fontFace: "Cambria", valign: "middle" });
      txt(s, st[i][1], { x: 10.3, y: y + 0.15, w: 2.3, h: 1.0, fontSize: 12, color: i === 2 ? C.background1 : C.text1, valign: "middle" });
    }
    banner(s, "We rescue distressed houses because that's where value is created: about 8.5% a year, versus about 3.5% buying at full price.", 6.0);
    s.addNotes(
      "Judges with finance backgrounds will check this. Every real cost is in the budget.\n\n" +
        "Net rent: $1,400 rent minus vacancy (5%), management (8%), repair reserve (10%), platform fee (2%), taxes and insurance (~$270) and admin (~$80) = $700 a month = $8,400 a year = 5.8% cash yield. The rest of the return comes at the exit when the tenant buys or the house is sold.\n\n" +
        "Jasmine: $100 = 10 tokens. $700 / 14,400 tokens = 4.9¢ per token per month = $0.49. After 5 years at 3% appreciation: about $116 from the exit + $29 in payouts = about $145 (~8.7% a year). Downside: a 25% drop in value is roughly break-even; bigger shocks are losses.\n\n" +
        "Why distressed: buying a $132,000 house at full price plus raise costs makes a $175,500 raise; each token starts with only $8.55 of value and returns ~3.5%, below a savings account. Buying an eyesore at its as-is value and fixing it starts each token at $10.63. The mission and the math point the same way. Full charts are in the appendix."
    );
  }

  // =============================================================== M13. Competitors / innovation
  {
    const s = slide("OTB_CONTENT", "What's new");
    title(s, "What's new: others do pieces; no one does the whole block");
    const Y = "✓", P = "◐", N = "–";
    const feats = ["On a blockchain", "Small minimum", "Neighbors first", "Community rules in code", "Tenant path to own", "Rescues eyesores"];
    const data = [
      ["Arrived, Fundrise", [N, Y, N, N, N, N]],
      ["RealT, Lofty", [Y, Y, N, P, N, N]],
      ["Community Investment Trust (Portland)", [N, Y, Y, P, N, N]],
      ["Community land trusts", [N, N, Y, P, P, P]],
      ["OwnTheBlock", [Y, Y, Y, Y, Y, Y]],
    ];
    const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.green }, align: "center", fontSize: 12 } });
    const rows = [[{ text: "", options: { fill: { color: HEX.green } } }, ...feats.map(hdr)]].concat(
      data.map(([name, v], r) => {
        const us = r === data.length - 1;
        const fill = us ? { fill: { color: "F5E9CF" } } : {};
        return [
          { text: name, options: { bold: true, color: us ? HEX.green : HEX.ink, ...fill } },
          ...v.map((m) => ({ text: m, options: { align: "center", fontSize: 20, bold: true, color: m === Y ? HEX.green : m === P ? HEX.gold : "B5AD9E", ...fill } })),
        ];
      }),
    );
    s.addTable(rows, { x: M, y: 1.55, w: W - 2 * M, colW: [3.5, ...Array(6).fill((W - 2 * M - 3.5) / 6)], fontSize: 15, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: [0.62, 0.6, 0.6, 0.6, 0.6, 0.66], valign: "middle", margin: [0.03, 0.1, 0.03, 0.1] });
    txt(s, "✓ yes   ◐ partly   – no.  Based on public descriptions; verify before presenting.", { x: M, y: 5.45, w: 8, h: 0.3, fontSize: 11, italic: true, color: C.accent5 });
    banner(s, "The innovation: tokenized real estate turned inward, so a neighborhood owns itself, with its own rules written into the code.", 5.95);
    s.addNotes(
      "Name the competitors before the judges do. It shows you did the research.\n\n" +
        "Arrived and Fundrise: $10–$100 real estate investing, no blockchain, investors anywhere buy homes anywhere, no community control.\n" +
        "RealT and Lofty: tokenized rental homes on blockchains with small minimums. Owners are global; Lofty token holders can vote on property decisions (partly), but nothing keeps ownership local or protects tenants.\n" +
        "Community Investment Trust (Portland, Oregon): neighbors invest $10–$100 a month in a local commercial building. Closest to us in spirit, but no blockchain, commercial only, and run by one organization.\n" +
        "Community land trusts: keep homes affordable long-term, but residents can't invest small amounts and there's no on-chain transparency.\n\n" +
        "Our new combination: (1) residents-first ownership with per-person caps and a local floor enforced on every transfer; (2) a Community Charter that only a supermajority can change; (3) a lease-purchase path so the tenant becomes the owner; (4) a deal pipeline focused on distressed and heirs' property.\n\n" +
        "Double-check each company's current features before presenting; these products change."
    );
  }

  // =============================================================== M14. Impact
  {
    const s = slide("OTB_CONTENT", "Impact");
    title(s, "Who wins, and what it adds up to");
    const ppl = [
      ["FaHome", "Ms. Jenkins", "Stays, and becomes an owner of her block"],
      ["FaGraduationCap", "Jasmine, A&T student", "Her first investment, from $10, with lessons first"],
      ["FaKey", "Tasha, the tenant", "Capped rent and a path to buy the home"],
      ["FaHandshake", "The heirs", "A fair price, and the option to keep a stake"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.08;
      card(s, x, 1.55, 2.85, 2.2, C.background2, ppl[i][1] + " card");
      await badge(s, ppl[i][0], x + 0.25, 1.78, 0.7, C.accent1, "FFFFFF", ppl[i][1]);
      txt(s, ppl[i][1], { x: x + 0.25, y: 2.58, w: 2.45, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
      txt(s, ppl[i][2], { x: x + 0.25, y: 2.98, w: 2.45, h: 0.7, fontSize: 13 });
    }
    txt(s, "At scale: 100 communities × 5 homes (target)", { x: M, y: 4.0, w: 8, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
    const big = [
      ["500", "families housed at capped rents"],
      ["$72M", "of homes owned by the people who live around them"],
      ["$4.2M", "a year in rent income staying in the neighborhood"],
      ["600,000+", "ownership stakes, most of them first investments"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.08;
      txt(s, big[i][0], { x, y: 4.45, w: 2.85, h: 0.85, fontSize: 40, bold: true, color: i % 2 ? C.accent2 : C.accent1, fontFace: "Cambria" });
      txt(s, big[i][1], { x, y: 5.3, w: 2.7, h: 0.65, fontSize: 14 });
    }
    txt(s, "Every house also adds a repaired home to the block, local contractor jobs, and a public record of where every dollar went.", { x: M, y: 6.15, w: W - 2 * M, h: 0.45, fontSize: 14, italic: true, color: C.accent5 });
    s.addNotes(
      "Benefits (15 points): social impact, scalability and originality.\n\n" +
        "Math for the scale numbers: 500 homes × $144,000 = $72 million of community-owned homes; 500 × $700 × 12 = $4.2 million a year of net rent paid to local owners; about 1,250 investors per home × 500 = 625,000 ownership stakes (many people will own pieces of several homes).\n\n" +
        "If asked 'Jasmine only makes $45 in 5 years. How does that close a wealth gap?': \"Her $45 isn't the impact. The impact is that the house, its rent and its rising value stay owned by the neighborhood instead of leaving it, a tenant becomes a homeowner, and a thousand people make their first investment and learn how ownership works. Individual returns grow as people keep investing $10 a month.\"\n\n" +
        "How it scales: the same contracts and Charter templates work in any neighborhood. Growth comes through partners who already have properties: city land banks, land trusts and HBCU foundations, starting with 100+ HBCU communities."
    );
  }

  // =============================================================== M15. Roadmap
  {
    const s = slide("OTB_CONTENT", "The plan");
    title(s, "Action plan: from test network to the first Greensboro house");
    const ph = [
      ["Done", "Today", ["Demo app and Block Simulator", "5 contracts, " + DEMO.tests + " tests", DEMO.live ? "Live on Base Sepolia" : "End-to-end demo on a test chain"], "Prototype works"],
      ["Months 0–3", "Set up", ["Form company, hire securities counsel", "Smart Wallet + paymaster in the app", "Independent security audit", "Sign a steward and a crowdfunding portal"], "Audit passed; steward signed"],
      ["Months 3–9", "First raise", ["Find house via city/land bank or heirs", "File Form C with the SEC", "Raise $144,000 from ~1,250 people"], "Raise fully funded"],
      ["Months 9–18", "First payouts", ["Close, renovate, lease to a local family", "Monthly payouts on Base mainnet", "Houses 2–3 and one local business"], "3 homes, 12 on-time payouts"],
      ["Year 2–3", "Scale", ["License the platform to land trusts and CDCs", "5 cities, starting with HBCU communities"], "25 homes; break-even path"],
    ];
    for (let i = 0; i < 5; i++) {
      const x = M + i * 2.46;
      const done = i === 0;
      card(s, x, 1.55, 2.3, 4.55, done ? C.accent1 : C.background2, ph[i][0] + " card");
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: 1.75, w: 1.9, h: 0.38, rectRadius: 0.19, fill: { color: done ? C.accent2 : C.accent1 }, line: { type: "none" }, objectName: ph[i][0] + " pill" });
      txt(s, ph[i][0], { x: x + 0.2, y: 1.75, w: 1.9, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, ph[i][1], { x: x + 0.2, y: 2.27, w: 1.95, h: 0.45, fontSize: 18, bold: true, color: done ? C.background1 : C.accent1 });
      txt(s, ph[i][2].map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < ph[i][2].length - 1 } })), { x: x + 0.15, y: 2.8, w: 2.05, h: 2.35, fontSize: 12, paraSpaceAfter: 5, color: done ? C.background1 : C.text1 });
      txt(s, [{ text: "Success = ", options: { bold: true } }, { text: ph[i][3] }], { x: x + 0.2, y: 5.25, w: 1.95, h: 0.7, fontSize: 11, color: done ? C.accent2 : C.accent3 });
    }
    banner(s, "Objective: prove one house end to end in 18 months, then grow through partners who already own property.", 6.25);
    s.addNotes(
      "Action Plan is worth 20 points: objectives, resources, budget and timeline. This slide is the objectives and timeline; the next two are resources and budget.\n\n" +
        "Each phase has a measurable success test in red. Say them: audit passed and steward signed; raise fully funded; three homes and twelve on-time payouts; 25 homes.\n\n" +
        "Why this order: the legal and security work comes BEFORE any real money. Real dollars only move after a securities attorney signs off and the contracts pass an independent audit.\n\n" +
        "Why distressed houses first: city and county surplus or tax-foreclosed properties and heirs' property families are the pipeline, and they're where the returns work (see the numbers slide)."
    );
  }

  // =============================================================== M16. Team and partners
  {
    const s = slide("OTB_CONTENT", "The plan");
    title(s, "Resources: the team and the partners we need");
    txt(s, "Team", { x: M, y: 1.5, w: 4, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
    const team = [
      ["FaUserTie", "[Your name]", "Founder: finance and the financial model"],
      ["FaCode", "[Teammate]", "Smart contracts and the app"],
      ["FaUsers", "[Teammate]", "Community partnerships and outreach"],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 2.0 + i * 1.3;
      card(s, M, y, 4.4, 1.12, C.background2, "team " + i);
      await badge(s, team[i][0], M + 0.2, y + 0.2, 0.72, C.accent1, "FFFFFF", team[i][1]);
      txt(s, team[i][1], { x: M + 1.1, y: y + 0.14, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: C.accent1 });
      txt(s, team[i][2], { x: M + 1.1, y: y + 0.55, w: 3.2, h: 0.45, fontSize: 13 });
    }
    txt(s, "Advisors to add: a securities attorney, a Greensboro real-estate broker, a CPA", { x: M, y: 5.95, w: 4.4, h: 0.6, fontSize: 12, italic: true, color: C.accent5 });
    txt(s, "Partners we're pursuing", { x: 5.4, y: 1.5, w: 6, h: 0.4, fontSize: 18, bold: true, color: C.accent1 });
    const partners = [
      ["FaChurch", "Steward", "Neighborhood association, church or community land trust"],
      ["FaLandmark", "Deal pipeline", "City of Greensboro and Guilford County surplus homes; heirs' property legal aid"],
      ["FaUniversity", "Regulated rails", "Reg CF funding portal, SEC-registered transfer agent, escrow bank"],
      ["FaShieldAlt", "First-loss capital", "A CDFI or a bank earning Community Reinvestment Act credit"],
      ["FaGraduationCap", "Campus", "NC A&T and Bennett College students and alumni networks"],
      ["FaLink", "Base ecosystem", "Base Builder grants and Coinbase Developer Platform"],
    ];
    for (let i = 0; i < 6; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 5.4 + col * 3.7, y = 2.0 + row * 1.5;
      await badge(s, partners[i][0], x, y, 0.62, C.accent2, "FFFFFF", partners[i][1]);
      txt(s, partners[i][1], { x: x + 0.75, y: y - 0.03, w: 2.8, h: 0.38, fontSize: 15, bold: true, color: C.accent1 });
      txt(s, partners[i][2], { x: x + 0.75, y: y + 0.35, w: 2.8, h: 0.95, fontSize: 12 });
    }
    s.addNotes(
      "FILL IN BEFORE PRESENTING: replace [Your name] and [Teammate] with real names and one line of credibility each (major, year, relevant experience). Judges score whether this team can carry out the plan.\n\n" +
        "Partners are TARGETS, not signed. Say 'we're pursuing' unless you have a real conversation to cite. Even one email reply from a neighborhood association or the city's Neighborhood Development department makes this much stronger: get one before the competition if you can.\n\n" +
        "Why each partner matters: the steward is the community's check on us; the city and county are the property pipeline; the portal, transfer agent and escrow bank are legally required for a crowdfunding offering; first-loss capital protects small investors; campus networks bring investors; Base grants can fund the audit."
    );
  }

  // =============================================================== M17. Budget
  {
    const s = slide("OTB_CONTENT", "The plan");
    title(s, "Budget: $180,000 to run the 18-month pilot");
    const hdr = (t, al = "left") => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.green }, align: al } });
    const rows = [
      [hdr("Pilot costs (18 months)"), hdr("Estimate", "right")],
      ["Securities attorney: company, Form C, Charter review", "$35,000"],
      ["Independent smart contract security audit", "$30,000"],
      ["CPA review and annual reports", "$10,000"],
      ["Portal and transfer agent setup", "$8,000"],
      ["Insurance (company and officers)", "$8,000"],
      ["App: hosting, paymaster gas, ID checks", "$9,000"],
      ["Community outreach and money lessons", "$15,000"],
      ["Team stipends (part-time)", "$65,000"],
      [{ text: "Total", options: { bold: true } }, { text: "$180,000", options: { bold: true } }],
    ].map((r) => r.map((c, j) => (typeof c === "string" ? { text: c, options: { align: j ? "right" : "left" } } : { ...c, options: { align: j ? "right" : "left", ...c.options } })));
    s.addTable(rows, { x: M, y: 1.5, w: 7.0, colW: [5.4, 1.6], fontSize: 13, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: 0.5, valign: "middle", margin: [0.03, 0.12, 0.03, 0.12] });
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Funding", labels: ["Grants and competitions", "CDFI or bank program", "Impact angels"], values: [50, 50, 80] }], {
      x: 7.85, y: 1.4, w: 4.9, h: 3.75, holeSize: 55,
      chartColors: [HEX.gold, HEX.blue, HEX.green],
      showValue: true, showPercent: false, dataLabelFormatCode: '"$"0"k"', dataLabelColor: "FFFFFF", dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelFontFace: "+mn-lt",
      showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.ink,
      showTitle: true, title: "Where the $180k comes from", titleFontSize: 14, titleColor: HEX.ink, titleFontFace: "+mn-lt",
    });
    card(s, 7.85, 5.3, 4.88, 1.2, C.background2, "note card");
    txt(s, [
      { text: "House money is separate. ", options: { bold: true, color: HEX.green } },
      { text: "Each house is paid for by its own raise ($144,000), not this budget. Each raise pays OwnTheBlock $2,880, plus 2% of rent." },
    ], { x: 8.1, y: 5.35, w: 4.4, h: 1.1, fontSize: 13, valign: "middle" });
    s.addNotes(
      "These are planning estimates; replace any line with a real quote when you get one. Ranges to know: securities counsel for a first Reg CF offering is often $20,000–$50,000; a smart contract audit for contracts this size is often $15,000–$50,000.\n\n" +
        "The company's costs are about $10,000 a month, which is lean on purpose. Funding: competition prizes and grants such as Base Builder grants ($50k); a CDFI or a bank's community program, motivated by Community Reinvestment Act credit ($50k); impact angels ($80k).\n\n" +
        "How OwnTheBlock earns money long-term: 2% of each raise ($2,880 per house), 2% of rent ($336 per house per year) and, mainly, licensing the platform to land trusts, community development corporations and cities that already own properties. Deal fees alone need a few hundred homes to cover a team, which is why licensing is the scale plan.\n\n" +
        "Key point: investors' money for the house never pays for the company. It goes from escrow to the house's LLC."
    );
  }

  // =============================================================== M18. Risks
  {
    const s = slide("OTB_CONTENT", "Feasibility");
    title(s, "Risks we've planned for");
    const hdr = (t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: HEX.green } } });
    const rows = [
      [hdr("Risk"), hdr("How we handle it")],
      ["Not enough investors to fill a raise", "Mix of residents, students, alumni and churches (appendix); all-or-nothing refunds; alumni windows open on day 8"],
      ["Securities rules", "Reg CF through a registered portal; one LLC per house (no pooled fund until counsel approves); 12-month lockup in code"],
      ["Code bug or hack", "22 tests, independent audit before real money, two keys on every payment, transfer agent's official list as backup"],
      ["Repairs run over / tenant leaves", "15% repair cushion, staged payments, 5% vacancy cushion and a 10% reserve"],
      ["Home values fall", "Buy below repaired value, no mortgage on the house, long hold, first-loss partner covers the first 10%"],
      ["Rules seen as excluding people", "Rules favor residency, never race or any protected class; attorney reviews every Charter"],
      ["Not enough houses", "City/county surplus homes and heirs' property partners, not open-market bidding"],
    ].map((r, i) => (i === 0 ? r : [{ text: r[0], options: { bold: true, color: HEX.green } }, { text: r[1] }]));
    s.addTable(rows, { x: M, y: 1.5, w: W - 2 * M, colW: [3.8, W - 2 * M - 3.8], fontSize: 13, color: HEX.ink, border: { type: "solid", pt: 0.75, color: HEX.line }, rowH: [0.42, 0.6, 0.6, 0.6, 0.55, 0.6, 0.55, 0.55], valign: "middle", margin: [0.03, 0.12, 0.03, 0.12] });
    txt(s, "Estimates, not guarantees. Investors can lose money, and the app shows the downside as clearly as the upside.", { x: M, y: 6.2, w: W - 2 * M, h: 0.4, fontSize: 13, italic: true, color: C.accent3 });
    s.addNotes(
      "Feasibility (15 points): judges want to see you found the hard parts yourself.\n\n" +
        "FILLING A RAISE: 14,400 tokens is a lot of $10 checks. The plan doesn't rely on $10 checks alone: about 300 residents at $50, 400 students at $25, 540 alumni and supporters at $150, and 19 churches and local organizations at $2,000 = $144,000 from about 1,260 people. No one can exceed the 2% cap ($2,880). See the appendix chart.\n\n" +
        "SECURITIES: each house's LLC is its own crowdfunding issuer. A pooled neighborhood fund is attractive (one tax form, spread risk) but may be treated as an investment company, which crowdfunding excludes, so it waits for counsel. After 12 months, resale must go through a registered trading platform; no do-it-yourself marketplace.\n\n" +
        "CODE RISK: tests, audit, two-key payments, and the transfer agent's official owner list mean a lost phone or a bug doesn't erase ownership. Lost wallets can be recovered through identity verification.\n\n" +
        "STABLECOIN: USDC is only used briefly for payouts; the house, not the token, is the asset. Stablecoins are federally regulated under the GENIUS Act (2025)."
    );
  }

  // =============================================================== M19. Close / ask
  {
    const s = slide("OTB_TITLE", "Close");
    s.addImage({ path: photo("sample-st-alt"), x: 9.6, y: 0, w: W - 9.6, h: H, sizing: { type: "cover", w: W - 9.6, h: H }, altText: "A restored home" });
    s.addText([{ text: "Fix the block. Own the block.", options: { fontSize: 44 } }], { placeholder: "title" });
    body(s, [
      { text: "Built on Base, so a neighborhood can own itself.", options: { bold: true, color: C.accent2, breakLine: true } },
      { text: " ", options: { breakLine: true, fontSize: 10 } },
      { text: "Our ask:", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "A steward partner and a first house in East Greensboro", options: { bullet: true, fontSize: 17, breakLine: true } },
      { text: "$180,000 to fund the 18-month pilot", options: { bullet: true, fontSize: 17, breakLine: true } },
      { text: "Mentorship from the Base and Coinbase team for the audit and launch", options: { bullet: true, fontSize: 17 } },
    ]);
    txt(s, "Thank you  ·  Questions", { x: 0.8, y: 6.55, w: 6, h: 0.45, fontSize: 18, bold: true, color: C.background1 });
    s.addNotes(
      "Return to the story, then make the ask.\n\n" +
        "Say: \"Ms. Jenkins doesn't have to leave. Her neighbors become owners. Built on Base, a neighborhood can own itself.\" Then read the three asks. \"Thank you.\"\n\n" +
        "Likely questions (answers in the appendix and the playbook PDF): Why not a regular database? Is this legal? How do you stop outsiders taking over? Isn't $0.49 a month too small? How does OwnTheBlock make money? What if a house loses value? Isn't this gentrification with extra steps?"
    );
  }

  // =============================================================== Appendix divider
  {
    APPX = true;
    const s = slide("OTB_SECTION", "Appendix");
    title(s, "Appendix");
    body(s, "Detail for questions: structure, steps, money, people, rules, legal");
    s.addNotes("Use these slides only to answer questions. Jump straight to the one you need (in slideshow mode, type the slide number and press Enter).");
  }

  // =============================================================== A. Investor mix
  {
    const s = slide("OTB_CONTENT", "Appendix");
    title(s, "Can we fill a $144,000 raise? The investor mix");
    s.addChart(pres.charts.BAR, [{ name: "Raised", labels: ["Residents (300 × $50)", "Students (400 × $25)", "Alumni and supporters (540 × $150)", "Churches and local orgs (19 × $2,000)"], values: [15000, 10000, 81000, 38000] }], {
      x: M, y: 1.5, w: 7.6, h: 4.9, barDir: "bar", barGapWidthPct: 50,
      chartColors: [HEX.green, HEX.moss, HEX.gold, HEX.blue],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0', dataLabelFontSize: 14, dataLabelFontBold: true, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.ink, catAxisLabelFontSize: 13, catAxisLabelFontFace: "+mn-lt", catAxisOrientation: "maxMin",
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 100000, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, showTitle: false,
    });
    const pts = [
      ["$144,000", "from about 1,260 people"],
      ["$2,880", "most any one person can hold (2%)"],
      ["7 days", "residents-only window before anyone else"],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 1.6 + i * 1.6;
      card(s, 8.6, y, 4.13, 1.4, i === 0 ? C.accent1 : C.background2, "mix stat " + i);
      txt(s, pts[i][0], { x: 8.85, y: y + 0.12, w: 3.7, h: 0.7, fontSize: 30, bold: true, color: i === 0 ? C.accent2 : C.accent1, fontFace: "Cambria" });
      txt(s, pts[i][1], { x: 8.85, y: y + 0.82, w: 3.7, h: 0.45, fontSize: 14, color: i === 0 ? C.background1 : C.text1 });
    }
    s.addNotes(
      "Answer to 'Will 1,400 people really put in $10?': they don't have to. Most of the dollars come from alumni and organizations; most of the PEOPLE are residents and students. Both matter: one fills the raise, the other is the mission.\n\n" +
        "Federal limits: investors with lower income or net worth can invest up to about $2,500 a year across all crowdfunding offerings (verify the current figure), so every group here is within the rules."
    );
  }


  // =============================================================== 10. LLC structure
  {
    const s = slide("OTB_CONTENT", "How it works");
    title(s, "Own a piece of the LLC that owns the house");
    const boxes = [
      ["FaUsers", "Neighbors", "Buy tokens from $10.\nEach token = 1 unit of the LLC."],
      ["FaFileContract", "The house's LLC", "Legally owns the house.\nManaged by OwnTheBlock.\nA local steward holds a seat."],
      ["FaHome", "The house", "Deed recorded in the LLC's name at the county."],
    ];
    for (let i = 0; i < 3; i++) {
      const x = M + 0.1 + i * 4.2;
      card(s, x, 1.75, 3.5, 3.3, i === 1 ? C.accent1 : C.background2, boxes[i][1] + " box");
      await badge(s, boxes[i][0], x + 1.3, 2.0, 0.9, i === 1 ? C.accent2 : C.accent1, "FFFFFF", boxes[i][1]);
      txt(s, boxes[i][1], { x: x + 0.25, y: 3.05, w: 3.0, h: 0.5, fontSize: 21, bold: true, align: "center", color: i === 1 ? C.background1 : C.accent1 });
      txt(s, boxes[i][2], { x: x + 0.25, y: 3.6, w: 3.0, h: 1.35, fontSize: 15, align: "center", color: i === 1 ? C.background1 : C.text1 });
      if (i < 2) arrow(s, x + 3.58, 3.2, 0.55, C.accent2, "arrow " + i);
    }
    const facts = [
      ["1 token = 1 LLC unit = $10", "FaCoins"],
      ["Tokens are recorded on the Base blockchain", "FaLink"],
      ["The law already recognizes LLC ownership", "FaBalanceScale"],
    ];
    for (let i = 0; i < 3; i++) {
      const x = M + 0.1 + i * 4.2;
      await badge(s, facts[i][1], x, 5.55, 0.6, C.accent2, "FFFFFF", facts[i][0]);
      txt(s, facts[i][0], { x: x + 0.75, y: 5.55, w: 3.0, h: 0.6, fontSize: 15, bold: true, valign: "middle" });
    }
    s.addNotes(
      "THIS IS THE CORE IDEA. Make sure you can explain it without the slide.\n\n" +
        "People can't legally own 1/14,400th of a house. But a house can be owned by an LLC (limited liability company), and an LLC can have thousands of members. The tokens are membership units of that LLC.\n\n" +
        "OwnTheBlock is the LLC's manager (handles the day-to-day work). A steward, meaning a trusted local group like a neighborhood association, church, land trust or the city, holds a governance seat and a veto over changes to the affordability rules.\n\n" +
        "Why it's legally solid: LLC ownership is standard U.S. law. The operating agreement says the official member list is kept by a registered transfer agent, which mirrors the token records on the blockchain. Limited liability means investors can't lose more than they put in.\n\n" +
        "Recommended upgrade: one 'Block Fund LLC' per neighborhood that owns several homes directly. It means one tax form per investor, lower admin costs, and spreads the risk."
    );
  }
  // =============================================================== 11. 10 steps
  {
    const s = slide("OTB_CONTENT", "How it works");
    title(s, "The life of one house, in ten steps");
    const steps = [
      ["Find", "Neighbors flag an eyesore; stewards bring properties", "Week 0"],
      ["Vet", "Title search, appraisal, inspection, two repair bids", "Weeks 1–8"],
      ["Set up", "Form the LLC, adopt the Charter, sign the purchase deal", "Weeks 6–10"],
      ["Raise", "Offering goes live; residents get first access", "Weeks 10–20"],
      ["Close", "Escrow releases funds; deed recorded to the LLC", "Weeks 20–24"],
      ["Renovate", "Local contractors, paid in stages after inspections", "Months 6–9"],
      ["Rent", "Licensed manager leases to a local family", "Month 9"],
      ["Pay", "Net rent paid out to token holders every month", "Month 10 →"],
      ["Govern", "Owners vote; reports published every quarter", "Ongoing"],
      ["Exit", "Tenant buys, community holds, or mission sale", "Years 3–10"],
    ];
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5), col = i % 5;
      const x = M + col * 2.45, y = 1.6 + row * 2.65;
      s.addShape(pres.shapes.OVAL, { x, y, w: 0.6, h: 0.6, fill: { color: row === 0 ? C.accent1 : C.accent2 }, line: { type: "none" }, objectName: "step " + (i + 1) });
      txt(s, String(i + 1), { x, y, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, steps[i][0], { x: x + 0.72, y: y + 0.08, w: 1.6, h: 0.45, fontSize: 19, bold: true, color: C.accent1 });
      txt(s, steps[i][1], { x, y: y + 0.75, w: 2.25, h: 1.15, fontSize: 14 });
      txt(s, steps[i][2], { x, y: y + 1.9, w: 2.25, h: 0.35, fontSize: 13, bold: true, color: C.accent5 });
    }
    s.addNotes(
      "Walk through these in order. Roughly 9–10 months from flagging a house to the first payout.\n\n" +
        "1 FIND: neighbors tap 'Flag an eyesore' with a photo and address, or a steward (city, land bank, church) brings a property. Staff pull public records: owner, back taxes, liens, code violations.\n" +
        "2 VET: a title company checks who legally owns it; a licensed appraiser sets the value (rule: never pay above the as-is appraisal); an inspector checks condition; two licensed contractors bid on repairs. All documents go in the project's document room.\n" +
        "3 SET UP: form the LLC, attach the neighborhood's Charter (the rules), sign a purchase agreement that depends on the raise succeeding.\n" +
        "4 RAISE: an attorney files Form C with the SEC. The offering goes live on a registered crowdfunding portal and in the app. Days 1–7 zip-code residents, days 8–14 students and alumni, day 15+ any verified U.S. investor. Investors can cancel up to 48 hours before the deadline.\n" +
        "5 CLOSE: if the goal is met, the escrow bank releases the money and tokens are created for every investor. If not, everyone is refunded automatically. NC uses attorneys for closings; the deed is recorded in the LLC's name.\n" +
        "6 RENOVATE: contractors are paid in 3–4 stages, each needing an invoice, inspection photos and two signatures (manager plus steward). A 15% contingency covers surprises.\n" +
        "7 RENT: a licensed property manager picks the tenant under fair-housing law. Investors never pick tenants.\n" +
        "8 PAY: each month, rent minus expenses goes to token holders.\n" +
        "9 GOVERN: owners vote on big decisions; quarterly public reports.\n" +
        "10 EXIT: preferred is the tenant buying the home; or hold long-term; or sell to a land trust; open-market sale only by a 2/3 vote."
    );
  }
  // =============================================================== 12. How the house is bought
  {
    const s = slide("OTB_CONTENT", "How it works");
    title(s, "How the house gets bought: the family chooses");
    const opts = [
      ["A", "Sell", "Cash at the appraised value. Back taxes and liens are paid off at closing.", "Heirs live far away and want out"],
      ["B", "Sell with buy-back", "Cash now, plus the right to buy the house back within 5 years at a preset price.", "The family wants to keep its tie to the house"],
      ["C", "Trade the house for shares", "No cash needed. The family keeps about half the tokens and shares future rent or sale.", "Heirs lack cash but want to stay owners"],
    ];
    for (let i = 0; i < 3; i++) {
      const x = M + i * 4.1;
      card(s, x, 1.6, 3.8, 3.35, C.background2, "option " + opts[i][0]);
      s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 1.85, w: 0.65, h: 0.65, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "letter " + opts[i][0] });
      txt(s, opts[i][0], { x: x + 0.3, y: 1.85, w: 0.65, h: 0.65, fontSize: 22, bold: true, color: C.background1, align: "center", valign: "middle" });
      txt(s, opts[i][1], { x: x + 1.1, y: 1.9, w: 2.5, h: 0.6, fontSize: 19, bold: true, color: C.accent1, valign: "middle" });
      txt(s, opts[i][2], { x: x + 0.3, y: 2.7, w: 3.2, h: 1.3, fontSize: 15 });
      txt(s, "Best when: " + opts[i][3], { x: x + 0.3, y: 4.1, w: 3.2, h: 0.7, fontSize: 13, italic: true, color: C.accent5 });
    }
    txt(s, "Other ways a house comes in", { x: M, y: 5.2, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
    const others = [
      ["FaHome", "Paid-off owner sells to neighbors"],
      ["FaUniversity", "Mortgage is paid off at closing"],
      ["FaGavel", "Bought from the bank after foreclosure"],
      ["FaLandmark", "City or land bank property"],
    ];
    for (let i = 0; i < 4; i++) {
      const x = M + i * 3.05;
      await badge(s, others[i][0], x, 5.75, 0.6, C.accent2, "FFFFFF", others[i][1]);
      txt(s, others[i][1], { x: x + 0.72, y: 5.72, w: 2.2, h: 0.7, fontSize: 14, valign: "middle" });
    }
    s.addNotes(
      "The family is never forced. Staff present all three options side by side, and nothing happens without the heirs' agreement.\n\n" +
        "Example (Option A): appraised as-is at $90,000. The family gets $90,000 minus any back taxes and liens paid at closing. Repairs cost about $35,000, and the fixed-up house is worth about $150,000.\n\n" +
        "Fairness question you'll get: 'If you buy at $90k and it's worth $150k, did you take the family's money?' Answer: most of the gap is the $35–40k of repairs plus the risk of fixing it. The family gets the full as-is value, and if they want a share of the upside they can choose B (buy-back) or C (keep shares).\n\n" +
        "Hurdles to be honest about: every heir must sign (often the slowest step), back taxes reduce the family's cash, vacant-house insurance is expensive, and repairs can run over budget. No raise opens until the title is clear.\n\n" +
        "Other sources: a paid-off owner who'd rather sell to neighbors than an investor (simplest case); a mortgaged house (the attorney pays off the loan at closing, the seller keeps the rest); a bank-owned foreclosure (needs a fast 'bridge' fund since banks want quick closings); city or land bank properties, which are the best pipeline for growth."
    );
  }
  // =============================================================== 13. Blockchain on/off
  {
    const s = slide("OTB_CONTENT", "How it works");
    title(s, "Where the blockchain fits, and where it doesn't");
    card(s, M, 1.6, 5.9, 4.6, C.accent1, "on-chain column");
    await badge(s, "FaLink", M + 0.3, 1.85, 0.7, C.accent2, "FFFFFF", "on-chain");
    txt(s, "On the blockchain (proven by code)", { x: M + 1.15, y: 1.85, w: 4.6, h: 0.7, fontSize: 19, bold: true, color: C.background1, valign: "middle" });
    const on = ["Who passed the ID check (no personal data)", "Every commitment to a raise, and the tokens", "Every repair payment (steward must co-sign)", "Monthly payouts, split automatically", "Votes and community rules (rent cap, reserve)", "Tenant's on-time rent record and lesson badges"];
    txt(s, on.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < on.length - 1 } })), { x: M + 0.4, y: 2.75, w: 5.2, h: 3.3, fontSize: 16, color: C.background1, paraSpaceAfter: 8 });
    card(s, 6.83, 1.6, 5.9, 4.6, C.background2, "off-chain column");
    await badge(s, "FaFileAlt", 7.13, 1.85, 0.7, C.accent5, "FFFFFF", "off-chain");
    txt(s, "In the real world (proven by documents)", { x: 7.98, y: 1.85, w: 4.6, h: 0.7, fontSize: 19, bold: true, color: C.accent1, valign: "middle" });
    const off = ["Buying the house and recording the deed", "Investor dollars held by the escrow bank", "Collecting rent from the tenant", "Repairs actually getting done", "Choosing the tenant (licensed manager)"];
    txt(s, off.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < off.length - 1 } })), { x: 7.23, y: 2.75, w: 5.2, h: 3.3, fontSize: 16, paraSpaceAfter: 8 });
    txt(s, "Every real-world document gets a digital fingerprint on the blockchain, so nobody can quietly swap it later.", { x: M, y: 6.35, w: W - 2 * M, h: 0.45, fontSize: 16, italic: true, bold: true, color: C.accent2, align: "center" });
    s.addNotes(
      "Being honest about what blockchain can't do is a strength, not a weakness. Say it before a judge asks.\n\n" +
        "WHY BLOCKCHAIN AT ALL? Four reasons: (1) thousands of tiny owners tracked and paid for almost nothing; payouts cost the same whether there are 10 owners or 10,000; (2) a public record anyone can check: where every dollar went; (3) rules no single party can quietly change, because the rent cap and reserve can only change by a 2/3 vote plus a 30-day wait, enforced by code; (4) caps and local-first rules checked automatically on every transfer.\n\n" +
        "The smart contracts: IdentityRegistry (who passed KYC), AssetToken (the LLC units; transfers only between verified people), Raise (commitments, refunds), Treasury (repair money; steward co-signs), Distributor (monthly payouts), RulesRegistry and CommunityGovernor (rules and votes), Badges (lessons). All on Base, a low-cost network built by Coinbase that settles to Ethereum.\n\n" +
        "Users never see crypto: balances show in dollars, there's no seed phrase (Face ID/passkey wallet), and OwnTheBlock pays the network fees.\n\n" +
        "WHAT IT CAN'T DO: code can't prove a house exists or make a tenant pay rent. Those are proven by the recorded deed, the manager's monthly report and audits, and each document's fingerprint (hash) is stored on-chain.\n\n" +
        "Legal note: under crowdfunding rules, investor dollars must sit with a bank or broker-dealer escrow until the raise closes. The blockchain records the commitments and creates the tokens at closing."
    );
  }
  // =============================================================== 14. Follow the money
  {
    const s = slide("OTB_CONTENT", "How it works");
    title(s, "Follow the money");
    txt(s, "Buying and fixing the house", { x: M, y: 1.5, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
    const top = [["FaUsers", "Investors"], ["FaUniversity", "Escrow bank"], ["FaFileContract", "House's LLC"], ["FaHandshake", "Seller"], ["FaHardHat", "Contractors"]];
    const topNotes = ["$10 and up", "Holds money until the goal is met", "Gets the money, mints tokens", "Paid at closing", "Paid in stages"];
    for (let i = 0; i < 5; i++) {
      const x = M + i * 2.5;
      await badge(s, top[i][0], x + 0.55, 2.0, 0.85, i === 2 ? C.accent2 : C.accent1, "FFFFFF", top[i][1]);
      txt(s, top[i][1], { x, y: 2.95, w: 1.95, h: 0.4, fontSize: 16, bold: true, align: "center" });
      txt(s, topNotes[i], { x, y: 3.35, w: 1.95, h: 0.6, fontSize: 13, align: "center", color: C.accent5 });
      if (i < 4 && i !== 3) arrow(s, x + 1.65, 2.22, 0.6, C.accent2, "money arrow " + i);
    }
    txt(s, "+", { x: M + 9.95, y: 2.05, w: 0.6, h: 0.7, fontSize: 30, bold: true, color: C.accent2, align: "center" });
    txt(s, "Every month after", { x: M, y: 4.15, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.accent1 });
    const bot = [["FaKey", "Tenant"], ["FaUserTie", "Property manager"], ["FaReceipt", "Bills first"], ["FaLink", "Payout contract"], ["FaUsers", "Investors"]];
    const botNotes = ["Pays $1,400 rent", "Collects rent, sends report", "Taxes, insurance, repairs, reserve", "Splits by tokens", "Claim to wallet or bank"];
    for (let i = 0; i < 5; i++) {
      const x = M + i * 2.5;
      await badge(s, bot[i][0], x + 0.55, 4.65, 0.85, i === 3 ? C.accent2 : C.accent1, "FFFFFF", bot[i][1]);
      txt(s, bot[i][1], { x, y: 5.6, w: 1.95, h: 0.4, fontSize: 16, bold: true, align: "center" });
      txt(s, botNotes[i], { x, y: 6.0, w: 1.95, h: 0.6, fontSize: 13, align: "center", color: C.accent5 });
      if (i < 4) arrow(s, x + 1.65, 4.87, 0.6, C.accent2, "rent arrow " + i);
    }
    s.addNotes(
      "TOP ROW (one time): investors commit money; it sits at a regulated escrow bank; if the goal is met it goes to the LLC, which pays the seller at closing and pays contractors in stages after each inspection. If the goal is missed, everyone gets refunded.\n\n" +
        "BOTTOM ROW (every month): the tenant pays rent in dollars to the licensed property manager. Bills come first: property taxes and insurance, management (8%), a repair reserve (10%) and a vacancy cushion (5%), admin and a 2% platform fee. What's left is converted to USDC (a digital dollar) and sent to the payout contract with a fingerprint of the expense report. The contract splits it by tokens, and investors claim it to their wallet or cash out to their bank.\n\n" +
        "This is the 'Money Trail' in the app: any investor can trace their exact dollars at every step."
    );
  }
  // =============================================================== 15. Jasmine's $100
  {
    const s = slide("OTB_CONTENT", "Following the money");
    title(s, "Follow one person: Jasmine's $100");
    const tl = [
      ["Dec", "Signs up with Face ID, takes the safety and money lessons"],
      ["Jan", "Puts in $100 = 10 tokens"],
      ["Mar", "Raise hits its goal; her tokens are created"],
      ["Apr", "LLC buys the house"],
      ["May–Jul", "Repairs in three inspected stages"],
      ["Aug", "A family moves in"],
      ["Sep", "First payout: $0.49"],
      ["Year 5", "Exit: tenant buys or community sells"],
    ];
    s.addShape(pres.shapes.LINE, { x: M + 0.3, y: 2.25, w: W - 2 * M - 0.6, h: 0, line: { color: C.accent2, width: 3 }, objectName: "timeline line" });
    const step = (W - 2 * M - 0.6) / (tl.length - 1);
    for (let i = 0; i < tl.length; i++) {
      const cx = M + 0.3 + i * step;
      s.addShape(pres.shapes.OVAL, { x: cx - 0.17, y: 2.08, w: 0.34, h: 0.34, fill: { color: i === tl.length - 1 ? C.accent3 : C.accent1 }, line: { color: C.background1, width: 2 }, objectName: "timeline dot " + i });
      txt(s, tl[i][0], { x: cx - 0.75, y: 1.5, w: 1.5, h: 0.4, fontSize: 15, bold: true, color: C.accent1, align: "center" });
      txt(s, tl[i][1], { x: cx - 0.72, y: 2.6, w: 1.44, h: 1.4, fontSize: 13, align: "center" });
    }
    const stats = [["$0.49", "a month in payouts", C.accent2], ["~$145", "back after 5 years", C.accent1], ["~8.7%", "a year, estimated", C.accent1]];
    for (let i = 0; i < 3; i++) {
      const x = M + i * 4.1;
      card(s, x, 4.45, 3.8, 1.95, C.background2, "stat " + i);
      txt(s, stats[i][0], { x: x + 0.3, y: 4.6, w: 3.2, h: 1.0, fontSize: 48, bold: true, color: stats[i][2], fontFace: "Cambria" });
      txt(s, stats[i][1], { x: x + 0.3, y: 5.6, w: 3.2, h: 0.5, fontSize: 16 });
    }
    txt(s, "Estimates, not guarantees. You can lose some or all of your investment.", { x: M, y: 6.5, w: 8, h: 0.35, fontSize: 11, italic: true, color: C.accent5 });
    s.addNotes(
      "Jasmine is a 20-year-old A&T sophomore with about $40 a month to spare who has never invested and is scared of crypto scams.\n\n" +
        "Her $100 buys 10 of the house's 14,400 tokens (0.069% ownership). After bills, about $700 a month goes to investors. $700 / 14,400 = about 4.9 cents per token per month, so Jasmine gets about $0.49 a month, or $5.83 a year.\n\n" +
        "At year 5, if the house has grown 3% a year, each token is worth about $11.56 after selling costs. Jasmine gets about $115.60 from the sale plus about $29 in payouts = about $145 total, roughly 8.7% a year.\n\n" +
        "If she also auto-invests $40 a month at that rate, she'd have about $3,100 after 5 years from $2,500 put in.\n\n" +
        "Downside: if the house is worth 10% less than expected, prices stay flat and there are two vacant months, she'd get back about $117. A 25% drop in value is about break-even, and bigger shocks mean a loss. Always show the downside next to the base case.\n\n" +
        "On the blockchain: her ID check, her commitment, her tokens being created, each repair payment, each monthly payout and her claim are all recorded and visible in her Money Trail."
    );
  }
  // =============================================================== 17. Where rent goes (doughnut)
  {
    const s = slide("OTB_CONTENT", "Following the money");
    title(s, "Where each month's $1,400 rent goes");
    const labels = ["To investors", "Property tax + insurance", "Repair reserve (10%)", "Property manager (8%)", "Admin and tax filings", "Vacancy cushion (5%)", "OwnTheBlock fee (2%)"];
    const values = [700, 270, 140, 112, 80, 70, 28];
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Monthly rent", labels, values }], {
      x: M, y: 1.45, w: 6.4, h: 5.3, holeSize: 55,
      chartColors: [HEX.green, HEX.taupe, HEX.gold, HEX.blue, "A9A08F", HEX.moss, HEX.brick],
      showValue: true, showPercent: false, dataLabelFormatCode: "$#,##0", dataLabelColor: "FFFFFF", dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt",
      showLegend: true, legendPos: "b", legendFontSize: 12, legendFontFace: "+mn-lt", legendColor: HEX.ink,
      showTitle: false,
    });
    card(s, 7.5, 1.7, 5.23, 1.9, C.background2, "payout card");
    txt(s, "$700", { x: 7.8, y: 1.85, w: 2.3, h: 0.9, fontSize: 48, bold: true, color: C.accent1, fontFace: "Cambria" });
    txt(s, "a month to investors = 4.9¢ per token, about 5.8% a year in cash", { x: 7.8, y: 2.75, w: 4.7, h: 0.75, fontSize: 15 });
    const pts = [
      ["FaShieldAlt", "Bills are always paid first; investors get what's left"],
      ["FaPiggyBank", "The reserve covers roofs, water heaters and empty months"],
      ["FaChartLine", "The rest of the return comes when the house is sold or the tenant buys it"],
    ];
    for (let i = 0; i < 3; i++) {
      const y = 3.95 + i * 0.95;
      await badge(s, pts[i][0], 7.5, y, 0.65, C.accent1, "FFFFFF", pts[i][1]);
      txt(s, pts[i][1], { x: 8.35, y, w: 4.4, h: 0.75, fontSize: 15, valign: "middle" });
    }
    s.addNotes(
      "Formula from the spec: money to investors = rent minus (vacancy + management + reserve + platform fee) x rent, minus taxes and insurance, minus admin.\n\n" +
        "$1,400 - $70 vacancy - $112 management - $140 reserve - $28 fee - $270 taxes and insurance - $80 admin = $700.\n\n" +
        "$700 x 12 = $8,400 a year / $144,000 raised = 5.8% cash yield.\n\n" +
        "Verify the tax and insurance estimate for Guilford County before presenting. The admin line assumes a pooled neighborhood fund; a separate LLC for every single house would cost about $250 a month and cut the payout to about $530.\n\n" +
        "When something goes wrong (a tenant moves out, the roof leaks), the reserve pays first, and payouts dip until it refills. The simulator in the app shows this honestly."
    );
  }
  // =============================================================== 18. Why eyesores (bar chart)
  {
    const s = slide("OTB_CONTENT", "Following the money");
    title(s, "Why we rescue eyesores instead of buying at full price");
    s.addChart(pres.charts.BAR, [{ name: "Yearly return over 7 years", labels: ["Buy a house at full price", "Rescue a distressed house"], values: [3.5, 8.5] }], {
      x: M, y: 1.5, w: 7.2, h: 4.9, barDir: "col", barGapWidthPct: 70,
      chartColors: [HEX.brick, HEX.green],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0.0"%"', dataLabelFontSize: 20, dataLabelFontBold: true, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.ink, catAxisLabelFontSize: 15, catAxisLabelFontFace: "+mn-lt",
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 10, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, showTitle: true, title: "Estimated yearly return for investors (7-year hold)", titleFontSize: 15, titleColor: HEX.ink, titleFontFace: "+mn-lt",
    });
    const pts = [
      ["Full price", "$175,500 raise for a $147,000 house. Each $10 token starts at about $8.55 of value.", C.accent3],
      ["Distressed", "$144,000 raise for a house worth $150,000 once fixed. Each token starts at about $10.63.", C.accent1],
    ];
    for (let i = 0; i < 2; i++) {
      card(s, 8.3, 1.6 + i * 1.75, 4.43, 1.55, C.background2, pts[i][0] + " card");
      txt(s, pts[i][0], { x: 8.6, y: 1.75 + i * 1.75, w: 3.9, h: 0.4, fontSize: 18, bold: true, color: pts[i][2] });
      txt(s, pts[i][1], { x: 8.6, y: 2.15 + i * 1.75, w: 3.9, h: 0.9, fontSize: 14 });
    }
    txt(s, "Fixing the eyesore is where the value is created. The mission and the math point the same way.", { x: 8.3, y: 5.2, w: 4.43, h: 1.2, fontSize: 17, italic: true, bold: true, color: C.accent2 });
    s.addNotes(
      "This is the most important financial insight in the whole plan.\n\n" +
        "Buying a normal house at market price means paying the full price plus all the costs of the raise. Investors start behind and only earn about 3.5% a year over 7 years, below a savings account.\n\n" +
        "Buying a boarded-up house at its as-is value and fixing it creates value: the repairs add more to the house's worth than they cost. Investors start ahead and earn about 8.5% a year over 7 years (about 8.7% over 5 years).\n\n" +
        "So 'Rescue the Eyesore' isn't a side feature. It's the business model. Assumptions: 3% yearly home-price growth and 6% selling costs. At 2% growth, the distressed case drops by about 1 point."
    );
  }
  // =============================================================== 19. Compare alternatives (bar chart)
  {
    const s = slide("OTB_CONTENT", "Following the money");
    title(s, "What $100 could become in 5 years");
    s.addChart(pres.charts.BAR, [{ name: "Value after 5 years", labels: ["Cash at home (after inflation)", "High-yield savings (4%)", "OwnTheBlock (estimate)", "Stock index fund (varies)"], values: [86, 122, 145, 150] }], {
      x: M, y: 1.5, w: 7.6, h: 4.9, barDir: "bar", barGapWidthPct: 55,
      chartColors: ["A9A08F", HEX.blue, HEX.green, HEX.taupe],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '"$"#,##0', dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelColor: HEX.ink, dataLabelFontFace: "+mn-lt",
      catAxisLabelColor: HEX.ink, catAxisLabelFontSize: 14, catAxisLabelFontFace: "+mn-lt", catAxisOrientation: "maxMin",
      valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 180, valGridLine: { style: "none" }, catGridLine: { style: "none" },
      showLegend: false, showTitle: false,
    });
    const pts = [
      ["FaCoins", "Monthly cash", "About 6% a year, paid monthly"],
      ["FaDoorOpen", "Most comes back at the exit", "Usually years 3–7, when the tenant buys or the house is sold"],
      ["FaLock", "Not instant cash", "Locked for 12 months by law, then limited resale"],
      ["FaHeart", "What an index fund can't give you", "Ownership on your own block, a vote, and a neighbor who becomes a homeowner"],
    ];
    for (let i = 0; i < 4; i++) {
      const y = 1.55 + i * 1.22;
      await badge(s, pts[i][0], 8.55, y, 0.65, i === 3 ? C.accent2 : C.accent1, "FFFFFF", pts[i][1]);
      txt(s, pts[i][1], { x: 9.35, y: y - 0.03, w: 3.4, h: 0.4, fontSize: 15, bold: true, color: C.accent1 });
      txt(s, pts[i][2], { x: 9.35, y: y + 0.37, w: 3.4, h: 0.75, fontSize: 13 });
    }
    s.addNotes(
      "Be honest here; it builds credibility.\n\n" +
        "Cash under the mattress loses value to inflation (about $86 in today's dollars after 5 years at 3% inflation). A high-yield savings account at 4% grows to about $122 with almost no risk. An index fund has historically averaged roughly 7–10% a year but swings a lot; $150 is a rough midpoint, not a promise. OwnTheBlock's estimate is about $145.\n\n" +
        "So on pure return, OwnTheBlock is similar to an index fund, but with less flexibility: federal crowdfunding rules lock it for 12 months, and resale after that is limited.\n\n" +
        "The real advantages are local ownership, a voice in what happens on your block, a path to homeownership for the tenant, and money that stays in the neighborhood.\n\n" +
        "If asked 'Isn't $0.68 a year too small?': it's the starting point. Wealth comes from stacking: $10 a month, reinvesting, the exit, credit-building and education."
    );
  }
  // =============================================================== 20. Tasha
  {
    const s = slide("OTB_CONTENT", "The people");
    title(s, "Tasha: from renter to homeowner");
    s.addImage({ path: photo("bungalow-3"), x: M, y: 1.55, w: 4.6, h: 4.9, sizing: { type: "cover", w: 4.6, h: 4.9 }, altText: "A brick bungalow" });
    const steps = [
      ["FaKey", "Moves in", "Gets an option to buy the house at a price set on day one (appraisal + 3% a year)."],
      ["FaPiggyBank", "$100 of rent each month is credited", "It builds into a down-payment credit: about $6,000 by year 5."],
      ["FaIdCard", "On-time rent builds credit", "Payments are reported to credit bureaus and recorded on-chain as a record she owns."],
      ["FaHome", "Years 3–5: buys the home", "Credit + NC down-payment help + a mortgage. Investors are paid out."],
    ];
    for (let i = 0; i < 4; i++) {
      const y = 1.55 + i * 1.25;
      await badge(s, steps[i][0], 5.6, y, 0.75, C.accent1, "FFFFFF", steps[i][1]);
      txt(s, steps[i][1], { x: 6.55, y: y - 0.02, w: 6.2, h: 0.42, fontSize: 17, bold: true, color: C.accent1 });
      txt(s, steps[i][2], { x: 6.55, y: y + 0.4, w: 6.2, h: 0.75, fontSize: 15 });
    }
    s.addNotes(
      "Tasha is a 31-year-old single mom renting an OwnTheBlock home and building credit.\n\n" +
        "HOW IT WORKS: when she moves in, she gets a lease-purchase option. She can buy the house in years 3–7 at a price set the day she moves in (the appraisal plus 3% a year). $100 of each month's rent goes into a down-payment credit: $100 x 60 months = $6,000 by year 5. Combined with NC down-payment assistance programs and her improved credit, she can get a mortgage and buy the house.\n\n" +
        "WHY IT'S GOOD FOR EVERYONE: Tasha becomes a homeowner, and her purchase is the investors' exit; they get paid out at the preset price. The home stays local instead of going to a developer.\n\n" +
        "COST: the $100 credit reduces investor payouts by about 0.8 percentage points a year. That's a deliberate choice; it's part of the social return.\n\n" +
        "Why this replaced the original idea: the first plan gave tenants tokens worth 2% of rent ($28 a month). That would have taken about 88 years to reach a down payment, and it used up the entire platform fee.\n\n" +
        "Also: rent caps (3% a year max) protect her, and eviction is a last resort after a hardship fund, a payment plan and mediation."
    );
  }
  // =============================================================== 21. Marcus
  {
    const s = slide("OTB_CONTENT", "The people");
    title(s, "Marcus: growing a barbershop without a predatory loan");
    s.addImage({ path: photo("corner-cuts"), x: M, y: 1.55, w: 4.6, h: 4.9, sizing: { type: "cover", w: 4.6, h: 4.9 }, altText: "A barbershop" });
    card(s, 5.55, 1.55, 3.45, 4.9, C.background2, "MCA card");
    await badge(s, "FaExclamationTriangle", 5.85, 1.8, 0.7, C.accent3, "FFFFFF", "warning");
    txt(s, "Typical cash advance", { x: 5.85, y: 2.65, w: 2.95, h: 0.45, fontSize: 18, bold: true, color: C.accent3 });
    const mca = ["Often far above 40% APR", "Fixed daily payments, even in slow weeks", "Can require personal guarantees"];
    txt(s, mca.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < mca.length - 1 } })), { x: 5.85, y: 3.2, w: 2.95, h: 3.0, fontSize: 15, paraSpaceAfter: 8 });
    card(s, 9.28, 1.55, 3.45, 4.9, C.accent1, "OTB card");
    await badge(s, "FaCut", 9.58, 1.8, 0.7, C.accent2, "FFFFFF", "barbershop");
    txt(s, "OwnTheBlock revenue share", { x: 9.58, y: 2.65, w: 2.95, h: 0.7, fontSize: 18, bold: true, color: C.background1 });
    const otb = ["Raise $25,000 from neighbors", "Pay 4% of sales ($667/mo) until investors get 1.25× back", "About 12% APR; payments shrink in slow months", "Marcus keeps 100% ownership"];
    txt(s, otb.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < otb.length - 1 } })), { x: 9.58, y: 3.45, w: 2.95, h: 2.9, fontSize: 15, color: C.background1, paraSpaceAfter: 6 });
    s.addNotes(
      "Marcus owns a barbershop near campus and needs $25,000 to expand.\n\n" +
        "REVENUE SHARE: instead of a loan, investors get a percentage of the shop's monthly sales until they've received a set multiple of what they put in (the 'cap'). With $200,000 a year in sales, 4% = about $667 a month. The cap is 1.25 x $25,000 = $31,250, reached in about 47 months. If sales drop, payments drop too, and it just takes longer.\n\n" +
        "IMPORTANT CHANGE: the original plan used 5% of sales with a 1.4x cap. That works out to about 20% APR, which is hard to defend as 'not predatory.' 4% with a 1.25x cap is about 12% APR.\n\n" +
        "THE RIGHT COMPARISON: businesses that banks turn down often use merchant cash advances, which commonly cost far more than 40% APR with fixed daily payments (find a specific source before presenting). Against an SBA microloan (often around 8–13%), it's similar, but needs no collateral.\n\n" +
        "HOW REVENUE IS VERIFIED (barbershops take cash): funding requires a connected card terminal (Square, Stripe or Clover) plus monthly bank deposit statements. Payments are based on verified deposits, not self-reported numbers.\n\n" +
        "IF THE BUSINESS CLOSES: investors lose the unpaid part. A first-loss partner (a bank, foundation or city fund) covers the first 10% of losses, and the neighborhood fund spreads the risk across many deals."
    );
  }
  // =============================================================== 22. Community control
  {
    const s = slide("OTB_CONTENT", "The people");
    title(s, "The community writes the rules, and the code enforces them");
    const rules = [
      ["FaUsers", "Who can invest", "Anyone, residents first, or residents only"],
      ["FaBalanceScale", "Per-person cap", "e.g. no one person holds more than 2%"],
      ["FaMapMarkerAlt", "Local-share floor", "e.g. 51% of tokens must stay local"],
      ["FaVoteYea", "Resident votes count 1.5×", "Among owners of the property"],
      ["FaHome", "Rent cap", "Max 3% a year, between tenants too"],
      ["FaLock", "Changes need 2/3 + 30 days", "No sudden takeover can rewrite the rules"],
    ];
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = M + col * 4.1, y = 1.6 + row * 2.0;
      card(s, x, y, 3.8, 1.75, C.background2, rules[i][1] + " card");
      await badge(s, rules[i][0], x + 0.25, y + 0.3, 0.75, C.accent1, "FFFFFF", rules[i][1]);
      txt(s, rules[i][1], { x: x + 1.2, y: y + 0.25, w: 2.45, h: 0.75, fontSize: 17, bold: true, color: C.accent1, valign: "middle" });
      txt(s, rules[i][2], { x: x + 1.2, y: y + 1.0, w: 2.45, h: 0.65, fontSize: 14 });
    }
    txt(s, "A steward (neighborhood association, church, land trust or city) co-signs every repair payment and can veto changes to affordability rules.", { x: M, y: 5.75, w: W - 2 * M, h: 0.8, fontSize: 16, italic: true, color: C.accent1 });
    s.addNotes(
      "This answers the question every judge asks: 'What stops a rich outsider or a developer from buying everything?'\n\n" +
        "Answer: each neighborhood writes its own Charter: who may invest, how much one person can hold, how much must stay local, how votes work, the rent cap and the reserve. The token contract rejects any transfer that would break those rules. Caps apply per verified person, not per wallet, so splitting money across wallets doesn't get around them.\n\n" +
        "Three starter presets: Open Block (anyone verified, per-person cap); Neighbors First (default: local windows first, resident vote bonus, rent cap); Resident Owned (residents and local business owners only, 51% local floor).\n\n" +
        "Who votes: binding votes on a property are by its token holders, with verified residents counting 1.5x. Big money decisions (sell or refinance) can use 'quadratic' weighting, where votes = the square root of tokens held, so large holders can't dominate.\n\n" +
        "The steward is required on every spend from the house's account, so OwnTheBlock and the property manager can't move money alone.\n\n" +
        "Legal guardrail: rules can favor residents or years of local presence, never race or any protected class. An attorney reviews every preset.\n\n" +
        "The rules aren't meant to shut people out: a community can welcome a trusted outside investor on whatever terms it chooses. The point is that residents hold the pen."
    );
  }
  // =============================================================== 23. Who's involved
  {
    const s = slide("OTB_CONTENT", "The people");
    title(s, "Everyone it takes to make one house work");
    const roles = [
      ["FaUsers", "Neighbors and alumni", "Invest, vote, propose projects"],
      ["FaKey", "Tenant", "Rents, builds credit, can buy"],
      ["FaHandshake", "Seller or heirs", "Sell, keep a buy-back, or trade for shares"],
      ["FaStore", "Local business", "Raises capital, keeps ownership"],
      ["FaChurch", "Steward", "Governance seat, co-signs spending"],
      ["FaMobileAlt", "OwnTheBlock", "App, vetting, manages the LLC"],
      ["FaLandmark", "Crowdfunding portal", "SEC-registered; hosts the offering"],
      ["FaUniversity", "Escrow bank", "Holds money until the goal is met"],
      ["FaBook", "Transfer agent", "Official owner list, mirrors the chain"],
      ["FaGavel", "Closing attorney", "Title, closing, records the deed"],
      ["FaUserTie", "Property manager", "Leasing, rent, repairs, reports"],
      ["FaShieldAlt", "First-loss partner", "Bank, foundation or city; absorbs first losses"],
    ];
    for (let i = 0; i < 12; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = M + col * 3.08, y = 1.6 + row * 1.7;
      const community = i < 6;
      await badge(s, roles[i][0], x, y, 0.75, community ? C.accent1 : C.accent5, "FFFFFF", roles[i][1]);
      txt(s, roles[i][1], { x: x + 0.9, y: y - 0.02, w: 2.05, h: 0.45, fontSize: 16, bold: true, color: community ? C.accent1 : C.text1 });
      txt(s, roles[i][2], { x: x + 0.9, y: y + 0.42, w: 2.05, h: 0.9, fontSize: 13 });
    }
    s.addShape(pres.shapes.OVAL, { x: M, y: 6.6, w: 0.22, h: 0.22, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "legend community" });
    txt(s, "The community", { x: M + 0.32, y: 6.55, w: 2, h: 0.32, fontSize: 13 });
    s.addShape(pres.shapes.OVAL, { x: M + 2.4, y: 6.6, w: 0.22, h: 0.22, fill: { color: C.accent5 }, line: { type: "none" }, objectName: "legend professionals" });
    txt(s, "Licensed professionals and partners", { x: M + 2.72, y: 6.55, w: 4, h: 0.32, fontSize: 13 });
    s.addNotes(
      "Green = the community. Brown = the regulated professionals who make it legal and safe.\n\n" +
        "The professionals are the same people involved in any normal home sale or securities offering. OwnTheBlock doesn't replace them; it connects them to a neighborhood.\n\n" +
        "Crowdfunding portal: under Regulation Crowdfunding, offerings must run through an SEC-registered funding portal or broker-dealer. OwnTheBlock partners with one in the pilot.\n" +
        "Transfer agent: a registered company that keeps the official list of owners; it mirrors the token records on the blockchain.\n" +
        "First-loss partner: banks get credit under the Community Reinvestment Act for investing in low- and moderate-income communities, so a bank absorbing the first 10% of losses is realistic.\n\n" +
        "How residents get involved: block captains, sign-up nights at churches, barbershops and the A&T student union, free lessons before investing, pitch nights for new project ideas, and $10-a-month auto-invest."
    );
  }
  // =============================================================== 24. Sustainability
  {
    const s = slide("OTB_CONTENT", "The plan");
    title(s, "How OwnTheBlock pays for itself");
    const lines = [
      ["FaHandHoldingUsd", "2% raise fee", "About $2,880 per house, once"],
      ["FaHome", "2% of rent", "About $336 per house, per year"],
      ["FaLaptop", "Software licensing", "Land trusts, community developers and cities use the platform for their own properties"],
      ["FaSeedling", "Grants and impact investors", "Fund the lean pilot years"],
    ];
    for (let i = 0; i < 4; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 6.15, y = 1.65 + row * 1.95;
      card(s, x, y, 5.9, 1.7, C.background2, lines[i][1] + " card");
      await badge(s, lines[i][0], x + 0.3, y + 0.42, 0.85, i >= 2 ? C.accent2 : C.accent1, "FFFFFF", lines[i][1]);
      txt(s, lines[i][1], { x: x + 1.4, y: y + 0.25, w: 4.3, h: 0.45, fontSize: 19, bold: true, color: C.accent1 });
      txt(s, lines[i][2], { x: x + 1.4, y: y + 0.72, w: 4.3, h: 0.85, fontSize: 15 });
    }
    txt(s, "Fees alone need a few hundred homes to support a team. Licensing grows through partners without charging residents more.", { x: M, y: 5.75, w: W - 2 * M, h: 0.8, fontSize: 17, italic: true, bold: true, color: C.accent2 });
    s.addNotes(
      "Judges will ask how the company itself makes money. Be honest.\n\n" +
        "Deal fees are small: 2% of a $144,000 raise is $2,880 once, and 2% of $1,400 rent is $28 a month per house. The app's own growth model showed fees alone take about 10 years and roughly $5 million of funding to break even.\n\n" +
        "So the plan: run the pilot lean (about $10,000 a month) on grants, competition winnings and impact investors. Long term, the main revenue is software licensing: land trusts, community development corporations and city vacant-property programs already hold properties but have no way to take $10 investments from residents. OwnTheBlock becomes their engine for a monthly fee, which scales without charging residents more.\n\n" +
        "Option on the table: a 1% yearly asset fee is standard in real estate crowdfunding, but it would cut investor returns by about a point, a trade-off to decide carefully."
    );
  }
  // =============================================================== 26. Legal
  {
    const s = slide("OTB_CONTENT", "The plan");
    title(s, "Built to work inside today's rules");
    const items = [
      ["FaLandmark", "Regulation Crowdfunding", "Offerings run through an SEC-registered portal. Up to $5M a year per issuer; yearly limits protect smaller investors."],
      ["FaUniversity", "Bank escrow", "Investor dollars sit with a regulated escrow bank until the goal is met."],
      ["FaFileContract", "An LLC behind every house", "Ownership is standard U.S. law. A transfer agent keeps the official list, mirroring the chain."],
      ["FaIdCard", "Identity checks on everyone", "ID + selfie verification and sanctions screening. No personal data on the blockchain."],
      ["FaBalanceScale", "Fair housing", "Rules can favor local residents, never race or any protected class. Attorneys review every rule set."],
      ["FaLock", "12-month lockup", "Required by law and enforced in the token contract."],
    ];
    for (let i = 0; i < 6; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = M + col * 6.15, y = 1.55 + row * 1.6;
      await badge(s, items[i][0], x, y + 0.1, 0.75, C.accent1, "FFFFFF", items[i][1]);
      txt(s, items[i][1], { x: x + 0.95, y: y + 0.05, w: 4.95, h: 0.42, fontSize: 17, bold: true, color: C.accent1 });
      txt(s, items[i][2], { x: x + 0.95, y: y + 0.47, w: 4.95, h: 0.95, fontSize: 14 });
    }
    s.addNotes(
      "Keep regulation to about 20% of your talk. State it, show you've thought about it, move on.\n\n" +
        "Suggested wording: \"OwnTheBlock is a tool. Wide use will take regulatory oversight at the federal, state and local levels, just like selling a home already involves regulated parties who verify ownership and protect buyers' money. Our pilot starts inside existing rules: Regulation Crowdfunding through a registered portal, an LLC for each property, a regulated escrow bank, and identity checks on every investor.\"\n\n" +
        "Details if pressed: securities can't generally be resold for 12 months; after that, resale must go through a registered trading platform, so there's no do-it-yourself marketplace in the pilot. Crowdfunding raises above roughly $124,000 need accountant-reviewed financials (verify). Investors get a tax form each year (a K-1 from the LLC, or possibly a simpler 1099 if the fund is structured as a REIT; ask a CPA). A securities attorney reviews everything before any real money moves. Stablecoins like USDC are now federally regulated under the GENIUS Act (2025)."
    );
  }

  // =============================================================== 29. Credits
  {
    const s = slide("OTB_CONTENT", "Close");
    title(s, "Notes and photo credits");
    txt(s, [
      { text: "All projects, people and numbers in this deck are illustrative. Ms. Jenkins, Jasmine, Tasha and Marcus are composite characters, not real people. Financial figures are estimates for discussion, not investment advice, and should be verified with a securities attorney and a CPA.", options: { breakLine: true } },
    ], { x: M, y: 1.5, w: W - 2 * M, h: 1.0, fontSize: 14 });
    const credits = [
      "Neighborhood street: \"Santamonica Street\" by Jay Mantri, CC0 (StockSnap)",
      "Porch: \"Terrace Court, Danville, KY\" by w_lemay, CC BY-SA 2.0 (Flickr)",
      "Boarded houses: \"Boarded up houses on North Huron Street\" by chris.rycroft, CC BY 2.0 (Flickr)",
      "Duplex: \"Duplex in Seattle's West Woodland neighborhood\" by Sightline Institute, CC BY 2.0 (Flickr)",
      "Renovation: \"House Renovation 051\" by shister, CC BY 2.0 (Flickr)",
      "Restored house: \"John McAnulty House, Summit Avenue, Saint Paul, MN\" by w_lemay, CC BY-SA 2.0 (Flickr)",
      "Bungalow: \"Doctor Fenton Adams House, Latonia, Covington, KY\" by w_lemay, CC BY-SA 2.0 (Flickr)",
      "Barbershop: \"Barbershop\" by billackerman1, CC BY 2.0 (Flickr)",
      "Closing photo: \"C. Scott Chambers House, Walton, KY\" by w_lemay, CC BY-SA 2.0 (Flickr)",
    ];
    txt(s, credits.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < credits.length - 1 } })), { x: M, y: 2.65, w: W - 2 * M, h: 4.0, fontSize: 12, color: C.text1, paraSpaceAfter: 4 });
    s.addNotes("Photos are openly licensed stand-ins, not real OwnTheBlock properties. Swap in real Greensboro photos (with permission) when you have them, and keep the credits for any photos you keep.");
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
