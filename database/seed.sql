-- =============================================================================
-- FractionalEstate Seed Data
-- Supabase PostgreSQL
-- =============================================================================
-- Run this AFTER schema.sql and policies.sql to populate test data
-- =============================================================================

-- =============================================================================
-- USERS (Test Accounts)
-- =============================================================================

INSERT INTO users (wallet_address, email, full_name, role, verification_status, accreditation_type, country_code, state_code, is_active)
VALUES
  -- Admin account
  ('0x1234567890abcdef1234567890abcdef12345678', 'admin@fractionalestate.com', 'Platform Admin', 'admin', 'verified', 'none', 'US', 'CA', true),
  
  -- Compliance officer
  ('0xabcdef1234567890abcdef1234567890abcdef12', 'compliance@fractionalestate.com', 'Sarah Compliance', 'compliance', 'verified', 'none', 'US', 'NY', true),
  
  -- Property manager
  ('0xfedcba0987654321fedcba0987654321fedcba09', 'manager@fractionalestate.com', 'Mike Manager', 'property_manager', 'verified', 'none', 'US', 'TX', true),
  
  -- Verified investors
  ('0x1111111111111111111111111111111111111111', 'investor1@example.com', 'Alice Investor', 'investor', 'verified', 'income_threshold', 'US', 'CA', true),
  ('0x2222222222222222222222222222222222222222', 'investor2@example.com', 'Bob Investor', 'investor', 'accredited', 'net_worth_threshold', 'US', 'NY', true),
  ('0x3333333333333333333333333333333333333333', 'investor3@example.com', 'Carol Investor', 'investor', 'verified', 'none', 'US', 'FL', true),
  
  -- Pending verification
  ('0x4444444444444444444444444444444444444444', 'pending@example.com', 'David Pending', 'investor', 'pending', 'none', 'US', 'WA', true),
  
  -- International investor
  ('0x5555555555555555555555555555555555555555', 'intl@example.com', 'Emma International', 'investor', 'verified', 'professional_cert', 'GB', '', true);

-- =============================================================================
-- PROPERTIES (Sample Real Estate)
-- =============================================================================

