// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/FixedSupplyToken.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: wkeyDAO3)
contract WkeyDao3Token is FixedSupplyToken {
    constructor(uint256 initialSupply, address initialHolder)
        ERC20("wkeyDAO3", "wkeyDAO3")
        FixedSupplyToken(initialSupply, initialHolder)
    {}
}
