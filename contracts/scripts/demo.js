// Plays the Ms. Jenkins story on-chain and records every transaction.
//   Local:        npx hardhat run scripts/demo.js
//   Base Sepolia: npx hardhat run scripts/demo.js --network baseSepolia   (needs DEPLOYER_KEY in .env, funded from a faucet)
// Writes deployments/<network>.json and deployments/<network>.md with explorer links and gas used.
const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");
const { USD, person, fingerprint, deployProperty } = require("./lib");

const LIVE = network.name !== "hardhat";
const EXPLORER = "https://sepolia.basescan.org";
const log = [];

async function record(step, txPromise, { expectRevert = false } = {}) {
  let tx, receipt;
  try {
    tx = await txPromise;
    receipt = await tx.wait();
  } catch (e) {
    // a revert on a live network still lands on-chain when we pass a gas limit; the receipt is in the error
    receipt = e.receipt;
    tx = e.transaction ? { hash: e.receipt?.hash } : tx;
    if (!expectRevert) throw e;
  }
  const ok = receipt?.status === 1;
  if (expectRevert && ok) throw new Error(`${step}: expected the contract to refuse, but it succeeded`);
  const entry = { step, hash: receipt?.hash ?? tx?.hash, gasUsed: Number(receipt?.gasUsed ?? 0), status: ok ? "ok" : "refused by contract" };
  log.push(entry);
  console.log(`${ok ? "✔" : "✖"} ${step}  gas ${entry.gasUsed}  ${entry.hash ?? ""}`);
  return receipt;
}

async function refuse(step, contract, fn, args) {
  // Live: force-send with a fixed gas limit so the refusal is recorded on-chain and visible on the explorer.
  if (LIVE) return record(step, contract[fn](...args, { gasLimit: 300_000 }), { expectRevert: true });
  try {
    await contract[fn].staticCall(...args);
  } catch (e) {
    let reason = e.revert?.name;
    try {
      reason ||= contract.interface.parseError(e.data)?.name;
    } catch {}
    reason ||= e.shortMessage || e.message;
    log.push({ step, hash: null, gasUsed: 0, status: "refused by contract", reason });
    console.log(`✖ ${step}  (refused: ${reason})`);
    return;
  }
  throw new Error(`${step}: expected a refusal`);
}

