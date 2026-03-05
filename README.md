# fractionalestatefinals
A test final project for business applications blockchain technology class
# FractionalEstate - PropTech Real Estate Tokenization Platform -
--------------------------------------------------------------------------------------------------------------------------------------
OVERVIEW. AFTER READING THROUGH GO TO LINE 220 FOR DEVELOPMENT INSTRUCTIONS
GET YOUR GROUP MEMBERS TO HAVE AS MUCH SEPOLIA FUNDS. THE FUNDS WILL BE TRANSFERRED TO THE PROJECT LEAD. 
AT LEAST 1.5 SEPOLIA ETH needed to deploy on sepolia network. Before then the instructions will guide you how to deploy and test on local network called ganache
I HAVE MADE THIS COMPREHENSIVE DOCUMENT TO HELP YOUR BLOCKCHAIN JOURNEY BEYOND THE CLASS. 
THANK YOU AND SEE YOU IN OUR FINAL PROJECT DEVELOPMENT CLASS!
PROF TREKU
--------------------------------------------------------------------------------------------------------------------------------------

<div align="center">

![FractionalEstate](https://img.shields.io/badge/FractionalEstate-PropTech-4F46E5?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-627EEA?style=for-the-badge&logo=ethereum)

**Democratizing Real Estate Investment Through Blockchain Technology**

[Live Demo](#demo) • [Documentation](#documentation) • [Quick Start](#quick-start) • [Student Gude](#student-implementation-guide) • [Architecture](#architecture)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Smart Contracts](#smart-contracts)
- [Frontend Application](#frontend-application)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Regulatory Compliance](#regulatory-compliance)
- [Contributing](#contributing)
- [License](#license)

---

##  Case Overview

FractionalEstate is a decentralized real estate tokenization platform that enables fractional ownership of commercial and residential properties through blockchain technology. Built on Ethereum (Sepolia testnet), the platform uses ERC-1155 multi-token standards to represent property shares, allowing investors to own fractions of high-value real estate assets with as little as $100.

### Problem Statement

Traditional real estate investment requires:
- **High capital requirements** ($50,000+ minimum for most properties)
- **Illiquid assets** (months to years to sell)
- **Geographic limitations** (local market access only)
- **Complex legal processes** (attorneys, title companies, etc.)

### Our Solution

FractionalEstate addresses these challenges by:
- **Lowering barriers** - Minimum investment of $100 equivalent
- **Providing liquidity** - Trade property shares 24/7 on-chain
- **Enabling global access** - Invest in properties worldwide
- **Automating compliance** - Smart contract-enforced KYC/AML
- **Distributing governance** - Token-weighted voting on property decisions

---

##  Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Fractional Ownership** | Purchase shares of tokenized properties using ETH |
| **Automated Dividends** | Receive rental income proportional to share ownership |
| **Property Governance** | Vote on renovations, management changes, and sales |
| **KYC/AML Compliance** | On-chain investor verification status |
| **Portfolio Dashboard** | Track investments, yields, and claimable dividends |

### Smart Contract Features

- **ERC-1155 Multi-Token** - Each property has its own token ID
- **Role-Based Access Control** - Admin, Property Manager, Compliance roles
- **Pausable Operations** - Emergency stop for security incidents
- **Reentrancy Protection** - Secure fund transfers
- **Platform Fee Collection** - 2.5% transaction fee to treasury

### Governance Features

- **Token-Weighted Voting** - Voting power proportional to shares owned
- **Multiple Proposal Types** - General, Renovation, Management, Sale, Distribution, Emergency
- **Quorum Requirements** - 25% minimum participation
- **Timelock Execution** - 2-day delay after proposal passage
- **Vote Delegation** - (Future: delegate voting power)

---

## Technology Stack

### Blockchain Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | ^0.8.19 | Smart contract development |
| OpenZeppelin | ^4.9.3 | Security-audited contract libraries |
| Truffle | ^5.11.5 | Development framework & migrations |
| Ganache | ^7.9.0 | Local blockchain for development |
| Sepolia | - | Ethereum testnet deployment |

### Backend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | Cloud | PostgreSQL database + Auth + Real-time |
| PostgreSQL | 15+ | Relational database |
| Row Level Security | - | Database access control |

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14 | React framework with App Router |
| TypeScript | ^5.0 | Type-safe JavaScript |
| Tailwind CSS | ^3.4 | Utility-first CSS framework |
| shadcn/ui | latest | Accessible component library |
| wagmi | ^2.0 | React hooks for Ethereum |
| viem | ^2.0 | TypeScript Ethereum library |
| RainbowKit | ^2.0 | Wallet connection UI |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks |
| Jest | Testing framework |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │  RainbowKit │  │   MetaMask / Wallet     │  │
│  │   Frontend  │  │   Connect   │  │     (Web3 Provider)     │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    wagmi + viem                          │   │
│  │         (Contract Interactions & Transaction Mgmt)       │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┼─────────────────────────────────┐   │
│  │              Supabase Client (REST + Real-time)          │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│   BLOCKCHAIN LAYER      │     │        DATABASE LAYER           │
│  ┌───────────────────┐  │     │  ┌───────────────────────────┐  │
│  │ FractionalEstate  │  │     │  │     Supabase Cloud        │  │
│  │    (ERC-1155)     │  │     │  │  ┌─────────────────────┐  │  │
│  │                   │  │     │  │  │    PostgreSQL       │  │  │
│  │  • Properties     │  │     │  │  │  ┌───────────────┐  │  │  │
│  │  • Investments    │  │     │  │  │  │    Tables     │  │  │  │
│  │  • Dividends      │  │     │  │  │  │ • users       │  │  │  │
│  │  • KYC Status     │  │     │  │  │  │ • properties  │  │  │  │
│  └─────────┬─────────┘  │     │  │  │  │ • investments │  │  │  │
│            │            │     │  │  │  │ • dividends   │  │  │  │
│  ┌─────────▼─────────┐  │     │  │  │  │ • proposals   │  │  │  │
│  │ PropertyGovernance│  │     │  │  │  │ • votes       │  │  │  │
│  │                   │  │     │  │  │  └───────────────┘  │  │  │
│  │  • Proposals      │  │     │  │  └─────────────────────┘  │  │
│  │  • Voting         │  │     │  │                           │  │
│  │  • Execution      │  │     │  │  Row Level Security (RLS) │  │
│  └───────────────────┘  │     │  └───────────────────────────┘  │
│                         │     │                                 │
│    Sepolia Testnet      │     │      Supabase Auth + Storage    │
└─────────────────────────┘     └─────────────────────────────────┘
```

### Data Flow

1. **User connects wallet** → RainbowKit → MetaMask → Wallet address returned
2. **User browses properties** → Next.js → Supabase → Property listings returned
3. **User purchases shares** → wagmi → FractionalEstate.sol → ERC-1155 tokens minted
4. **Manager declares dividend** → wagmi → FractionalEstate.sol → Dividend recorded on-chain
5. **User claims dividend** → wagmi → FractionalEstate.sol → ETH transferred to wallet
6. **User creates proposal** → wagmi → PropertyGovernance.sol → Proposal stored on-chain
7. **User votes** → wagmi → PropertyGovernance.sol → Vote recorded with token weight


### PREREQUISITES 

Ensure you have the following installed: Refer to the previous implementation guide to install them

```bash
node >= 18.0.0
npm >= 9.0.0
git >= 2.0.0
```
# install ganache for local network testing

```bash
npm install -g ganache

node -v
npm -v
git -v
ganache -v
```


*** TWO PLACES TO START YOUR CAPSTONE PROJECT DEVELOPMENT: EITHER FROM   "QUICK START"  OR   "STUDENT IMPLEMENTATION GUDE" (Line 820)
IN EACH, CASE YOU TWO OPTIONS ***
-------------------------------------------------------------------------------------------------------------------------------
Option A: Local Demo Only (No Sepolia ETH Needed)
Run everything locally for demonstration:

Option B: Deploy to Sepolia (Recommended for Capstone)
Deploy contracts to Sepolia so anyone can access your app:

If you want to...                        | Use
─────────────────────────────────────────┼─────────────────────────────────────
Test locally on your computer.           | Ganache + localhost
Show demo on your computer only.         | Ganache + localhost
Avoid getting Sepolia ETH.               | Ganache + localhost (limited and blockchain sits on only your personal computer)
Submit final work capstone for grading   | Sepolia + Vercel   (I am flexible if the group runs out of sepolia eth)
Let others test your app globally        | Sepolia + Vercel

-------------------------------------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------------------------------------
##  QUICK START         *******************************************************************************************************
-------------------------------------------------------------------------------------------------------------------------------

### 1: GitHub Repository Setup

## Scenario: You Have the Project Folder Locally, Need to Create GitHub Repository

This guide assumes you already have the `fractionalestatefinals` folder on your computer (open in VS Code) and need to push it to a new GitHub repository.

---

## Step 1.1: Open Your Project in VS Code Terminal

1. Open VS Code
2. Go to **File → Open Folder** → Select your `fractionalestatefinals` folder
3. Open the integrated terminal: **View → Terminal** (or press `` Ctrl+` ``)
4. Verify you're in the correct folder:

```bash
pwd
```

**Expected output:**
```
/Users/yourname/path/to/fractionalestatefinals
```

You should see files like `blockchain/`, `frontend/`, `database/`, etc.

---

## Step 1.2: Create a New Repository on GitHub

1. Go to **https://github.com** and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Configure your repository:

| Setting                | Value.       |
|------------------------|--------------|
| Repository name        | `fractionalestatefinals` |
| Description            | `FractionalEstate - Real Estate Tokenization Capstone Project` |
| Visibility             | **Public** (or Private if preferred) |
| Initialize with README | ❌ **Leave UNCHECKED** |
| Add .gitignore         | ❌ **Leave as "None"** |
| Choose a license       | ❌ **Leave as "None"** |

4. Click **"Create repository"**

> ⚠️ **IMPORTANT:** Do NOT check any initialization options. Your local folder already has files.

5. After creation, you'll see a page with setup instructions. **Keep this page open** - you'll need the repository URL.
https://github.com/dtreku/fractionalestatefinals
---

## Step 1.3: Initialize Git in Your Local Folder

Back in VS Code terminal, run these commands one at a time:

```bash
# Check if git is already initialized
ls -la | grep .git
```

**If you see `.git` folder:** Skip to Step 1.4

**If you don't see `.git` folder:** Initialize git:

```bash
git init
```

**Expected output:**
```
Initialized empty Git repository in /path/to/fractionalestatefinals/.git/
```

# Add the .gitignore FIRST

``` bash
git add .gitignore
```

**Create the file .gitignore file manually using echo commands if you got a fatal error else skip these echo commands and go to "verify the file created"!**

```bash
echo "# Dependencies" > .gitignore
echo "node_modules/" >> .gitignore
echo "*/node_modules/" >> .gitignore
echo "" >> .gitignore
echo "# Build outputs" >> .gitignore
echo ".next/" >> .gitignore
echo "*/.next/" >> .gitignore
echo "build/" >> .gitignore
echo "*/build/" >> .gitignore
echo "" >> .gitignore
echo "# Environment files" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo "" >> .gitignore
echo "# OS files" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "" >> .gitignore
echo "# Logs" >> .gitignore
echo "*.log" >> .gitignore
echo "" >> .gitignore
echo "# Truffle" >> .gitignore
echo "blockchain/build/" >> .gitignore

```
---

# Verify the file was created

```bash
cat .gitignore
```

## Step 1.4: Add All Files and Create First Commit

```bash
# Add all project files to git tracking
git add .

# Create your first commit
git commit -m "Initial commit - FractionalEstate Final Project"
```

**Expected output:**
```
[main (root-commit) abc1234] Initial commit - FractionalEstate capstone project
 150 files changed, 25000 insertions(+)
 create mode 100644 README.md
 create mode 100644 blockchain/contracts/FractionalEstate.sol
 ...
```

---

## Step 1.5: Connect Local Repository to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
# Link your local repo to GitHub (copy your actual URL from GitHub)
git remote add origin https://github.com/YOUR_USERNAME/fractionalestatefinals.git

# Verify the remote was added
git remote -v
```

**Expected output:**
```
origin  https://github.com/YOUR_USERNAME/fractionalestatefinals.git (fetch)
origin  https://github.com/YOUR_USERNAME/fractionalestatefinals.git (push)
```

---

## Step 1.6: Push Your Code to GitHub

```bash
# Push your code to GitHub
git push -u origin main
```

**If you get an error about `main` vs `master`:**
```bash
# Rename your branch to main (if needed)
git branch -M main

# Then push
git push -u origin main
```

**Expected output:**
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 250.00 KiB | 5.00 MiB/s, done.
Total 150 (delta 25), reused 0 (delta 0)
remote: Resolving deltas: 100% (25/25), done.
To https://github.com/YOUR_USERNAME/fractionalestatefinals.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Step 1.7: Verify on GitHub

1. Go to `https://github.com/YOUR_USERNAME/fractionalestatefinals`
2. You should see all your project files
3. Verify the folder structure matches:

```
fractionalestatefinals/
├── blockchain/
├── frontend/
├── database/
├── docs/
└── README.md
```

✅ **Your code is now on GitHub!**

---

## Quick Summary of Commands

Run these commands in order from your project folder:

```bash
git init                                                                      # Initialize git (skip if already done)
git add .                                                                     # Stage all files
git commit -m "Initial commit"                                                # Create first commit
git remote add origin https://github.com/YOUR_USERNAME/fractionalestatefinals.git  # Connect to GitHub
git branch -M main                                                            # Ensure branch is named 'main'
git push -u origin main                                                       # Push to GitHub
```

---

## Troubleshooting

### Error: "remote origin already exists"

```bash
# Remove existing remote and add again
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/fractionalestatefinals.git
```

### Error: "failed to push some refs"

```bash
# Force push (only for initial setup!)
git push -u origin main --force
```

### Error: "Authentication failed"

GitHub now requires Personal Access Tokens instead of passwords:

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Give it a name and select scopes: `repo` (full control)
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again!)
6. Use this token as your password when git prompts you

### Error: "src refspec main does not match any"

This means you haven't committed anything yet:

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## Future Updates

After your initial push, use these commands to save future changes:

```bash
# Check what files have changed
git status

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Added property investment feature"

# Push to GitHub
git push

# Pull from GitHub to your vscode project file if you make changes directly in the github repository.
git push
```
---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER (VS Code)                      │
│                                                                 │
│   fractionalestatefinals/                                       │
│   ├── blockchain/                                               │
│   ├── frontend/                                                 │
│   ├── database/                                                 │
│   └── README.md                                                 │
│                                                                 │
│   Terminal Commands:                                            │
│   $ git init                                                    │
│   $ git add .                                                   │
│   $ git commit -m "Initial commit"                              │
│   $ git remote add origin https://github.com/YOU/repo.git      │
│   $ git push -u origin main                                     │
│                                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  │ git push
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GITHUB.COM                              │
│                                                                 │
│   https://github.com/YOUR_USERNAME/fractionalestatefinals       │
│                                                                 │
│   ✅ All your files are now backed up and shareable!           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*### 1 Complete - Proceed to ### 2: Smart Contract Deployment*


### 2. Install Dependencies

Move the blockchain folder into the fractionalestatefinals folder
**Blockchain:**
```bash
cd blockchain
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Environment Configuration

**Blockchain (.env):**
```bash
cd ../blockchain
cp .env.example .env
```

Edit `.env`:
```env
MNEMONIC="your twelve word mnemonic phrase here"
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
TREASURY_ADDRESS=0xYourTreasuryAddress
```

**Frontend (.env.local):**
```bash
cd ../frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS=0xDeployedContractAddress
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0xDeployedGovernanceAddress
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In your Supabase dashboard, look at the left sidebar
3. Navigate to SQL Editor (has a >_ icon)
4. Execute the following sql scripts in order: (see 5. below to execute the scripts)
   - `database/schema.sql`
   - `database/policies.sql`
   - `database/seed.sql` (optional, for test data)


5. 
- Open your local file database/schema.sql in a text editor (VS Code, etc.)
- Select All (Ctrl+A / Cmd+A) and Copy (Ctrl+C / Cmd+C)
- In Supabase SQL Editor, click "New query" (or the + button)
- Paste the copied SQL (Ctrl+V / Cmd+V)
- Click the green "Run" button (or press Ctrl+Enter / Cmd+Enter)
- You should see: Success. No rows returned (this is normal for CREATE TABLE statements)

### 5. Local Network - Ganache Development/ Deployment

**Start local blockchain:**
```bash
cd ../blockchain
npx ganache --port 7545 --networkId 5777 --gasLimit 80000000 --chain.allowUnlimitedContractSize
```
if ganache is already running
curl http://127.0.0.1:7545

one liner to kill and restart ganache
pkill -f ganache && npx ganache --port 7545 --networkId 5777 --gasLimit 80000000 --chain.allowUnlimitedContractSize

**Deploy contracts:**
```bash
npx truffle migrate --network development
```

**Start frontend:**
```bash
cd ../frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Smart Contracts

### FractionalEstate.sol

The core contract implementing ERC-1155 for fractional property ownership.

#### Key Functions

| Function | Description | Access |
|----------|-------------|--------|
| `listProperty()` | Create new tokenized property | PROPERTY_MANAGER_ROLE |
| `purchaseShares()` | Buy property tokens with ETH | Verified investors |
| `verifyInvestor()` | Mark investor as KYC-verified | COMPLIANCE_ROLE |
| `declareDividend()` | Distribute rental income | PROPERTY_MANAGER_ROLE |
| `claimDividends()` | Claim accumulated dividends | Token holders |

#### Events

```solidity
event PropertyListed(uint256 indexed propertyId, string metadataURI, uint256 totalShares, uint256 pricePerShare);
event SharesPurchased(uint256 indexed propertyId, address indexed buyer, uint256 shares, uint256 totalCost);
event DividendDeclared(uint256 indexed propertyId, uint256 dividendIndex, uint256 totalAmount, uint256 amountPerShare);
event DividendsClaimed(uint256 indexed propertyId, address indexed investor, uint256 amount);
event InvestorVerified(address indexed investor, bool isAccredited);
```

### PropertyGovernance.sol

Governance contract for token-weighted voting on property decisions.

#### Key Functions

| Function | Description | Access |
|----------|-------------|--------|
| `createProposal()` | Submit new governance proposal | Token holders |
| `castVote()` | Vote on active proposal | Token holders |
| `executeProposal()` | Execute passed proposal | Anyone (after timelock) |
| `cancelProposal()` | Cancel pending proposal | Proposer or Admin |

#### Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Voting Period | 7 days | Duration for voting |
| Quorum | 25% | Minimum participation |
| Approval Threshold | 51% | Votes needed to pass |
| Execution Delay | 2 days | Timelock after passage |

---

## Frontend Application

### Page Structure

```
app/
├── page.tsx              # Landing page
├── dashboard/
│   └── page.tsx          # Portfolio overview
├── properties/
│   ├── page.tsx          # Property listings
│   └── [id]/
│       └── page.tsx      # Property details & investment
├── governance/
│   └── page.tsx          # Proposals & voting
├── investments/
│   └── page.tsx          # Investment history
└── profile/
    └── page.tsx          # User settings & KYC
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `Navbar` | Navigation with wallet connection |
| `PropertyCard` | Property preview with key metrics |
| `InvestmentForm` | Share purchase interface |
| `DividendClaimer` | Claim available dividends |
| `ProposalCard` | Governance proposal display |
| `VotePanel` | Voting interface |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useProperty` | Fetch property data from contract |
| `useInvestor` | Get investor verification status |
| `useShareBalance` | Get token balance for property |
| `useClaimableDividends` | Calculate claimable dividends |
| `usePurchaseShares` | Execute share purchase |
| `useClaimDividends` | Execute dividend claim |

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Wallet addresses, KYC status, contact info |
| `properties` | Property metadata, cached chain data |
| `investments` | Purchase transactions, share quantities |
| `dividends` | Dividend declarations per property |
| `dividend_claims` | User dividend claim records |
| `proposals` | Governance proposals |
| `votes` | Individual vote records |

### Entity Relationship

```
users 1───────∞ investments ∞───────1 properties
  │                                       │
  │                                       │
  ├──────∞ dividend_claims ∞──────────────┤
  │                                       │
  ├──────∞ votes ∞────────1 proposals ────┤
  │                                       │
  └──────∞ notifications                  │
                                          │
              dividends ∞─────────────────┘
```

### Row Level Security

All tables implement RLS policies ensuring:
- Users can only read their own sensitive data
- Public properties are readable by all
- Write operations require authentication
- Admin operations require admin role

---

## Testing

### Smart Contract Tests

```bash
cd fractionalestatefinals/blockchain
npm test
```

Test coverage includes:
- Property listing and share purchases
- Dividend declaration and claiming
- Investor verification workflow
- Governance proposal lifecycle
- Access control enforcement
- Edge cases and failure scenarios

### Frontend Tests

```bash
cd frontend

#npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
# Add a simple test script to package.json
npm pkg set scripts.test="echo 'No frontend tests configured yet' && exit 0"

npm test
```

# Update project folder with necessary scripts

```bash
npm install @supabase/supabase-js wagmi viem @tanstack/react-query
```


**STUDENT IMPLEMENTATION GUIDE**
---------------------------------------------------------------------------------------------------------------------------------
*********************************************************************************************************************************
---------------------------------------------------------------------------------------------------------------------------------
This section provides **step-by-step instructions** for deploying your FractionalEstate capstone project. 
Follow each step in order.
---------------------------------------------------------------------------------------------------------------------------------



---------------------------------------------------------------------------------------------------------------------------------
## Part 1: GitHub Repository Setup
---------------------------------------------------------------------------------------------------------------------------------

### Step 1.1: Initialize Your Repository

If you haven't already pushed your code to GitHub:

```bash
# Navigate to your project root
cd /path/to/fractionalestatefinals

# Initialize git (skip if already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "FractionalEstate Final Project - initial commit"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/fractionalestatefinals.git

# Push to GitHub
git push -u origin main
```

### Step 1.2: Verify Repository Structure

Your GitHub repository should have this structure:

```
fractionalestatefinals/
├── blockchain/           # Smart contracts and Truffle config
│   ├── contracts/
│   ├── migrations/
│   ├── test/
│   ├── truffle-config.js
│   └── package.json
├── frontend/             # Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── database/             # SQL scripts
│   ├── schema.sql
│   ├── policies.sql
│   └── seed.sql
├── docs/                 # Documentation
└── README.md
```


---------------------------------------------------------------------------------------------------------------------------------
## Part 2: Smart Contract Deployment (Localhost - Ganache) & (Sepolia Testnet)
---------------------------------------------------------------------------------------------------------------------------------

### Step 2.1: Get Sepolia ETH

You need approximately **1.5 - 2 Sepolia ETH** for deployment.

**Fund deployer wallet**  **Free Faucets (choose one or more):**

| Faucet | URL | Daily Limit |
|--------|-----|-------------|
| Google | https://cloud.google.com/application/web3/faucet/ethereum/sepolia| 0.05 ETH |
| Alchemy | https://sepoliafaucet.com | 0.5 ETH |
| Infura | https://www.infura.io/faucet/sepolia | 0.5 ETH |
| QuickNode | https://faucet.quicknode.com/ethereum/sepolia | 0.1 ETH |




Sepolia ETH Required: Below's is an estimate based om the contract sizes

Breakdown
Contract            Estimated Gas Est. Cost (ETH)
Migrations          ~0.14 ETH     0.14
InvestorRegistry.   ~0.25 ETH     0.25
DividendDistributor ~0.35 ETH     0.35
PropertyGovernance  ~0.20 ETH     0.20
PropertyFactory.    ~0.25 ETH     0.25
FractionalEstate.   ~0.30 ETH     0.30
Total.               ~1.5 ETH


Get 1.5 - 2 Sepolia ETH for this project


### Step 2.2: Configure Environment

```bash
cd blockchain

# Create .env file if it doesn't exist
cat > .env << 'EOF'
# Your MetaMask private key (without 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Infura API Key (from https://app.infura.io)
INFURA_API_KEY=your_infura_project_id

# Etherscan API Key for contract verification (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key
EOF
```

**⚠️ SECURITY WARNING:** Never commit your `.env` file to GitHub!  (This is automatically taken care of with .gitingnore in the quick guide)



### Step 2.3: Verify Your Balance

```bash
cd blockchain

node -e "
require('dotenv').config();
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const provider = new HDWalletProvider(
  process.env.PRIVATE_KEY,
  'https://sepolia.infura.io/v3/' + process.env.INFURA_API_KEY
);
const web3 = new Web3(provider);
const address = provider.getAddress();

web3.eth.getBalance(address).then(bal => {
  console.log('═══════════════════════════════════════');
  console.log('Deployer Address:', address);
  console.log('Balance:', web3.utils.fromWei(bal, 'ether'), 'ETH');
  console.log('═══════════════════════════════════════');
  
  if (parseFloat(web3.utils.fromWei(bal, 'ether')) < 1.5) {
    console.log('⚠️  WARNING: You need at least 1.5 ETH for deployment');
  } else {
    console.log('✅ Sufficient balance for deployment');
  }
  provider.engine.stop();
});
"
```

---
### Step 2.4: Deploy Contracts - ### Local Network Deployment (Ganache)


**Start local blockchain:** 
```bash
npx ganache --port 7545 --networkId 5777 --gasLimit 80000000 --chain.allowUnlimitedContractSize
```

**Deploy contracts:**
```bash
npx truffle migrate --network development
```

**Start frontend:**
```bash
cd ../frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.


---
### Step 2.5: Testing on local network

### Smart Contract Tests

```bash
cd fractionalestatefinals/blockchain
npm test
```

Test coverage includes:
- Property listing and share purchases
- Dividend declaration and claiming
- Investor verification workflow
- Governance proposal lifecycle
- Access control enforcement
- Edge cases and failure scenarios

### Frontend Tests

```bash
cd frontend

#npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
# Add a simple test script to package.json
npm pkg set scripts.test="echo 'No frontend tests configured yet' && exit 0"

npm test
```


---
### Step 2.6: Deploy Contracts - ### Sepolia Testnet Deployment (skip if you are doing local deployment)

```bash
cd blockchain

# Compile contracts
npx truffle compile

# Deploy to Sepolia
npx truffle migrate --network sepolia
```

**Expected Output:**

```
Starting migrations...
======================
> Network name:    'sepolia'
> Network id:      11155111

1_initial_migration.js
======================
   Deploying 'Migrations'
   > transaction hash:    0x...
   > contract address:    0x...
   ✅ Migrations deployed

2_deploy_contracts.js
=====================
   Deploying 'InvestorRegistry'
   > contract address:    0x1234...  ← SAVE THIS
   
   Deploying 'PropertyToken'
   > contract address:    0x5678...  ← SAVE THIS
   
   ... (more contracts)
```

### Step 2.7: Save Your Contract Addresses

Create a file to store your deployed addresses:

```bash
# The deployment script should create deployed-addresses.json
# If not, create it manually:

cat > deployed-addresses.json << 'EOF'
{
  "network": "sepolia",
  "chainId": 11155111,
  "deployedAt": "2026-02-27",
  "contracts": {
    "InvestorRegistry": "0x_YOUR_ADDRESS_HERE",
    "PropertyToken": "0x_YOUR_ADDRESS_HERE",
    "DividendDistributor": "0x_YOUR_ADDRESS_HERE",
    "PropertyGovernance": "0x_YOUR_ADDRESS_HERE",
    "PropertyFactory": "0x_YOUR_ADDRESS_HERE",
    "FractionalEstate": "0x_YOUR_ADDRESS_HERE"
  }
}
EOF
```


### Step 2.8: Verify Contracts on Etherscan (Skip if not deploying on sepolia, Optional but Recommended)

```bash
# Install verification plugin if not installed
npm install truffle-plugin-verify --save-dev

# Verify each contract
npx truffle run verify InvestorRegistry --network sepolia
npx truffle run verify PropertyFactory --network sepolia
npx truffle run verify FractionalEstate --network sepolia
```

After verification, your contracts will show a green checkmark on Etherscan.

---


### Step 2.9: Find Your Contract ABIs
## Create ABI Folder and Files

## Extract FractionalEstate ABI
## Run this to extract only the ABI array:

```bash
cd blockchain

node -e "console.log(JSON.stringify(require('./build/contracts/FractionalEstate.json').abi, null, 2))" > ../frontend/lib/abis/FractionalEstate.abi.json

# Extract PropertyGovernance ABI
node -e "console.log(JSON.stringify(require('./build/contracts/PropertyGovernance.json').abi, null, 2))" > ../frontend/lib/abis/PropertyGovernance.abi.json

```
---------------------------------------------------------------------------------------------------------------------------------
## Part 3: Supabase Database Setup
---------------------------------------------------------------------------------------------------------------------------------


### Step 3.1: Create Supabase Project

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Configure:
   - **Organization:** Select or create one
   - **Name:** `fractionalestate`
   - **Database Password:** Generate a strong password (SAVE THIS!)
   - **Region:** Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for initialization

### Step 3.2: Get Your Credentials

After project creation:

1. Go to **Settings** (gear icon) → **API**
2. Copy and save these values:

| Value       | Where to Find           | Example        |
|-------------|-------------------------|----------------|
| Project URL | Under "Project URL"                      | `https://abcdefgh.supabase.co` |
| Anon Key    | Under "Project API keys" → "anon public" | `eyJhbGciOiJIUzI1NiIs...`      |

### Step 3.3: Execute Database Schema

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**

**Execute in this order:**

**Query 1: Schema (tables and structures)**
```sql
-- Copy entire contents of database/schema.sql and paste here
-- Then click "Run"
```

**Query 2: Policies (security rules)**
```sql
-- Copy entire contents of database/policies.sql and paste here
-- Then click "Run"
```

**Query 3: Seed Data (test data - optional)**
```sql
-- Copy entire contents of database/seed.sql and paste here
-- Then click "Run"
```

### Step 3.4: Verify Database Setup

After running the scripts, verify tables were created:

1. Click **"Table Editor"** in left sidebar
2. You should see tables: `users`, `properties`, `investments`, `dividends`, `proposals`, `votes`
3. Click on `properties` - if you ran seed.sql, you should see test properties

---

---------------------------------------------------------------------------------------------------------------------------------
## Part 4: Frontend Configuration
---------------------------------------------------------------------------------------------------------------------------------

### Step 4.1: Create Frontend Environment File

```bash
cd frontend

# Create .env.local file. if not already created
cat > .env.local << 'EOF'
# ================================================
# FRACTIONALESTATE FRONTEND CONFIGURATION
# ================================================

# Blockchain Network
NEXT_PUBLIC_CHAIN_ID = 11155111

# Smart Contract Addresses (from your deployment)
NEXT_PUBLIC_INVESTOR_REGISTRY_ADDRESS = 0x_YOUR_ADDRESS
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS = 0x_YOUR_ADDRESS
NEXT_PUBLIC_DIVIDEND_DISTRIBUTOR_ADDRESS = 0x_YOUR_ADDRESS
NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS = 0x_YOUR_ADDRESS
NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS = 0x_YOUR_ADDRESS
NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS = 0x_YOUR_ADDRESS

# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = your_project_id

# Supabase (from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key_here
EOF
```

### Step 4.2: Update Contract Addresses

Replace the placeholder addresses in `.env.local` with your actual deployed addresses from Step 2.5.

### Step 4.3: Test Locally

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Step 4.4: Verify Frontend is Working

**Checklist:**

- [ ] Page loads without errors
- [ ] "Connect Wallet" button appears
- [ ] MetaMask connects successfully
- [ ] Properties load from Supabase (if seed data was added)
- [ ] No console errors in browser DevTools



# Update project folder with necessary scripts
# Open another basch/zsh terminal and navigate to frontend folder

```bash
cd frontend

npm install @supabase/supabase-js wagmi viem @tanstack/react-query
```


# test supabase connection

```bash
cd frontend
cat lib/supabase.ts
cat .env.local
```\

### Step 4.5: Create ABIs folder
## Create ABI Folder and Files

```bash
mkdir -p lib/abis
```

```bash
cd ../blockchain

node -e "console.log(JSON.stringify(require('./build/contracts/FractionalEstate.json').abi, null, 2))" > ../frontend/lib/abis/FractionalEstate.abi.json

node -e "console.log(JSON.stringify(require('./build/contracts/PropertyGovernance.json').abi, null, 2))" > ../frontend/lib/abis/PropertyGovernance.abi.json

cd frontend
npm install @supabase/supabase-js
npx tsc --noEmit
```



### Step 4.6: Update Files in your project

### Update the contracts.ts frontend/lib/contracts.ts
### Update the supabase.ts frontend/lib/supabase.ts  
### Update the utils.ts file in the frontend/lib/utils.ts
### Update the tsconfig.json frontend/tsconfig.json 
### Update InvestmentForm.tsx frontend/components/Investment/InvestmentForm.tsx
### Update use-fractionalestate.ts. frontend/hooks/use-fractionalestate.ts 
### Update page.tsx frontend/app/pag.tsx
### Update page.tsx frontend/app/profile/page.tsx
### Update page.tsx frontend/app/properties/page.tsx
### Update page.tsx frontend/app/properties/[id]/page.tsx
### Update page.tsx frontend/app/governance/[id]/page.tsx
### Update page.tsx frontend/app/investments/page.tsx
### Update providers.tsx frontend/app/providers.tsx
### Update layout.tsx frontend/app
### Update index.ts frontend/components
### Update navbar.tsx frontend/components/layout/navbar.tsx
### Update useUserRegistration.ts frontend/hooks/useUserRegistration.ts
### Update frontend/lib/database.ts
### Update web.ts frontend/lib/web.ts
### Update frontend/lib/helpers.ts



git add .
git commit -m "Update files directions in readme"
git push -u origin main

---

---
---------------------------------------------------------------------------------------------------------------------------------
## Part 5: Vercel Deployment (Frontend Hosting) - If you have sepolia deployed contracts
---------------------------------------------------------------------------------------------------------------------------------

### Step 5.1: Push Latest Changes to GitHub

```bash
cd /path/to/fractionalestatefinals

# Add all changes
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Push
git push origin main
```

### Step 5.2: Import Project to Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New..."** → **"Project"**
3. Find and select **fractionalestatefinals** repository
4. Click **"Import"**

### Step 5.3: Configure Build Settings

In the configuration screen:

| Setting          | Value.                      |
|------------------|-----------------------------|
| Framework Preset | Next.js.                    |
| Root Directory   | `frontend` ← **IMPORTANT!** |
| Build Command    | `npm run build` (default)   |
| Output Directory | `.next` (default)           |

### Step 5.4: Add Environment Variables

Click **"Environment Variables"** and add each variable:

| Key                                    | Value                     |
|----------------------------------------|---------------------------|
| `NEXT_PUBLIC_CHAIN_ID`                 | `11155111`                |
| `NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS` | `0x...` (your address)    |
| `NEXT_PUBLIC_GOVERNANCE_ADDRESS`       | `0x...` (your address)    |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `your_id`.                |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`.       | `eyJ...`                  |

Add ALL contract addresses from your `.env.local` file.

### Step 5.5: Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes for build and deployment
3. Once complete, you'll get a URL like: `https://fractionalestatefinals.vercel.app`

### Step 5.6: Verify Deployment

1. Open your Vercel URL
2. Connect MetaMask (switch to Sepolia network)
3. Verify the application works

---
---------------------------------------------------------------------------------------------------------------------------------
## Part 6: Testing Your Deployed Application
---------------------------------------------------------------------------------------------------------------------------------

### Step 6.1: User Registration Flow

**Test the investor registration process:**

1. Open your deployed application
2. Connect MetaMask wallet
3. Navigate to Profile/Settings
4. Complete KYC registration form
5. Verify data appears in Supabase `users` table

**Verify in Supabase:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

### Step 6.2: Property Investment Flow

**Test purchasing property shares:**

1. Navigate to Properties page
2. Select a property
3. Enter investment amount
4. Confirm transaction in MetaMask
5. Wait for transaction confirmation

**Verify on Etherscan:**
- Go to `https://sepolia.etherscan.io/address/YOUR_FRACTIONALESTATE_ADDRESS`
- Check recent transactions

**Verify in Supabase:**
```sql
-- Check investments table
SELECT 
  i.*,
  p.name as property_name
FROM investor_holdings i
JOIN properties p ON i.property_id = p.id
ORDER BY i.created_at DESC;
```

### Step 6.3: Governance Voting Flow

**Test creating and voting on proposals:**

1. Navigate to Governance page
2. Click "Create Proposal"
3. Fill in proposal details
4. Submit and confirm in MetaMask
5. Cast a vote on the proposal

**Verify in Supabase:**
```sql
-- Check proposals
SELECT * FROM proposals ORDER BY created_at DESC;

-- Check votes
SELECT 
  v.*,
  p.title as proposal_title
FROM votes v
JOIN proposals p ON v.proposal_id = p.id;
```

### Step 6.4: Dividend Claiming Flow

**Test dividend distribution (requires admin role):**

1. Using the admin wallet, declare a dividend via Truffle console:

```bash
cd blockchain
npx truffle console --network sepolia

# In console:
> const fe = await FractionalEstate.deployed()
> await fe.declareDividend(1, { value: web3.utils.toWei("0.1", "ether") })
```

2. As an investor, navigate to Dashboard
3. Click "Claim Dividends"
4. Confirm transaction

---
---------------------------------------------------------------------------------------------------------------------------------
## Part 7: Sample Database Queries for Testing
---------------------------------------------------------------------------------------------------------------------------------

### Query 1: View All Properties with Investment Stats

```sql
SELECT 
  p.id,
  p.name,
  p.location,
  p.total_value,
  p.total_shares,
  p.available_shares,
  p.price_per_share,
  COUNT(i.id) as total_investments,
  SUM(i.shares_purchased) as shares_sold,
  SUM(i.amount_invested) as total_invested
FROM properties p
LEFT JOIN investments i ON p.id = i.property_id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Query 2: View User Portfolio

```sql
SELECT 
  u.wallet_address,
  p.name as property_name,
  i.shares_purchased,
  i.amount_invested,
  i.purchase_date,
  (i.shares_purchased::float / p.total_shares * 100) as ownership_percentage
FROM users u
JOIN investments i ON u.id = i.user_id
JOIN properties p ON i.property_id = p.id
WHERE u.wallet_address = '0xYourWalletAddress';
```

### Query 3: View Governance Activity

```sql
SELECT 
  p.title as proposal_title,
  p.status,
  p.votes_for,
  p.votes_against,
  p.created_at,
  COUNT(v.id) as total_votes
FROM proposals p
LEFT JOIN votes v ON p.id = v.proposal_id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Query 4: View Recent Activity Feed

```sql
-- Recent investments
SELECT 
  'Investment' as activity_type,
  u.wallet_address,
  p.name as details,
  i.amount_invested as amount,
  i.created_at
FROM investments i
JOIN users u ON i.user_id = u.id
JOIN properties p ON i.property_id = p.id

UNION ALL

-- Recent votes
SELECT 
  'Vote' as activity_type,
  u.wallet_address,
  pr.title as details,
  v.voting_power as amount,
  v.created_at
FROM votes v
JOIN users u ON v.user_id = u.id
JOIN proposals pr ON v.proposal_id = pr.id

ORDER BY created_at DESC
LIMIT 20;
```

---

---------------------------------------------------------------------------------------------------------------------------------
## Part 8: Sharing Your Project
---------------------------------------------------------------------------------------------------------------------------------

### For Capstone Submission

Include the following in your submission:

1. **GitHub Repository URL:** `https://github.com/YOUR_USERNAME/fractionalestatefinals`

2. **Deployed Application URL:** `https://your-app.vercel.app`

3. **Contract Addresses (Sepolia):**
   ```
   InvestorRegistry: 0x...
   PropertyFactory: 0x...
   FractionalEstate: 0x...
   PropertyGovernance: 0x...
   ```

4. **Etherscan Links:**
   - FractionalEstate: `https://sepolia.etherscan.io/address/0x...`

5. **Demo Video:** (Optional) Record a 5-minute walkthrough showing:
   - Wallet connection
   - Property browsing
   - Investment transaction
   - Governance voting

### For Others to Test Your Application

Share these instructions:

```
📱 How to Test FractionalEstate

1. Install MetaMask: https://metamask.io
2. Add Sepolia Testnet to MetaMask
3. Get free Sepolia ETH from: https://sepoliafaucet.com
4. Visit: https://your-app.vercel.app
5. Connect your wallet
6. Browse properties and try investing!
```

---

---------------------------------------------------------------------------------------------------------------------------------
## Part 9: Troubleshooting Common Issues
---------------------------------------------------------------------------------------------------------------------------------

### Issue: "Insufficient funds for gas"

**Cause:** Not enough Sepolia ETH in your wallet.

**Solution:**
```bash
# Check your balance
node -e "require('dotenv').config(); const Web3 = require('web3'); const web3 = new Web3('https://sepolia.infura.io/v3/'+process.env.INFURA_API_KEY); web3.eth.getBalance('YOUR_ADDRESS').then(b => console.log(web3.utils.fromWei(b,'ether'),'ETH'));"

# Get more ETH from faucets listed above
```

### Issue: "Contract deployment failed"

**Cause:** Usually gas-related or network issues.

**Solution:**
```bash
# Try with reset flag to redeploy all contracts
npx truffle migrate --network sepolia --reset

# Or deploy specific migration
npx truffle migrate --network sepolia -f 2 --to 2
```

### Issue: "Transaction reverted"

**Cause:** Contract requirements not met (missing role, invalid input, etc.)

**Solution:**
```bash
# Check if you have the required role
npx truffle console --network sepolia
> const fe = await FractionalEstate.deployed()
> const adminRole = await fe.DEFAULT_ADMIN_ROLE()
> await fe.hasRole(adminRole, 'YOUR_ADDRESS')  // Should return true
```

### Issue: "Vercel build failed"

**Cause:** Usually missing environment variables or build errors.

**Solution:**
1. Check Vercel build logs for specific error
2. Verify all environment variables are set correctly
3. Ensure root directory is set to `frontend`
4. Check that `package.json` has correct build script

### Issue: "Supabase queries return empty"

**Cause:** RLS policies blocking access or no data.

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Temporarily disable RLS for testing (re-enable later!)
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Or check policies
SELECT * FROM pg_policies WHERE tablename = 'properties';
```

### Issue: "MetaMask not connecting"

**Cause:** Wrong network, WalletConnect issues, or browser extensions.

**Solution:**
1. Ensure MetaMask is on Sepolia network (Chain ID: 11155111)
2. Try disconnecting and reconnecting
3. Clear MetaMask activity data: Settings → Advanced → Clear Activity Tab Data
4. Try a different browser

---

## Part 10: Future Enhancements (For Real-World Deployment)

> **📌 NOTE FOR STUDENTS:** The following sections describe features and considerations for a **production deployment**. These are **NOT required** for your capstone project but are included for reference if you continue developing this application professionally.

### Security Enhancements (Production)

- [ ] **Professional Security Audit** - Engage firms like Trail of Bits, OpenZeppelin, or Consensys Diligence ($50,000-$200,000)
- [ ] **Bug Bounty Program** - Set up via Immunefi or HackerOne
- [ ] **Multi-Signature Treasury** - Use Gnosis Safe for fund management
- [ ] **Hardware Wallet Deployment** - Use Ledger/Trezor for production deployments
- [ ] **Rate Limiting** - Implement API rate limiting
- [ ] **DDoS Protection** - Use Cloudflare or AWS Shield

### Legal & Compliance (Production)

- [ ] **Securities Counsel** - Engage attorneys specializing in blockchain securities
- [ ] **Broker-Dealer Partnership** - Required for selling securities in US
- [ ] **KYC/AML Provider** - Integrate Chainalysis, Jumio, or Onfido
- [ ] **State-by-State Compliance** - Blue sky laws vary by state
- [ ] **International Regulations** - MiCA (EU), local regulations

### Infrastructure (Production)

- [ ] **Dedicated RPC Nodes** - Run own Ethereum nodes vs. Infura
- [ ] **Database Scaling** - Configure Supabase for high availability
- [ ] **CDN Setup** - Global content delivery for frontend
- [ ] **Monitoring** - Set up DataDog, New Relic, or similar
- [ ] **Backup Strategy** - Automated database backups and recovery testing

### Feature Enhancements (Production)

- [ ] **Secondary Market** - Allow trading of property tokens
- [ ] **Yield Optimization** - Integrate with DeFi protocols
- [ ] **Mobile App** - Native iOS/Android applications
- [ ] **Multi-Chain** - Deploy on Polygon, Arbitrum, etc.
- [ ] **Fiat On-Ramp** - Integration with MoonPay, Transak

---

## Quick Reference Card

### Essential Commands

```bash
# ═══════════════════════════════════════════════════
# BLOCKCHAIN COMMANDS (run from /blockchain folder)
# ═══════════════════════════════════════════════════

# Start local blockchain
npx ganache --port 7545 --networkId 5777 --gasLimit 80000000

# Compile contracts
npx truffle compile

# Deploy locally
npx truffle migrate --network development

# Deploy to Sepolia
npx truffle migrate --network sepolia

# Run tests
npm test

# Open console
npx truffle console --network sepolia

# ═══════════════════════════════════════════════════
# FRONTEND COMMANDS (run from /frontend folder)
# ═══════════════════════════════════════════════════

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# ═══════════════════════════════════════════════════
# GIT COMMANDS (run from project root)
# ═══════════════════════════════════════════════════

# Save your changes
git add .
git commit -m "Your message"
git push origin main
```

### Important URLs

| Resource | URL |
|----------|-----|
| Your Vercel App | `https://your-app.vercel.app` |
| Supabase Dashboard | `https://app.supabase.com` |
| Sepolia Etherscan | `https://sepolia.etherscan.io` |
| Sepolia Faucet | `https://sepoliafaucet.com` |
| Infura Dashboard | `https://app.infura.io` |
| WalletConnect | `https://cloud.walletconnect.com` |

### Contract Addresses (Fill in after deployment)

```
Network: Sepolia (Chain ID: 11155111)
Deployed: [DATE]

InvestorRegistry:     0x_____________________
PropertyToken:        0x_____________________
DividendDistributor:  0x_____________________
PropertyGovernance:   0x_____________________
PropertyFactory:      0x_____________________
FractionalEstate:     0x_____________________
```

---

## Conclusion

Congratulations on completing the FractionalEstate capstone project! 🎉

You have successfully:
- ✅ Deployed smart contracts to Ethereum Sepolia testnet
- ✅ Set up a PostgreSQL database with Supabase
- ✅ Built a Next.js frontend with wallet connectivity
- ✅ Deployed the application to Vercel
- ✅ Created a full-stack blockchain application

This project demonstrates key skills in:
- **Solidity** smart contract development
- **Web3** frontend integration
- **Database** design and management
- **Cloud deployment** and DevOps
- **Real-world** blockchain application development

---

<div align="center">

**FractionalEstate Capstone Project**

Business Applications of Blockchain

Worcester Polytechnic Institute | 2026

</div>
