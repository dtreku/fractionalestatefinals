import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Server-side Supabase client with service role (use in API routes only)
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper function to get user from wallet address
export const getUserByWallet = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

// Helper function to register or update user
export const upsertUser = async (userData: {
  wallet_address: string;
  email?: string;
  full_name?: string;
  country?: string;
  state_province?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        ...userData,
        wallet_address: userData.wallet_address.toLowerCase(),
      },
      { onConflict: 'wallet_address' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    return null;
  }

  return data;
};
