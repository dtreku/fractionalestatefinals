// frontend/lib/database.ts
// ============================================================================
// DATABASE OPERATIONS
// Handles all Supabase database interactions for the FractionalEstate platform
// ============================================================================

import { supabase } from './supabase';
import { normalizeProperty, normalizeProperties } from './helpers';
import type { 
  User, 
  Property, 
  InvestorHolding, 
  Transaction, 
  Proposal, 
  Vote,
  DividendRound,
  DividendClaim 
} from './supabase';

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Get or create a user by wallet address
 * This is the main onboarding function - creates user if they don't exist
 */
export async function getOrCreateUser(walletAddress: string): Promise<User | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  // First, try to get existing user
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (existingUser) {
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', existingUser.id);
    
    console.log('Existing user found:', existingUser.id);
    return existingUser;
  }

  // User doesn't exist, create new one
  if (fetchError && fetchError.code === 'PGRST116') {
    console.log('Creating new user for wallet:', normalizedAddress);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        wallet_address: normalizedAddress,
        role: 'investor',
        verification_status: 'none',
        accreditation_type: 'none',
        email_notifications: true,
        two_factor_enabled: false,
        is_active: true,
        is_restricted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create user:', createError);
      return null;
    }

    console.log('New user created:', newUser.id);
    return newUser;
  }

  console.error('Error fetching user:', fetchError);
  return null;
}

/**
 * Get user by wallet address (without creating)
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Pick<User, 'email' | 'full_name' | 'phone' | 'bio' | 'city' | 'state_code' | 'country_code' | 'postal_code'>>
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
}

/**
 * Update user KYC/verification status
 */
export async function updateUserVerification(
  userId: string,
  verificationStatus: User['verification_status'],
  accreditationType?: User['accreditation_type']
): Promise<boolean> {
  const updates: any = {
    verification_status: verificationStatus,
    updated_at: new Date().toISOString(),
  };

  if (verificationStatus === 'verified' || verificationStatus === 'accredited') {
    updates.verification_date = new Date().toISOString();
    // Set expiry to 1 year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    updates.verification_expiry = expiry.toISOString();
  }

  if (accreditationType) {
    updates.accreditation_type = accreditationType;
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating verification:', error);
    return false;
  }

  return true;
}

// ============================================================================
// PROPERTY OPERATIONS
// ============================================================================

/**
 * Get all properties
 */
export async function getProperties(status?: Property['status']): Promise<Property[]> {
  let query = supabase.from('properties').select('*');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching properties:', error.message || JSON.stringify(error));
    return [];
  }

  // Normalize numeric fields for all properties
  return normalizeProperties(data || []);
}

/**
 * Get property by ID
 */
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error) {
    console.error('Error fetching property:', error.message || JSON.stringify(error));
    return null;
  }

  // Normalize numeric fields from Supabase NUMERIC type to JavaScript numbers
  return normalizeProperty(data);
}

/**
 * Get property by on-chain property ID
 */
export async function getPropertyByChainId(chainPropertyId: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('property_id', chainPropertyId)
    .single();

  if (error) {
    console.error('Error fetching property:', error.message || JSON.stringify(error));
    return null;
  }

  return normalizeProperty(data);
}

/**
 * Update property token availability
 */
