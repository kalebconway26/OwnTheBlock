// Shared deploy helper for tests and the live demo.
const { ethers } = require("hardhat");

const USD = (n) => ethers.parseUnits(String(n), 6);
const person = (label) => ethers.id("otb-person:" + label);
const fingerprint = (text) => ethers.id(text);

// Charter preset "Neighbors First": 2% per-person cap, 0% local floor, 3% rent cap, 10% reserve
const NEIGHBORS_FIRST = [200, 0, 300, 1000];

/**
 * Deploys one property: registry, test USDC, token, treasury, raise and governor.
 * Times are in seconds from `now`.
 */
async function deployProperty({
  admin,
  manager,
  steward,
  goalUnits = 14_400n,
  price = USD(10),
  rent = USD(1400),
  rules = NEIGHBORS_FIRST,
  residentWindow = 7 * 86400,
  cancelCutoff = 28 * 86400,
  deadline = 30 * 86400,
  lockup = 365 * 86400,
  votingPeriod = 7 * 86400,
  timelock = 30 * 86400,
  quorumBps = 1000,
  propertyRef = "Guilford County parcel (demo) / 1201 Example Ave",
  registry,
  usdc,
}) {
  const now = BigInt((await ethers.provider.getBlock("latest")).timestamp);
  const send = async (p) => (await p).waitForDeployment ? (await p).waitForDeployment() : p;

  if (!registry) registry = await send(ethers.deployContract("IdentityRegistry", [admin.address], admin));
  if (!usdc) usdc = await send(ethers.deployContract("MockUSDC", [], admin));

  const token = await send(
    ethers.deployContract(
      "BlockToken",
      ["OwnTheBlock 1201 Example Ave", "OTB-1201", propertyRef, await registry.getAddress(), await usdc.getAddress(), goalUnits, now + BigInt(lockup), manager.address, rent, rules],
      admin,
    ),
  );
  const treasury = await send(ethers.deployContract("Treasury", [await usdc.getAddress(), manager.address, steward.address], admin));
  const raise = await send(
    ethers.deployContract(
      "Raise",
      [
        await token.getAddress(),
        await usdc.getAddress(),
        await registry.getAddress(),
        await treasury.getAddress(),
        price,
        goalUnits,
        now,
        now + BigInt(residentWindow),
        now + BigInt(cancelCutoff),
        now + BigInt(deadline),
      ],
      admin,
    ),
  );
  const governor = await send(
    ethers.deployContract("CharterGovernor", [await token.getAddress(), await registry.getAddress(), steward.address, votingPeriod, timelock, quorumBps], admin),
  );
  await (await token.connect(admin).setMinter(await raise.getAddress())).wait();
  await (await token.connect(admin).setCharter(await governor.getAddress())).wait();
  return { registry, usdc, token, treasury, raise, governor };
}

module.exports = { USD, person, fingerprint, deployProperty, NEIGHBORS_FIRST };
