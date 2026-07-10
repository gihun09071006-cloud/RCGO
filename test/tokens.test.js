const { expect } = require("chai");
const { ethers } = require("hardhat");

const INITIAL_SUPPLY = ethers.parseUnits("1000000000", 18);

const TOKENS = [
  { contract: "AnbToken", name: "Anb Token", symbol: "ANB" },
  { contract: "DosToken", name: "Dos Token", symbol: "DOS" },
  { contract: "BdlToken", name: "Bdl Token", symbol: "BDL" },
];

for (const { contract, name, symbol } of TOKENS) {
  describe(contract, function () {
    let token, owner, other;

    beforeEach(async function () {
      [owner, other] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory(contract);
      token = await Factory.deploy(INITIAL_SUPPLY, owner.address);
      await token.waitForDeployment();
    });

    it("has correct name, symbol and decimals", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
      expect(await token.decimals()).to.equal(18);
    });

    it("mints the initial supply to the owner", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("allows the owner to mint additional tokens", async function () {
      await token.mint(other.address, ethers.parseUnits("100", 18));
      expect(await token.balanceOf(other.address)).to.equal(ethers.parseUnits("100", 18));
    });

    it("rejects minting from a non-owner account", async function () {
      await expect(
        token.connect(other).mint(other.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("allows holders to burn their own tokens", async function () {
      const burnAmount = ethers.parseUnits("1000", 18);
      await token.burn(burnAmount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
    });

    it("transfers tokens between accounts", async function () {
      const amount = ethers.parseUnits("500", 18);
      await token.transfer(other.address, amount);
      expect(await token.balanceOf(other.address)).to.equal(amount);
    });
  });
}
