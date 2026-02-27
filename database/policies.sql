-- =============================================================================
-- FractionalEstate Row Level Security (RLS) Policies
-- Supabase PostgreSQL
-- =============================================================================
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get current user's ID from their wallet address (stored in JWT)
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id FROM users 
    WHERE wallet_address = LOWER(auth.jwt()->>'wallet_address')
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = get_user_id() 
    AND role IN ('admin', 'compliance')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is verified
CREATE OR REPLACE FUNCTION is_verified()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = get_user_id() 
    AND verification_status IN ('verified', 'accredited')
    AND (verification_expiry IS NULL OR verification_expiry > NOW())
    AND is_restricted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- USERS TABLE POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = get_user_id());

-- Admins can view all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (is_admin());

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = get_user_id())
  WITH CHECK (
    id = get_user_id() AND
    -- Cannot change these fields
    role = (SELECT role FROM users WHERE id = get_user_id()) AND
    verification_status = (SELECT verification_status FROM users WHERE id = get_user_id())
  );

-- Admins can update any user
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (is_admin());

-- Allow new user registration (wallet address from auth)
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    wallet_address = LOWER(auth.jwt()->>'wallet_address')
  );

-- =============================================================================
-- PROPERTIES TABLE POLICIES
-- =============================================================================

-- Anyone can view active/offering properties
CREATE POLICY "properties_select_public" ON properties
  FOR SELECT USING (status IN ('offering', 'active'));

-- Admins can view all properties
CREATE POLICY "properties_select_admin" ON properties
  FOR SELECT USING (is_admin());

-- Verified investors can view properties they've invested in
CREATE POLICY "properties_select_invested" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investor_holdings ih
      WHERE ih.property_id = properties.id
      AND ih.user_id = get_user_id()
    )
  );

-- Only admins can insert/update/delete properties
CREATE POLICY "properties_insert_admin" ON properties
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "properties_update_admin" ON properties
  FOR UPDATE USING (is_admin());

CREATE POLICY "properties_delete_admin" ON properties
  FOR DELETE USING (is_admin());

-- =============================================================================
-- INVESTOR HOLDINGS TABLE POLICIES
-- =============================================================================

-- Users can view their own holdings
CREATE POLICY "holdings_select_own" ON investor_holdings
  FOR SELECT USING (user_id = get_user_id());

-- Admins can view all holdings
CREATE POLICY "holdings_select_admin" ON investor_holdings
  FOR SELECT USING (is_admin());

-- Holdings are updated via blockchain sync (service role)
-- Regular users cannot directly modify holdings
CREATE POLICY "holdings_insert_service" ON investor_holdings
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "holdings_update_service" ON investor_holdings
  FOR UPDATE USING (is_admin());

-- =============================================================================
-- TRANSACTIONS TABLE POLICIES
-- =============================================================================

-- Users can view their own transactions
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (user_id = get_user_id());

-- Users can view transactions where they are counterparty
CREATE POLICY "transactions_select_counterparty" ON transactions
  FOR SELECT USING (counterparty_user_id = get_user_id());

-- Admins can view all transactions
CREATE POLICY "transactions_select_admin" ON transactions
  FOR SELECT USING (is_admin());

-- Transactions are created via service (blockchain sync)
CREATE POLICY "transactions_insert_service" ON transactions
  FOR INSERT WITH CHECK (is_admin());

-- =============================================================================
-- DIVIDEND ROUNDS TABLE POLICIES
-- =============================================================================

-- Verified investors can view dividend rounds for properties they hold
CREATE POLICY "dividends_select_holder" ON dividend_rounds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investor_holdings ih
      WHERE ih.property_id = dividend_rounds.property_id
      AND ih.user_id = get_user_id()
    )
  );

-- Admins can view all dividend rounds
CREATE POLICY "dividends_select_admin" ON dividend_rounds
  FOR SELECT USING (is_admin());

-- Only admins can manage dividend rounds
CREATE POLICY "dividends_insert_admin" ON dividend_rounds
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "dividends_update_admin" ON dividend_rounds
  FOR UPDATE USING (is_admin());

-- =============================================================================
-- DIVIDEND CLAIMS TABLE POLICIES
-- =============================================================================

-- Users can view their own claims
CREATE POLICY "claims_select_own" ON dividend_claims
  FOR SELECT USING (user_id = get_user_id());

-- Admins can view all claims
CREATE POLICY "claims_select_admin" ON dividend_claims
  FOR SELECT USING (is_admin());

-- Claims are managed via service
CREATE POLICY "claims_insert_service" ON dividend_claims
  FOR INSERT WITH CHECK (is_admin() OR user_id = get_user_id());

