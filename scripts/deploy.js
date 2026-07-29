const hre = require("hardhat");

// Per-token config: name/symbol live in the contract itself, supply lives here.
const TOKENS = [
  { contract: "AnbToken", supply: "50000000" }, // Anubis Chain (ANB)
  { contract: "DosToken", supply: "10000000" }, // Dappos (DOS)
  { contract: "BdlToken", supply: "100000000" }, // Billboard Liq (BDL)
  { contract: "WkpToken", supply: "3000000000" }, // wkeyplus (WKP)
  { contract: "WkeyDao3Token", supply: "3000000000" }, // wkeyDAO3
];

// Optional: set DEPLOY_TOKENS="AnbToken" (comma-separated contract names) to
// deploy only a subset instead of all three. Useful for shipping tokens one
// at a time.
function tokensToDeploy() {
  const filter = process.env.DEPLOY_TOKENS;
  if (!filter) return TOKENS;
  const wanted = filter.split(",").map((s) => s.trim());
  const selected = TOKENS.filter((t) => wanted.includes(t.contract));
  if (selected.length === 0) {
    throw new Error(`DEPLOY_TOKENS="${filter}" matched none of: ${TOKENS.map((t) => t.contract).join(", ")}`);
  }
  return selected;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  for (const { contract: contractName, supply } of tokensToDeploy()) {
    const initialSupply = hre.ethers.parseUnits(supply, 18);
    const Factory = await hre.ethers.getContractFactory(contractName);
    const token = await Factory.deploy(initialSupply, deployer.address);
    await token.waitForDeployment();

    const address = await token.getAddress();
    const symbol = await token.symbol();
    console.log(`${contractName} (${symbol}) deployed to: ${address}`);
    console.log(`  initial supply: ${supply} ${symbol} (fixed forever, no mint function exists)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
