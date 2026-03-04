// frontend/lib/contracts.ts
// ============================================================================
// SMART CONTRACT CONFIGURATION
// FractionalEstate - Blockchain Course Capstone Project
// ============================================================================

import { parseEther, formatEther } from 'viem';

// Import ABIs from JSON files (extracted from Truffle build)
import FractionalEstateABI from './abis/FractionalEstate.abi.json';
import PropertyGovernanceABI from './abis/PropertyGovernance.abi.json';

// ============================================================================
// CONTRACT ADDRESSES
// ============================================================================

export const CONTRACT_ADDRESSES = {
  FRACTIONAL_ESTATE: process.env.NEXT_PUBLIC_FRACTIONALESTATE_ADDRESS as `0x${string}`,
  PROPERTY_GOVERNANCE: process.env.NEXT_PUBLIC_PROPERTY_GOVERNANCE_ADDRESS as `0x${string}`,
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS as `0x${string}`,
} as const;

// ============================================================================
// CONTRACT ABIs (Imported from build artifacts)
// ============================================================================

export const FRACTIONALESTATE_ABI = FractionalEstateABI;
export const PROPERTY_GOVERNANCE_ABI = PropertyGovernanceABI;

// ============================================================================
// PROPOSAL TYPES & STATES
// ============================================================================

export const PROPOSAL_TYPES = {
  0: 'General',
  1: 'Renovation',
  2: 'Management',
  3: 'Sale',
  4: 'Distribution',
  5: 'Emergency',
} as const;

export const PROPOSAL_STATES = {
  0: 'Pending',
  1: 'Active',
  2: 'Defeated',
  3: 'Succeeded',
  4: 'Queued',
  5: 'Executed',
  6: 'Cancelled',
} as const;

export const VOTE_SUPPORT = {
  0: 'Against',
  1: 'For',
  2: 'Abstain',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert ETH amount to Wei
 */
export function toWei(amount: string | number): bigint {
  return parseEther(String(amount));
}

/**
 * Convert Wei to ETH
 */
export function fromWei(wei: bigint): string {
  return formatEther(wei);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number | string): string {
  return new Intl.NumberFormat('en-US').format(Number(num));
}

/**
 * Format currency
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(amount));
}

/**
 * Shorten wallet address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

/**
 * Get proposal type label
 */
export function getProposalTypeLabel(type: number | string): string {
  const types: Record<string, string> = {
    '0': 'General',
    '1': 'Renovation',
    '2': 'Management',
    '3': 'Sale',
    '4': 'Distribution',
    '5': 'Emergency',
    general: 'General',
    renovation: 'Renovation',
    management: 'Management',
    sale: 'Sale',
    distribution: 'Distribution',
    emergency: 'Emergency',
    maintenance: 'Maintenance',
    policy_change: 'Policy Change',
    manager_change: 'Manager Change',
    sale_approval: 'Sale Approval',
    other: 'Other',
  };
  return types[String(type).toLowerCase()] || 'Unknown';
}

/**
 * Get vote option label
 */
export function getVoteOptionLabel(option: number): string {
  const options: Record<number, string> = {
    0: 'Against',
    1: 'For',
    2: 'Abstain',
  };
  return options[option] || 'Unknown';
}

/**
 * Check if proposal is still active
 */
export function isProposalActive(startTime: Date | string, endTime: Date | string): boolean {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  return now >= start && now <= end;
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime: Date | string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

/**
 * Get proposal state label
 */
export function getProposalStateLabel(state: number): string {
  return PROPOSAL_STATES[state as keyof typeof PROPOSAL_STATES] || 'Unknown';
}

/**
 * Format ETH value for display
 */
export function formatEth(wei: bigint | string | number, decimals: number = 4): string {
  const eth = typeof wei === 'bigint' ? formatEther(wei) : formatEther(BigInt(wei));
  return `${parseFloat(eth).toFixed(decimals)} ETH`;
}
