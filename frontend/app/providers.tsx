// frontend/app/providers.tsx
// ============================================================================
// APP PROVIDERS
// Wraps the app with all necessary context providers
// ============================================================================

'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3';
import { UserProvider } from '@/components/providers/UserProvider';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#2563eb',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <UserProvider>
            {children}
          </UserProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
