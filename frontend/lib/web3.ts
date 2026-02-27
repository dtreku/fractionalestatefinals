import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';

// Contract addresses from environment variables
export const contractAddresses = {
  propertyFactory: process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`,
  investorRegistry: process.env.NEXT_PUBLIC_INVESTOR_REGISTRY_ADDRESS as `0x${string}`,
  dividendDistributor: process.env.NEXT_PUBLIC_DIVIDEND_DISTRIBUTOR_ADDRESS as `0x${string}`,
  propertyGovernance: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS as `0x${string}`,
  samplePropertyToken: process.env.NEXT_PUBLIC_SAMPLE_PROPERTY_TOKEN_ADDRESS as `0x${string}`,
  usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`,
  usdt: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`,
};

// Get chain based on environment
const getChains = () => {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
  
  switch (chainId) {
    case 1:
      return [mainnet] as const;
    case 11155111:
      return [sepolia] as const;
    case 31337:
      return [hardhat] as const;
    default:
      return [sepolia] as const;
  }
};

// RainbowKit and wagmi configuration
export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'FractionalEstate',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: getChains(),
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

// Chain configuration for display
export const chainConfig = {
  id: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111'),
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'sepolia',
  isTestnet: process.env.NEXT_PUBLIC_ENABLE_TESTNET_MODE === 'true',
};

// Format helpers
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEther = (value: bigint, decimals: number = 4): string => {
  const formatted = Number(value) / 1e18;
  return formatted.toFixed(decimals);
};

export const formatUSDC = (value: bigint, decimals: number = 2): string => {
  const formatted = Number(value) / 1e6;
  return formatted.toFixed(decimals);
};

export const parseEther = (value: string): bigint => {
  return BigInt(Math.floor(parseFloat(value) * 1e18));
};

export const parseUSDC = (value: string): bigint => {
  return BigInt(Math.floor(parseFloat(value) * 1e6));
};

// Explorer URLs
export const getExplorerUrl = (type: 'tx' | 'address' | 'token', hash: string): string => {
  const baseUrl = chainConfig.id === 1 
    ? 'https://etherscan.io'
    : 'https://sepolia.etherscan.io';
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'token':
      return `${baseUrl}/token/${hash}`;
    default:
      return baseUrl;
  }
};
