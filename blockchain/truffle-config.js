/**
 * Truffle Configuration for FractionalEstate
 * Blockchain Course - Capstone Project
 */

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const MNEMONIC = process.env.MNEMONIC || '';
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 30000000,           // ← I increase gas limit
      gasPrice: 20000000000,   // 20 gwei
      //gas: 6721975,
      //gasPrice: 20000000000,
    },
    sepolia: {
      provider: () => new HDWalletProvider({
        mnemonic: { phrase: MNEMONIC },
        providerOrUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
        providerOrUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        numberOfAddresses: 1,
        shareNonce: true,
      }),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 25000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 100000,
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        viaIR: true,
        optimizer: { 
          enabled: true, 
          runs: 1 },
        evmVersion: "paris",
      }
    }
  },

  
  plugins: ['truffle-plugin-verify'],
  api_keys: { etherscan: ETHERSCAN_API_KEY },
  mocha: { timeout: 100000 },
};
