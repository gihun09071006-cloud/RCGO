const hre = require("hardhat");

const INITIAL_SUPPLY = hre.ethers.parseUnits("1000000000", 18); // 1,000,000,000 tokens, 18 decimals

const TOKENS = ["AnbToken", "DosToken", "BdlToken"];

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  for (const contractName of TOKENS) {
    const Factory = await hre.ethers.getContractFactory(contractName);
    const token = await Factory.deploy(INITIAL_SUPPLY, deployer.address);
    await token.waitForDeployment();

    const address = await token.getAddress();
    const symbol = await token.symbol();
    console.log(`${contractName} (${symbol}) deployed to: ${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
