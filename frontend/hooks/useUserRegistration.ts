// frontend/hooks/useUserRegistration.ts
// ============================================================================
// USER REGISTRATION HOOK
// Automatically registers users when they connect their wallet
// ============================================================================

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getOrCreateUser } from '@/lib/database';
import type { User } from '@/lib/supabase';

export function useUserRegistration() {
  const { address, isConnected } = useAccount();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      registerUser();
    } else {
      setUser(null);
      setIsNewUser(false);
    }
  }, [isConnected, address]);

  const registerUser = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if user exists before creating
      const { getUserByWallet } = await import('@/lib/database');
      const existingUser = await getUserByWallet(address);
      
      // Get or create user
      const registeredUser = await getOrCreateUser(address);
      
      if (registeredUser) {
        setUser(registeredUser);
        // Check if this is a new user (created just now)
        setIsNewUser(!existingUser);
        
        if (!existingUser) {
          console.log('🎉 New user registered:', registeredUser.id);
        } else {
          console.log('👋 Welcome back:', registeredUser.id);
        }
      } else {
        setError('Failed to register user');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to register user');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    isNewUser,
    refetch: registerUser,
  };
}
