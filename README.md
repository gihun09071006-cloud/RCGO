# BSC Tokens: ANB / DOS / BDL / WKP / wkeyDAO3

Five BEP-20 tokens for BNB Smart Chain, built with OpenZeppelin's ERC20
implementation. All of them share the `FixedSupplyToken` base contract
(`contracts/base/FixedSupplyToken.sol`) and are:

- **Fixed-supply, minted once at deployment**: 18 decimals, per-token supply
  set in `scripts/deploy.js`, minted entirely to the deployer in the
  constructor. There is no `mint` function at all — supply can never
  increase, by anyone, ever.
- **Burnable**: any holder can burn their own tokens (`burn(amount)`)
- **No owner, no admin functions, no transfer fee** — see "Why no owner"
  below

### Why no owner

Earlier versions of these contracts kept an `Ownable` owner around: first
for an adjustable transfer fee meant to discourage bots, then (after
removing the fee) just for a mint-then-renounce pattern. Wallet and scanner
heuristics — MetaMask via Blockaid, TokenSniffer, and similar — flag *any*
owner-adjustable capability as a risk factor, regardless of intent or
whether it's ever exercised: an adjustable fee read as honeypot-shaped even
capped at 10%, and even a renounceable mint function shows up as
"owner-controlled minting" until the owner actually renounces it on-chain.
The only way to clear that whole class of finding is to not have an owner
at all. `FixedSupplyToken` mints once in the constructor and nothing else —
there's nothing left for a scanner to flag, and nothing left to renounce.

If you deployed an earlier version of one of these tokens (with a fee, or
with a renounceable mint), that contract is unaffected — its bytecode is
immutable. This only changes what gets deployed going forward.

| Contract | File | Name | Symbol | Initial supply |
|---|---|---|---|---|
| `AnbToken` | `contracts/AnbToken.sol` | Anubis Chain | ANB | 50,000,000 |
| `DosToken` | `contracts/DosToken.sol` | Dappos | DOS | 10,000,000 |
| `BdlToken` | `contracts/BdlToken.sol` | Billboard Liq | BDL | 100,000,000 |
| `WkpToken` | `contracts/WkpToken.sol` | wkeyplus | WKP | 3,000,000,000 |
| `WkeyDao3Token` | `contracts/WkeyDao3Token.sol` | wkeyDAO3 | wkeyDAO3 | 3,000,000,000 |

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

**There is nothing to do after deployment** — no `renounceMinting()`, no fee
setup. The constructor mint is the only mint that will ever happen.

## Verify on BscScan

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <INITIAL_SUPPLY> <INITIAL_HOLDER_ADDRESS>
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

Just **1 wallet** is needed per deployment run: it pays gas, deploys the
contract(s), and receives the entire initial supply. There's no owner role
to hand off to a multisig afterward — there's no owner at all.

## Security notes

- `PRIVATE_KEY` in `.env` controls the deployer wallet — never commit `.env`
  (it's already git-ignored) or share that key.
- Test thoroughly on `bscTestnet` before deploying to mainnet.
- Since there's no owner and no mint, the only way to change a token's
  circulating supply after launch is holders burning their own balance —
  plan initial distribution accordingly, since there's no way to top it up
  later.
