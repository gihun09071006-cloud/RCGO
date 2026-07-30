// One-time allocation transfer for DappOS (DOS), run once right after
// deploying DappOsToken. The deploying wallet holds 100% of the fixed
// supply (no owner, no mint on this token) -- this script just splits it
// out to the allocation wallets below via plain transfer() calls.
//
// Fill in TOKEN_ADDRESS and every recipient address before running:
//   npx hardhat run scripts/distribute-dappos.js --network bscMainnet
const hre = require("hardhat");

const TOKEN_ADDRESS = "0xREPLACE_WITH_DAPPOS_TOKEN_ADDRESS";

// Percentages must sum to 100. Expressed as basis points (1% = 100 bps) so
// the split is exact integer math -- no floating-point rounding.
const ALLOCATIONS = [
  { label: "Airdrop", bps: 600, address: "0xREPLACE_AIRDROP_WALLET" }, // 6%
  { label: "Ecosystem", bps: 2000, address: "0xREPLACE_ECOSYSTEM_WALLET" }, // 20%
  { label: "Treasury", bps: 2000, address: "0xREPLACE_TREASURY_WALLET" }, // 20%
  { label: "Team", bps: 2000, address: "0xREPLACE_TEAM_WALLET" }, // 20%
  { label: "Investors", bps: 2250, address: "0xREPLACE_INVESTORS_WALLET" }, // 22.5%
  { label: "Marketing", bps: 1150, address: "0xREPLACE_MARKETING_WALLET" }, // 11.5%
];

async function main() {
  const totalBps = ALLOCATIONS.reduce((sum, a) => sum + a.bps, 0);
  if (totalBps !== 10000) {
    throw new Error(`Allocation basis points must sum to 10000 (100%), got ${totalBps}`);
  }
  for (const { label, address } of ALLOCATIONS) {
    if (!hre.ethers.isAddress(address) || address.startsWith("0xREPLACE")) {
      throw new Error(`Set a real wallet address for the ${label} allocation before running this script`);
    }
  }

  const [sender] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt("DappOsToken", TOKEN_ADDRESS);

  const totalSupply = await token.totalSupply();
  console.log("Sender:", sender.address);
  console.log("DappOS total supply:", hre.ethers.formatUnits(totalSupply, 18));
  console.log("Sender balance before:", hre.ethers.formatUnits(await token.balanceOf(sender.address), 18));
  console.log("");

  let totalSent = 0n;
  for (const { label, bps, address } of ALLOCATIONS) {
    const amount = (totalSupply * BigInt(bps)) / 10000n;
    const tx = await token.transfer(address, amount);
    await tx.wait();
    totalSent += amount;
    console.log(`${label} (${bps / 100}%): sent ${hre.ethers.formatUnits(amount, 18)} DOS -> ${address}`);
  }

  console.log("");
  console.log("Total sent:", hre.ethers.formatUnits(totalSent, 18));
  console.log("Remaining in sender wallet:", hre.ethers.formatUnits(await token.balanceOf(sender.address), 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
