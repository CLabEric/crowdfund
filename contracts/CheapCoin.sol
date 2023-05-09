// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title CheapCoin
 * @dev A simple ERC20 token that anybody can mint for free until a max number
 * of tokens have been minted
 */

contract CheapCoin is ERC20 {
    uint256 public immutable max;

    constructor(uint256 _max) ERC20("CheapCoin", "CC") {
        max = _max;
    }

    function getSomeCoins(uint256 amount) public {
        require(totalSupply() + amount <= max, "can't mint that many tokens.");
        _mint(msg.sender, amount);
    }
}