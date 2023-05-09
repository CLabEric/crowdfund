const { expect } = require("chai");
const { ethers } = require("hardhat");
  
  describe("CrowdFundFactory contract", function () {
    let CheapCoin;
    let cheapCoin;
    let CrowdFundFactory;
    let crowdFundFactory;
    let CrowdFund;
  
    beforeEach(async function () {
        CheapCoin = await ethers.getContractFactory("CheapCoin");
        cheapCoin = await CheapCoin.deploy(100000);
        CrowdFundFactory = await ethers.getContractFactory("CrowdFundFactory");
        crowdFundFactory = await CrowdFundFactory.deploy();
        CrowdFund = await ethers.getContractFactory('CrowdFund');
    });
  
    describe("Factory Object Creation", function () {
        const week = 60 * 60 * 24 * 7;
        it("Should be able to create a new CrowdFund contract.", async function () {
          await crowdFundFactory.createNewCrowdFund("Test", 10000, week, cheapCoin.address);

          const campaignAddress = await crowdFundFactory.crowdFundCampaigns(0);
          const campaign = await CrowdFund.attach(campaignAddress);

          expect(await campaign.campaign()).to.equal("Test");
        });

        it("Should be able to create multiple CrowdFund contracts.", async function () {
          await crowdFundFactory.createNewCrowdFund("CF One", 5000, week, cheapCoin.address);
          await crowdFundFactory.createNewCrowdFund("CF Two", 80000, week, cheapCoin.address);

          const campaign0Address = await crowdFundFactory.crowdFundCampaigns(0);
          const campaign1Address = await crowdFundFactory.crowdFundCampaigns(1);
          const campaign0 = await CrowdFund.attach(campaign0Address);
          const campaign1 = await CrowdFund.attach(campaign1Address);

          expect(await campaign0.campaign()).to.equal("CF One");
          expect(await campaign1.campaign()).to.equal("CF Two");
        });
    });
  });
  