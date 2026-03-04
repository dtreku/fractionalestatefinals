// frontend/components/providers/UserProvider.tsx
// ============================================================================
// USER PROVIDER
// Automatically registers users when they connect their wallet
// ============================================================================

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { getOrCreateUser, getUserByWallet } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/supabase';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isNewUser: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  isNewUser: false,
  error: null,
  refetch: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async () => {
    if (!address) {
      setUser(null);
      setIsNewUser(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Checking user for wallet:', address);
      
      // Check if user exists
      const existingUser = await getUserByWallet(address);
      console.log('📋 Existing user:', existingUser);
      
      // Get or create user
      const registeredUser = await getOrCreateUser(address);
      console.log('✅ Registered user:', registeredUser);
      
      if (registeredUser) {
        setUser(registeredUser);
        setIsNewUser(!existingUser);
        
        if (!existingUser) {
          console.log('🎉 New user registered:', registeredUser.id);
          toast({
            title: '🎉 Welcome to FractionalEstate!',
            description: 'Your account has been created successfully.',
          });
        } else {
          console.log('👋 Welcome back:', registeredUser.id);
        }
      } else {
        setError('Failed to register user');
        console.error('❌ Failed to register user - null returned');
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Failed to register user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      registerUser();
    } else {
      setUser(null);
      setIsNewUser(false);
    }
  }, [isConnected, address]);

  return (
    <UserContext.Provider value={{ user, isLoading, isNewUser, error, refetch: registerUser }}>
      {children}
    </UserContext.Provider>
  );
}
