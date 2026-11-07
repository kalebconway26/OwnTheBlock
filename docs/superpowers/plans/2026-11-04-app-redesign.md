# OwnTheBlock Navy & Gold Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole app in the approved Navy & Gold fintech look, rebuild Home around the portfolio, and add a Blockchain tab that explains blockchain and shows proof from the recorded contract run.

**Architecture:** Most of the restyle comes from re-pointing the existing design tokens in `app/globals.css`. Every screen already uses `bg-green`, `text-gold-ink` and so on, so they all move to navy/gold at once. New logic goes in two small tested modules: `lib/chain` (contract-run proof data) and a history-range helper in `lib/world`. Screens then get layout passes on top.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, Tailwind v4, framer-motion, recharts, vitest.

**Spec:** `docs/superpowers/specs/2026-11-04-app-redesign-design.md`

## Global Constraints

- Colors: navy `#14306B` primary; gold `#D9A21B` fills / `#8A6400` small gold text; green `#0F8A5F` positive change only; brick for negatives/blocked; ink `#0C1526`; muted `#5D6678`; card `#F4F6FA`; line `#E7E9EF`; page background white.
- Never use Coinbase `#0052FF` or Robinhood `#00C805`.
- Font: Plus Jakarta Sans via `next/font/google`.
- Tabs: Home · Explore · Blockchain · Learn · Account (Account = existing `/me` route). No route renames.
- Honesty: on-chain status reads "Test network" unless `baseSepolia` data exists. Never "LIVE". Demo-world txs never appear in the on-chain feed. "<1¢" is labeled "est. at typical Base fees".
- UI never computes money; it renders lib output. No changes to `lib/finance`, `lib/sim`, `lib/growth` behavior.
- Next 16: no `export const dynamic` (cacheComponents is on). Read `apps/web/node_modules/next/dist/docs/` before any new API.
- Tap targets ≥ 44px, AA contrast, `aria-current` on active tab. Looks right at 375px.
- One build/browser at a time (~7 GB RAM).
- The repo is not under git, so the "commit" step is replaced by "run `npm test` + `npx tsc --noEmit`".

## Review Focus

- A new user with no holdings (`w.history.length === 1`, value 0) sees the Home chart area as a calm empty state, not a broken chart or NaN%. Tested in Task 2 (`historyInRange` with one point; `changeOverRange` returns 0% when the start value is 0).
- Picking a range longer than the demo history (e.g. 1Y at month 2) shows all available history. Tested in Task 2.
- With no `baseSepolia.json`, every status reads "Test network" and no explorer link renders. Tested in Task 1 (`networkLabel`, `explorerUrl` null).
- The Claim button is disabled with no claimable payouts and never shows "$0.00". Handled in Task 4 (renders "Claim" disabled when `totalClaimable(w) === 0`).
- Long property names in holding rows truncate at 375px instead of pushing values off-screen. Handled in Task 4/6 (`min-w-0 truncate`), checked in Task 8 QA.

---

### Task 1: `lib/chain`: proof data from the recorded contract run

**Files:**
- Create: `apps/web/lib/chain/run.json` (copy of `contracts/deployments/hardhat.json`), `apps/web/lib/chain/index.ts`, `apps/web/lib/chain/chain.test.ts`, `apps/web/scripts/sync-chain.mjs`
- Modify: `apps/web/package.json` (add `"sync:chain": "node scripts/sync-chain.mjs"`)

**Interfaces:**
- Produces:
  - `type RunTx = { step: string; hash: string; gasUsed: number; status: "ok" | string }`
  - `type Run = { network: string; chainId: number; contracts: Record<string,string>; gas: { distribute: number; claimAverage: number }; transactions: RunTx[] }`
  - `RUN: Run`
  - `isLive(run?: Run): boolean`: true only when `network === "baseSepolia"`
  - `networkLabel(run?: Run): "Live on Base Sepolia" | "Test network"`
  - `explorerUrl(hash: string, run?: Run): string | null`: `https://sepolia.basescan.org/tx/<hash>` when live, else null
  - `BASE_GAS_PRICE_GWEI = 0.01`, `ETH_USD = 3500` (named assumptions)
  - `payoutCostUsd(gas = RUN.gas.claimAverage): number` = gas × gwei × 1e-9 × ETH_USD
  - `refusals(run?: Run): { label: string; hash: string }[]`: txs whose status ≠ "ok", label with ": refused" suffix stripped
  - `ownersPaidInOneDeposit(run?: Run): number`: count of "claims $" steps after the "deposits $700" step
  - `feed(run?: Run, n = 8): { label: string; hash: string; ok: boolean }[]`: most recent first

