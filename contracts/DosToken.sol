// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./base/FeeToken.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: DOS)
contract DosToken is FeeToken {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Dos Token", "DOS")
        FeeToken(initialSupply, initialOwner)
    {}
}
