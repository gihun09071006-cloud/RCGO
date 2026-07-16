// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/MintOnceToken.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: BDL)
contract BdlToken is MintOnceToken {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Billboard Liq", "BDL")
        MintOnceToken(initialSupply, initialOwner)
    {}
}
