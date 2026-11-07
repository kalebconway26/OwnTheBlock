# OwnTheBlock

A mobile-first app that lets neighborhoods collectively own the homes and businesses on their block.
**Status: Milestones 1 and 2 are done** (app shell, finance engine, Block Simulator). Everything runs on
fictional demo data with pretend money. No blockchain, accounts or real money yet.

## Run it

You need Node.js 20+.

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
npm test           # 26 tests: every worked example in spec section 6, plus the simulator
npm run build      # production build
```

### See it on your phone

The easiest way is to deploy it (free) and open the link on your phone:

```bash
cd apps/web
npx vercel login   # one time, opens a browser
npx vercel --prod  # prints a public https:// link
```

Then on your phone: open the link → **Share → Add to Home Screen** (iPhone, Safari) or
**⋮ → Install app** (Android, Chrome). It opens full-screen like a native app.

## The full demo (pretend money)

1. **Home → + $100 test dollars** (up to $500 a day, like the testnet faucet).
2. **Explore** → pick an open raise or the Neighborhood Fund → **Invest from $10**. Rules are enforced:
   $10 minimum, wallet balance, room left in the raise, the $2,500 yearly crowdfunding limit, and a
   cooling-off notice on a first investment over $100.
3. **Demo clock (+1 mo / +6 mo / +1 yr)**. Each month, neighbors invest too, raises complete or refund,
   houses renovate, tenants move in, and rent and revenue pay out with the spec's formulas. Planned bumps
   (a vacancy, a water heater, a roof) show payouts dipping honestly.
4. **Me**: wallet, claim payouts or auto-claim, value over time, holdings, and a **Money Trail** for every
   investment with on-chain and off-chain labels. **Reset demo** starts over.
5. **Simulate → Grow the app**: a 10-year projection of what happens if the app actually catches on
   (`lib/growth`). Includes investors, communities, homes, businesses, wealth created, tenant savings, jobs,
   and whether OwnTheBlock itself breaks even. Presets, stress tests and adjustable assumptions.

Your demo wallet is saved on the phone (localStorage), so it survives closing the app.

## What's in here

```
apps/web/
  app/                 screens (Next.js App Router)
    page.tsx           welcome carousel
    (tabs)/            Home · Explore · Simulate · Learn · Me
    project/[id]/      project detail + clickable invest flow (mock)
    learn/[slug]/      lesson player (cards + 3-question check)
    trace/ impact/     Money Trail and Community Impact
  components/sim/      Block Simulator: Street, MoneyFlow, Ledger, Story, Simulator
  lib/finance/         every formula from spec section 6, as pure tested functions
  lib/sim/             deterministic month-by-month simulation engine + "How is this calculated?"
  lib/demo.ts          fictional seed data (spec 8.6)
  lib/lessons.ts       7 lessons across 6 tracks
docs/spec.pdf          the original product spec
```

## Demo tips

- `/simulate` shows story mode the first time; tap **▶ Story** to replay it.
- Deep links for judges: `/simulate?month=36` jumps to year 3, `/simulate?amount=10&focus=homes`
  starts with $10 in a house. **Share this scenario** copies a link with your exact settings and events.

## Where this build differs from the spec (on purpose)

1. **Story step 4** said "500 neighbors do the same" after a $10 buy, but 500 × $10 = $5,000, not $150,000.
   It now says about 500 neighbors averaging $300 each.
2. **Business note value** uses a 20% risk-adjusted discount rate in the simulator instead of 10%. At 10%, a
   brand-new 1.4× note is valued above what you paid, showing an instant paper gain before a single payment.
3. **Neighborhood Fund income** counts only the profit part of business repayments (0.4 of every 1.4) as
   income. The rest is principal, which the fund redeploys.
4. **Vacancy allowance** (5% of rent) is saved into the reserve as a vacancy buffer. The spec deducts it but
   doesn't say where it goes.
5. **Simulator assumptions** the spec didn't define (all editable under "Assumptions"): neighbors invest the
   same starting amount as you plus $25/month, raises refund after 12 months, renovation takes 2 months,
   40% of investors live in the zip code.
6. Map is an illustrated SVG for now; Leaflet comes with Milestone 4.
7. Photos are openly licensed stand-ins (CC0 / CC BY / CC BY-SA via Openverse), credited on the in-app
   **Photo credits** page and in `apps/web/lib/photos.ts`. Swap in real Greensboro photos before a pitch.
   Keep the credits if you keep these photos.
8. **Design and tabs (Nov 4, 2026 redesign):** the look is "Navy & Gold" (navy `#14306B` brand, gold for earnings,
   green only for gains, Plus Jakarta Sans) instead of the spec's green/cream. The bottom tabs are Home, Explore,
   **Blockchain**, Learn, Account (the `/me` route) instead of Home, Explore, Simulate, Learn, Me. The Simulator
   (`/simulate`, `/simulate/grow`) is reached from cards on Home and Explore. The new Blockchain tab explains
   blockchain and shows proof from the recorded contract run (`npm run sync:chain` copies it into `lib/chain/run.json`;
   it is labeled "Test network" until a Base Sepolia deployment exists). Design: `docs/superpowers/specs/2026-11-04-app-redesign-design.md`.

## What the growth model says (base case, change the assumptions to test your own)

- With the spec's fees (3% raise fee + 2% of rent), OwnTheBlock breaks even around **year 10** and needs
  about **$5M** of startup funding first. In the slow scenario it never breaks even. 2% of $1,400 rent is
  $28 a month per home: too thin to pay a team.
- Adding a 1% yearly asset-management fee (common in real-estate crowdfunding) moves break-even much
  earlier, but it comes out of investor returns. That's a real trade-off to decide on.
- **Deal supply, not money, becomes the limit**: each neighborhood has only so many good homes, so growth
  means launching new communities.
- Projected investor return is about 8% a year (cash payouts + home appreciation − business losses).
