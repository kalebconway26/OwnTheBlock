# OwnTheBlock app redesign: "Navy & Gold" fintech look + Blockchain tab

Date: 2026-11-04 · Owner: Kaleb Conway · Status: draft for approval

## Intent (the why)

Kaleb pitches OwnTheBlock live on Nov 10, 2026 (Own Your Future Challenge, HBCU AI & Fintech Conference). The app
works but looks like a student project (cream background, green cards). He wants it to look like a real
fintech app, organized and professional like Coinbase or Robinhood, so that "when people open it they just
know it is legit." It must still feel like its own app, not a copy-paste of Coinbase.

He also wants a new section that explains how blockchain works and how OwnTheBlock uses it, because "Appropriate
use of Blockchain" is the biggest score on the judging rubric (20/100).

## Goals

1. Restyle every screen in the "Navy & Gold" direction Kaleb picked (mockup `twist.html`, option 1).
2. Home screen modeled on Coinbase's portfolio view: balance up top, chart, then what you've invested in.
3. Keep property photos everywhere they appear today (thumbnails in lists, large photo on featured and detail screens).
4. New **Blockchain** tab with two parts: "How it works" and "How we use it" (incl. live proof). Approved mockup: `blockchain-tab.html`.
5. Keep the **Learn** section, the **Simulator** (both "My block" and "Grow the app") and the **Impact** page. Kaleb explicitly asked for all three.
6. Organized: clear sections, consistent cards, a searchable Explore.

## Non-goals

- No change to money logic, the simulator engine, `lib/finance`, `lib/sim`, `lib/world` or `lib/growth` behavior. This is a visual and navigation redesign plus one new tab.
- No real wallet / testnet wiring (that is Milestone 4). No dark mode.
- No new lessons beyond what the Blockchain tab links to (existing lessons may be linked).

## Anti-goals (would make this a failure even if it works)

