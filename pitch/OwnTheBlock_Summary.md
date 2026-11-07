# OwnTheBlock: Full Project Summary (as of Nov 3, 2026)

Founder: Kaleb Conway (finance student, learning blockchain development)
Tagline: "Fix the block. Own the block."
One-liner: A phone app that lets neighbors pool small amounts, from $10, to buy, fix and own the homes on their own block, with ownership, payouts and community rules enforced by smart contracts on Base (Coinbase's blockchain).

---

## 1. The competition

- Event: Own Your Future Challenge, live pitch at the Annual HBCU AI & Fintech Conference, Nashville, TN
- When/where: Tuesday, Nov 10, 2026, 9:40-10:25 AM ET, Seagrass/P01 room, Margaritaville Hotel
- Format: 8 minutes total = 5 min presenting + 3 min Q&A
- Organizer contact: Jade Kim
- Due to Jade: arrival/departure flight details + presentation slides by Sunday, Nov 8, 2026
- Networking dinner: Monday, Nov 9 (courtesy of Base 11), details pending from Jade

### Judging rubric (100 points)
| Section | Points | What judges want |
|---|---|---|
| Problem Articulation | 5 | Clear, precise problem; critical elements identified |
| Appropriate use of Blockchain | 20 | Why blockchain is uniquely suited; "not all problems can be fixed with blockchain" |
| Action Plan | 20 | Objectives, resources, budget, timeline, backed by evidence |
| Feasibility | 15 | Key risks and complexities identified, with mitigations |
| Innovation | 15 | New concepts or established techniques used in a new way |
| Benefits | 15 | Social impact, scalability, originality, alignment with Coinbase's mission |
| Pitch | 10 | Content quality, mastery of subject, staying within the time limit |

Coinbase's mission: "increase economic freedom in the world."

---

## 2. The problem

- Story: Ms. Jenkins (composite character), 40 years on her block in East Greensboro. The house next door is vacant: the owner died, heirs live out of state, can't afford repairs, no bank will lend on a boarded-up house. Out-of-town investors make cash offers; rents rise and profits leave the neighborhood. Neighbors would chip in, but there's no way to turn $10 here and $50 there into owning a house.
- Data: U.S. homeownership is ~45% for Black households vs ~74% for white households (Census Housing Vacancies and Homeownership Survey; confirm latest quarter). A home is most families' largest asset, so the 29-point ownership gap becomes a wealth gap passed down.
- Who it hurts: long-time residents of Black neighborhoods near HBCUs (e.g., East Greensboro around NC A&T and Bennett).
- Root cause: ownership requires a down payment, credit and one big check. Pooling many small checks has been too costly to run.
- Problem statement: Neighbors have the will and small amounts of money, but no way to pool it into ownership, so outsiders decide what happens to their block.
- Heirs' property: when an owner dies without a will, every heir inherits a share and all must agree before the house can be sold, fixed or borrowed against.

### Why existing options fail
- Banks: need a down payment, good credit and a livable house.
- $10-$100 real estate apps (Arrived, Fundrise): pool small investors from anywhere into homes anywhere; the block gets no say.
- Neighbors on their own: tracking and paying 1,000 tiny owners each month costs more than the payouts.

---

## 3. The solution

About 1,250 neighbors, students, alumni and churches put in $10-$2,000 each on their phones to raise $144,000 to buy and fix one house. The heirs get a fair price, local contractors fix it, a local family rents it with a path to buy, and every investor owns a piece, votes on the rules and gets paid monthly.

### Four steps
1. Raise: neighbors buy $10 tokens. Residents get the first 7 days, then students/alumni, then any verified U.S. investor. If the goal isn't met, everyone is refunded automatically (all-or-nothing). 48-hour cancel right before deadline.
2. Buy & fix: the house's LLC buys at the as-is appraisal (rule: never pay above it). Contractors paid in inspected stages.
3. Rent & pay: a licensed property manager leases to a local family. Net rent is paid to every owner monthly.
4. Govern & exit: owners vote on the Community Charter. Tenant can buy the home in years 3-7 (lease-purchase).

### Legal structure
- One LLC per house. People can't legally own 1/14,400th of a house, but an LLC can own the house and have thousands of members.
- 1 token = 1 LLC membership unit. 14,400 tokens x $10 = $144,000. Investors can't lose more than they put in.
- OwnTheBlock manages the LLC. A local steward (neighborhood association, church, land trust or the city) holds a seat and must co-sign every payment.
- Raise is done under SEC Regulation Crowdfunding (Reg CF) via a registered funding portal; Form C filed with the SEC. Escrow agent holds money during the raise; SEC-registered transfer agent keeps the official owner list (mirrors the chain). 12-month resale lockup. After 12 months, resale only through a registered trading platform.
- No pooled multi-house fund until securities counsel approves (could be treated as an investment company, which Reg CF excludes).

### Community Charter rules (enforced in code)
- Max 2% of tokens per person ($2,880)
- Local-ownership floor checked on every transfer
- Rent increases capped at 3% per year
- Steward co-signs every payment
- Rule changes need a 2/3 supermajority vote + 30-day wait; residents' votes count 1.5x; steward can veto changes to the rent cap and reserve
- Rules favor residency, never race or any protected class; attorney reviews every Charter

---

## 4. Why blockchain (the 20-point argument)

Two reasons a database can't do this:
1. Payout math: a $100 owner earns $0.49/month. Paying 1,440 owners by bank ACH at ~$0.20-$0.50 each costs $288-$720/month, eating 41-100%+ of a $700 payout. On Base, the manager makes ONE deposit and the contract splits it among every owner; each claim costs under 1 cent (measured 67,067 gas per claim), and the platform's paymaster covers it, so owners pay $0 (~$14/month total for 1,440 claims).
2. Trust: whoever runs a database can change the rules. Here the rent cap, ownership limits and local share live in the contract and change only by 2/3 vote + 30-day timelock.

Also: every transfer automatically checks ID, 2% cap and local share; every payment is traceable on a public ledger; two keys on the house's money (manager proposes, steward co-signs); tenant's on-time rent history recorded on-chain, portable to a lender.

Answer to "Why not just a database?": "A database could store the list. It can't make tiny payments cheap, and it can't stop its own operator from changing the rules."
Answer to "Aren't you still using a bank?": "Yes, for the parts the law requires: an escrow agent during a raise and a transfer agent for the official list, which mirrors the chain. Blockchain runs everything after that."

---

## 5. What's been built

### App (owntheblock/apps/web): Next.js 16 PWA
- Milestone 1 (done): 5-tab app shell, design system, finance library (all formulas, tested), seed data
- Milestone 2 (done): Block Simulator sandbox (street view, money flow, ledger, results, impact, story mode, compare mode, "How is this calculated?")
- Extra (done): full pretend-money demo (faucet, invest, escrow, demo clock, payouts, claims, Money Trail) + "Grow the app" scale projection; real photos with credits
- Run locally at localhost:3000
- Milestones 4-6 (not started): Smart Wallet login, paymaster, real invest/claim, indexer; on-chain Money Trail/governance; rent-to-own, owner dashboard, admin console, Spanish, accessibility, end-to-end tests

### Smart contracts (owntheblock/contracts): Milestone 3 in progress
Hardhat, Solidity 0.8.24, OpenZeppelin 5. 5 contracts, 22/22 tests passing:
1. IdentityRegistry: records verified wallets ("verified", "local resident", anonymous person number); no personal data on-chain
2. Raise: all-or-nothing Reg CF-style sale, residents-first window, 48-hour cancel, auto refunds
3. BlockToken: LLC units with Charter rules, 12-month lockup, 2% cap, local floor, pull-based monthly rent payouts, 3% rent cap
4. Treasury: manager proposes payment with invoice fingerprint; steward must approve
5. CharterGovernor: token-weighted voting (snapshot at proposal), residents 1.5x, 2/3 supermajority, 30-day wait, steward veto
Plus MockUSDC test token.

Demo script replays Ms. Jenkins' story end to end (38 transactions on a local Hardhat chain): resident commits $2,000; out-of-town investor blocked before residents' window ends; raise closes; steward co-signs $3,000 roof payment; one $700 rent deposit pays every owner; Jasmine claims payout. BLOCKED by code: sale during lockup, 10% rent increase, rule change before 30-day wait.

Status: Base Sepolia (public testnet) deploy is ready but blocked; the deployer wallet has 0 test ETH. Fund it and the deck auto-updates to "live" with a QR code to the block explorer.

---

## 6. The numbers (one house)

### Uses of the $144,000 raise
| Item | Amount |
|---|---|
| Purchase at as-is appraisal | $90,000 |
| Repairs ($35,000) + 15% contingency | $40,250 |
| Closing costs + repair reserve | $5,110 |
| Legal, CPA review, crowdfunding portal | $5,760 |
| OwnTheBlock raise fee (2%) | $2,880 |
| Total (14,400 tokens at $10) | $144,000 |

- After-repair value: $150,000 = $10.63 of value behind each $10 token on day one
- Monthly rent $1,400 minus: vacancy 5% ($70), management 8% ($112), repair reserve 10% ($140), platform 2% ($28), taxes & insurance (~$270), admin (~$80) = $700/month net to owners = $8,400/yr = 5.8% cash yield
- $700 / 14,400 tokens = 4.9 cents per token per month
- Jasmine (A&T student) invests $100 = 10 tokens = $0.49/month. After 5 years at 3% appreciation: ~$116 at exit + ~$29 payouts = ~$145 (~8.7%/yr estimated, not guaranteed)
- Downside: a ~25% value drop is roughly break-even; bigger shocks are losses
- Why distressed homes: buying a $132,000 house at full price means a $175,500 raise, each token starts at only $8.55 of value and returns ~3.5% (below a savings account). Rescuing eyesores returns ~8.5%. The mission and the math point the same way.

### Filling the raise (~1,260 investors)
| Group | Investors | Avg | Total |
|---|---|---|---|
| Alumni & supporters | 540 | $150 | $81,000 |
| Churches & local orgs | 19 | $2,000 | $38,000 |
| Residents | 300 | $50 | $15,000 |
| A&T / Bennett students | 400 | $25 | $10,000 |
| Total | 1,259 | | $144,000 |

### Impact at scale (target: 100 communities x 5 homes)
- 500 families housed at capped rents
- $72M of homes owned by their neighborhoods (500 x $144K)
- $4.2M/yr of rent income staying local (500 x $700 x 12)
- 600K+ ownership stakes, most of them first investments
- Plus repaired homes, local contractor jobs, a public money trail

### Business model
- 2% of each raise ($2,880/house) + 2% of rent (~$336/house/yr)
- Main scale plan: license the platform to land trusts, community development corporations and cities that already own properties (deal fees alone need a few hundred homes to cover a team)
- Investors' house money never pays for the company; it goes from escrow to the house's LLC

---

## 7. Action plan & budget

### Timeline (prove one house in 18 months)
- Done: demo app, Block Simulator, 5 contracts, 22 tests, end-to-end test-chain demo. Success = prototype works
- Months 0-3 (set up): form company, hire securities counsel, Smart Wallet + paymaster in app, independent security audit, sign a steward and a Reg CF portal. Success = audit passed, steward signed
- Months 3-9 (first raise): find house via city/county surplus or heirs' property family, file Form C, raise $144,000 from ~1,250 people. Success = raise fully funded
- Months 9-18 (first payouts): close, renovate, lease to a local family, monthly payouts on Base mainnet, houses 2-3 + one local business. Success = 3 homes, 12 on-time payouts
- Years 2-3 (scale): license to land trusts and CDCs, 5 cities starting with HBCU communities. Success = 25 homes, break-even path
- Legal and security work comes BEFORE any real money moves.

### Pilot budget: $180,000 for 18 months
| Line | Amount |
|---|---|
| Team stipends (part-time) | $65,000 |
| Securities attorney (LLC, Form C, Charter) | $35,000 |
| Independent smart contract audit | $30,000 |
| CPA ($10K), portal/transfer agent ($8K), insurance ($8K) | $26,000 |
| Outreach & money lessons ($15K), app/hosting/gas/ID checks ($9K) | $24,000 |
| Total | $180,000 |
Typical ranges: first Reg CF counsel $20-50K; audit $15-50K. ~$10K/month burn.

Funding: grants & competitions incl. Base Builder grants ($50K), CDFI or bank Community Reinvestment Act program ($50K), impact angels ($80K).

### Partners being pursued (none signed yet)
- Steward: neighborhood association, church or community land trust
- Deal pipeline: City of Greensboro / Guilford County surplus homes; heirs' property legal aid
- Regulated rails: Reg CF funding portal, SEC-registered transfer agent, escrow bank
- First-loss capital: CDFI or bank earning CRA credit (covers first 10% of losses)
- Campus: NC A&T and Bennett students and alumni networks
- Base ecosystem: Base Builder grants, Coinbase Developer Platform
- Advisors to recruit: securities attorney, Greensboro real-estate broker, CPA

### Coinbase stack
| Component | Purpose | Status |
|---|---|---|
| Base | Low fees make 49-cent payouts possible | Built (test chain) |
| USDC | Payouts in digital dollars | Built (test USDC) |
| Smart Wallet | Face ID login, no seed phrase | Next 90 days |
| Paymaster | We pay network fees | Next 90 days |
| Onramp/Offramp | Fund from / cash out to bank | Next 90 days |
| Coinbase Verifications | Reusable on-chain ID check | Evaluating |
Stablecoins are federally regulated under the GENIUS Act (2025). The house, not the token, is the asset.

---

## 8. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Can't fill a $144K raise | ~1,260 investors across 4 groups; all-or-nothing refunds; alumni window opens day 8 |
| Securities law | Reg CF via registered portal; one LLC per house; 12-month lockup in code |
| Code bug or hack | 22 tests + independent audit before real money; two keys on every payment; transfer agent's list as backup; lost wallets recoverable via ID |
| Repairs run over / tenant leaves | 15% repair cushion, staged payments, 5% vacancy cushion, 10% reserve |
| Home values fall | Buy below repaired value, no mortgage, long hold, first-loss partner covers first 10% |
| Rules seen as excluding people | Rules favor residency, never race or protected class; attorney reviews every Charter |
| Not enough houses | City/county surplus and heirs' property partners, not open-market bidding |

---

## 9. Competitive landscape (innovation)
- Arrived, Fundrise: small minimums, no blockchain, no community control
- RealT, Lofty: tokenized rentals on blockchain, small minimums, but global owners; Lofty has partial voting; nothing keeps ownership local or protects tenants
- Community Investment Trust (Portland, OR): neighbors invest $10-$100/month in a local commercial building; closest in spirit, but no blockchain, commercial only
- Community land trusts: long-term affordability, but residents can't invest small amounts; no on-chain transparency
- OwnTheBlock's new combination: residents-first ownership with per-person caps and local floor on every transfer + Community Charter only a supermajority can change + lease-purchase path for the tenant + deal pipeline focused on distressed and heirs' property
- Verify competitors' current features before presenting.

---

## 10. Deliverables created
- OwnTheBlock_5min_Pitch.pptx (Downloads): 8 main slides + 4 appendix, corporate banking style (navy/gold, serif headlines, full-sentence action titles, source lines, native charts and tables), with full script in speaker notes. Build script: owntheblock/docs/pitch-build.js
- OwnTheBlock_Story_Deck.pptx (Downloads): earlier 19-slide story deck + appendix. Build script: owntheblock/docs/deck-build.js
- 24-page OwnTheBlock Playbook PDF (Downloads); source: owntheblock/docs/playbook.html
- Product spec: owntheblock/docs/spec.pdf

### 5-minute deck structure
| # | Slide | Time | Rubric |
|---|---|---|---|
| 1 | Cover + Ms. Jenkins hook | 0:00-0:40 | Problem |
| 2 | Problem (chart + root cause) | 0:40-1:00 | Problem (5) |
| 3 | Solution (4 steps, LLC structure, Charter) | 1:00-1:40 | Benefits |
| 4 | Why blockchain (payout cost chart + trust table) | 1:40-2:35 | Blockchain (20) |
| 5 | Proof it works (5 contracts, 22 tests, demo results) | 2:35-3:00 | Blockchain/Feasibility |
| 6 | Innovation & impact (competitor matrix + scale) | 3:00-3:40 | Innovation (15), Benefits (15) |
| 7 | Action plan & budget | 3:40-4:25 | Action Plan (20) |
| 8 | Risks & the ask | 4:25-5:00 | Feasibility (15) |
Appendix: A one-house economics, B filling the raise, C resources/partners, D Coinbase stack.

---

## 11. Five-minute script (~620 words)

1. Hook: "Walk two blocks from A&T and count how many homes are owned by people who live there. Meet Ms. Jenkins: forty years on the same block in East Greensboro. The house next door is boarded up. The heirs live out of state, can't afford repairs, and no bank will lend on it. Then the cash offers start from out-of-town investors. Her neighbors would gladly chip in, but there's no way to turn $10 here and $50 there into owning a house."

2. Problem: "Black homeownership is 45%; white homeownership is 74%. Homes are how families build wealth, so that gap gets passed down. The problem: neighbors have the will and small amounts of money, but no way to pool it into ownership, so outsiders decide what happens to their block."

3. Solution: "OwnTheBlock lets about 1,250 neighbors, students, alumni and churches put in $10 to $2,000 each on their phones: $144,000 to buy and fix one house. Each $10 token is one unit of an LLC that owns the deed. Residents go first, and no one can own more than 2%. A local family rents it with a path to buy it. Every owner votes on the rules and gets paid every month."

4. Why blockchain (slow down): "Why does this need a blockchain? Two reasons. First, the payments. A $100 owner earns 49 cents a month. A bank transfer to each of 1,440 owners costs 20 to 50 cents, so fees eat most of the payout. On Base, the manager makes one deposit and the contract splits it for everyone. Each claim costs under a cent, and we cover it. Second, trust. Whoever runs a normal database can change the rules. Our rent cap, ownership limits and local share are written into the code; changing them takes a two-thirds vote and a 30-day wait. Every payment needs a community steward's co-signature, and anyone can trace every dollar on a public ledger."

5. Proof: "This isn't a slide. We've written five smart contracts with 22 automated tests passing, and ran Ms. Jenkins' whole story on a test blockchain. The code refused an early sale, a 10% rent hike, and a rushed rule change."

6. Innovation & impact: "Others do pieces of this. Fundrise has small minimums but no community control; RealT and Lofty put homes on a blockchain, but owners are global. Nobody keeps ownership local, writes the community's rules into code, and gives the tenant a path to own. At 100 communities with 5 homes each, that's $72 million of homes owned by the neighborhoods around them and $4.2 million a year in rent staying local. It fits Coinbase's mission: increase economic freedom, starting with the block you live on."

7. Plan: "Our plan proves one house in 18 months. Months 0-3: securities attorney, independent security audit, sign a steward and a crowdfunding portal. Months 3-9: source a house from city surplus or an heirs'-property family and run the raise under SEC crowdfunding rules. Months 9-18: renovate, lease, start monthly payouts, then houses two and three. The pilot costs $180,000, mostly legal, audit and team stipends. Each house is paid for by its own raise, never this budget."

8. Risks & ask: "Our biggest risks are filling the raise, securities law and code bugs. We handle them with all-or-nothing refunds, a registered crowdfunding portal, and an audit before any real money moves. Our ask: a steward partner, $180,000 for the pilot, and mentorship from Base. Ms. Jenkins doesn't have to leave. Fix the block. Own the block. Thank you."

---

## 12. Q&A prep (3 minutes)
- Why not a database? A database can store the list, but it can't make 49-cent payments cheap or stop its own operator from changing the rules.
- Is this legal? Each house's LLC raises under Reg CF through a registered portal, with a 12-month lockup built into the code.
- 49 cents is nothing / how does $45 in 5 years close a wealth gap? Her $45 isn't the impact. The house, its rent and its rising value stay owned by the neighborhood, a tenant becomes a homeowner, and a thousand people make their first investment. Returns grow as people keep investing.
- Can you really raise $144K? 300 residents x $50, 400 students x $25, 540 alumni x $150, 19 churches/orgs x $2,000. Missed goal = automatic refunds.
- How do you make money? 2% of each raise, 2% of rent, then platform licensing to land trusts, CDCs and cities.
- What if the house loses value? Bought below repaired value, no mortgage, first-loss partner covers the first 10%; ~25% drop is roughly break-even.
- Isn't this gentrification with extra steps? Residents buy first, rent is capped at 3%/yr in code, and the tenant can buy the home; profits stay local instead of leaving.
- How do you stop outsiders taking over? 2% per-person cap and local-ownership floor checked on every transfer, residents' votes count 1.5x.

---

## 13. To-do before Nov 8-10
- [ ] Email Jade: slides + arrival/departure flight details by Sunday, Nov 8
- [ ] Confirm latest Census homeownership figures (45% / 74%)
- [ ] Get a real bank quote for ACH per-payment fees (strengthens slide 4)
- [ ] Add teammates or a credential line to the team slide (Appendix C)
- [ ] Optional: add one local Greensboro stat (vacant/condemned homes in East Greensboro, or investor share of sales in 27405/27406)
- [ ] Optional: fund deployer wallet with test ETH to deploy on Base Sepolia (makes slide 5 "live" with QR code)
- [ ] Optional: get one real reply from a steward/city contact to cite
- [ ] Verify competitors' current features
- [ ] Rehearse with a timer; finish at 4:45
