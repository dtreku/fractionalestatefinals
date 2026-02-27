# FractionalEstate Deployment Guide

This guide provides step-by-step instructions for deploying the FractionalEstate platform across development, staging, and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Testnet Deployment (Sepolia)](#testnet-deployment-sepolia)
4. [Database Deployment (Supabase)](#database-deployment-supabase)
5. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
6. [Production Considerations](#production-considerations)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|-------------|
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm | >= 9.0.0 | Included with Node.js |
| Git | >= 2.0.0 | [git-scm.com](https://git-scm.com) |
| Truffle | ^5.11.5 | `npm install -g truffle` |
| Ganache | ^7.9.0 | `npm install -g ganache` |

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Infura | Ethereum node provider | [infura.io](https://infura.io) |
| Etherscan | Contract verification | [etherscan.io](https://etherscan.io) |
| WalletConnect | Wallet connection | [walletconnect.com](https://cloud.walletconnect.com) |
| Supabase | Database hosting | [supabase.com](https://supabase.com) |
| Vercel | Frontend hosting | [vercel.com](https://vercel.com) |

### Required Funds

| Network | Currency | Source |
|---------|----------|--------|
| Sepolia | SepoliaETH | [sepoliafaucet.com](https://sepoliafaucet.com) |
| Mainnet | ETH | Purchase from exchange |

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/fractionalestate.git
cd fractionalestate

# Install blockchain dependencies
cd blockchain
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Blockchain Environment (blockchain/.env):**

```bash
cd blockchain
cp .env.example .env
```

Edit `blockchain/.env`:
```env
# Development mnemonic (DO NOT use in production)
MNEMONIC="test test test test test test test test test test test junk"

# API Keys (not needed for local development)
INFURA_API_KEY=
ETHERSCAN_API_KEY=

# Platform Configuration
TREASURY_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
METADATA_BASE_URI=ipfs://QmExample/
MIN_INVESTMENT_WEI=1000000000000000
```

**Frontend Environment (frontend/.env.local):**

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:
```env
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=5777

# Contract Addresses (updated after deployment)
NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS=
NEXT_PUBLIC_GOVERNANCE_ADDRESS=

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Supabase (use local or create test project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 3: Start Local Blockchain

```bash
cd blockchain

# Start Ganache with deterministic accounts
npx ganache \
  --port 7545 \
  --networkId 5777 \
  --accounts 10 \
  --defaultBalanceEther 100 \
  --mnemonic "test test test test test test test test test test test junk"
```

Keep this terminal running.

### Step 4: Deploy Contracts

In a new terminal:

```bash
cd blockchain

# Compile contracts
npx truffle compile

# Deploy to local network
npx truffle migrate --network development

# Note the deployed addresses from output:
# FractionalEstate: 0x...
# PropertyGovernance: 0x...
```

### Step 5: Update Frontend Config

Update `frontend/.env.local` with deployed addresses:
```env
NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS=0x... # From migration output
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...       # From migration output
```

### Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 7: Connect MetaMask

1. Open MetaMask
2. Add Network → Add network manually
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `5777`
   - Currency: `ETH`
3. Import account using Ganache private key

---

## Testnet Deployment (Sepolia)

### Step 1: Configure API Keys

Edit `blockchain/.env`:
```env
# Use a dedicated deployment wallet mnemonic
MNEMONIC="your secure twelve word mnemonic phrase here"

# Infura project ID
INFURA_API_KEY=your_infura_project_id

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Platform treasury (your wallet or multisig)
TREASURY_ADDRESS=0xYourTreasuryAddress
```

### Step 2: Fund Deployment Wallet

1. Get your deployer address:
```bash
npx truffle console --network sepolia
> web3.eth.getAccounts().then(console.log)
```

2. Visit [sepoliafaucet.com](https://sepoliafaucet.com) and request ETH

3. Verify balance:
```bash
> web3.eth.getBalance('0xYourAddress').then(b => console.log(web3.utils.fromWei(b, 'ether')))
web3.eth.getBalance(0x6f4e3Ef41AF0351F3F91d95afd74a0a365f1e7a0).then(b => console.log(web3.utils.fromWei(b, 'ether')))
```

You need approximately 0.1 ETH for deployment.

### Step 3: Deploy Contracts

```bash
cd blockchain

# Compile with optimizer
npx truffle compile --all

# Deploy to Sepolia
npx truffle migrate --network sepolia

# Expected output:
# Deploying 'FractionalEstate'
# > transaction hash: 0x...
# > contract address: 0x...
# > gas used: 3500000
# 
# Deploying 'PropertyGovernance'
# > transaction hash: 0x...
# > contract address: 0x...
# > gas used: 2500000
```

Save the deployed addresses!

### Step 4: Verify Contracts on Etherscan

```bash
# Verify FractionalEstate
npx truffle run verify FractionalEstate --network sepolia

# Verify PropertyGovernance (with constructor args)
npx truffle run verify PropertyGovernance --network sepolia
```

After verification, contracts will have a green checkmark on Etherscan.

### Step 5: Initial Configuration

```bash
npx truffle console --network sepolia

# Get contract instances
> const fe = await FractionalEstate.deployed()
> const gov = await PropertyGovernance.deployed()

# Grant roles to additional addresses if needed
> await fe.grantRole(await fe.PROPERTY_MANAGER_ROLE(), '0xManagerAddress')
> await fe.grantRole(await fe.COMPLIANCE_ROLE(), '0xComplianceAddress')

# Verify roles
> await fe.hasRole(await fe.PROPERTY_MANAGER_ROLE(), '0xManagerAddress')
```

---

## Database Deployment (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in and click "New Project"
3. Configure:
   - Name: `fractionalestate-prod` (or staging)
   - Database Password: Generate strong password
   - Region: Choose closest to users
4. Wait for project initialization (~2 minutes)

### Step 2: Get Connection Details

From Project Settings → API:
- Project URL: `https://xxxxx.supabase.co`
- anon public key: `eyJhbGci...`
- service_role key: `eyJhbGci...` (keep secret!)

### Step 3: Execute Schema

1. Navigate to SQL Editor
2. Click "New Query"
3. Paste contents of `database/schema.sql`
4. Click "Run"
5. Repeat for `database/policies.sql`
6. (Optional) Run `database/seed.sql` for test data

### Step 4: Configure Authentication

From Authentication → Providers:
1. Enable Email provider
2. Configure settings:
   - Enable email confirmations: Yes
   - Secure email change: Yes
3. (Optional) Enable additional OAuth providers

### Step 5: Configure Storage

From Storage:
1. Create bucket: `property-images`
2. Set to Public
3. Add policy: Allow authenticated uploads

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Repository

Ensure your repository is pushed to GitHub/GitLab/Bitbucket.

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - Framework: Next.js
   - Root Directory: `frontend`

### Step 3: Configure Environment Variables

In Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
```

### Step 4: Deploy

Click "Deploy" and wait for build completion.

### Step 5: Configure Domain (Optional)

From Vercel project settings → Domains:
1. Add custom domain: `fractionalestate.com`
2. Configure DNS records as instructed
3. Enable SSL (automatic)

---

## Production Considerations

### Security Checklist

- [ ] Use hardware wallet or multisig for deployment
- [ ] Complete professional security audit
- [ ] Enable 2FA on all service accounts
- [ ] Use separate API keys for prod/staging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Implement incident response plan

### Smart Contract Security

```solidity
// Recommended production settings
uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
uint256 public constant MAX_FEE_BPS = 1000;     // 10% cap
uint256 public constant MIN_INVESTMENT_USD = 100;
```

### Database Security

```sql
-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
-- etc.

-- Regular backups
-- Configure point-in-time recovery in Supabase
```

### Mainnet Deployment

For Ethereum mainnet:

1. Update `truffle-config.js`:
```javascript
mainnet: {
  provider: () => new HDWalletProvider(
    process.env.MAINNET_MNEMONIC,
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  ),
  network_id: 1,
  gas: 5000000,
  gasPrice: 20000000000, // 20 gwei - adjust based on network
  confirmations: 2,
  timeoutBlocks: 200,
}
```

2. Deploy with care:
```bash
npx truffle migrate --network mainnet
```

3. Immediately verify:
```bash
npx truffle run verify FractionalEstate --network mainnet
```

---

## Post-Deployment Verification

### Smart Contract Checks

```bash
npx truffle console --network sepolia

# Verify deployment
> const fe = await FractionalEstate.deployed()
> await fe.name() // Should return "FractionalEstate"

# Check admin role
> const adminRole = await fe.DEFAULT_ADMIN_ROLE()
> await fe.hasRole(adminRole, '0xYourAddress') // Should return true

# Check treasury
> await fe.treasury() // Should return treasury address

# Check paused state
> await fe.paused() // Should return false
```

### Frontend Checks

1. **Wallet Connection**: Connect MetaMask, verify correct network
2. **Property Display**: Properties load from database
3. **Investment Flow**: Complete test purchase
4. **Governance**: Create and vote on test proposal
5. **Responsive Design**: Test on mobile devices

### Database Checks

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies;

-- Verify seed data (if applicable)
SELECT COUNT(*) FROM properties;
```

---

## Troubleshooting

### Common Issues

#### "Insufficient funds for gas"
```bash
# Check balance
web3.eth.getBalance('0xYourAddress')

# Solution: Fund wallet with more ETH
```

#### "Contract verification failed"
```bash
# Ensure correct compiler version
# Check constructor arguments match
npx truffle run verify FractionalEstate@0xAddress --network sepolia
```

#### "Transaction reverted"
```bash
# Check require conditions
# Verify caller has required role
# Confirm contract not paused
```

#### "CORS errors in frontend"
```bash
# Add domain to Supabase allowed origins
# Check NEXT_PUBLIC_ prefix on env vars
```

#### "Wallet won't connect"
```bash
# Verify WalletConnect project ID
# Check chain ID matches
# Ensure correct RPC URL
```

### Getting Help

1. Check project issues on GitHub
2. Review Truffle/Hardhat documentation
3. Ask in Ethereum Stack Exchange
4. Join Discord communities

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Check contract state | Daily | Etherscan / Console |
| Database backup | Daily | Supabase automatic |
| Update dependencies | Monthly | `npm update` |
| Security scan | Monthly | `npm audit` |
| Gas price monitoring | As needed | ethgasstation.info |

### Upgrade Path

For contract upgrades, consider:
1. Deploy new version
2. Migrate state if needed
3. Update frontend references
4. Deprecate old contract

---

## Environment Summary

| Environment | Network | Database | Frontend |
|-------------|---------|----------|----------|
| Local | Ganache (5777) | Local/Test Supabase | localhost:3000 |
| Staging | Sepolia (11155111) | Staging Supabase | staging.example.com |
| Production | Mainnet (1) | Production Supabase | example.com |

---

*Last Updated: February 2026*
