//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.18;

import "./CrowdFund.sol";


/**
 * @title CrowdFundFactory
 * @dev Anybody can use this contract to create a CrowdFund campaign. Each campaign
 * gets pushed to an array and can be accessed by it's index.
 */

contract CrowdFundFactory {
    CrowdFund[] public crowdFundCampaigns;

    function createNewCrowdFund(string calldata campaign, uint256 goal, uint256 campaignLength, IERC20 cheapCoin) public {
        CrowdFund crowdFund = new CrowdFund(campaign, goal, campaignLength, cheapCoin);
        crowdFundCampaigns.push(crowdFund);
    }
}