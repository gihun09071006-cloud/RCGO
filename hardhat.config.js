require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { BSC_TESTNET_RPC_URL, BSC_MAINNET_RPC_URL, PRIVATE_KEY, BSCSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    bscMainnet: {
      url: BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // Etherscan's unified v2 API covers BscScan too; one key works for
    // both bscTestnet and bscMainnet (get one at etherscan.io/myapikey).
    apiKey: BSCSCAN_API_KEY || "",
  },
};
