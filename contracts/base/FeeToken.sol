// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice BEP-20 base token with an owner-adjustable transfer fee.
/// @dev Fee is expressed in basis points (1 bps = 0.01%), capped at
/// MAX_FEE_RATE_BPS (10%). The rate can be raised temporarily to discourage
/// sandwich/arbitrage bots by taxing a non-exempt transfer; use setFeeExempt
/// to keep legitimate users/pools unaffected while such a rate is active.
/// The cap is intentionally well under 100% -- wallets and scanners flag
/// tokens whose owner can zero out a transfer's value as honeypot-shaped,
/// regardless of intent, so this trades away full neutralization for a
/// pattern that reads as a normal adjustable fee.
/// Minting and burning are never subject to the fee.
///
/// NOTE ON TRUST: holders are trusting the owner not to raise the rate to
/// grief transfers. Consider a timelock or multisig owner, and communicate
/// any active fee rate to holders.
abstract contract FeeToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_RATE_BPS = 1_000; // 10% hard cap

    uint256 public feeRateBps;
    address public feeRecipient;
    mapping(address => bool) public isFeeExempt;

    /// @notice Once true, mint() is permanently disabled. Does not affect
    /// ownership or fee controls, which the owner keeps for anti-bot use.
    bool public mintingRenounced;

    event FeeRateUpdated(uint256 oldRateBps, uint256 newRateBps);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeeExemptionUpdated(address indexed account, bool exempt);
    event MintingRenounced();

    constructor(uint256 initialSupply, address initialOwner) Ownable(initialOwner) {
        feeRecipient = initialOwner;
        isFeeExempt[initialOwner] = true;
        isFeeExempt[address(this)] = true;
        _mint(initialOwner, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(!mintingRenounced, "FeeToken: minting renounced");
        _mint(to, amount);
    }

    /// @notice Permanently disables mint(). Irreversible; total supply is
    /// fixed from this point on except for holder-initiated burns.
    function renounceMinting() external onlyOwner {
        require(!mintingRenounced, "FeeToken: already renounced");
        mintingRenounced = true;
        emit MintingRenounced();
    }

    /// @param newRateBps New fee rate in basis points (100 = 1%). Must be <= MAX_FEE_RATE_BPS.
    function setFeeRate(uint256 newRateBps) external onlyOwner {
        require(newRateBps <= MAX_FEE_RATE_BPS, "FeeToken: rate exceeds cap");
        emit FeeRateUpdated(feeRateBps, newRateBps);
        feeRateBps = newRateBps;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "FeeToken: zero recipient");
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }

    function setFeeExempt(address account, bool exempt) external onlyOwner {
        isFeeExempt[account] = exempt;
        emit FeeExemptionUpdated(account, exempt);
    }

    /// @dev Applies the transfer fee on ordinary transfers only; mint (from ==
    /// address(0)), burn (to == address(0)) and exempt parties bypass it.
    function _update(address from, address to, uint256 value) internal virtual override {
        if (
            from == address(0) ||
            to == address(0) ||
            feeRateBps == 0 ||
            isFeeExempt[from] ||
            isFeeExempt[to]
        ) {
            super._update(from, to, value);
            return;
        }

        uint256 fee = (value * feeRateBps) / FEE_DENOMINATOR;
        uint256 netAmount = value - fee;

        super._update(from, to, netAmount);
        if (fee > 0) {
            super._update(from, feeRecipient, fee);
        }
    }
}