- [ ] **Step 1: Write failing tests** in `chain.test.ts`:
  - `networkLabel(RUN)` → `"Test network"`; `networkLabel({...RUN, network:"baseSepolia"})` → `"Live on Base Sepolia"`
  - `explorerUrl("0xabc", RUN)` → `null`; live → `"https://sepolia.basescan.org/tx/0xabc"`
  - `payoutCostUsd(67067)` `< 0.01`
  - `refusals(RUN).length` → `6`, includes label `"Manager tries to raise rent 10%"` (prefix match)
  - `ownersPaidInOneDeposit(RUN)` → `5`
  - `feed(RUN, 3)[0].label` starts with `"Rule change executed before the 30-day wait"`, and `ok` is false
- [ ] **Step 2:** `cd apps/web && npx vitest run lib/chain` → FAIL (module missing)
- [ ] **Step 3:** Implement `index.ts` (import `./run.json`), and `sync-chain.mjs` copying `../../contracts/deployments/baseSepolia.json` if it exists, else `hardhat.json`, to `lib/chain/run.json`. Run it once.
- [ ] **Step 4:** `npx vitest run lib/chain` → PASS

### Task 2: History range helpers

**Files:** Create `apps/web/lib/world/range.ts`, `apps/web/lib/world/range.test.ts`

**Interfaces:**
- Produces:
  - `type Range = "1M" | "3M" | "YTD" | "1Y" | "ALL"`
  - `historyInRange(history: World["history"], month: number, range: Range): World["history"]`: 1M = last 1 month (2 points), 3M = 3, 1Y = 12, YTD = since the most recent January (`monthLabel` month 0 = Nov 2026, so January = months where `(month + 10) % 12 === 0`), ALL = everything; always at least the last point
  - `changeOverRange(points): { cents: Cents; pct: number }`: last minus first; pct 0 when first value is 0

- [ ] **Step 1: Failing tests**: 25-point history, month 24: `1M` → 2 points, `3M` → 4, `1Y` → 13, `ALL` → 25; month 2 with 3 points, `1Y` → 3; single point → 1; `changeOverRange([{value:0},{value:500}])` → `{cents:500, pct:0}`; `[{value:1000},{value:1100}]` → pct `0.1`
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** `npx vitest run lib/world` → PASS (existing world tests still pass)

### Task 3: Foundation: tokens, font, UI kit, logo, tab bar

**Files:**
- Modify: `app/globals.css` (token values per Global Constraints; `--cream` → `#ffffff` page bg; `--green` → navy; `--green-2` → `#1d428f`; `--green-soft` → `#e6ecf7`; `--gold` → `#d9a21b`; `--gold-ink` → `#8a6400`; `--gold-soft` → `#fbf1d6`; add `--pos: #0f8a5f`, `--pos-soft: #e3f4ec`, `--card: #f4f6fa` and `--color-pos`/`--color-pos-soft`/`--color-card`; comment that "green" now means the primary brand color)
- Modify: `app/layout.tsx` (Plus Jakarta Sans as `--font-sans-brand`, themeColor `#14306b`), `components/ui.tsx` (Card: `bg-card` default, no border, rounded-2xl; Button: rounded-xl; SectionTitle: `text-[17px] font-extrabold`; PageHeader back link in navy), `components/TabBar.tsx` (5 equal tabs incl. Blockchain `/blockchain` and Account label for `/me`, no raised center button, active = navy rounded-square icon chip)
- Create: `components/Logo.tsx`: `Logo({ size?: "sm" | "md" })`, a 2×2 rounded-square mark (bottom-right gold) + wordmark
- Modify: `components/icons.tsx`: add `ChainIcon`, `SearchIcon`, `BellIcon`

- [ ] **Step 1:** Make the changes. **Step 2:** `npx tsc --noEmit` clean, `npm test` passes. **Step 3:** dev server; `curl` every route → 200.

### Task 4: Home screen

**Files:** Modify `app/(tabs)/home/page.tsx`; create `components/PortfolioChart.tsx`

**Interfaces:** Consumes `historyInRange`, `changeOverRange`, `Range` (Task 2), `Logo` (Task 3).
`PortfolioChart({ points, }: { points: World["history"] })`: recharts AreaChart, navy stroke, navy→transparent fill, no axes, tooltip in dollars via `fmt`; empty state text "Your chart starts after your first investment" when points < 2 or all zero.