async function waitUntil(ts) {
  if (!LIVE) {
    await network.provider.send("evm_setNextBlockTimestamp", [Number(ts)]);
    await network.provider.send("evm_mine");
    return;
  }
  for (;;) {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    if (BigInt(now) >= BigInt(ts)) return;
    const wait = Math.min(Number(BigInt(ts) - BigInt(now)) + 2, 30);
    console.log(`  …waiting ${wait}s for the clock`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

async function main() {
  const [admin] = await ethers.getSigners();
  // Stable demo wallets derived from the deployer key, so reruns reuse them.
  const seed = LIVE ? process.env.DEPLOYER_KEY : "0x" + "11".repeat(32);
  const wallet = (label) => new ethers.Wallet(ethers.keccak256(ethers.concat([seed, ethers.toUtf8Bytes(label)])), ethers.provider);
  const W = {
    manager: wallet("manager"),
    steward: wallet("steward"),
    jenkins: wallet("ms-jenkins"),
    jasmine: wallet("jasmine"),
    tasha: wallet("tasha"),
    alumna: wallet("alumna-atlanta"),
    church: wallet("church"),
    outsider: wallet("outsider"),
    contractor: wallet("contractor"),
  };

  console.log(`Network: ${network.name}  deployer ${admin.address}`);
  const gas = ethers.parseEther(LIVE ? "0.0004" : "1");
  for (const [k, w] of Object.entries(W)) {
    if (k === "contractor") continue;
    if ((await ethers.provider.getBalance(w.address)) < gas / 2n) await (await admin.sendTransaction({ to: w.address, value: gas })).wait();
  }

  // Demo scale: 1,000 tokens ($10,000) and 5 investors, 20% per-person cap. Same code as the 14,400-token house.
  const t = LIVE ? { residentWindow: 90, cancelCutoff: 180, deadline: 600, votingPeriod: 120 } : { residentWindow: 7 * 86400, cancelCutoff: 28 * 86400, deadline: 30 * 86400, votingPeriod: 7 * 86400 };
  const c = await deployProperty({ admin, manager: W.manager, steward: W.steward, goalUnits: 1000n, rules: [2000, 0, 300, 1000], timelock: 30 * 86400, ...t });
  const addr = {};
  for (const k of ["registry", "usdc", "token", "treasury", "raise", "governor"]) addr[k] = await c[k].getAddress();
  console.log("Deployed", addr);
  const start = BigInt((await ethers.provider.getBlock("latest")).timestamp);
  const as = (contract, w) => contract.connect(w);

  // 1. Documents and identity
  await record("Deed fingerprint stored on-chain", c.token.anchorDocument(fingerprint("Deed: Guilford Co. Book 1234 Page 567 (demo)"), "deed"));
  await record("Appraisal fingerprint stored on-chain", c.token.anchorDocument(fingerprint("As-is appraisal $90,000 (demo)"), "appraisal"));
  for (const [k, local] of [["jenkins", true], ["jasmine", true], ["tasha", true], ["alumna", false], ["church", true]]) {
    await record(`ID check passed: ${k}${local ? " (resident)" : ""}`, c.registry.verify(W[k].address, person(k), local));
  }
  for (const k of ["jenkins", "jasmine", "tasha", "alumna", "church", "manager"]) {
    await (await c.usdc.mint(W[k].address, USD(5000))).wait();
    await (await as(c.usdc, W[k]).approve(addr.raise, ethers.MaxUint256)).wait();
  }

  // 2. The raise
  await refuse("Unverified outsider tries to invest: refused", as(c.raise, W.outsider), "commit", [10]);
  await record("Ms. Jenkins commits $2,000 (resident window)", as(c.raise, W.jenkins).commit(200));
  await record("Jasmine commits $2,000 (resident window)", as(c.raise, W.jasmine).commit(200));
  await record("Tasha commits $2,000 (resident window)", as(c.raise, W.tasha).commit(200));
  await refuse("Alumna in Atlanta tries during resident window: refused", as(c.raise, W.alumna), "commit", [200]);
  await waitUntil(start + BigInt(t.residentWindow));
  await record("Alumna in Atlanta commits $2,000 (open window)", as(c.raise, W.alumna).commit(200));
  await record("Church commits $2,000", as(c.raise, W.church).commit(200));
  await waitUntil(start + BigInt(t.cancelCutoff));
  await record("Raise closes: goal met, money to the house's treasury", c.raise.finalize());
  for (const k of ["jenkins", "jasmine", "tasha", "alumna", "church"]) await record(`${k} receives 200 tokens`, as(c.raise, W[k]).claimTokens());

  // 3. Repairs need two keys
  await record("Manager proposes $3,000 roof payment with invoice fingerprint", as(c.treasury, W.manager).propose(W.contractor.address, USD(3000), fingerprint("Invoice #1 roof (demo)"), "Stage 1: roof"));
  await refuse("Manager tries to approve own payment: refused", as(c.treasury, W.manager), "approve", [0]);
  await record("Steward co-signs: contractor paid", as(c.treasury, W.steward).approve(0));

  // 4. Rent and payouts
  await record("Tenant's on-time rent recorded", as(c.token, W.manager).logRentPayment(fingerprint("tenant:unit-1"), 1, true));
  await (await as(c.usdc, W.manager).approve(addr.token, ethers.MaxUint256)).wait();
  const dist = await record("Manager deposits $700 net rent: split across all owners in one transaction", as(c.token, W.manager).distribute(USD(700), fingerprint("September expense report (demo)")));
  const claims = [];
  for (const k of ["jenkins", "jasmine", "tasha", "alumna", "church"]) claims.push(await record(`${k} claims $140 payout`, as(c.token, W[k]).claim()));

  // 5. Rules the code enforces
  await refuse("Jasmine tries to sell during the 12-month lockup: refused", as(c.token, W.jasmine), "transfer", [W.alumna.address, 10]);
  await refuse("Manager tries to raise rent 10%: refused (3% cap, once a year)", as(c.token, W.manager), "setRent", [USD(1540)]);
  await record("Ms. Jenkins proposes lowering the per-person cap to 15%", as(c.governor, W.jenkins).propose(0, 1500));
  for (const k of ["jenkins", "jasmine", "tasha", "church"]) await record(`${k} votes yes`, as(c.governor, W[k]).vote(0, true));
  await waitUntil(start + BigInt(t.cancelCutoff + t.votingPeriod) + 60n);
  await refuse("Rule change executed before the 30-day wait: refused", c.governor, "execute", [0]);

  // Summary
  const claimGas = Math.round(claims.reduce((a, r) => a + Number(r.gasUsed), 0) / claims.length);
  const summary = {
    network: network.name,
    chainId: Number(network.config.chainId ?? 31337),
    deployedAt: new Date().toISOString(),
    contracts: addr,
    gas: { distribute: Number(dist.gasUsed), claimAverage: claimGas },
    transactions: log,
  };
  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${network.name}.json`), JSON.stringify(summary, null, 2));
  const link = (h) => (h && LIVE ? `[${h.slice(0, 10)}…](${EXPLORER}/tx/${h})` : h ? h.slice(0, 10) + "…" : "simulated");
  const md = [
    `# OwnTheBlock live demo: ${network.name}`,
    "",
    `Run ${summary.deployedAt}. Demo scale: 1,000 tokens ($10,000), 5 investors.`,
    "",
    "## Contracts",
    ...Object.entries(addr).map(([k, a]) => `- ${k}: ${LIVE ? `[${a}](${EXPLORER}/address/${a})` : a}`),
    "",
    "## Story, transaction by transaction",
    "| # | Step | Result | Gas | Transaction |",
    "|---|---|---|---|---|",
    ...log.map((e, i) => `| ${i + 1} | ${e.step} | ${e.status} | ${e.gasUsed || ""} | ${link(e.hash)} |`),
    "",
    `Payout gas: one deposit = ${summary.gas.distribute} gas no matter how many owners; each claim ≈ ${claimGas} gas.`,
  ].join("\n");
  fs.writeFileSync(path.join(dir, `${network.name}.md`), md + "\n");
  console.log(`\nWrote deployments/${network.name}.json and .md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
