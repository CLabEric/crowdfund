const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CheapCoin ERC20 contract", function () {
  let CheapCoin;
  let cheapCoin;
  let owner;
  let acct1;

  beforeEach(async function () {
    CheapCoin = await ethers.getContractFactory("CheapCoin");
    cheapCoin = await CheapCoin.deploy(100000);
    [owner, acct1] = await ethers.getSigners();
  });

  describe("Basic Functions", function () {
    it("Name should be 'CheapCoin'", async function () {
      expect(await cheapCoin.name()).to.equal("CheapCoin");
    });

    it("Initial total supply should be 0", async function () {
      expect(await cheapCoin.totalSupply()).to.equal(0);
    });

    it("Should set the max supply", async function () {
      expect(await cheapCoin.max()).to.equal(100000);
    });

    it("Should allow minting to anybody", async function () {
      await cheapCoin.connect(acct1).getSomeCoins(1000);
      expect(await cheapCoin.balanceOf(acct1.address)).to.equal(1000);
    });
  });
});
