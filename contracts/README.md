# OwnTheBlock contracts

Five Solidity contracts that run one property's raise, ownership, payouts and rules on Base.

| Contract | What it enforces |
|---|---|
| `IdentityRegistry` | Who passed the ID check; stores only verified / local / an anonymous person id |
| `Raise` | Residents-first window, per-person cap, cancel-for-refund until the cutoff, all-or-nothing close |
| `BlockToken` | LLC units; ID, per-person cap, local floor and 12-month lockup on every transfer; one-deposit payouts; rent cap |
| `Treasury` | Manager proposes each payment with the invoice hash, steward must approve |
| `CharterGovernor` | Rule changes need quorum + 2/3 (residents count 1.5x) + timelock; steward veto on rent cap and reserve |

```bash
npm install --legacy-peer-deps
npx hardhat test                                   # 22 tests
npx hardhat run scripts/demo.js                    # the Ms. Jenkins story on a local chain
npx hardhat run scripts/demo.js --network baseSepolia   # live, needs DEPLOYER_KEY in .env with test ETH
```

The demo writes `deployments/<network>.json` and `.md` (every step, gas used, explorer links).
The pitch deck build (`docs/deck-build.js`) reads that file, so after a Base Sepolia run the deck's proof slide shows real transaction hashes and a QR code.

Known limits (fine for the testnet demo, fix before mainnet): revoking an identity while it still holds tokens breaks the per-person and local-supply bookkeeping; `Raise` holds test USDC itself, whereas in production a regulated escrow agent holds the dollars and the contract mirrors commitments; no audit yet.
