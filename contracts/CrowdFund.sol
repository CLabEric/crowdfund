// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 * @title CrowdFund
 * @dev A crowdfunding contract where anybody can pledge CheapCoin tokens.
 * If the campaign is successful the owner can withdraw the funds.
 * If the campaign is not successful the accounts that pledged tokens can take them back.
 */

contract CrowdFund {

    IERC20 private immutable cheapCoin;

    address public immutable owner;

    string public campaign;

    uint256 public immutable goal;
    uint256 public immutable campaignDeadline;
    uint256 public tokensRaised;

    bool public goalAchieved;

    mapping(address => uint256) public balances;

    event Pledged(address indexed, uint256 indexed);
    event GoalAchieved(string, uint256);

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        require(owner == msg.sender, "Must be CrowdFund instance owner");
    }

    modifier campaignOver() {
        _checkDeadline();
        _;
    }

    function _checkDeadline() internal view virtual {
        require(block.timestamp >= campaignDeadline, "Campaign is over.");
    }

    constructor(string memory _campaign, uint256 _goal, uint256 _campaignLength, IERC20 _cheapCoin) {
        campaign = _campaign;
        goal = _goal;
        campaignDeadline = block.timestamp + _campaignLength;
        cheapCoin = _cheapCoin;
        owner = msg.sender;
    }

    function pledge(uint256 amount) external {
        require(block.timestamp < campaignDeadline, "Campaign has ended.");
        
        balances[msg.sender] += amount;
        tokensRaised += amount;

        if (tokensRaised >= goal && !goalAchieved) {
            goalAchieved = true;
            emit GoalAchieved(campaign, goal);
        }
        
        emit Pledged(msg.sender, amount);
        
        bool success = cheapCoin.transferFrom(msg.sender, address(this), amount);
        require(success);
    }

    function getFundsBack() external campaignOver {
        require(!goalAchieved, "Campaign was sucessful. Only owner can retrieve funds.");
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;

        bool success = cheapCoin.transfer(msg.sender, balance);
        require(success);
    }

    function withdraw() public onlyOwner campaignOver {
        require(goalAchieved, "Campaign unsuccessful. Those who pledged can withdraw their funds");

        bool success = cheapCoin.transfer(owner, tokensRaised);
        require(success);
    }
}
