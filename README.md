# BSC Tokens: ANB / DOS / BDL

Three BEP-20 tokens for BNB Smart Chain, built with OpenZeppelin's ERC20
implementation. Each token is:

- **Fixed-supply on deploy**: 1,000,000,000 tokens (18 decimals) minted to the deployer
- **Mintable**: the owner can mint additional supply later (`mint(to, amount)`)
- **Burnable**: any holder can burn their own tokens (`burn(amount)`)
- **Ownable**: owner-restricted functions use OpenZeppelin's `Ownable`

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

## Security notes

- `PRIVATE_KEY` in `.env` controls the deployer wallet — never commit `.env`
  (it's already git-ignored) or share that key.
- Test thoroughly on `bscTestnet` before deploying to mainnet.
- Consider a multisig (e.g. Gnosis Safe) as the owner address for mainnet
  deployments instead of a single EOA, since the owner can mint new supply.
