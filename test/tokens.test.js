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
    let token, owner, other, third;

    beforeEach(async function () {
      [owner, other, third] = await ethers.getSigners();
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

    it("permanently disables mint() once renounced, without touching ownership", async function () {
      expect(await token.mintingRenounced()).to.equal(false);

      await expect(token.renounceMinting()).to.emit(token, "MintingRenounced");
      expect(await token.mintingRenounced()).to.equal(true);

      await expect(
        token.mint(other.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("FeeToken: minting renounced");

      // fee controls still work post-renounce
      await expect(token.setFeeRate(100)).to.emit(token, "FeeRateUpdated");
      expect(await token.owner()).to.equal(owner.address);
    });

    it("rejects renouncing minting twice", async function () {
      await token.renounceMinting();
      await expect(token.renounceMinting()).to.be.revertedWith(
        "FeeToken: already renounced"
      );
    });

    it("rejects renouncing minting from a non-owner account", async function () {
      await expect(
        token.connect(other).renounceMinting()
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

    describe("transfer fee", function () {
      it("starts with a zero fee rate and the owner as fee recipient", async function () {
        expect(await token.feeRateBps()).to.equal(0);
        expect(await token.feeRecipient()).to.equal(owner.address);
        expect(await token.isFeeExempt(owner.address)).to.equal(true);
      });

      it("allows the owner to change the fee rate", async function () {
        await expect(token.setFeeRate(250))
          .to.emit(token, "FeeRateUpdated")
          .withArgs(0, 250);
        expect(await token.feeRateBps()).to.equal(250);
      });

      it("rejects a fee rate above the cap", async function () {
        const cap = await token.MAX_FEE_RATE_BPS();
        await expect(token.setFeeRate(cap + 1n)).to.be.revertedWith(
          "FeeToken: rate exceeds cap"
        );
      });

      it("rejects fee rate changes from a non-owner account", async function () {
        await expect(
          token.connect(other).setFeeRate(100)
        ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      });

      it("deducts the fee on transfers between non-exempt accounts", async function () {
        const seedAmount = ethers.parseUnits("1000", 18);
        await token.transfer(other.address, seedAmount); // owner is exempt, no fee here

        await token.setFeeRate(500); // 5%
        const sendAmount = ethers.parseUnits("100", 18);
        const expectedFee = (sendAmount * 500n) / 10000n;

        await token.connect(other).transfer(third.address, sendAmount);

        expect(await token.balanceOf(third.address)).to.equal(sendAmount - expectedFee);
        expect(await token.balanceOf(owner.address)).to.equal(
          INITIAL_SUPPLY - seedAmount + expectedFee
        );
      });

      it("allows a 100% fee rate to neutralize a non-exempt transfer (anti-bot mode)", async function () {
        const seedAmount = ethers.parseUnits("1000", 18);
        await token.transfer(other.address, seedAmount); // owner is exempt, no fee here

        await token.setFeeRate(10_000); // 100%
        const sendAmount = ethers.parseUnits("100", 18);

        await token.connect(other).transfer(third.address, sendAmount);

        expect(await token.balanceOf(third.address)).to.equal(0);
        expect(await token.balanceOf(owner.address)).to.equal(
          INITIAL_SUPPLY - seedAmount + sendAmount
        );
      });

      it("does not charge a fee for exempt accounts", async function () {
        await token.setFeeRate(500);
        await token.setFeeExempt(other.address, true);
        await token.transfer(other.address, ethers.parseUnits("1000", 18));

        await token.connect(other).transfer(third.address, ethers.parseUnits("100", 18));
        expect(await token.balanceOf(third.address)).to.equal(ethers.parseUnits("100", 18));
      });

      it("never charges a fee on mint or burn", async function () {
        await token.setFeeRate(500);
        const mintAmount = ethers.parseUnits("100", 18);
        await token.mint(third.address, mintAmount);
        expect(await token.balanceOf(third.address)).to.equal(mintAmount);

        await token.connect(third).burn(mintAmount);
        expect(await token.balanceOf(third.address)).to.equal(0);
      });

      it("allows the owner to change the fee recipient", async function () {
        await expect(token.setFeeRecipient(third.address))
          .to.emit(token, "FeeRecipientUpdated")
          .withArgs(owner.address, third.address);
        expect(await token.feeRecipient()).to.equal(third.address);
      });

      it("rejects a zero-address fee recipient", async function () {
        await expect(
          token.setFeeRecipient(ethers.ZeroAddress)
        ).to.be.revertedWith("FeeToken: zero recipient");
      });
    });
  });
}
