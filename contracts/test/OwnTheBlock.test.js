const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { USD, person, fingerprint, deployProperty } = require("../scripts/lib");

const DAY = 86400;
const Rule = { MaxPersonBps: 0, LocalFloorBps: 1, RentCapBps: 2, ReserveBps: 3 };

describe("OwnTheBlock contracts", function () {
  let admin, manager, steward, jenkins, jasmine, alum, outsider, unverified, c;

  // small property so tests stay readable: 1,000 units, 20% per-person cap
  async function setup(opts = {}) {
    [admin, manager, steward, jenkins, jasmine, alum, outsider, unverified] = await ethers.getSigners();
    c = await deployProperty({ admin, manager, steward, goalUnits: 1000n, rules: [2000, 0, 300, 1000], ...opts });
    const reg = c.registry.connect(admin);
    await reg.verify(jenkins.address, person("jenkins"), true);
    await reg.verify(jasmine.address, person("jasmine"), true);
    await reg.verify(alum.address, person("alum"), false);
    await reg.verify(outsider.address, person("outsider"), false);
    for (const s of [jenkins, jasmine, alum, outsider, unverified, manager]) {
      await c.usdc.mint(s.address, USD(10_000));
      await c.usdc.connect(s).approve(await c.raise.getAddress(), ethers.MaxUint256);
    }
  }

  async function fundAndClose() {
    await c.raise.connect(jenkins).commit(200);
    await c.raise.connect(jasmine).commit(200);
    await time.increase(7 * DAY);
    await c.raise.connect(alum).commit(200);
    await c.raise.connect(outsider).commit(200);
    const [, , , , , , , , filler] = await ethers.getSigners();
    await c.registry.connect(admin).verify(filler.address, person("filler"), false);
    await c.usdc.mint(filler.address, USD(10_000));
    await c.usdc.connect(filler).approve(await c.raise.getAddress(), ethers.MaxUint256);
    await c.raise.connect(filler).commit(200);
    await time.increase(21 * DAY);
    await c.raise.finalize();
    for (const s of [jenkins, jasmine, alum, outsider, filler]) await c.raise.connect(s).claimTokens();
    return filler;
  }

  describe("Raise", function () {
    beforeEach(() => setup());

    it("gives residents first access, then opens to everyone", async function () {
      await expect(c.raise.connect(alum).commit(10)).to.be.revertedWithCustomError(c.raise, "ResidentsOnly");
      await c.raise.connect(jenkins).commit(10);
      await time.increase(7 * DAY);
      await c.raise.connect(alum).commit(10);
      expect(await c.raise.totalUnits()).to.equal(20);
    });

    it("rejects people who haven't passed the ID check", async function () {
      await expect(c.raise.connect(unverified).commit(1)).to.be.revertedWithCustomError(c.raise, "NotVerified");
    });

    it("enforces the per-person cap across a person's wallets", async function () {
      const [, , , , , , , , , second] = await ethers.getSigners();
      await c.registry.connect(admin).verify(second.address, person("jenkins"), true); // same person, new wallet
      await c.usdc.mint(second.address, USD(10_000));
      await c.usdc.connect(second).approve(await c.raise.getAddress(), ethers.MaxUint256);
      await c.raise.connect(jenkins).commit(150);
      await expect(c.raise.connect(second).commit(51)).to.be.revertedWithCustomError(c.raise, "OverPersonCap");
      await c.raise.connect(second).commit(50);
    });

    it("lets investors cancel for a full refund before the cutoff, not after", async function () {
      const before = await c.usdc.balanceOf(jasmine.address);
      await c.raise.connect(jasmine).commit(10);
      await c.raise.connect(jasmine).cancel();
      expect(await c.usdc.balanceOf(jasmine.address)).to.equal(before);
      await c.raise.connect(jasmine).commit(10);
      await time.increase(28 * DAY);
      await expect(c.raise.connect(jasmine).cancel()).to.be.revertedWithCustomError(c.raise, "TooLateToCancel");
    });

    it("refunds every dollar if the goal is missed", async function () {
      const before = await c.usdc.balanceOf(jasmine.address);
      await c.raise.connect(jasmine).commit(100);
      await time.increase(30 * DAY);
      await c.raise.finalize();
      expect(await c.raise.state()).to.equal(2); // Failed
      await c.raise.connect(jasmine).refund();
      expect(await c.usdc.balanceOf(jasmine.address)).to.equal(before);
      await expect(c.raise.connect(jasmine).claimTokens()).to.be.revertedWithCustomError(c.raise, "NotOpen");
    });

    it("sends the money to the treasury and mints tokens when the goal is met", async function () {
      await fundAndClose();
      expect(await c.usdc.balanceOf(await c.treasury.getAddress())).to.equal(USD(10_000));
      expect(await c.token.totalSupply()).to.equal(1000);
      expect(await c.token.balanceOf(jasmine.address)).to.equal(200);
    });

    it("can't be closed early while investors can still cancel", async function () {
      await expect(c.raise.finalize()).to.be.revertedWithCustomError(c.raise, "TooEarly");
    });
  });

  describe("BlockToken charter rules", function () {
    beforeEach(async () => {
      await setup();
      await fundAndClose();
    });

    it("locks transfers for 12 months", async function () {
      await expect(c.token.connect(jasmine).transfer(alum.address, 1)).to.be.revertedWithCustomError(c.token, "Locked");
      await time.increase(365 * DAY);
      await c.token.connect(jasmine).transfer(jenkins.address, 0);
    });

    it("blocks transfers to unverified wallets", async function () {
      await time.increase(365 * DAY);
      await expect(c.token.connect(jasmine).transfer(unverified.address, 1)).to.be.revertedWithCustomError(c.token, "NotVerified");
    });

    it("blocks transfers that push a person over the cap", async function () {
      await time.increase(365 * DAY);
      await expect(c.token.connect(jasmine).transfer(alum.address, 1)).to.be.revertedWithCustomError(c.token, "PersonCapExceeded");
    });

    it("only the community governor can change the rules", async function () {
      await expect(c.token.connect(admin).setRule(Rule.RentCapBps, 1000)).to.be.revertedWithCustomError(c.token, "NotAllowed");
    });
  });

  describe("Local-ownership floor", function () {
    it("stops local owners selling below the floor to outsiders", async function () {
      await setup({ rules: [4000, 4000, 300, 1000] }); // 40% cap, 40% must stay local
      const [, , , , , , , , filler] = await ethers.getSigners();
      await c.raise.connect(jenkins).commit(250);
      await c.raise.connect(jasmine).commit(250);
      await time.increase(7 * DAY);
      await c.raise.connect(alum).commit(250);
      await c.raise.connect(outsider).commit(250);
      await time.increase(23 * DAY);
      await c.raise.finalize();
      for (const s of [jenkins, jasmine, alum, outsider]) await c.raise.connect(s).claimTokens();
      expect(await c.token.localSupply()).to.equal(500);
      await time.increase(365 * DAY);
      await c.token.connect(jasmine).transfer(alum.address, 100); // local 400 = 40%, ok
      await expect(c.token.connect(jasmine).transfer(outsider.address, 1)).to.be.revertedWithCustomError(c.token, "LocalFloorBroken");
      await c.token.connect(jasmine).transfer(jenkins.address, 50); // local to local is always fine
    });
  });

  describe("Payouts", function () {
    beforeEach(async () => {
      await setup();
      await fundAndClose();
      await c.usdc.connect(manager).approve(await c.token.getAddress(), ethers.MaxUint256);
    });

    it("splits one deposit across every holder by tokens", async function () {
      await c.token.connect(manager).distribute(USD(700), fingerprint("Sep expense report"));
      expect(await c.token.claimable(jasmine.address)).to.equal(USD(140)); // 20% of $700
      const before = await c.usdc.balanceOf(jasmine.address);
      await c.token.connect(jasmine).claim();
      expect((await c.usdc.balanceOf(jasmine.address)) - before).to.equal(USD(140));
      expect(await c.token.claimable(jasmine.address)).to.equal(0);
    });

    it("only the manager can deposit rent", async function () {
      await expect(c.token.connect(jasmine).distribute(USD(1), fingerprint("x"))).to.be.revertedWithCustomError(c.token, "NotAllowed");
    });

    it("new owners only earn payouts made after they buy", async function () {
      const [, , , , , , , , , newbie] = await ethers.getSigners();
      await c.registry.connect(admin).verify(newbie.address, person("newbie"), true);
      await c.token.connect(manager).distribute(USD(700), fingerprint("m1"));
      await time.increase(365 * DAY);
      await c.token.connect(jasmine).transfer(newbie.address, 100);
      expect(await c.token.claimable(newbie.address)).to.equal(0);
      expect(await c.token.claimable(jasmine.address)).to.equal(USD(140));
      await c.token.connect(manager).distribute(USD(700), fingerprint("m2"));
      expect(await c.token.claimable(newbie.address)).to.equal(USD(70));
      expect(await c.token.claimable(jasmine.address)).to.equal(USD(210));
    });
  });

  describe("Rent cap", function () {
    beforeEach(() => setup());

    it("allows at most one increase a year, within the cap", async function () {
      await expect(c.token.connect(manager).setRent(USD(1442))).to.be.revertedWithCustomError(c.token, "RentChangedTooRecently");
      await time.increase(365 * DAY);
      await expect(c.token.connect(manager).setRent(USD(1500))).to.be.revertedWithCustomError(c.token, "RentIncreaseTooLarge");
      await c.token.connect(manager).setRent(USD(1442)); // +3%
      expect(await c.token.monthlyRent()).to.equal(USD(1442));
    });

    it("always allows lowering rent", async function () {
      await c.token.connect(manager).setRent(USD(1300));
      expect(await c.token.monthlyRent()).to.equal(USD(1300));
    });
  });

  describe("Treasury", function () {
    beforeEach(async () => {
      await setup();
      await fundAndClose();
    });

    it("needs the manager to propose and the steward to approve", async function () {
      const [, , , , , , , , , , contractor] = await ethers.getSigners();
      await expect(c.treasury.connect(admin).propose(contractor.address, USD(1), fingerprint("inv"), "x")).to.be.revertedWithCustomError(c.treasury, "NotAllowed");
      await c.treasury.connect(manager).propose(contractor.address, USD(3000), fingerprint("Invoice 1: roof"), "Stage 1: roof");
      await expect(c.treasury.connect(manager).approve(0)).to.be.revertedWithCustomError(c.treasury, "NotAllowed");
      await c.treasury.connect(steward).approve(0);
      expect(await c.usdc.balanceOf(contractor.address)).to.equal(USD(3000));
      await expect(c.treasury.connect(steward).approve(0)).to.be.revertedWithCustomError(c.treasury, "NotPending");
    });
  });

  describe("CharterGovernor", function () {
    beforeEach(async () => {
      await setup();
      await fundAndClose();
    });

    it("changes a rule after a 2/3 vote and the timelock", async function () {
      await c.governor.connect(jenkins).propose(Rule.MaxPersonBps, 1500);
      await c.governor.connect(jenkins).vote(0, true); // 200 * 1.5 = 300
      await c.governor.connect(jasmine).vote(0, true); // 300
      await c.governor.connect(alum).vote(0, false); // 200
      await time.increase(7 * DAY);
      expect(await c.governor.passed(0)).to.equal(true); // 600 / 800 = 75%
      await expect(c.governor.execute(0)).to.be.revertedWithCustomError(c.governor, "TimelockActive");
      await time.increase(30 * DAY);
      await c.governor.execute(0);
      expect(await c.token.rules(Rule.MaxPersonBps)).to.equal(1500);
    });

    it("fails without a 2/3 supermajority", async function () {
      await c.governor.connect(alum).propose(Rule.MaxPersonBps, 5000);
      await c.governor.connect(alum).vote(0, true);
      await c.governor.connect(outsider).vote(0, true);
      await c.governor.connect(jenkins).vote(0, false);
      await c.governor.connect(jasmine).vote(0, false);
      await time.increase(37 * DAY);
      await expect(c.governor.execute(0)).to.be.revertedWithCustomError(c.governor, "NotPassed");
    });

    it("lets the steward veto changes to the rent cap", async function () {
      await c.governor.connect(alum).propose(Rule.RentCapBps, 2000);
      for (const s of [jenkins, jasmine, alum, outsider]) await c.governor.connect(s).vote(0, true);
      await c.governor.connect(steward).veto(0);
      await time.increase(37 * DAY);
      await expect(c.governor.execute(0)).to.be.revertedWithCustomError(c.governor, "Done");
    });

    it("tokens bought after a proposal can't vote on it", async function () {
      await c.governor.connect(jenkins).propose(Rule.MaxPersonBps, 1500);
      const [, , , , , , , , , late] = await ethers.getSigners();
      await c.registry.connect(admin).verify(late.address, person("late"), false);
      await expect(c.governor.connect(late).vote(0, true)).to.be.revertedWithCustomError(c.governor, "NoVotes");
    });
  });
});
