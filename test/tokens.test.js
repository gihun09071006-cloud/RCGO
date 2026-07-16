const { expect } = require("chai");
const { ethers } = require("hardhat");

const TOKENS = [
  { contract: "AnbToken", name: "Anubis Chain", symbol: "ANB", supply: "50000000" },
  { contract: "DosToken", name: "Dappos", symbol: "DOS", supply: "10000000" },
  { contract: "BdlToken", name: "Billboard Liq", symbol: "BDL", supply: "100000000" },
];

for (const { contract, name, symbol, supply } of TOKENS) {
  describe(contract, function () {
    const INITIAL_SUPPLY = ethers.parseUnits(supply, 18);
    let token, holder, other;

    beforeEach(async function () {
      [holder, other] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory(contract);
      token = await Factory.deploy(INITIAL_SUPPLY, holder.address);
      await token.waitForDeployment();
    });

    it("has correct name, symbol and decimals", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
      expect(await token.decimals()).to.equal(18);
    });

    it("mints the entire fixed supply to the initial holder, with no mint function", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(holder.address)).to.equal(INITIAL_SUPPLY);
      expect(token.mint).to.equal(undefined);
    });

    it("allows holders to burn their own tokens", async function () {
      const burnAmount = ethers.parseUnits("1000", 18);
      await token.burn(burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("rejects burning more than the caller's balance", async function () {
      await expect(
        token.connect(other).burn(ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("transfers the full amount between accounts (no fee)", async function () {
      const amount = ethers.parseUnits("500", 18);
      await token.transfer(other.address, amount);
      expect(await token.balanceOf(other.address)).to.equal(amount);
      expect(await token.balanceOf(holder.address)).to.equal(INITIAL_SUPPLY - amount);
    });
  });
}