export async function updatePropertyTokens(
  propertyId: string,
  tokensToDeduct: number
): Promise<boolean> {
  // First get current tokens
  const { data: property, error: fetchError } = await supabase
    .from('properties')
    .select('tokens_available')
    .eq('id', propertyId)
    .single();

  if (fetchError || !property) {
    console.error('Error fetching property:', fetchError);
    return false;
  }

  const newAvailable = (property.tokens_available || 0) - tokensToDeduct;
  
  if (newAvailable < 0) {
    console.error('Not enough tokens available');
    return false;
  }

  const { error } = await supabase
    .from('properties')
    .update({
      tokens_available: newAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId);

  if (error) {
    console.error('Error updating property tokens:', error);
    return false;
  }

  return true;
}

// ============================================================================
// INVESTMENT/HOLDING OPERATIONS
// ============================================================================

/**
 * Get user holdings
 */
export async function getUserHoldings(userId: string): Promise<InvestorHolding[]> {
  const { data, error } = await supabase
    .from('investor_holdings')
    .select(`
      *,
      properties (
        id,
        name,
        city,
        state,
        token_price,
        total_valuation,
        status
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching holdings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get holding for a specific property
 */
export async function getUserPropertyHolding(
  userId: string, 
  propertyId: string
): Promise<InvestorHolding | null> {
  const { data, error } = await supabase
    .from('investor_holdings')
    .select('*')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching holding:', error);
  }

  return data || null;
}

/**
 * Create or update investor holding after a purchase
 */
export async function updateInvestorHolding(
  userId: string,
  propertyId: string,
  tokenAmount: number,
  totalAmount: number,
  propertyTotalTokens: number
): Promise<InvestorHolding | null> {
  // Check if holding exists
  const existingHolding = await getUserPropertyHolding(userId, propertyId);

  if (existingHolding) {
    // Update existing holding
    const newBalance = existingHolding.token_balance + tokenAmount;
    const newTotalInvested = existingHolding.total_invested + totalAmount;
    const ownershipPercentage = (newBalance / propertyTotalTokens) * 100;

    const { data, error } = await supabase
      .from('investor_holdings')
      .update({
        token_balance: newBalance,
        total_invested: newTotalInvested,
        ownership_percentage: ownershipPercentage,
        average_cost_basis: newTotalInvested / newBalance,
        last_transaction_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingHolding.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating holding:', error);
      return null;
    }

    return data;
  } else {
    // Create new holding
    const ownershipPercentage = (tokenAmount / propertyTotalTokens) * 100;

    const { data, error } = await supabase
      .from('investor_holdings')
      .insert({
        user_id: userId,
        property_id: propertyId,
        token_balance: tokenAmount,
        total_invested: totalAmount,
        average_cost_basis: totalAmount / tokenAmount,
        ownership_percentage: ownershipPercentage,
        total_dividends_received: 0,
        first_investment_date: new Date().toISOString(),
        last_transaction_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating holding:', error);
      return null;
    }

    return data;
  }
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

/**
 * Record a new transaction (purchase, sale, dividend, etc.)
 */
export async function recordTransaction(params: {
  userId: string;
  propertyId: string;
  transactionType: Transaction['transaction_type'];
  tokenAmount: number;
  pricePerToken?: number;
  totalAmount: number;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  gasPrice?: number;
  counterpartyAddress?: string;
  notes?: string;
}): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: params.userId,
      property_id: params.propertyId,
      transaction_type: params.transactionType,
      token_amount: params.tokenAmount,
      price_per_token: params.pricePerToken,
      total_amount: params.totalAmount,
      tx_hash: params.txHash,
      block_number: params.blockNumber,
      gas_used: params.gasUsed,
      gas_price: params.gasPrice,
      counterparty_address: params.counterpartyAddress,
      notes: params.notes,
      status: params.txHash ? 'confirmed' : 'pending',
      confirmed_at: params.txHash ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording transaction:', error);
    return null;
  }

  console.log('Transaction recorded:', data.id);
  return data;
}

/**
 * Get user transactions
 */
export async function getUserTransactions(
  userId: string, 
  limit?: number
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      properties (name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get transactions for a property
 */
export async function getPropertyTransactions(
  propertyId: string,
  limit?: number
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      users (wallet_address, full_name)
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching property transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * Update transaction status after blockchain confirmation
 */
export async function confirmTransaction(
  transactionId: string,
  txHash: string,
  blockNumber?: number,
  gasUsed?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .update({
      tx_hash: txHash,
      block_number: blockNumber,
      gas_used: gasUsed,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Error confirming transaction:', error);
    return false;
  }

  return true;
}

// ============================================================================
// COMPLETE INVESTMENT FLOW
// Records transaction AND updates holdings in one operation
// ============================================================================

/**
 * Record a complete investment (transaction + holding update + token deduction)
 */
export async function recordInvestment(params: {
  walletAddress: string;
  propertyId: string;
  tokenAmount: number;
  pricePerToken: number;
  totalAmount: number;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
}): Promise<{ success: boolean; transaction?: Transaction; holding?: InvestorHolding; error?: string }> {
  try {
    // 1. Get or create user
    const user = await getOrCreateUser(params.walletAddress);
    if (!user) {
      return { success: false, error: 'Failed to get/create user' };
    }

    // 2. Get property details
    const property = await getPropertyById(params.propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    // 3. Check token availability
    if ((property.tokens_available || 0) < params.tokenAmount) {
      return { success: false, error: 'Not enough tokens available' };
    }

    // 4. Record transaction
    const transaction = await recordTransaction({
      userId: user.id,
      propertyId: params.propertyId,
      transactionType: 'purchase',
      tokenAmount: params.tokenAmount,
      pricePerToken: params.pricePerToken,
      totalAmount: params.totalAmount,
      txHash: params.txHash,
      blockNumber: params.blockNumber,
      gasUsed: params.gasUsed,
      notes: `Purchased ${params.tokenAmount} tokens of ${property.name}`,
    });

    if (!transaction) {
      return { success: false, error: 'Failed to record transaction' };
    }

    // 5. Update investor holding
    const holding = await updateInvestorHolding(
      user.id,
      params.propertyId,
      params.tokenAmount,
      params.totalAmount,
      property.total_tokens || 10000
    );

    if (!holding) {
      return { success: false, error: 'Failed to update holding' };
    }

    // 6. Update property token availability
    await updatePropertyTokens(params.propertyId, params.tokenAmount);

    console.log('Investment recorded successfully:', {
      transactionId: transaction.id,
      holdingId: holding.id,
      tokenAmount: params.tokenAmount,
      totalAmount: params.totalAmount,
    });

    return { success: true, transaction, holding };
  } catch (error) {
    console.error('Error recording investment:', error);
    return { success: false, error: 'Unexpected error recording investment' };
  }
}

// ============================================================================
// DIVIDEND OPERATIONS
// ============================================================================

/**
 * Record dividend claim
 */
export async function recordDividendClaim(params: {
  userId: string;
  propertyId: string;
  dividendRoundId: string;
  amount: number;
  txHash?: string;
}): Promise<boolean> {
  try {
    // Record the dividend transaction
    await recordTransaction({
      userId: params.userId,
      propertyId: params.propertyId,
      transactionType: 'dividend',
      tokenAmount: 0,
      totalAmount: params.amount,
      txHash: params.txHash,
      notes: `Dividend claim from round ${params.dividendRoundId}`,
    });

    // Update the dividend claim record
    const { error: claimError } = await supabase
      .from('dividend_claims')
      .update({
        is_claimed: true,
        claimed_amount: params.amount,
        claimed_at: new Date().toISOString(),
        claim_tx_hash: params.txHash,
      })
      .eq('dividend_round_id', params.dividendRoundId)
      .eq('user_id', params.userId);

    if (claimError) {
      console.error('Error updating dividend claim:', claimError);
      return false;
    }

    // Update investor holding dividends received
    const { error: holdingError } = await supabase
      .from('investor_holdings')
      .update({
        total_dividends_received: supabase.rpc('increment_dividends', { amount: params.amount }),
        last_dividend_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', params.userId)
      .eq('property_id', params.propertyId);

    return true;
  } catch (error) {
    console.error('Error recording dividend claim:', error);
    return false;
  }
}

// ============================================================================
// GOVERNANCE OPERATIONS
// ============================================================================

/**
 * Get proposals for a property
 */
export async function getPropertyProposals(propertyId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active proposals
 */
export async function getActiveProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('proposals')
    .select(`
      *,
      properties (name, city, state)
    `)
    .eq('status', 'active')
    .order('voting_end', { ascending: true });

  if (error) {
    console.error('Error fetching active proposals:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's vote on a proposal
 */
export async function getUserVote(proposalId: string, userId: string): Promise<Vote | null> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('proposal_id', proposalId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching vote:', error);
  }

  return data || null;
}

/**
 * Cast a vote on a proposal
 */
export async function castVote(params: {
  proposalId: string;
  userId: string;
  voteOption: number; // 0=Abstain, 1=For, 2=Against
  weight: number;
  reason?: string;
  txHash?: string;
}): Promise<Vote | null> {
  // Check if user already voted
  const existingVote = await getUserVote(params.proposalId, params.userId);
  if (existingVote) {
    console.error('User has already voted on this proposal');
    return null;
  }

  const { data, error } = await supabase
    .from('votes')
    .insert({
      proposal_id: params.proposalId,
      user_id: params.userId,
      vote_option: params.voteOption,
      weight: params.weight,
      reason: params.reason,
      tx_hash: params.txHash,
      voted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error casting vote:', error);
    return null;
  }

  // Update proposal vote counts
  const voteField = params.voteOption === 1 ? 'for_votes' : 
                    params.voteOption === 2 ? 'against_votes' : 'abstain_votes';

  await supabase.rpc('increment_vote', {
    p_proposal_id: params.proposalId,
    p_vote_field: voteField,
    p_weight: params.weight,
  });

  return data;
}

// ============================================================================
// ANALYTICS/STATS
// ============================================================================

/**
 * Get platform statistics
 */
export async function getPlatformStats(): Promise<{
  totalProperties: number;
  activeListings: number;
  totalInvested: number;
  totalInvestors: number;
}> {
  const [propertiesResult, usersResult, transactionsResult] = await Promise.all([
    supabase.from('properties').select('id, status', { count: 'exact' }),
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'investor'),
    supabase.from('transactions').select('total_amount').eq('transaction_type', 'purchase'),
  ]);

  const totalProperties = propertiesResult.count || 0;
  const activeListings = propertiesResult.data?.filter(p => p.status === 'active' || p.status === 'offering').length || 0;
  const totalInvestors = usersResult.count || 0;
  const totalInvested = transactionsResult.data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

  return {
    totalProperties,
    activeListings,
    totalInvested,
    totalInvestors,
  };
}

/**
 * Get user portfolio summary
 */
export async function getUserPortfolioSummary(userId: string): Promise<{
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalDividends: number;
  propertyCount: number;
}> {
  const holdings = await getUserHoldings(userId);

  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalInvested = holdings.reduce((sum, h) => sum + (h.total_invested || 0), 0);
  const totalGain = holdings.reduce((sum, h) => sum + (h.unrealized_gain_loss || 0), 0);
  const totalDividends = holdings.reduce((sum, h) => sum + (h.total_dividends_received || 0), 0);

  return {
    totalValue,
    totalInvested,
    totalGain,
    totalDividends,
    propertyCount: holdings.length,
  };
}