// frontend/lib/wagmi.ts
// ============================================================================
// WAGMI CONFIGURATION
// Blockchain wallet connection configuration for RainbowKit
// Supports: Sepolia, Mainnet, Ganache (local), Hardhat (local)
// ============================================================================

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, type Chain } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// ============================================================================
// CUSTOM CHAIN DEFINITIONS
// ============================================================================

// Ganache Local Network (default port 7545)
export const ganache: Chain = {
  id: 1337,
  name: 'Ganache',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:7545'] 
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: '' },
  },
  testnet: true,
};

// Ganache with chain ID 5777 (some versions use this)
export const ganache5777: Chain = {
  id: 5777,
  name: 'Ganache (5777)',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { 
      http: [process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:7545'] 
    },
  },
  blockExplorers: {
    default: { name: 'Local', url: '' },
  },
  testnet: true,
};

// Hardhat Local Network (port 8545)
export const hardhatLocal: Chain = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: '' },
  },
  testnet: true,
};

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FractionalEstate';
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/';
const LOCAL_RPC_URL = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || 'http://127.0.0.1:7545';

// ============================================================================
// CHAIN CONFIGURATION
// ============================================================================

// Development chains - local networks first for easier testing
const chains: readonly [Chain, ...Chain[]] = [
  ganache,        // Local development (Ganache default - port 7545)
  ganache5777,    // Local development (Ganache alternative chain ID)
  hardhatLocal,   // Local development (Hardhat - port 8545)
  sepolia,        // Primary testnet
  mainnet,        // Production
];

// ============================================================================
// TRANSPORT CONFIGURATION
// ============================================================================

const transports = {
  // Mainnet
  [mainnet.id]: http(),
  
  // Sepolia Testnet
  [sepolia.id]: http(SEPOLIA_RPC_URL),
  
  // Ganache (Chain ID 1337)
  [ganache.id]: http(LOCAL_RPC_URL),
  
  // Ganache (Chain ID 5777)
  [ganache5777.id]: http(LOCAL_RPC_URL),
  
  // Hardhat (Chain ID 31337)
  [hardhatLocal.id]: http('http://127.0.0.1:8545'),
};

// ============================================================================
// RAINBOWKIT CONFIG
// ============================================================================

export const config = getDefaultConfig({
  appName: APP_NAME,
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: chains,
  transports: transports,
  ssr: true, // Required for Next.js App Router
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current chain ID from environment
 */
export function getDefaultChainId(): number {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId ? parseInt(chainId, 10) : sepolia.id;
}

/**
 * Check if we're on a local network
 */
export function isLocalNetwork(chainId: number): boolean {
  return [1337, 5777, 31337].includes(chainId);
}

/**
 * Get block explorer URL for a chain
 */
export function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return 'https://etherscan.io';
    case sepolia.id:
      return 'https://sepolia.etherscan.io';
    default:
      return '';
  }
}

/**
 * Get transaction URL for block explorer
 */
export function getTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  if (!baseUrl) return '';
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get address URL for block explorer
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = getBlockExplorerUrl(chainId);
  if (!baseUrl) return '';
  return `${baseUrl}/address/${address}`;
}

// ============================================================================
// CONTRACT ADDRESSES BY CHAIN
// ============================================================================

interface ContractAddresses {
  FractionalEstate: string;
  PropertyGovernance: string;
  PropertyFactory?: string;
  InvestorRegistry?: string;
  DividendDistributor?: string;
  USDC?: string;
  USDT?: string;
}

const contractAddressesByChain: Record<number, ContractAddresses> = {
  // Sepolia
  [sepolia.id]: {
    FractionalEstate: process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS || '',
    PropertyGovernance: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS || '',
    PropertyFactory: process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS || '',
    InvestorRegistry: process.env.NEXT_PUBLIC_INVESTOR_REGISTRY_ADDRESS || '',
    DividendDistributor: process.env.NEXT_PUBLIC_DIVIDEND_DISTRIBUTOR_ADDRESS || '',
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '',
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '',
  },
  // Ganache (1337)
  [ganache.id]: {
    FractionalEstate: process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS || '',
    PropertyGovernance: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS || '',
  },
  // Ganache (5777)
  [ganache5777.id]: {
    FractionalEstate: process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS || '',
    PropertyGovernance: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS || '',
  },
  // Hardhat
  [hardhatLocal.id]: {
    FractionalEstate: process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS || '',
    PropertyGovernance: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS || '',
  },
  // Mainnet (for future use)
  [mainnet.id]: {
    FractionalEstate: '',
    PropertyGovernance: '',
  },
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  return contractAddressesByChain[chainId] || contractAddressesByChain[sepolia.id];
}

// ============================================================================
// EXPORTS
// ============================================================================

export { chains, transports };
export type { ContractAddresses };