- Looks like Coinbase or Robinhood copy-paste: their exact blue (#0052FF) or green (#00C805), their logo shapes, or their wording.
- Claims that aren't true: labeling anything "live on Base" or "LIVE" while contracts only ran on a local test chain. Use "Test network" until a real Base Sepolia deployment exists.
- Breaking any existing flow (invest, claim, demo clock, faucet, vote, lessons, simulator) a week before the pitch.
- Losing the property photos.

## Constraints

- Next.js 16 App Router, Tailwind v4, framer-motion, recharts (existing stack; see `apps/web/AGENTS.md` and the Next 16 docs in `node_modules/next/dist/docs/` before using new APIs). `cacheComponents` is on: no `export const dynamic`.
- Design tokens live in `app/globals.css`; components read tokens, not hard-coded hex.
- The UI never computes money itself; it renders `lib/finance` / `lib/sim` / `lib/world` output.
- Every existing test must still pass (`npm test` in `apps/web`).
- Phone-first PWA (existing `max-w-md` layout). Must look right at 375px wide; on desktop it stays a centered phone-width column.
- WSL machine has ~7 GB RAM: one build or browser at a time.
- Accessibility: text contrast WCAG AA, tap targets ≥ 44px, `aria-current` on active tab (existing behavior kept).
- Deadline: usable by Sun Nov 8 (slides due), polished by Nov 10.

## The look (decided by Kaleb)

From the approved mockup (`.superpowers/brainstorm/.../content/twist.html`, option 1 "Navy and gold"):

- Layout language of Coinbase (option B): white background, soft gray rounded cards, pill/rounded buttons, generous spacing.
- Colors: deep navy primary `#14306B`; gold `#D9A21B` for everything you **earn** (rent income, payouts, Claim); green `#0F8A5F` only for positive change (▲); red/brick for negatives, refused and blocked actions; ink `#0C1526`; muted `#5D6678`; card `#F4F6FA`; line `#E7E9EF`. (Gold as text on white must meet AA: use a darker gold ink, e.g. `#8A6400`, for small gold text; bright gold for fills/large numbers.)
- "Block" logo mark: a 2×2 grid of small rounded squares in navy, the bottom-right one gold, next to the wordmark "OwnTheBlock".
- Rounded-square motif (radius ~10-16px) for icons, photo thumbnails, buttons and tab icons.

## Navigation (decided by Kaleb)

Bottom tab bar, 5 tabs: **Home · Explore · Blockchain · Learn · Account**. No raised center button (today's
center "Simulate" button goes away from the bar, but the Simulator stays; see below).

## Screens

### Home (approved mockup)
Top: logo + two icon buttons (notifications, search). "Portfolio balance", big number, "▲ $X (Y%) all time" in green.
Area chart of portfolio value from `w.history` with range buttons 1M · 3M · YTD · 1Y · ALL (selected one is a navy pill;
ranges are in demo months). Two tiles: "Rent income / month" (gold) and "Cash". Button row: **Invest** (navy) · **Add cash**
(today's "+ $100 test dollars") · **Claim $X** (only active when something is claimable). Then "Your properties" (photo
thumbnail, name, tokens · stage, value, % change), "Raising now" featured card with large photo and progress bar,
Activity, the demo clock, and entry cards to the Simulator and Impact page (see below). Empty state for a new user
keeps today's "How to try the demo" steps, restyled.

### Explore
Same content as today (Greensboro projects, Community Pitch Board) reorganized like a markets screen: a search field at the
top, filter chips (All · Raising · Renting · Businesses · Fund), then a clean list/grid of properties, each with its photo.
Keeps the Pitch Board as its own section.

### Property page + Invest flow
Large hero photo, name and neighborhood, key numbers in a tidy stat grid, the existing rent/revenue chart restyled
navy, Risks and Documents as clean list sections, sticky navy **Invest** button. Invest flow keeps every step and rule;
restyled only.

### Blockchain (new tab; approved mockup `blockchain-tab.html`)
Title "Blockchain", subtitle "Why you can trust OwnTheBlock without trusting us." A segmented toggle:

1. **How it works**: navy hero card "A shared record nobody can secretly edit" with a small chain-of-blocks graphic
   (each block shows a real-looking entry like "rent $700", "claim $0.49", "vote ✓"); then 4 numbered steps:
   everyone has the same copy · blocks are chained (changing one breaks the rest) · smart contracts are rules that run
   themselves · anyone can check. Then "Why not a regular bank database?" and a link to the matching lesson in Learn.
2. **How we use it**: three proof numbers (cost per payout "<1¢", owners paid in one deposit, rules broken "0"); the 5 contracts in plain
   English (ID check, The raise, Ownership tokens, Two-key treasury, Community votes), each with a status tag; tapping one
   opens a sheet with what it does, the exact rule it enforces, and examples of times it said no. Below: **Live proof**,
   a feed of transactions (green dot "Done", red dot "Blocked") with short hashes, the bank-database-vs-blockchain
   comparison table (rules · cost to pay owners · seeing where money went), and a "View on block explorer" button.

Data source for proof (honesty rule above): the recorded end-to-end contract run in
`contracts/deployments/hardhat.json` (or `baseSepolia.json` once it exists), copied into the app as static data at build
time or imported as JSON, plus the user's own demo-world transactions. Status tags read "Test network" for the local run
and "Live on Base Sepolia" only when the Base Sepolia file exists. The explorer button is shown only for Base Sepolia.

### Learn
Keep all lessons and progress. Restyle as an organized course list (cards with progress, rounded-square icons), and
add or link a "Blockchain basics" entry that the Blockchain tab points to.

### Account (today's "Me")
Wallet, value-over-time chart, allocation donut, holdings, all activity, rent-to-own view: same content, restyled into
clean sections. Links to Money Trail and Credits.

### Simulator and Impact (kept, per Kaleb)
Both stay as full pages with their current features (Simulator: "My block" + "Grow the app" toggle; Impact: community
impact). Restyled to match. Since Simulate leaves the tab bar, they are reached from clear entry points; see builder
notes for placement.

### Welcome / onboarding (`app/page.tsx`)
Restyle the photo slides to the new look (navy overlay, logo mark, gold accents).

## Settled after the builder check

- **Mockups vs. this document:** the mockups are binding for look and layout; this document is binding for content,
  data sources and the honesty rule. Where they conflict, the honesty rule wins (e.g. the mockup's "LIVE" tags become "Test network").
- **"<1¢" per payout:** computed from the measured `claimAverage` gas in the deployment file times a stated, typical
  Base gas price and ETH price kept as named constants in one place, and labeled "est. at typical Base fees" with a
  one-line footnote. Same method the pitch deck uses.
- **"Owners paid in one deposit":** taken from the recorded run (number of token holders when the single rent
  deposit happened), labeled as the test run. No hard-coded marketing number.
- **Demo-world transactions** never appear in the on-chain feed. Live proof shows only the recorded contract run (real
  hashes from the deployment file). The user's own pretend activity appears in a separate section titled
  "Your demo activity (pretend money, not on-chain)" with no hashes.
- **"Times it said no"** examples in each contract sheet come only from the recorded refusals in the deployment file.
- **Route names:** keep `/me` (label changes to "Account"); no route renames, so existing links keep working.
- **Simulator / Impact pages** keep the bottom tab bar with no tab highlighted.
- **Lesson link:** the Blockchain tab links to the existing "What is a blockchain?" lesson in `lib/lessons.ts`; no new lesson.

## Left to the builder

- Exact component breakdown, spacing scale and icon set (keep the existing `components/icons.tsx` style or extend it in
  the rounded-square motif).
- Chart styling details within the palette above.
- How the static contract-run data is loaded (import JSON vs. a small generated module).

## Calls made by Claude (Kaleb to check)

- **Font:** switch from Inter to Plus Jakarta Sans (via `next/font/google`) for a distinct, modern fintech feel.
- **Simulator placement:** a "Try the Block Simulator" card on Home and a "Simulator" entry at the top of Explore; route stays `/simulate` and `/simulate/grow`.
- **Impact placement:** the "Your neighborhood" card on Home (as today) and a link from the Blockchain tab's "How we use it" section; route stays `/impact`.
- **Money Trail** (`/trace`) stays, linked from Account and from Live proof.
- **Range buttons** on the Home chart use demo months (1M = last month of the demo world, etc.).
- **Spec deviation:** the bottom tabs change from the spec's 5 tabs (Home, Explore, Simulate, Learn, Me) to Home, Explore, Blockchain, Learn, Account; add this to the deviations list in `README.md`.
