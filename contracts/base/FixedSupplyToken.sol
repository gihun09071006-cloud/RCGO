// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @notice BEP-20 base token with a fixed supply minted once at deployment.
/// @dev No owner, no mint, no transfer fee -- nothing for anyone (including
/// the deployer) to adjust after deployment except holders burning their
/// own balance. Earlier versions kept an owner around for mint-then-renounce
/// and, before that, an adjustable transfer fee; both got flagged by
/// wallet/scanner heuristics (MetaMask via Blockaid, TokenSniffer, etc.) as
/// risk factors regardless of intent, since the heuristics key on the mere
/// existence of owner-adjustable capability, not how it's used. Removing
/// the owner role entirely removes that whole class of finding.
abstract contract FixedSupplyToken is ERC20, ERC20Burnable {
    constructor(uint256 initialSupply, address initialHolder) {
        _mint(initialHolder, initialSupply);
    }
}
