# OwnTheBlock: notes for AI coding sessions

The full product spec is `docs/spec.pdf` (text version: `docs/spec.txt`). Sections 1–10 are the build
instructions; follow section 10.1 "How to work" (restate the milestone plan, one milestone at a time,
explain new concepts in plain English: the owner is a finance student learning blockchain development).

## Status

- [x] Milestone 1: Next.js PWA shell (5 tabs), design system, `lib/finance` (all section 6 formulas, tested), seed data
- [x] Milestone 2: Block Simulator sandbox (`lib/sim` engine, street, money flow, ledger, results, impact,
      controls, events, story mode, compare mode, "How is this calculated?")
- [x] Extra: full pretend-money demo (`lib/world`: faucet, invest, escrow, demo clock, payouts, claims,
      Money Trail) and the "Grow the app" scale projection (`lib/growth`). Real photos in `public/photos`
      with credits in `lib/photos.ts`.
- [~] Milestone 3: Smart contracts in `contracts/` (Hardhat, not Foundry: Foundry is not installed here). Five contracts + 22 tests + `scripts/demo.js` story run done; Base Sepolia deploy waits on a funded `DEPLOYER_KEY` in `contracts/.env`.
- [x] Extra (Nov 4, 2026): Navy & Gold redesign + Blockchain tab (`app/(tabs)/blockchain`, `lib/chain`); tokens in
      `globals.css` keep old names ("green" = brand navy). Spec: `docs/superpowers/specs/2026-11-04-app-redesign-design.md`
- [ ] Milestone 4: Smart wallet login, paymaster, MockUSDC faucet, real invest/claim, Ponder indexer
- [ ] Milestone 5: Money Trail + governance + badges on-chain, simulator Live testnet mode
- [ ] Milestone 6: Rent-to-own, owner dashboard, admin console, Spanish, a11y pass, Playwright e2e

## Conventions

- App lives in `apps/web` (Next.js 16 App Router, Tailwind v4, framer-motion, recharts, vitest).
  Next 16 differs from older versions: read `apps/web/node_modules/next/dist/docs/` before using new APIs.
  `cacheComponents` is on, so don't use `export const dynamic`.
- Money is integer cents everywhere; round down only when crediting a person.
- The UI never computes money itself: it renders `lib/finance` / `lib/sim` output, and every simulator
  number has an entry in `lib/sim/explain.ts`.
- Design tokens are in `app/globals.css` ("green" token = brand navy, gold = earnings, pos = gains, brick = alerts/blocked, white bg).
- Spec deviations are listed in `README.md`; keep that list current.
- In Milestone 4, real testnet transactions should replace the pretend ones behind the same `lib/world`
  actions (faucet → MockUSDC faucet, invest → Raise.invest, claim → Distributor.claim).
- WSL machine has ~7 GB RAM: run one build or browser at a time.
