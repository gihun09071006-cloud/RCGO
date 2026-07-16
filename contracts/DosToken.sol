// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/FixedSupplyToken.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: DOS)
contract DosToken is FixedSupplyToken {
    constructor(uint256 initialSupply, address initialHolder)
        ERC20("Dappos", "DOS")
        FixedSupplyToken(initialSupply, initialHolder)
    {}
}
