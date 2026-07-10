// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice BEP-20 token deployed on BNB Smart Chain (symbol: DOS)
contract DosToken is ERC20, ERC20Burnable, Ownable {
    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Dos Token", "DOS")
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
