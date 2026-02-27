/**
 * Deploy FractionalEstate Contracts
 * Blockchain Course - Capstone Project
 * 
 * Deployment Order:
 * 1. FractionalEstate (main ERC-1155 contract)
 * 2. PropertyGovernance (governance contract, linked to FractionalEstate)
 */

const FractionalEstate = artifacts.require("FractionalEstate");
const PropertyGovernance = artifacts.require("PropertyGovernance");

module.exports = async function (deployer, network, accounts) {
  const deployerAccount = accounts[0];
  
  console.log("\n========================================");
  console.log("🏠 FractionalEstate Deployment");
  console.log("========================================");
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployerAccount}`);
  console.log("========================================\n");

  // Configuration
  const config = {
    // Base URI for token metadata (update with your IPFS gateway)
    metadataURI: "https://ipfs.io/ipfs/YOUR_METADATA_CID/{id}.json",
    
    // Treasury address for platform fees
    treasury: deployerAccount,
    
    // Minimum investment in wei (approximately $100 at ~0.00003 ETH)
    // Adjust based on current ETH price
    minimumInvestment: web3.utils.toWei("0.001", "ether"), // ~$3-4 for testing
  };

  // ============ DEPLOY FRACTIONAL ESTATE ============
  console.log("📦 Deploying FractionalEstate...");
  
  await deployer.deploy(
    FractionalEstate,
    config.metadataURI,
    config.treasury,
    config.minimumInvestment
  );
  
  const fractionalEstate = await FractionalEstate.deployed();
  console.log(`✅ FractionalEstate deployed at: ${fractionalEstate.address}`);

  // ============ DEPLOY PROPERTY GOVERNANCE ============
  console.log("\n📦 Deploying PropertyGovernance...");
  
  await deployer.deploy(
    PropertyGovernance,
    fractionalEstate.address
  );
  
  const propertyGovernance = await PropertyGovernance.deployed();
  console.log(`✅ PropertyGovernance deployed at: ${propertyGovernance.address}`);

  // ============ DEPLOYMENT SUMMARY ============
  console.log("\n========================================");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log(`FractionalEstate:    ${fractionalEstate.address}`);
  console.log(`PropertyGovernance:  ${propertyGovernance.address}`);
  console.log(`Treasury:            ${config.treasury}`);
  console.log(`Minimum Investment:  ${web3.utils.fromWei(config.minimumInvestment, "ether")} ETH`);
  console.log("========================================\n");

  // ============ SAVE ADDRESSES TO FILE ============
  const fs = require('fs');
  const path = require('path');
  
  const addresses = {
    network: network,
    deployedAt: new Date().toISOString(),
    contracts: {
      FractionalEstate: fractionalEstate.address,
      PropertyGovernance: propertyGovernance.address,
    },
    config: {
      treasury: config.treasury,
      minimumInvestment: config.minimumInvestment,
      metadataURI: config.metadataURI,
    }
  };

  const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`📄 Contract addresses saved to: deployed-addresses.json`);

  // ============ VERIFICATION INSTRUCTIONS ============
  if (network === 'sepolia') {
    console.log("\n========================================");
    console.log("🔍 ETHERSCAN VERIFICATION");
    console.log("========================================");
    console.log("Run the following commands to verify:");
    console.log(`\ntruffle run verify FractionalEstate --network sepolia`);
    console.log(`truffle run verify PropertyGovernance --network sepolia`);
    console.log("========================================\n");
  }
};
