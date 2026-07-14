// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/FeeToken.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: BDL)
contract BdlToken is FeeToken {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Billboard Liq", "BDL")
        FeeToken(initialSupply, initialOwner)
    {}
}
