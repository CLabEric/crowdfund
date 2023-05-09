const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
  
describe("CrowdFund contract", function () {
    let CheapCoin;
    let cheapCoin;
    let CrowdFund;
    let crowdFund;
    let owner;
    let acct1;
    let acct2;
  
    beforeEach(async function () {
        CheapCoin = await ethers.getContractFactory("CheapCoin");
        cheapCoin = await CheapCoin.deploy(100000);

        const week = 60 * 60 * 24 * 7;

        CrowdFund = await ethers.getContractFactory("CrowdFund");
        crowdFund = await CrowdFund.deploy("Test", 10000, week, cheapCoin.address);

        [owner, acct1, acct2] = await ethers.getSigners();
    });
  
    describe("Deployment", function () {
        it("Should define Name and Goal on deploy", async function () {
            expect(await crowdFund.campaign()).to.equal("Test");
            expect(await crowdFund.goal()).to.equal(10000);
        });

        it("Should not have met it's goal yet", async function () {
            expect(await crowdFund.goalAchieved()).to.equal(false);
        });

        it("Campaign should end after current time", async function () {
            const deadline = await crowdFund.campaignDeadline();
            const latest = await time.latest();

            expect(deadline).to.be.greaterThan(latest);
        });
    });
  
// test an event

    describe("Live Campaign", function () {
        it("Should allow anybody to pledge tokens", async function () {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            const acct1Balance = await crowdFund.balances(acct1.address);
            
            expect(acct1Balance).to.equal(1000);
        });

        it("Should not allow owner to withdraw funds before deadline", async function() {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            const tokensRaised = await crowdFund.tokensRaised();
            
            expect(tokensRaised).to.equal(1000);
            await expect(crowdFund.withdraw()).to.be.revertedWith("Campaign is over.");
        });

        it("Should not allow pledges to be withdrawn before deadline", async function() {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            const tokensRaised = await crowdFund.tokensRaised();

            expect(tokensRaised).to.equal(1000);
            await expect(crowdFund.connect(acct1).getFundsBack()).to.be.revertedWith("Campaign is over.");
        });

        it("Should set goalAchieved flag to true once goal is met", async function() {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            const tokensRaised = await crowdFund.tokensRaised();

            expect(tokensRaised).to.equal(1000);
            expect(await crowdFund.goalAchieved()).to.equal(false);

            await cheapCoin.connect(acct2).getSomeCoins(10000);
            await cheapCoin.connect(acct2).approve(crowdFund.address, 10000);
            await crowdFund.connect(acct2).pledge(10000);

            const newTokenBalance = await crowdFund.tokensRaised();

            expect(newTokenBalance).to.equal(11000);
            expect(await crowdFund.goalAchieved()).to.equal(true);
        });
    });

    describe("Completed Campaign", function () {
        it("Should no longer be able to accept pledges", async function () {
            await time.increase(60 * 60 * 24 * 7 * 2);
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await expect(crowdFund.connect(acct1).pledge(1000)).to.be.revertedWith("Campaign has ended.");
        });

        it("Should allow pledges to be returned if campaign unsuccessful", async function () {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);
            await time.increase(60 * 60 * 24 * 7 * 2);
            
            expect(await crowdFund.balances(acct1.address)).to.equal(1000);
            expect(await cheapCoin.balanceOf(acct1.address)).to.equal(0);
            await crowdFund.connect(acct1).getFundsBack();

            expect(await crowdFund.balances(acct1.address)).to.equal(0);
            expect(await cheapCoin.balanceOf(acct1.address)).to.equal(1000);
        });

        it("Should not allow pledges to be returned if campaign successful", async function () {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            await cheapCoin.connect(acct2).getSomeCoins(10000);
            await cheapCoin.connect(acct2).approve(crowdFund.address, 10000);
            await crowdFund.connect(acct2).pledge(10000);

            await time.increase(60 * 60 * 24 * 7 * 2);
            
            expect(await crowdFund.balances(acct1.address)).to.equal(1000);
            expect(await cheapCoin.balanceOf(acct1.address)).to.equal(0);
            await expect(crowdFund.connect(acct1).getFundsBack()).to.be.revertedWith("Campaign was sucessful. Only owner can retrieve funds.");
        });

        it("Should allow owner to withdraw money if campaign successful", async function () {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            await cheapCoin.connect(acct2).getSomeCoins(10000);
            await cheapCoin.connect(acct2).approve(crowdFund.address, 10000);
            await crowdFund.connect(acct2).pledge(10000);

            await time.increase(60 * 60 * 24 * 7 * 2);

            const balance = await crowdFund.tokensRaised();

            await crowdFund.withdraw();

            expect(await cheapCoin.balanceOf(owner.address)).to.equal(balance);
        });

        it("Should not allow owner to withdraw money if campaign unsuccessful", async function () {
            await cheapCoin.connect(acct1).getSomeCoins(1000);
            await cheapCoin.connect(acct1).approve(crowdFund.address, 1000);
            await crowdFund.connect(acct1).pledge(1000);

            await time.increase(60 * 60 * 24 * 7 * 2);
            
            await expect(crowdFund.withdraw()).to.revertedWith("Campaign unsuccessful. Those who pledged can withdraw their funds");
        });
    });
});
