# BSC Tokens: ANB / DOS / BDL

Three BEP-20 tokens for BNB Smart Chain, built with OpenZeppelin's ERC20
implementation. All three share the `FeeToken` base contract
(`contracts/base/FeeToken.sol`) and are:

- **Fixed-supply on deploy**: 1,000,000,000 tokens (18 decimals) minted to the deployer
- **Mint, then permanently renounced**: `scripts/deploy.js` calls
  `renounceMinting()` right after deployment, so total supply is fixed
  forever after that — see "Minting" below
- **Burnable**: any holder can burn their own tokens (`burn(amount)`)
- **Ownable**: owner-restricted functions use OpenZeppelin's `Ownable`
- **Adjustable transfer fee**: the owner can set a transfer fee (in basis
  points) that is deducted from ordinary transfers and routed to a fee
  recipient address

### Minting

- `mint(address to, uint256 amount)` — owner-only, blocked once
  `mintingRenounced()` is `true`.
- `renounceMinting()` — owner-only, one-way switch that permanently disables
  `mint()`. Unlike `Ownable.renounceOwnership()`, this does **not** give up
  the owner role — fee controls (rate/recipient/exemptions) still work
  afterward, since those are what you need for anti-bot protection.
- `scripts/deploy.js` calls `renounceMinting()` immediately after each
  token's initial supply is minted, so by the time the deploy script exits,
  supply is already fixed. If you deploy manually instead, call
  `renounceMinting()` yourself right after deployment.

### Transfer fee

- `feeRateBps()` — current fee rate in basis points (100 = 1%). Starts at `0`.
- `setFeeRate(uint256 newRateBps)` — owner-only; capped at `MAX_FEE_RATE_BPS`
  (10,000 bps = 100%). A 100% rate is allowed on purpose: it lets the owner
  neutralize sandwich/arbitrage bots by routing a non-exempt transfer's
  entire value to the fee recipient instead of the bot. Combine with
  `setFeeExempt` so real users/pools aren't caught by it while it's active.
- `feeRecipient()` / `setFeeRecipient(address)` — owner-only; where collected
  fees go. Defaults to the deployer.
- `isFeeExempt(address)` / `setFeeExempt(address, bool)` — owner-only;
  addresses exempt from the fee. The deployer and the token contract itself
  are exempt by default.
- Minting and burning are never subject to the fee, regardless of exemption
  status.

**Trust tradeoff**: because the owner can push the fee to 100% for any
non-exempt address, holders are trusting the owner not to grief ordinary
transfers with it — a malicious or compromised owner could use it exactly
like a transfer pause. Mitigate with a multisig/timelock owner and by
communicating the current rate to holders (e.g. via the `FeeRateUpdated`
event).

| Contract | File | Name | Symbol |
|---|---|---|---|
| `AnbToken` | `contracts/AnbToken.sol` | Anb Token | ANB |
| `DosToken` | `contracts/DosToken.sol` | Dos Token | DOS |
| `BdlToken` | `contracts/BdlToken.sol` | Bdl Token | BDL |

Rename the token `name` strings in the contracts if you have official
project names in mind — the symbols (ANB/DOS/BDL) are already fixed to
match your request.

## Setup

```bash
npm install
cp .env.example .env
# edit .env: set PRIVATE_KEY (deployer wallet) and optionally BSCSCAN_API_KEY
```

## Compile & test

```bash
npm run compile
npm test
```

## Deploy

```bash
# local Hardhat network (for a quick sanity check)
npx hardhat node               # in one terminal
npm run deploy:local            # in another terminal

# BSC testnet (chainId 97)
npm run deploy:testnet

# BSC mainnet (chainId 56) — irreversible, double-check everything first
npm run deploy:mainnet
```

`scripts/deploy.js` deploys all three tokens in one run and prints their
addresses.

## Verify on BscScan

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <INITIAL_SUPPLY> <OWNER_ADDRESS>
```

## Simple audit (Slither)

A free static analyzer is enough for a project this size — it won't catch
everything a paid audit would, but it flags the common classes of bugs
(reentrancy, unchecked calls, bad access control, etc.) for zero cost. Run
it locally (needs network access to fetch a solc build, which this sandbox
didn't have):

```bash
pip install slither-analyzer
solc-select install 0.8.26 && solc-select use 0.8.26
slither . --exclude-dependencies
```

Review every finding before mainnet deploy. Slither will likely flag things
we've already made deliberate tradeoffs on (e.g. owner privileges for the
fee controls) — those are expected, not bugs; treat any finding about
external calls, arithmetic, or access control on functions we didn't
discuss as the ones worth a second look.

## Wallets

You do not need one deployer + one fee wallet per token. A practical
minimum for all three tokens together:

- **1 deployer wallet** — pays gas, deploys all three contracts. Can be a
  throwaway hot wallet if you plan to `transferOwnership` afterward.
- **1 owner wallet** (ideally a multisig) — ends up controlling fee settings
  for all three tokens. One shared owner is fine; you don't need a separate
  one per token unless you specifically want to isolate their admin rights.
- **1 fee-recipient (treasury) wallet** — `feeRecipient` can be the same
  address for all three tokens; a shared treasury is simpler to account for
  than three separate ones. Split it into per-token wallets only if you want
  separate bookkeeping per token.

So the minimum is closer to **2–3 wallets total**, not 6. Since minting is
renounced right after deploy, the owner's remaining power is just the fee
controls — still worth putting behind a multisig, but there's less at stake
than before.

## Security notes

- `PRIVATE_KEY` in `.env` controls the deployer wallet — never commit `.env`
  (it's already git-ignored) or share that key.
- Test thoroughly on `bscTestnet` before deploying to mainnet.
- Consider a multisig (e.g. Gnosis Safe) as the owner address for mainnet
  deployments instead of a single EOA, since the owner still controls the
  transfer fee (rate, recipient, exemptions) even after minting is
  renounced.
- If you list on a DEX, exempt the liquidity pool address from the fee
  (`setFeeExempt`) or thoroughly test against your router/pool contracts —
  fee-on-transfer tokens can break AMM math and some routers if the pool
  itself isn't exempt.
