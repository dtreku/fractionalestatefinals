export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'investor' | 'admin' | 'compliance' | 'property_manager';
export type VerificationStatus = 'pending' | 'verified' | 'accredited' | 'rejected' | 'expired';
export type AccreditationType = 'none' | 'income_threshold' | 'net_worth' | 'professional_cert' | 'entity_qualified';
export type PropertyStatus = 'draft' | 'offering' | 'active' | 'suspended' | 'liquidating' | 'closed';
export type PropertyType = 'residential' | 'commercial' | 'industrial' | 'mixed_use' | 'land' | 'vacation';
export type TransactionType = 'purchase' | 'sale' | 'transfer' | 'dividend' | 'redemption';
export type ProposalStatus = 'pending' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired' | 'cancelled';
export type ProposalType = 'maintenance' | 'policy_change' | 'manager_change' | 'sale_approval' | 'distribution' | 'emergency';
export type DividendStatus = 'declared' | 'funded' | 'distributing' | 'completed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          verification_status: VerificationStatus;
          accreditation_type: AccreditationType;
          accreditation_verified_at: string | null;
          accreditation_expires_at: string | null;
          country: string | null;
          state_province: string | null;
          kyc_document_hash: string | null;
          kyc_verified_at: string | null;
          phone_number: string | null;
          notification_preferences: Json;
          two_factor_enabled: boolean;
          is_restricted: boolean;
          restriction_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          verification_status?: VerificationStatus;
          accreditation_type?: AccreditationType;
          accreditation_verified_at?: string | null;
          accreditation_expires_at?: string | null;
          country?: string | null;
          state_province?: string | null;
          kyc_document_hash?: string | null;
          kyc_verified_at?: string | null;
          phone_number?: string | null;
          notification_preferences?: Json;
          two_factor_enabled?: boolean;
          is_restricted?: boolean;
          restriction_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          verification_status?: VerificationStatus;
          accreditation_type?: AccreditationType;
          accreditation_verified_at?: string | null;
          accreditation_expires_at?: string | null;
          country?: string | null;
          state_province?: string | null;
          kyc_document_hash?: string | null;
          kyc_verified_at?: string | null;
          phone_number?: string | null;
          notification_preferences?: Json;
          two_factor_enabled?: boolean;
          is_restricted?: boolean;
          restriction_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          property_id: string;
          token_address: string | null;
          name: string;
          symbol: string;
          property_type: PropertyType;
          description: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state_province: string;
          postal_code: string;
          country: string;
          latitude: number | null;
          longitude: number | null;
          current_valuation: number;
          token_price: number;
          total_supply: number;
          available_supply: number;
          minimum_investment: number;
          square_footage: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          year_built: number | null;
          annual_rent_income: number | null;
          occupancy_rate: number | null;
          cap_rate: number | null;
          status: PropertyStatus;
          offering_start_date: string | null;
          offering_end_date: string | null;
          metadata_uri: string | null;
          images: Json;
          documents: Json;
          property_manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          token_address?: string | null;
          name: string;
          symbol: string;
          property_type?: PropertyType;
          description?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state_province: string;
          postal_code: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          current_valuation: number;
          token_price: number;
          total_supply: number;
          available_supply: number;
          minimum_investment?: number;
          square_footage?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          year_built?: number | null;
          annual_rent_income?: number | null;
          occupancy_rate?: number | null;
          cap_rate?: number | null;
          status?: PropertyStatus;
          offering_start_date?: string | null;
          offering_end_date?: string | null;
          metadata_uri?: string | null;
          images?: Json;
          documents?: Json;
          property_manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          token_address?: string | null;
          name?: string;
          symbol?: string;
          property_type?: PropertyType;
          description?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state_province?: string;
          postal_code?: string;
          country?: string;
          latitude?: number | null;
          longitude?: number | null;
          current_valuation?: number;
          token_price?: number;
          total_supply?: number;
          available_supply?: number;
          minimum_investment?: number;
          square_footage?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          year_built?: number | null;
          annual_rent_income?: number | null;
          occupancy_rate?: number | null;
          cap_rate?: number | null;
          status?: PropertyStatus;
          offering_start_date?: string | null;
          offering_end_date?: string | null;
          metadata_uri?: string | null;
          images?: Json;
          documents?: Json;
          property_manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      investor_holdings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          token_balance: number;
          cost_basis: number;
          total_invested: number;
          ownership_percentage: number;
          current_value: number;
          unrealized_gain_loss: number;
          total_dividends_received: number;
          first_investment_date: string;
          last_transaction_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          token_balance?: number;
          cost_basis?: number;
          total_invested?: number;
          ownership_percentage?: number;
          current_value?: number;
          unrealized_gain_loss?: number;
          total_dividends_received?: number;
          first_investment_date?: string;
          last_transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          token_balance?: number;
          cost_basis?: number;
          total_invested?: number;
          ownership_percentage?: number;
          current_value?: number;
          unrealized_gain_loss?: number;
          total_dividends_received?: number;
          first_investment_date?: string;
          last_transaction_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          transaction_type: TransactionType;
          token_amount: number;
          price_per_token: number;
          total_amount: number;
          currency: string;
          tx_hash: string | null;
          block_number: number | null;
          gas_used: number | null;
          gas_price: number | null;
          counterparty_address: string | null;
          counterparty_user_id: string | null;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          transaction_type: TransactionType;
          token_amount: number;
          price_per_token: number;
          total_amount: number;
          currency?: string;
          tx_hash?: string | null;
          block_number?: number | null;
          gas_used?: number | null;
          gas_price?: number | null;
          counterparty_address?: string | null;
          counterparty_user_id?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          transaction_type?: TransactionType;
          token_amount?: number;
          price_per_token?: number;
          total_amount?: number;
          currency?: string;
          tx_hash?: string | null;
          block_number?: number | null;
          gas_used?: number | null;
          gas_price?: number | null;
          counterparty_address?: string | null;
          counterparty_user_id?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      dividend_rounds: {
        Row: {
          id: string;
          property_id: string;
          round_number: number;
          total_amount: number;
          amount_per_token: number;
          currency: string;
          record_date: string;
          payment_date: string;
          expiration_date: string;
          status: DividendStatus;
          total_claimed: number;
          total_eligible_tokens: number;
          blockchain_round_id: number | null;
          tx_hash: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          round_number: number;
          total_amount: number;
          amount_per_token: number;
          currency?: string;
          record_date: string;
          payment_date: string;
          expiration_date: string;
          status?: DividendStatus;
          total_claimed?: number;
          total_eligible_tokens?: number;
          blockchain_round_id?: number | null;
          tx_hash?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          round_number?: number;
          total_amount?: number;
          amount_per_token?: number;
          currency?: string;
          record_date?: string;
          payment_date?: string;
          expiration_date?: string;
          status?: DividendStatus;
          total_claimed?: number;
          total_eligible_tokens?: number;
          blockchain_round_id?: number | null;
          tx_hash?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dividend_claims: {
        Row: {
          id: string;
          dividend_round_id: string;
          user_id: string;
          snapshot_balance: number;
          entitled_amount: number;
          claimed_amount: number;
          claimed_at: string | null;
          claim_tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dividend_round_id: string;
          user_id: string;
          snapshot_balance: number;
          entitled_amount: number;
          claimed_amount?: number;
          claimed_at?: string | null;
          claim_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dividend_round_id?: string;
          user_id?: string;
          snapshot_balance?: number;
          entitled_amount?: number;
          claimed_amount?: number;
          claimed_at?: string | null;
          claim_tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      proposals: {
        Row: {
          id: string;
          property_id: string;
          title: string;
          description: string;
          proposal_type: ProposalType;
          proposer_id: string;
          proposer_address: string;
          voting_start: string;
          voting_end: string;
          execution_deadline: string;
          status: ProposalStatus;
          votes_for: number;
          votes_against: number;
          votes_abstain: number;
          total_votes: number;
          quorum_required: number;
          quorum_reached: boolean;
          blockchain_proposal_id: number | null;
          execution_tx_hash: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          title: string;
          description: string;
          proposal_type?: ProposalType;
          proposer_id: string;
          proposer_address: string;
          voting_start: string;
          voting_end: string;
          execution_deadline: string;
          status?: ProposalStatus;
          votes_for?: number;
          votes_against?: number;
          votes_abstain?: number;
          total_votes?: number;
          quorum_required?: number;
          quorum_reached?: boolean;
          blockchain_proposal_id?: number | null;
          execution_tx_hash?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          title?: string;
          description?: string;
          proposal_type?: ProposalType;
          proposer_id?: string;
          proposer_address?: string;
          voting_start?: string;
          voting_end?: string;
          execution_deadline?: string;
          status?: ProposalStatus;
          votes_for?: number;
          votes_against?: number;
          votes_abstain?: number;
          total_votes?: number;
          quorum_required?: number;
          quorum_reached?: boolean;
          blockchain_proposal_id?: number | null;
          execution_tx_hash?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          proposal_id: string;
          user_id: string;
          voter_address: string;
          vote_option: number;
          vote_weight: number;
          reason: string | null;
          tx_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          user_id: string;
          voter_address: string;
          vote_option: number;
          vote_weight: number;
          reason?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          user_id?: string;
          voter_address?: string;
          vote_option?: number;
          vote_weight?: number;
          reason?: string | null;
          tx_hash?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          notification_type: string;
          entity_type: string | null;
          entity_id: string | null;
          read: boolean;
          read_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          notification_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          notification_type?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          read?: boolean;
          read_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      property_stats: {
        Row: {
          property_id: string;
          name: string;
          status: PropertyStatus;
          investor_count: number;
          tokens_held: number;
          tokens_available: number;
          current_valuation: number;
        };
      };
      portfolio_summary: {
        Row: {
          user_id: string;
          total_invested: number;
          total_current_value: number;
          total_unrealized_gain: number;
          total_dividends: number;
          property_count: number;
        };
      };
    };
    Functions: {
      get_user_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_verified: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      accreditation_type: AccreditationType;
      property_status: PropertyStatus;
      property_type: PropertyType;
      transaction_type: TransactionType;
      proposal_status: ProposalStatus;
      proposal_type: ProposalType;
      dividend_status: DividendStatus;
    };
  };
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience types
export type User = Tables<'users'>;
export type Property = Tables<'properties'>;
export type InvestorHolding = Tables<'investor_holdings'>;
export type Transaction = Tables<'transactions'>;
export type DividendRound = Tables<'dividend_rounds'>;
export type DividendClaim = Tables<'dividend_claims'>;
export type Proposal = Tables<'proposals'>;
export type Vote = Tables<'votes'>;
export type Notification = Tables<'notifications'>;
