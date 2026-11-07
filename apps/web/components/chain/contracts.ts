/** The five OwnTheBlock smart contracts in plain English. `refusalMatch` picks this contract's refusals from the recorded run. */
export const CONTRACTS = [
  {
    id: "identity",
    name: "ID check",
    code: "IdentityRegistry",
    plain: "Only verified people can own tokens. The contract stores a yes/no and \"local resident\", never your name or ID.",
    rule: "Every buy and every transfer checks that both wallets passed the ID check.",
    refusalMatch: /outsider/i,
  },
  {
    id: "raise",
    name: "The raise",
    code: "Raise",
    plain: "Collects everyone's money for one house. Residents get the first window. If the goal isn't met, everyone is refunded automatically.",
    rule: "Residents-only window first · 48-hour cancel right · all-or-nothing: goal missed = automatic refunds.",
    refusalMatch: /alumna/i,
  },
  {
    id: "token",
    name: "Ownership tokens",
    code: "BlockToken",
    plain: "Each $10 token is one piece of the LLC that owns the house. Rent is paid to every owner from one deposit.",
    rule: "Max 2% per person · local-ownership floor · 12-month resale lockup · rent can rise at most 3% once a year.",
    refusalMatch: /lockup|raise rent/i,
  },
  {
    id: "treasury",
    name: "Two-key treasury",
    code: "Treasury",
    plain: "The house's money needs two keys. The manager proposes a payment with the invoice attached; the community steward must approve it.",
    rule: "No payment leaves the treasury without the steward's co-signature.",
    refusalMatch: /approve own payment/i,
  },
  {
    id: "governor",
    name: "Community votes",
    code: "CharterGovernor",
    plain: "Owners vote on the Community Charter. Residents' votes count 1.5×, and big changes have to wait before they take effect.",
    rule: "Rule changes need a 2/3 supermajority and a 30-day wait. The steward can veto changes to the rent cap.",
    refusalMatch: /30-day wait/i,
  },
] as const;

export type ContractInfo = (typeof CONTRACTS)[number];
