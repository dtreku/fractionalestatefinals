// frontend/lib/supabase.ts
// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// DATABASE TYPES (matching your schema)
// ============================================================================

export type UserRole = 'investor' | 'admin' | 'property_manager' | 'compliance';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'accredited' | 'rejected' | 'expired' | 'suspended';
export type AccreditationType = 'none' | 'income_threshold' | 'net_worth_threshold' | 'professional_cert' | 'entity_qualified' | 'other';
export type PropertyStatus = 'draft' | 'offering' | 'active' | 'suspended' | 'liquidating' | 'closed';
export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed_use' | 'land' | 'hospitality';
export type TransactionType = 'purchase' | 'sale' | 'transfer' | 'dividend' | 'redemption';
export type ProposalStatus = 'pending' | 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled' | 'expired';
export type ProposalType = 'maintenance' | 'policy_change' | 'manager_change' | 'sale_approval' | 'distribution' | 'emergency' | 'other';
export type DividendStatus = 'declared' | 'funded' | 'distributing' | 'completed' | 'cancelled';

export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  profile_image_url?: string;
  bio?: string;
  country_code?: string;
  state_code?: string;
  city?: string;
  postal_code?: string;
  verification_status: VerificationStatus;
  accreditation_type: AccreditationType;
  verification_date?: string;
  verification_expiry?: string;
  kyc_document_hash?: string;
  email_notifications: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  is_restricted: boolean;
  restriction_reason?: string;
}

export interface Property {
  id: string;
  property_id: string;
  token_address?: string;
  name: string;
  symbol: string;
  description?: string;
  property_type: PropertyType;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  total_valuation: number;
  token_price?: number;
  total_tokens?: number;
  tokens_available?: number;
  minimum_investment?: number;
  square_feet?: number;
  year_built?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  lot_size?: number;
  annual_rent_income?: number;
  occupancy_rate?: number;
  cap_rate?: number;
  status: PropertyStatus;
  offering_start?: string;
  offering_end?: string;
  funded_date?: string;
  metadata_uri?: string;
  images?: any[];
  documents?: any[];
  features?: any[];
  property_manager_id?: string;
  management_fee_percent?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InvestorHolding {
  id: string;
  user_id: string;
  property_id: string;
  token_balance: number;
  average_cost_basis?: number;
  total_invested: number;
  ownership_percentage?: number;
  current_value?: number;
  unrealized_gain_loss?: number;
  total_dividends_received: number;
  last_dividend_date?: string;
  first_investment_date: string;
  last_transaction_date?: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  property_id: string;
  transaction_type: TransactionType;
  token_amount: number;
  price_per_token?: number;
  total_amount?: number;
  tx_hash?: string;
  block_number?: number;
  gas_used?: number;
  gas_price?: number;
  counterparty_address?: string;
  counterparty_user_id?: string;
  status: string;
  confirmed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Proposal {
  id: string;
  property_id: string;
  proposal_number: number;
  title: string;
  description: string;
  proposal_type: ProposalType;
  document_hash?: string;
  created_at: string;
  voting_start: string;
  voting_end: string;
  execution_time?: string;
  expiration_time?: string;
  status: ProposalStatus;
  for_votes: number;
  against_votes: number;
  abstain_votes: number;
  total_voters: number;
  snapshot_supply?: number;
  quorum_required?: number;
  proposer_id: string;
  proposer_address?: string;
  contract_proposal_id?: number;
  execution_tx_hash?: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  user_id: string;
  vote_option: number; // 0=Abstain, 1=For, 2=Against
  weight: number;
  reason?: string;
  tx_hash?: string;
  voted_at: string;
}

export interface DividendRound {
  id: string;
  property_id: string;
  round_number: number;
  total_amount: number;
  amount_per_token?: number;
  currency: string;
  record_date: string;
  payment_date: string;
  expiration_date?: string;
  status: DividendStatus;
  total_claimed: number;
  claims_count: number;
  total_eligible_holders?: number;
  contract_round_id?: number;
  funding_tx_hash?: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface DividendClaim {
  id: string;
  dividend_round_id: string;
  user_id: string;
  token_balance_snapshot?: number;
  entitled_amount?: number;
  claimed_amount?: number;
  is_claimed: boolean;
  claimed_at?: string;
  claim_tx_hash?: string;
  created_at: string;
}