INSERT INTO properties (
  property_id, token_address, name, symbol, description, property_type,
  street_address, city, state, postal_code, country, latitude, longitude,
  total_valuation, token_price, total_tokens, tokens_available, minimum_investment,
  square_feet, year_built, bedrooms, bathrooms, parking_spaces,
  annual_rent_income, occupancy_rate, cap_rate,
  status, metadata_uri, features
)
VALUES
  -- Property 1: Luxury Apartment Building
  (
    'PROP-001',
    '0xaaa0000000000000000000000000000000000001',
    'Sunset Heights Apartments',
    'SUNHT',
    'A premier 24-unit luxury apartment complex in downtown San Francisco. Built in 2019, this Class A property features modern amenities, rooftop terrace, fitness center, and secure parking. Prime location near tech hubs with consistent 98% occupancy.',
    'residential',
    '1250 Market Street',
    'San Francisco',
    'California',
    '94102',
    'United States',
    37.7749,
    -122.4194,
    8500000.000000,  -- $8.5M valuation
    8.500000,        -- $8.50 per token
    1000000,         -- 1M tokens
    350000,          -- 350K available
    100.000000,      -- $100 minimum
    28500,           -- sq ft
    2019,
    NULL,            -- apartments have multiple units
    NULL,
    48,              -- parking spaces
    680000.000000,   -- $680K annual rent
    98.50,           -- 98.5% occupancy
    8.00,            -- 8% cap rate
    'active',
    'ipfs://QmSunsetHeightsMetadata',
    '["Rooftop Terrace", "Fitness Center", "Smart Home Technology", "EV Charging", "24/7 Concierge", "Pet Friendly"]'::jsonb
  ),
  
  -- Property 2: Commercial Office Space
  (
    'PROP-002',
    '0xbbb0000000000000000000000000000000000002',
    'Tech Hub Office Tower',
    'THOT',
    'Class A office building in Austin''s Silicon Hills. Features open floor plans, high-speed connectivity, modern conference facilities, and ground-floor retail. Long-term leases with established tech companies provide stable income.',
    'commercial',
    '500 Congress Avenue',
    'Austin',
    'Texas',
    '78701',
    'United States',
    30.2672,
    -97.7431,
    12000000.000000, -- $12M valuation
    12.000000,       -- $12 per token
    1000000,         -- 1M tokens
    600000,          -- 600K available (offering)
    250.000000,      -- $250 minimum
    45000,           -- sq ft
    2017,
    NULL,
    NULL,
    120,
    960000.000000,   -- $960K annual rent
    95.00,
    8.00,
    'offering',
    'ipfs://QmTechHubMetadata',
    '["High-Speed Fiber", "Conference Center", "Ground Floor Retail", "Rooftop Deck", "Bike Storage", "Green Certified"]'::jsonb
  ),
  
  -- Property 3: Vacation Rental Portfolio
  (
    'PROP-003',
    '0xccc0000000000000000000000000000000000003',
    'Miami Beach Vacation Collection',
    'MBVC',
    'Portfolio of 6 premium vacation rental condos in Miami Beach. All units are oceanfront with stunning views, fully furnished, and managed by professional property management. Strong seasonal income with year-round bookings.',
    'hospitality',
    '1500 Ocean Drive',
    'Miami Beach',
    'Florida',
    '33139',
    'United States',
    25.7617,
    -80.1918,
    4200000.000000,  -- $4.2M valuation
    4.200000,        -- $4.20 per token
    1000000,         -- 1M tokens
    200000,          -- 200K available
    100.000000,      -- $100 minimum
    8400,            -- total sq ft across 6 units
    2015,
    12,              -- total bedrooms
    12.0,            -- total bathrooms
    12,              -- parking spaces
    420000.000000,   -- $420K annual rent
    78.00,           -- 78% occupancy (vacation rental)
    10.00,           -- 10% cap rate
    'active',
    'ipfs://QmMiamiBeachMetadata',
    '["Ocean Front", "Pool Access", "Full Kitchen", "Beach Service", "Concierge", "Weekly Cleaning"]'::jsonb
  ),
  
  -- Property 4: Industrial Warehouse (Draft)
  (
    'PROP-004',
    NULL,
    'Phoenix Distribution Center',
    'PXDC',
    'Modern logistics facility near Phoenix Sky Harbor Airport. 100,000 sq ft warehouse with 32-foot clear height, cross-dock capability, and expansion potential. Ideal for e-commerce fulfillment.',
    'industrial',
    '4500 E Sky Harbor Circle',
    'Phoenix',
    'Arizona',
    '85034',
    'United States',
    33.4373,
    -111.9799,
    15000000.000000, -- $15M valuation
    15.000000,
    1000000,
    1000000,         -- All available (not launched)
    500.000000,      -- $500 minimum
    100000,
    2020,
    NULL,
    NULL,
    50,              -- truck bays
    1200000.000000,  -- $1.2M annual rent
    100.00,          -- 100% (single tenant)
    8.00,
    'draft',         -- Not yet launched
    'ipfs://QmPhoenixWarehouseMetadata',
    '["Cross-Dock", "32ft Clear Height", "Solar Panels", "Climate Controlled", "Airport Adjacent", "Expansion Land"]'::jsonb
  );

-- =============================================================================
-- PROPERTY IMAGES
-- =============================================================================

INSERT INTO property_images (property_id, url, thumbnail_url, alt_text, is_primary, display_order)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
  'Sunset Heights Apartments - Exterior',
  true,
  1
FROM properties p WHERE p.property_id = 'PROP-001';

INSERT INTO property_images (property_id, url, thumbnail_url, alt_text, is_primary, display_order)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
  'Tech Hub Office Tower - Lobby',
  true,
  1
FROM properties p WHERE p.property_id = 'PROP-002';

INSERT INTO property_images (property_id, url, thumbnail_url, alt_text, is_primary, display_order)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
  'Miami Beach Vacation Collection - Ocean View',
  true,
  1
FROM properties p WHERE p.property_id = 'PROP-003';

-- =============================================================================
-- INVESTOR HOLDINGS
-- =============================================================================

-- Holdings for PROP-001 (Sunset Heights)
INSERT INTO investor_holdings (user_id, property_id, token_balance, average_cost_basis, total_invested, total_dividends_received, first_investment_date)
SELECT 
  u.id,
  p.id,
  50000,           -- 50,000 tokens
  8.50,            -- $8.50 cost basis
  425000.000000,   -- $425K invested
  12750.000000,    -- $12,750 dividends received
  '2024-03-15'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111'
AND p.property_id = 'PROP-001';

INSERT INTO investor_holdings (user_id, property_id, token_balance, average_cost_basis, total_invested, total_dividends_received, first_investment_date)
SELECT 
  u.id,
  p.id,
  100000,          -- 100,000 tokens
  8.50,
  850000.000000,
  25500.000000,
  '2024-02-01'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x2222222222222222222222222222222222222222'
AND p.property_id = 'PROP-001';

