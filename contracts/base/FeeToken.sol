// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice BEP-20 base token with an owner-adjustable transfer fee.
/// @dev Fee is expressed in basis points (1 bps = 0.01%), up to and
/// including FEE_DENOMINATOR (100%). A 100% fee is intentionally allowed
/// so the owner can neutralize sandwich/arbitrage bots by routing an
/// attacker's entire transfer to the fee recipient; use setFeeExempt to
/// keep legitimate users/pools unaffected while such a rate is active.
/// Minting and burning are never subject to the fee.
///
/// NOTE ON TRUST: because the owner can set the rate up to 100% for
/// non-exempt accounts, holders are trusting the owner not to grief
/// transfers. Consider a timelock or multisig owner, and communicate any
/// active fee rate to holders.
abstract contract FeeToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant MAX_FEE_RATE_BPS = FEE_DENOMINATOR; // 100% hard cap

    uint256 public feeRateBps;
    address public feeRecipient;
    mapping(address => bool) public isFeeExempt;

    event FeeRateUpdated(uint256 oldRateBps, uint256 newRateBps);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event FeeExemptionUpdated(address indexed account, bool exempt);

    constructor(uint256 initialSupply, address initialOwner) Ownable(initialOwner) {
        feeRecipient = initialOwner;
        isFeeExempt[initialOwner] = true;
        isFeeExempt[address(this)] = true;
        _mint(initialOwner, initialSupply);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
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