- [ ] Layout per spec "Home": header (Logo, search → `/explore`, bell), "Portfolio balance", value, ▲/▼ change for the selected range (green/brick), chart, range pills (navy pill selected), tiles "Rent income / month" (gold-ink) and "Cash", button row Invest (`/explore`) · Add cash (faucet) · Claim (disabled + label "Claim" when 0), DemoClock, demo how-to empty state, "Your properties" rows (photo 48px rounded-xl, `min-w-0 truncate`), "Raising now" photo card with gold progress, Activity, Simulator entry card ("Try the Block Simulator" → `/simulate`), "Your neighborhood" impact card → `/impact`, USDC sheet kept.
- [ ] Verify: `npx tsc --noEmit`; dev `/home` 200; screenshot check in Task 8.

### Task 5: Blockchain tab

**Files:** Create `app/(tabs)/blockchain/page.tsx`, `components/chain/HowItWorks.tsx`, `components/chain/HowWeUseIt.tsx`, `components/chain/contracts.ts`

**Interfaces:** Consumes `RUN, networkLabel, explorerUrl, payoutCostUsd, refusals, ownersPaidInOneDeposit, feed` (Task 1).
`contracts.ts` exports `CONTRACTS: { id: "identity"|"raise"|"token"|"treasury"|"governor"; name: string; plain: string; rule: string; refusalMatch: RegExp }[]` with names "ID check", "The raise", "Ownership tokens", "Two-key treasury", "Community votes" and rules from the spec (2% cap, 12-month lockup, 3% rent cap, residents-first, refund if goal missed, steward co-sign, 2/3 vote + 30-day wait).

- [ ] Page: title "Blockchain", subtitle "Why you can trust OwnTheBlock without trusting us.", segmented toggle (state in component; `?view=use` query optional) between:
  - HowItWorks: navy hero "A shared record nobody can secretly edit" + 3 linked block tiles, 4 numbered steps (copy from spec), "Why not a regular bank database?" table, link to `/learn/what-is-a-blockchain`.
  - HowWeUseIt: 3 KPI tiles (`<1¢` "per payout, est. at typical Base fees"; `ownersPaidInOneDeposit()` "owners paid in one deposit (test run)"; `0` "rules broken"); contract list with `networkLabel()` tag; tap → `Sheet` showing plain, rule, and matching `refusals()` ("Times it said no"); "Live proof" feed from `feed()` (green/brick dot, short hash `0x1234…abcd`, link only if `explorerUrl` non-null); "Your demo activity (pretend money, not on-chain)" = existing `Activity` component, no hashes; links to `/impact` and `/trace`; footnote with the gas assumption.
- [ ] Verify: tsc clean; `/blockchain` 200.

### Task 6: Explore restyle

**Files:** Modify `app/(tabs)/explore/page.tsx`

- [ ] Add a search input (filters projects by name/neighborhood, case-insensitive), filter chips All · Raising · Renting · Businesses · Fund (derived from existing project type/stage fields), a "Block Simulator" entry card at the top → `/simulate`, project rows/cards keep photos. Pitch Board kept as its own section. Empty search → "No properties match".
- [ ] Verify: tsc clean; `/explore` 200.

### Task 7: Remaining screens visual pass

**Files:** Modify `app/project/[id]/ProjectView.tsx`, `app/project/[id]/ReportsChart.tsx`, `app/project/[id]/invest/InvestFlow.tsx`, `app/(tabs)/learn/page.tsx`, `app/learn/[slug]/LessonPlayer.tsx`, `app/(tabs)/me/page.tsx`, `app/impact/page.tsx`, `app/trace/TraceView.tsx`, `app/(tabs)/simulate/layout.tsx`, `app/page.tsx`, `app/credits/page.tsx`, `components/demo.tsx`, `components/sim/*` (colors only)

- [ ] Replace any hard-coded hex/cream values with tokens (`grep -rn "#[0-9a-fA-F]\{6\}" app components` → only chart/SVG fills that read CSS vars or new palette). Me page heading "Account". Project page: hero photo, stat grid in `bg-card` tiles, sticky Invest button. Learn: course cards with progress. Welcome slides: navy overlay + `Logo`. Charts: navy/gold/pos palette.
- [ ] Verify: tsc clean; `npm test`; every route 200.

### Task 8: Docs + QA

**Files:** Modify `README.md` (spec deviations: new tab set; Simulate moved to Home/Explore entry points), `CLAUDE.md` status line (design refresh)

- [ ] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (stop dev server first).
- [ ] Screenshot at 390×844 every main route (Home empty + after investing, Explore, Blockchain both views + contract sheet, Learn, Account, Project, Invest, Simulate, Impact, Trace, Welcome) and fix overflow/contrast/truncation issues found.