-- Holdings for PROP-002 (Tech Hub - Offering)
INSERT INTO investor_holdings (user_id, property_id, token_balance, average_cost_basis, total_invested, first_investment_date)
SELECT 
  u.id,
  p.id,
  25000,           -- 25,000 tokens
  12.00,
  300000.000000,
  '2024-11-01'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x2222222222222222222222222222222222222222'
AND p.property_id = 'PROP-002';

-- Holdings for PROP-003 (Miami Beach)
INSERT INTO investor_holdings (user_id, property_id, token_balance, average_cost_basis, total_invested, total_dividends_received, first_investment_date)
SELECT 
  u.id,
  p.id,
  200000,          -- 200,000 tokens
  4.20,
  840000.000000,
  42000.000000,
  '2024-01-10'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x3333333333333333333333333333333333333333'
AND p.property_id = 'PROP-003';

INSERT INTO investor_holdings (user_id, property_id, token_balance, average_cost_basis, total_invested, total_dividends_received, first_investment_date)
SELECT 
  u.id,
  p.id,
  100000,
  4.20,
  420000.000000,
  21000.000000,
  '2024-04-20'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111'
AND p.property_id = 'PROP-003';

-- =============================================================================
-- DIVIDEND ROUNDS
-- =============================================================================

-- Dividend for PROP-001 Q4 2024
INSERT INTO dividend_rounds (property_id, round_number, total_amount, amount_per_token, currency, record_date, payment_date, status, total_claimed, claims_count, description, period_start, period_end)
SELECT 
  p.id,
  1,
  170000.000000,   -- $170K total
  0.170000,        -- $0.17 per token
  'USDC',
  '2024-12-15'::timestamp,
  '2024-12-20'::timestamp,
  'completed',
  170000.000000,
  2,
  'Q4 2024 Rental Income Distribution',
  '2024-10-01',
  '2024-12-31'
FROM properties p WHERE p.property_id = 'PROP-001';

-- Dividend for PROP-003 Q4 2024
INSERT INTO dividend_rounds (property_id, round_number, total_amount, amount_per_token, currency, record_date, payment_date, status, total_claimed, claims_count, description, period_start, period_end)
SELECT 
  p.id,
  1,
  105000.000000,   -- $105K total
  0.105000,        -- $0.105 per token
  'USDC',
  '2024-12-15'::timestamp,
  '2024-12-20'::timestamp,
  'completed',
  105000.000000,
  2,
  'Q4 2024 Vacation Rental Income',
  '2024-10-01',
  '2024-12-31'
FROM properties p WHERE p.property_id = 'PROP-003';

-- =============================================================================
-- SAMPLE TRANSACTIONS
-- =============================================================================

-- Purchase transactions
INSERT INTO transactions (user_id, property_id, transaction_type, token_amount, price_per_token, total_amount, tx_hash, status, confirmed_at)
SELECT 
  u.id,
  p.id,
  'purchase',
  50000,
  8.50,
  425000.000000,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  'confirmed',
  '2024-03-15 10:30:00'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111'
AND p.property_id = 'PROP-001';

INSERT INTO transactions (user_id, property_id, transaction_type, token_amount, price_per_token, total_amount, tx_hash, status, confirmed_at)
SELECT 
  u.id,
  p.id,
  'purchase',
  100000,
  8.50,
  850000.000000,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  'confirmed',
  '2024-02-01 14:15:00'::timestamp
FROM users u, properties p
WHERE u.wallet_address = '0x2222222222222222222222222222222222222222'
AND p.property_id = 'PROP-001';

-- Dividend transactions
INSERT INTO transactions (user_id, property_id, transaction_type, token_amount, total_amount, tx_hash, status, confirmed_at, notes)
SELECT 
  u.id,
  p.id,
  'dividend',
  0,
  8500.000000,
  '0x' || encode(gen_random_bytes(32), 'hex'),
  'confirmed',
  '2024-12-20 09:00:00'::timestamp,
  'Q4 2024 Dividend - 50,000 tokens × $0.17'
FROM users u, properties p
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111'
AND p.property_id = 'PROP-001';

-- =============================================================================
-- GOVERNANCE PROPOSALS
-- =============================================================================

-- Active proposal for PROP-001
INSERT INTO proposals (property_id, proposal_number, title, description, proposal_type, voting_start, voting_end, status, for_votes, against_votes, abstain_votes, total_voters, snapshot_supply, quorum_required, proposer_id, proposer_address)
SELECT 
  p.id,
  1,
  'HVAC System Upgrade',
  'Proposal to upgrade the building''s HVAC system to modern, energy-efficient units. Estimated cost: $150,000. Expected annual savings: $18,000. ROI payback period: 8.3 years. This upgrade will improve tenant comfort and reduce operating costs.',
  'maintenance',
  '2025-01-15'::timestamp,
  '2025-01-22'::timestamp,
  'active',
  85000,           -- 85K tokens voted For
  15000,           -- 15K tokens voted Against
  5000,            -- 5K tokens Abstained
  3,
  1000000,
  200000,          -- 20% quorum
  u.id,
  '0x1111111111111111111111111111111111111111'
