// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice BEP-20 base token: owner can mint until renouncing that ability
/// permanently, holders can always burn their own tokens.
/// @dev No transfer fee or owner-adjustable transfer logic of any kind --
/// wallet/scanner heuristics (MetaMask via Blockaid, TokenSniffer, etc.)
/// flag any contract where the owner can reduce or redirect a transfer's
/// value as honeypot-shaped, regardless of intent or how small the cap is.
/// Keeping the token to mint-then-renounce plus burn avoids that class of
/// warning entirely.
abstract contract MintOnceToken is ERC20, ERC20Burnable, Ownable {
    bool public mintingRenounced;

    event MintingRenounced();

    constructor(uint256 initialSupply, address initialOwner) Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(!mintingRenounced, "MintOnceToken: minting renounced");
        _mint(to, amount);
    }

    /// @notice Permanently disables mint(). Irreversible; total supply is
    /// fixed from this point on except for holder-initiated burns.
    function renounceMinting() external onlyOwner {
        require(!mintingRenounced, "MintOnceToken: already renounced");
        mintingRenounced = true;
        emit MintingRenounced();
    }
}
