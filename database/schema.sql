-- =============================================================================
-- FractionalEstate Database Schema
-- Supabase PostgreSQL
-- =============================================================================
-- This schema supports the FractionalEstate real estate tokenization platform
-- Run this in your Supabase SQL Editor
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('investor', 'admin', 'property_manager', 'compliance');

-- Verification status (mirrors contract)
CREATE TYPE verification_status AS ENUM (
  'none', 'pending', 'verified', 'accredited', 'rejected', 'expired', 'suspended'
);

-- Accreditation type
CREATE TYPE accreditation_type AS ENUM (
  'none', 'income_threshold', 'net_worth_threshold', 'professional_cert', 
  'entity_qualified', 'other'
);

-- Property status
CREATE TYPE property_status AS ENUM (
  'draft', 'offering', 'active', 'suspended', 'liquidating', 'closed'
);

-- Property type
CREATE TYPE property_type AS ENUM (
  'residential', 'commercial', 'industrial', 'mixed_use', 'land', 'hospitality'
);

-- Transaction type
CREATE TYPE transaction_type AS ENUM (
  'purchase', 'sale', 'transfer', 'dividend', 'redemption'
);

-- Proposal status
CREATE TYPE proposal_status AS ENUM (
  'pending', 'active', 'passed', 'rejected', 'executed', 'cancelled', 'expired'
);

-- Proposal type
CREATE TYPE proposal_type AS ENUM (
  'maintenance', 'policy_change', 'manager_change', 'sale_approval', 
  'distribution', 'emergency', 'other'
);

-- Dividend status
CREATE TYPE dividend_status AS ENUM (
  'declared', 'funded', 'distributing', 'completed', 'cancelled'
);

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role user_role DEFAULT 'investor',
  
  -- Profile information
  profile_image_url TEXT,
  bio TEXT,
  
  -- Location (for compliance)
  country_code VARCHAR(2),
  state_code VARCHAR(10),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Verification data
  verification_status verification_status DEFAULT 'none',
  accreditation_type accreditation_type DEFAULT 'none',
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_expiry TIMESTAMP WITH TIME ZONE,
  kyc_document_hash VARCHAR(100),
  
  -- Settings
  email_notifications BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT
);

-- Index for wallet lookup
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification ON users(verification_status);

-- =============================================================================
-- PROPERTIES TABLE
-- =============================================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id VARCHAR(50) UNIQUE NOT NULL,
  token_address VARCHAR(42) UNIQUE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  description TEXT,
  property_type property_type NOT NULL,
  
  -- Location
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Financial
  total_valuation DECIMAL(18, 6) NOT NULL, -- USD value
  token_price DECIMAL(18, 6),
  total_tokens DECIMAL(30, 18),
  tokens_available DECIMAL(30, 18),
  minimum_investment DECIMAL(18, 6),
  
  -- Property details
  square_feet INTEGER,
  year_built INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  parking_spaces INTEGER,
  lot_size DECIMAL(10, 2),
  
  -- Income
  annual_rent_income DECIMAL(18, 6),
  occupancy_rate DECIMAL(5, 2),
  cap_rate DECIMAL(5, 2),
  
  -- Status
  status property_status DEFAULT 'draft',
  offering_start TIMESTAMP WITH TIME ZONE,
  offering_end TIMESTAMP WITH TIME ZONE,
  funded_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata_uri TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Management
  property_manager_id UUID REFERENCES users(id),
  management_fee_percent DECIMAL(5, 2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_token ON properties(token_address);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_city ON properties(city, state);

-- =============================================================================
-- INVESTOR HOLDINGS TABLE
-- =============================================================================

CREATE TABLE investor_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Holdings
  token_balance DECIMAL(30, 18) DEFAULT 0,
  average_cost_basis DECIMAL(18, 6),
  total_invested DECIMAL(18, 6) DEFAULT 0,
  
  -- Computed
  ownership_percentage DECIMAL(10, 6),
  current_value DECIMAL(18, 6),
  unrealized_gain_loss DECIMAL(18, 6),
  
  -- Dividends
  total_dividends_received DECIMAL(18, 6) DEFAULT 0,
  last_dividend_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  first_investment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, property_id)
);

-- Indexes
CREATE INDEX idx_holdings_user ON investor_holdings(user_id);
CREATE INDEX idx_holdings_property ON investor_holdings(property_id);

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  
  -- Transaction details
  transaction_type transaction_type NOT NULL,
  token_amount DECIMAL(30, 18) NOT NULL,
  price_per_token DECIMAL(18, 6),
  total_amount DECIMAL(18, 6),
  
  -- Blockchain data
  tx_hash VARCHAR(66),
  block_number BIGINT,
  gas_used BIGINT,
  gas_price DECIMAL(30, 18),
  
  -- Counterparty (for transfers)
  counterparty_address VARCHAR(42),
  counterparty_user_id UUID REFERENCES users(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_property ON transactions(property_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);

-- =============================================================================
-- DIVIDEND ROUNDS TABLE
-- =============================================================================

CREATE TABLE dividend_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id),
  round_number INTEGER NOT NULL,
  
  -- Amounts
  total_amount DECIMAL(18, 6) NOT NULL,
  amount_per_token DECIMAL(30, 18),
  currency VARCHAR(10) DEFAULT 'USDC',
  
  -- Dates
  record_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status dividend_status DEFAULT 'declared',
  
  -- Progress
  total_claimed DECIMAL(18, 6) DEFAULT 0,
  claims_count INTEGER DEFAULT 0,
  total_eligible_holders INTEGER,
  
  -- Blockchain
  contract_round_id INTEGER,
  funding_tx_hash VARCHAR(66),
  
  -- Description
  description TEXT,
  period_start DATE,
  period_end DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(property_id, round_number)
);