FROM users u, properties p
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111'
AND p.property_id = 'PROP-001';

-- Passed proposal for PROP-003
INSERT INTO proposals (property_id, proposal_number, title, description, proposal_type, voting_start, voting_end, execution_time, status, for_votes, against_votes, abstain_votes, total_voters, snapshot_supply, quorum_required, proposer_id, proposer_address)
SELECT 
  p.id,
  1,
  'Property Management Contract Renewal',
  'Renew the property management contract with Beach Stays Management for 2 years at 18% of gross rental income. Current performance has been excellent with 4.8/5 guest ratings and 78% occupancy.',
  'manager_change',
  '2024-11-01'::timestamp,
  '2024-11-08'::timestamp,
  '2024-11-10'::timestamp,
  'executed',
  280000,          -- 280K For
  20000,           -- 20K Against
  0,               -- 0 Abstain
  2,
  1000000,
  200000,
  u.id,
  '0x3333333333333333333333333333333333333333'
FROM users u, properties p
WHERE u.wallet_address = '0x3333333333333333333333333333333333333333'
AND p.property_id = 'PROP-003';

-- =============================================================================
-- SAMPLE VOTES
-- =============================================================================

-- Votes for PROP-001 Proposal
INSERT INTO votes (proposal_id, user_id, vote_option, weight, reason, voted_at)
SELECT 
  pr.id,
  u.id,
  1,               -- For
  50000,
  'Energy efficiency is important for long-term value',
  '2025-01-16 11:00:00'::timestamp
FROM proposals pr
JOIN properties p ON pr.property_id = p.id
JOIN users u ON u.wallet_address = '0x1111111111111111111111111111111111111111'
WHERE p.property_id = 'PROP-001' AND pr.proposal_number = 1;

INSERT INTO votes (proposal_id, user_id, vote_option, weight, reason, voted_at)
SELECT 
  pr.id,
  u.id,
  1,               -- For
  35000,           -- Partial holding voted
  'Good investment in property value',
  '2025-01-17 14:30:00'::timestamp
FROM proposals pr
JOIN properties p ON pr.property_id = p.id
JOIN users u ON u.wallet_address = '0x2222222222222222222222222222222222222222'
WHERE p.property_id = 'PROP-001' AND pr.proposal_number = 1;

-- =============================================================================
-- NOTIFICATIONS (Sample)
-- =============================================================================

INSERT INTO notifications (user_id, title, message, notification_type, entity_type, is_read)
SELECT 
  u.id,
  'Dividend Payment Received',
  'You received $8,500 in dividends from Sunset Heights Apartments (Q4 2024)',
  'dividend',
  'dividend',
  true
FROM users u
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111';

INSERT INTO notifications (user_id, title, message, notification_type, entity_type, is_read)
SELECT 
  u.id,
  'New Governance Proposal',
  'A new proposal "HVAC System Upgrade" has been created for Sunset Heights Apartments. Voting ends Jan 22.',
  'governance',
  'proposal',
  false
FROM users u
WHERE u.wallet_address IN ('0x1111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222');

INSERT INTO notifications (user_id, title, message, notification_type, entity_type, is_read)
SELECT 
  u.id,
  'New Property Offering',
  'Tech Hub Office Tower is now accepting investments. $12M Class A office building in Austin.',
  'property',
  'property',
  false
FROM users u
WHERE u.verification_status IN ('verified', 'accredited');

-- =============================================================================
-- ACTIVITY LOG (Sample)
-- =============================================================================

INSERT INTO activity_log (user_id, activity_type, entity_type, title, description)
SELECT 
  u.id,
  'investment',
  'property',
  'Purchased tokens',
  'Purchased 50,000 SUNHT tokens for $425,000'
FROM users u
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111';

INSERT INTO activity_log (user_id, activity_type, entity_type, title, description)
SELECT 
  u.id,
  'vote',
  'proposal',
  'Voted on proposal',
  'Voted FOR "HVAC System Upgrade" proposal with 50,000 tokens'
FROM users u
WHERE u.wallet_address = '0x1111111111111111111111111111111111111111';

-- =============================================================================
-- END OF SEED DATA
-- =============================================================================