CREATE POLICY "claims_update_service" ON dividend_claims
  FOR UPDATE USING (is_admin() OR user_id = get_user_id());

-- =============================================================================
-- PROPOSALS TABLE POLICIES
-- =============================================================================

-- Verified investors can view proposals for their properties
CREATE POLICY "proposals_select_holder" ON proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM investor_holdings ih
      WHERE ih.property_id = proposals.property_id
      AND ih.user_id = get_user_id()
    )
  );

-- Admins can view all proposals
CREATE POLICY "proposals_select_admin" ON proposals
  FOR SELECT USING (is_admin());

-- Verified investors can create proposals
CREATE POLICY "proposals_insert_verified" ON proposals
  FOR INSERT WITH CHECK (
    is_verified() AND
    proposer_id = get_user_id() AND
    EXISTS (
      SELECT 1 FROM investor_holdings ih
      WHERE ih.property_id = proposals.property_id
      AND ih.user_id = get_user_id()
      AND ih.token_balance > 0
    )
  );

-- Admins can manage proposals
CREATE POLICY "proposals_update_admin" ON proposals
  FOR UPDATE USING (is_admin());

-- =============================================================================
-- VOTES TABLE POLICIES
-- =============================================================================

-- Users can view their own votes
CREATE POLICY "votes_select_own" ON votes
  FOR SELECT USING (user_id = get_user_id());

-- Admins can view all votes
CREATE POLICY "votes_select_admin" ON votes
  FOR SELECT USING (is_admin());

-- Users can view vote counts (not who voted what) for proposals they can see
CREATE POLICY "votes_select_proposal" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM proposals p
      JOIN investor_holdings ih ON ih.property_id = p.property_id
      WHERE p.id = votes.proposal_id
      AND ih.user_id = get_user_id()
    )
  );

-- Verified investors can cast votes
CREATE POLICY "votes_insert_verified" ON votes
  FOR INSERT WITH CHECK (
    is_verified() AND
    user_id = get_user_id() AND
    EXISTS (
      SELECT 1 FROM proposals p
      JOIN investor_holdings ih ON ih.property_id = p.property_id
      WHERE p.id = votes.proposal_id
      AND ih.user_id = get_user_id()
      AND ih.token_balance > 0
      AND p.status = 'active'
    )
  );

-- =============================================================================
-- ACTIVITY LOG TABLE POLICIES
-- =============================================================================

-- Users can view their own activity
CREATE POLICY "activity_select_own" ON activity_log
  FOR SELECT USING (user_id = get_user_id());

-- Admins can view all activity
CREATE POLICY "activity_select_admin" ON activity_log
  FOR SELECT USING (is_admin());

-- Activity is logged via service
CREATE POLICY "activity_insert_service" ON activity_log
  FOR INSERT WITH CHECK (is_admin() OR user_id = get_user_id());

-- =============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = get_user_id());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = get_user_id())
  WITH CHECK (user_id = get_user_id());

-- Notifications can be created by service or admin
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR user_id = get_user_id());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (user_id = get_user_id());

-- =============================================================================
-- PROPERTY DOCUMENTS TABLE POLICIES
-- =============================================================================

-- Public documents can be viewed by anyone
CREATE POLICY "documents_select_public" ON property_documents
  FOR SELECT USING (is_public = true);

-- Verified investors can view documents for their properties
CREATE POLICY "documents_select_holder" ON property_documents
  FOR SELECT USING (
    is_verified() AND
    EXISTS (
      SELECT 1 FROM investor_holdings ih
      WHERE ih.property_id = property_documents.property_id
      AND ih.user_id = get_user_id()
    )
  );

-- Admins can view all documents
CREATE POLICY "documents_select_admin" ON property_documents
  FOR SELECT USING (is_admin());

-- Only admins can manage documents
CREATE POLICY "documents_insert_admin" ON property_documents
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "documents_update_admin" ON property_documents
  FOR UPDATE USING (is_admin());

CREATE POLICY "documents_delete_admin" ON property_documents
  FOR DELETE USING (is_admin());

-- =============================================================================
-- PROPERTY IMAGES TABLE POLICIES
-- =============================================================================

-- Anyone can view property images
CREATE POLICY "images_select_all" ON property_images
  FOR SELECT USING (true);

-- Only admins can manage images
CREATE POLICY "images_insert_admin" ON property_images
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "images_update_admin" ON property_images
  FOR UPDATE USING (is_admin());

CREATE POLICY "images_delete_admin" ON property_images
  FOR DELETE USING (is_admin());

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================
