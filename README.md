# BSC Tokens: ANB / DOS / BDL

Three BEP-20 tokens for BNB Smart Chain, built with OpenZeppelin's ERC20
implementation. All three share the `MintOnceToken` base contract
(`contracts/base/MintOnceToken.sol`) and are:

- **Fixed-supply on deploy**: 18 decimals, per-token supply set in
  `scripts/deploy.js`, minted to the deployer
- **Mint, then permanently renounced**: `scripts/deploy.js` calls
  `renounceMinting()` right after deployment, so total supply is fixed
  forever after that — see "Minting" below
- **Burnable**: any holder can burn their own tokens (`burn(amount)`)
- **Ownable**: owner-restricted functions use OpenZeppelin's `Ownable`
- **No transfer fee, no owner-adjustable transfer logic of any kind** —
  see "Why no transfer fee" below

### Minting

- `mint(address to, uint256 amount)` — owner-only, blocked once
  `mintingRenounced()` is `true`.
- `renounceMinting()` — owner-only, one-way switch that permanently disables
  `mint()`. Total supply is fixed from that point on except for
  holder-initiated burns.
- `scripts/deploy.js` calls `renounceMinting()` immediately after each
  token's initial supply is minted, so by the time the deploy script exits,
  supply is already fixed. If you deploy manually instead, call
  `renounceMinting()` yourself right after deployment.

### Why no transfer fee

An earlier version of these contracts had an owner-adjustable transfer fee
(with a per-address exemption list) meant to discourage sandwich/arbitrage
bots. In practice, wallet and scanner heuristics — MetaMask via Blockaid,
TokenSniffer, and similar — flag *any* contract where the owner can reduce
or redirect a transfer's value as honeypot-shaped, regardless of the cap or
the intent behind it. Lowering the cap from 100% to 10% didn't clear the
warning. The fee mechanism was removed entirely rather than tuned further:
`mint`-then-`renounce` plus `burn` is a well-understood, low-risk pattern
that doesn't trip that class of warning.

If you deployed an earlier version of one of these tokens with the fee
still present, that contract is unaffected — its bytecode is immutable.
This only changes what gets deployed going forward.

| Contract | File | Name | Symbol | Initial supply |
|---|---|---|---|---|
| `AnbToken` | `contracts/AnbToken.sol` | Anubis Chain | ANB | 50,000,000 |
| `DosToken` | `contracts/DosToken.sol` | Dappos | DOS | 10,000,000 |
| `BdlToken` | `contracts/BdlToken.sol` | Billboard Liq | BDL | 100,000,000 |

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

By default `scripts/deploy.js` deploys all three tokens. To deploy only one
(e.g. ship ANB first, DOS/BDL later), set `DEPLOY_TOKENS` to a comma-separated
list of contract names before running it.

```bash
# local Hardhat network (free, fake BNB — always do this before mainnet)
npx hardhat node               # in one terminal
npm run deploy:local            # in another terminal, deploys all three

# ...or just one token locally:
#   macOS/Linux:   DEPLOY_TOKENS=AnbToken npm run deploy:local
#   Windows PowerShell:
#     $env:DEPLOY_TOKENS="AnbToken"; npm run deploy:local

# BSC testnet (chainId 97)
npm run deploy:testnet

# BSC mainnet (chainId 56) — irreversible, double-check everything first
npm run deploy:mainnet
```

`DEPLOY_TOKENS` works the same way against `deploy:testnet` /
`deploy:mainnet` — e.g. on Windows PowerShell, to ship only ANB to mainnet:

```powershell
$env:DEPLOY_TOKENS="AnbToken"
npm run deploy:mainnet
```

## Verify on BscScan

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <INITIAL_SUPPLY> <OWNER_ADDRESS>
```

If BscScan reports "More than one contract was found to match the deployed
bytecode" (ANB/DOS/BDL only differ by name/symbol, so their runtime bytecode
matches), add `--contract contracts/AnbToken.sol:AnbToken` (swap in the
right file/contract name) to disambiguate.

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

Review every finding before mainnet deploy.

## Wallets

A practical minimum for all three tokens together:

- **1 deployer wallet** — pays gas, deploys all three contracts. Can be a
  throwaway hot wallet if you plan to `transferOwnership` afterward.
- **1 owner wallet** (ideally a multisig) — ends up controlling `mint`/
  `renounceMinting` for all three tokens. One shared owner is fine; you
  don't need a separate one per token unless you specifically want to
  isolate their admin rights.

So **2 wallets total** covers it, not 6. Since minting is renounced right
after deploy, the owner has no remaining power over an already-deployed
token at all.

## Security notes

- `PRIVATE_KEY` in `.env` controls the deployer wallet — never commit `.env`
  (it's already git-ignored) or share that key.
- Test thoroughly on `bscTestnet` before deploying to mainnet.
- Consider a multisig (e.g. Gnosis Safe) as the owner address for mainnet
  deployments — it's who controls `mint`/`renounceMinting` until you call
  `renounceMinting()`, after which the owner has no special power over that
  token left.
