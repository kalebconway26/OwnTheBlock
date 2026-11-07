# OwnTheBlock live demo: hardhat

Run 2026-11-03T04:41:04.353Z. Demo scale: 1,000 tokens ($10,000), 5 investors.

## Contracts
- registry: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6
- usdc: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
- token: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788
- treasury: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
- raise: 0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0
- governor: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82

## Story, transaction by transaction
| # | Step | Result | Gas | Transaction |
|---|---|---|---|---|
| 1 | Deed fingerprint stored on-chain | ok | 26779 | 0xaf50bcdf… |
| 2 | Appraisal fingerprint stored on-chain | ok | 26839 | 0x77c04792… |
| 3 | ID check passed: jenkins (resident) | ok | 70940 | 0x6e72aedf… |
| 4 | ID check passed: jasmine (resident) | ok | 70928 | 0xd1b0b55b… |
| 5 | ID check passed: tasha (resident) | ok | 70940 | 0x8e8ecc9b… |
| 6 | ID check passed: alumna | ok | 70928 | 0xbb89d7a2… |
| 7 | ID check passed: church (resident) | ok | 70940 | 0xee161c52… |
| 8 | Unverified outsider tries to invest: refused | refused by contract |  | simulated |
| 9 | Ms. Jenkins commits $2,000 (resident window) | ok | 165770 | 0x0f3605b6… |
| 10 | Jasmine commits $2,000 (resident window) | ok | 114470 | 0xdec58c84… |
| 11 | Tasha commits $2,000 (resident window) | ok | 114470 | 0xa305031e… |
| 12 | Alumna in Atlanta tries during resident window: refused | refused by contract |  | simulated |
| 13 | Alumna in Atlanta commits $2,000 (open window) | ok | 114462 | 0x44886eff… |
| 14 | Church commits $2,000 | ok | 114462 | 0x27d24552… |
| 15 | Raise closes: goal met, money to the house's treasury | ok | 76258 | 0x16437dd3… |
| 16 | jenkins receives 200 tokens | ok | 259484 | 0xe59d2935… |
| 17 | jasmine receives 200 tokens | ok | 210869 | 0x16eb2687… |
| 18 | tasha receives 200 tokens | ok | 210869 | 0x4b73cc19… |
| 19 | alumna receives 200 tokens | ok | 205770 | 0x4dacd7bb… |
| 20 | church receives 200 tokens | ok | 210869 | 0x46f7940a… |
| 21 | Manager proposes $3,000 roof payment with invoice fingerprint | ok | 140230 | 0x255ff1dc… |
| 22 | Manager tries to approve own payment: refused | refused by contract |  | simulated |
| 23 | Steward co-signs: contractor paid | ok | 84889 | 0xbbefadc6… |
| 24 | Tenant's on-time rent recorded | ok | 26336 | 0x2ec49219… |
| 25 | Manager deposits $700 net rent: split across all owners in one transaction | ok | 130302 | 0x3b24aa71… |
| 26 | jenkins claims $140 payout | ok | 68027 | 0xec20d44b… |
| 27 | jasmine claims $140 payout | ok | 68027 | 0x58f4b2b4… |
| 28 | tasha claims $140 payout | ok | 68027 | 0x581b7893… |
| 29 | alumna claims $140 payout | ok | 68027 | 0xe895c39f… |
| 30 | church claims $140 payout | ok | 63227 | 0xef0b65d4… |
| 31 | Jasmine tries to sell during the 12-month lockup: refused | refused by contract |  | simulated |
| 32 | Manager tries to raise rent 10%: refused (3% cap, once a year) | refused by contract |  | simulated |
| 33 | Ms. Jenkins proposes lowering the per-person cap to 15% | ok | 130227 | 0xa74ad65d… |
| 34 | jenkins votes yes | ok | 89603 | 0x8a807c2e… |
| 35 | jasmine votes yes | ok | 72503 | 0xad5381c8… |
| 36 | tasha votes yes | ok | 72503 | 0x13e6f607… |
| 37 | church votes yes | ok | 72503 | 0xdb47599a… |
| 38 | Rule change executed before the 30-day wait: refused | refused by contract |  | simulated |

Payout gas: one deposit = 130302 gas no matter how many owners; each claim ≈ 67067 gas.