-- Index
CREATE INDEX idx_dividends_property ON dividend_rounds(property_id);
CREATE INDEX idx_dividends_status ON dividend_rounds(status);

-- =============================================================================
-- DIVIDEND CLAIMS TABLE
-- =============================================================================

CREATE TABLE dividend_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dividend_round_id UUID NOT NULL REFERENCES dividend_rounds(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Claim details
  token_balance_snapshot DECIMAL(30, 18),
  entitled_amount DECIMAL(18, 6),
  claimed_amount DECIMAL(18, 6),
  
  -- Status
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  -- Blockchain
  claim_tx_hash VARCHAR(66),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(dividend_round_id, user_id)
);

-- Index
CREATE INDEX idx_claims_round ON dividend_claims(dividend_round_id);
CREATE INDEX idx_claims_user ON dividend_claims(user_id);

-- =============================================================================
-- GOVERNANCE PROPOSALS TABLE
-- =============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id),
  proposal_number INTEGER NOT NULL,
  
  -- Proposal details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proposal_type proposal_type NOT NULL,
  document_hash VARCHAR(100),
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voting_start TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_end TIMESTAMP WITH TIME ZONE NOT NULL,
  execution_time TIMESTAMP WITH TIME ZONE,
  expiration_time TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status proposal_status DEFAULT 'pending',
  
  -- Votes
  for_votes DECIMAL(30, 18) DEFAULT 0,
  against_votes DECIMAL(30, 18) DEFAULT 0,
  abstain_votes DECIMAL(30, 18) DEFAULT 0,
  total_voters INTEGER DEFAULT 0,
  snapshot_supply DECIMAL(30, 18),
  quorum_required DECIMAL(30, 18),
  
  -- Proposer
  proposer_id UUID NOT NULL REFERENCES users(id),
  proposer_address VARCHAR(42),
  
  -- Blockchain
  contract_proposal_id INTEGER,
  execution_tx_hash VARCHAR(66),
  
  UNIQUE(property_id, proposal_number)
);

-- Indexes
CREATE INDEX idx_proposals_property ON proposals(property_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_proposer ON proposals(proposer_id);

-- =============================================================================
-- VOTES TABLE
-- =============================================================================

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Vote details
  vote_option INTEGER NOT NULL CHECK (vote_option IN (0, 1, 2)), -- 0=Abstain, 1=For, 2=Against
  weight DECIMAL(30, 18) NOT NULL,
  reason TEXT,
  
  -- Blockchain
  tx_hash VARCHAR(66),
  
  -- Timestamps
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(proposal_id, user_id)
);

-- Indexes
CREATE INDEX idx_votes_proposal ON votes(proposal_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- =============================================================================
-- ACTIVITY LOG TABLE
-- =============================================================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  activity_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50), -- 'property', 'proposal', 'dividend', etc.
  entity_id UUID,
  
  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_type ON activity_log(activity_type);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_date ON activity_log(created_at DESC);

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  
  -- Related entity
  entity_type VARCHAR(50),
  entity_id UUID,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================================================
-- PROPERTY DOCUMENTS TABLE
-- =============================================================================

CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Document details
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'deed', 'appraisal', 'inspection', 'financial', 'legal'
  description TEXT,
  
  -- Storage
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  ipfs_hash VARCHAR(100),
  
  -- Access control
  is_public BOOLEAN DEFAULT false,
  required_verification verification_status DEFAULT 'verified',
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id)
);

-- Index
CREATE INDEX idx_documents_property ON property_documents(property_id);

-- =============================================================================
-- PROPERTY IMAGES TABLE
-- =============================================================================

CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Image details
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text VARCHAR(255),
  caption TEXT,
  
  -- Metadata
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_images_property ON property_images(property_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON investor_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_updated_at
  BEFORE UPDATE ON dividend_rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate ownership percentage
CREATE OR REPLACE FUNCTION calculate_ownership_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_tokens DECIMAL(30, 18);
BEGIN
  SELECT p.total_tokens INTO total_tokens
  FROM properties p
  WHERE p.id = NEW.property_id;
  
  IF total_tokens > 0 THEN
    NEW.ownership_percentage = (NEW.token_balance / total_tokens) * 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_ownership_percentage
  BEFORE INSERT OR UPDATE OF token_balance ON investor_holdings
  FOR EACH ROW EXECUTE FUNCTION calculate_ownership_percentage();

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Active properties with stats
CREATE OR REPLACE VIEW property_stats AS
SELECT 
  p.id,
  p.name,
  p.property_id,
  p.status,
  p.total_valuation,
  p.token_price,
  p.total_tokens,
  p.tokens_available,
  COUNT(DISTINCT ih.user_id) as investor_count,
  SUM(ih.token_balance) as tokens_held,
  ((p.total_tokens - COALESCE(SUM(ih.token_balance), 0)) / p.total_tokens * 100) as available_percentage
FROM properties p
LEFT JOIN investor_holdings ih ON p.id = ih.property_id
GROUP BY p.id;

-- User portfolio summary
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT 
  u.id as user_id,
  u.wallet_address,
  COUNT(DISTINCT ih.property_id) as properties_count,
  SUM(ih.total_invested) as total_invested,
  SUM(ih.current_value) as total_current_value,
  SUM(ih.total_dividends_received) as total_dividends
FROM users u
LEFT JOIN investor_holdings ih ON u.id = ih.user_id
GROUP BY u.id;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
