/**
 * "Level Up" lessons (spec 3.7): 2 minutes each, 3 to 5 cards plus a 3-question check.
 * Written at an 8th-grade reading level. Moved to MDX with Spanish in Milestone 6.
 */

export interface Lesson {
  slug: string;
  track: string;
  title: string;
  minutes: number;
  cards: { title: string; body: string }[];
  quiz: { q: string; options: string[]; answer: number; why: string }[];
}

export const TRACKS = [
  { id: "money", title: "Money basics", blurb: "Budgets, emergency funds, credit, compound interest" },
  { id: "investing", title: "Investing basics", blurb: "Risk vs return, diversification, yield" },
  { id: "realestate", title: "Real estate", blurb: "Rent, expenses, cap rate, LLCs" },
  { id: "business", title: "Business investing", blurb: "Revenue share, repayment caps" },
  { id: "blockchain", title: "Blockchain", blurb: "Wallets, USDC, smart contracts, gas" },
  { id: "safety", title: "Safety", blurb: "Scams, phishing, protecting your account" },
];

export const LESSONS: Lesson[] = [
  {
    slug: "what-is-a-blockchain",
    track: "blockchain",
    title: "What is a blockchain?",
    minutes: 2,
    cards: [
      { title: "A shared notebook", body: "A blockchain is a record of transactions that thousands of computers keep a copy of. Nobody owns the notebook, so nobody can secretly change it." },
      { title: "Blocks in a chain", body: "Every few seconds, new transactions are grouped into a block. Each block points to the one before it, so changing an old block would break the whole chain." },
      { title: "Why we use it", body: "When you buy a token of 1204 Sample St, the blockchain records it. Anyone can check it, and nobody can erase it, not even OwnTheBlock." },
      { title: "What it can't do", body: "A blockchain can't prove a house exists or make a tenant pay rent. Those real-world facts are proven with documents and audits, and we label them as off-chain." },
    ],
    quiz: [
      { q: "Who can change an old block on the blockchain?", options: ["OwnTheBlock", "The bank", "Nobody, realistically"], answer: 2, why: "Each block points to the one before it and thousands of copies exist, so changing history isn't practical." },
      { q: "What does the blockchain prove about 1204 Sample St?", options: ["That the roof is in good shape", "Who owns tokens and where payouts went", "That rent will always be paid"], answer: 1, why: "It records ownership and money movements. Physical facts are proven with documents." },
      { q: "How often are new blocks added on Base?", options: ["About every 2 seconds", "Once a day", "Once a month"], answer: 0, why: "Base adds a block about every 2 seconds, so your transaction confirms fast." },
    ],
  },
  {
    slug: "what-is-usdc",
    track: "blockchain",
    title: "What is USDC?",
    minutes: 2,
    cards: [
      { title: "A digital dollar", body: "USDC is a stablecoin: a digital token designed to always be worth $1. It's backed by cash and short-term U.S. government bonds held by its issuer." },
      { title: "Why not just dollars?", body: "USDC can move on the blockchain, so a smart contract can hold it in escrow and pay thousands of tiny owners automatically." },
      { title: "You only see dollars", body: "In OwnTheBlock your balance shows in dollars. Tap \"See it on the blockchain\" any time to see the USDC underneath." },
    ],
    quiz: [
      { q: "1 USDC is designed to equal…", options: ["$1", "Whatever the market says", "1 token of a house"], answer: 0, why: "Stablecoins are designed to hold a steady $1 value." },
      { q: "Why does OwnTheBlock use USDC?", options: ["It goes up in value", "Smart contracts can hold and pay it automatically", "It's anonymous"], answer: 1, why: "Programmable dollars let contracts handle escrow and payouts." },
      { q: "Do you need to buy ETH to use OwnTheBlock?", options: ["Yes, for gas", "No, OwnTheBlock pays the fees", "Only to sell"], answer: 1, why: "A paymaster sponsors gas fees, so you never need ETH." },
    ],
  },
  {
    slug: "what-is-yield",
    track: "investing",
    title: "What is yield?",
    minutes: 2,
    cards: [
      { title: "Yield is the cash an investment pays", body: "Yield is the yearly cash an investment pays you, divided by what you put in. If $100 pays you $6.80 a year, that's a 6.8% yield." },
      { title: "1204 Sample St's yield", body: "The house pays out $850 a month after bills. 12 × $850 ÷ $150,000 raised = 6.8% a year." },
      { title: "Yield is an estimate", body: "A month with no tenant pays $0. A big repair can pause payouts. That's why every yield in the app is a range, not a promise." },
      { title: "Small numbers, real ownership", body: "$10 earns about $0.68 a year. Wealth comes from stacking: adding regularly, reinvesting, and owning more over time." },
    ],
    quiz: [
      { q: "$200 invested pays $12 a year. What's the yield?", options: ["6%", "12%", "2%"], answer: 0, why: "$12 ÷ $200 = 0.06 = 6%." },
      { q: "What happens to yield in a month the house is empty?", options: ["It stays the same", "It drops to $0 that month", "OwnTheBlock covers it"], answer: 1, why: "No rent means no payout. The reserve covers the bills, not your payout." },
      { q: "Is the yield shown guaranteed?", options: ["Yes", "No, it's an estimate"], answer: 1, why: "Every projection is an estimate. You can lose money." },
    ],
  },
  {
    slug: "risk-vs-return",
    track: "investing",
    title: "Risk vs return & diversification",
    minutes: 2,
    cards: [
      { title: "More return usually means more risk", body: "The barbershop pays more than the house, but a business can close. Higher possible returns come with higher chances of losing money." },
      { title: "Don't put all your eggs in one basket", body: "Diversification means spreading your money out. If one project has a bad year, the others soften the hit." },
      { title: "The Neighborhood Fund", body: "One fund token spreads your money across every project on the block. Try \"Business closes\" in the simulator to see the difference." },
      { title: "Only invest what you can lose", body: "Keep an emergency fund first. OwnTheBlock checks in if you invest more than 10% of your monthly income." },
    ],
    quiz: [
      { q: "Which usually has more risk?", options: ["A rental home", "A small business revenue share", "A savings account"], answer: 1, why: "Small businesses can close; homes and savings tend to be steadier." },
      { q: "Diversification means…", options: ["Spreading money across many investments", "Putting it all in the best one", "Trading every day"], answer: 0, why: "Spreading out reduces the damage any one loss can do." },
      { q: "Before investing, you should have…", options: ["A credit card", "An emergency fund", "Crypto"], answer: 1, why: "An emergency fund means you won't need to sell at a bad time." },
    ],
  },
  {
    slug: "revenue-share",
    track: "business",
    title: "How revenue share works",
    minutes: 2,
    cards: [
      { title: "A slice of sales, not of the shop", body: "With revenue share, investors get a fixed percentage of monthly sales (5% for Corner Cuts) instead of owning part of the business." },
      { title: "The cap", body: "Payments stop once investors get back a set multiple, like 1.4×. Corner Cuts raised $25,000, so it repays up to $35,000. Then Marcus owns 100% again." },
      { title: "Busy months, slow months", body: "At $16,667 in monthly sales, the shop pays about $833 a month and hits the cap in about 42 months. If sales drop 25%, it takes about 56." },
    ],
    quiz: [
      { q: "Corner Cuts raised $25,000 with a 1.4× cap. Max total repaid?", options: ["$25,000", "$35,000", "No limit"], answer: 1, why: "$25,000 × 1.4 = $35,000." },
      { q: "If sales go down, payback takes…", options: ["Less time", "More time", "The same time"], answer: 1, why: "Smaller sales mean smaller monthly payments." },
      { q: "Who owns the barbershop?", options: ["The investors", "Marcus, 100%", "OwnTheBlock"], answer: 1, why: "Revenue share is not ownership. Marcus keeps all of it." },
    ],
  },
  {
    slug: "spot-a-scam",
    track: "safety",
    title: "How to spot a scam",
    minutes: 2,
    cards: [
      { title: "Nobody legit asks for your code", body: "OwnTheBlock will never text, DM or call you asking for a login code, password or recovery key. Anyone who does is a scammer." },
      { title: "Guaranteed returns = red flag", body: "Real investments can lose money. If someone promises you'll double your money, walk away." },
      { title: "Urgency is a trick", body: "\"Act now or miss out!\" is how scammers rush you. Real opportunities give you time to think." },
      { title: "Check the address", body: "Only use the official OwnTheBlock app and website. Scam sites copy logos and change one letter in the address." },
    ],
    quiz: [
      { q: "Someone DMs you as \"OwnTheBlock support\" asking for your login code. You…", options: ["Send it", "Ignore and report it", "Send half of it"], answer: 1, why: "Nobody legit will ever ask for your code." },
      { q: "\"Guaranteed 50% returns\" is…", options: ["A great deal", "A red flag"], answer: 1, why: "Real investments carry risk. Guarantees are a scam sign." },
      { q: "A message says you must invest in the next 10 minutes. That's…", options: ["Normal", "A pressure tactic"], answer: 1, why: "Scammers create urgency so you don't stop to think." },
    ],
  },
  {
    slug: "cap-rate-noi",
    track: "realestate",
    title: "Rent, expenses & NOI",
    minutes: 2,
    cards: [
      { title: "Rent isn't profit", body: "1204 Sample St rents for $1,400, but bills come first: management, taxes, insurance and repairs." },
      { title: "Where the $1,400 goes", body: "$70 vacancy buffer, $112 management, $140 repair reserve, $28 platform fee and $200 taxes + insurance. What's left, $850, goes to token holders." },
      { title: "NOI and cap rate", body: "Net operating income (NOI) is yearly rent minus operating costs. Cap rate = NOI ÷ property value. It helps compare houses fairly." },
    ],
    quiz: [
      { q: "Of $1,400 rent, how much goes to token holders?", options: ["$1,400", "$850", "$140"], answer: 1, why: "$1,400 − $350 in rate-based costs − $200 taxes + insurance = $850." },
      { q: "The repair reserve is for…", options: ["Surprise repairs like a roof", "Extra payouts", "Platform profit"], answer: 0, why: "10% of rent is saved for repairs so one bad month doesn't sink the house." },
      { q: "Cap rate is…", options: ["Rent ÷ tokens", "NOI ÷ property value", "Price × 12"], answer: 1, why: "It shows the yearly return of a property before financing." },
    ],
  },
];

export const lessonBySlug = (slug: string) => LESSONS.find((l) => l.slug === slug);
