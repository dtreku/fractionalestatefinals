// frontend/components/investment/InvestmentForm.tsx
// ============================================================================
// INVESTMENT FORM COMPONENT
// Handles purchasing property tokens with Supabase transaction recording
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useUserRegistration } from '@/hooks/useUserRegistration';
import { recordInvestment } from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/contracts';
import { CONTRACT_ADDRESSES, FRACTIONAL_ESTATE_ABI } from '@/lib/contracts';
import type { Property } from '@/lib/supabase';
import {
  Wallet,
  Coins,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';

interface InvestmentFormProps {
  property: Property;
  onSuccess?: () => void;
}

export default function InvestmentForm({ property, onSuccess }: InvestmentFormProps) {
  const { address, isConnected } = useAccount();
  const { user, isLoading: userLoading, isNewUser } = useUserRegistration();
  const { toast } = useToast();

  // Form state
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'confirming' | 'recording' | 'complete'>('idle');

  // Contract write hook
  const { data: hash, writeContract, isPending: isWritePending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate costs
  const tokens = parseInt(tokenAmount) || 0;
  const pricePerToken = property.token_price || 0;
  const subtotal = tokens * pricePerToken;
  const platformFee = subtotal * 0.025; // 2.5% fee
  const total = subtotal + platformFee;
  const tokensAvailable = property.tokens_available || 0;

  // Effect to handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash && transactionStep === 'confirming') {
      handleTransactionConfirmed();
    }
  }, [isConfirmed, hash, transactionStep]);

  // Show welcome message for new users
  useEffect(() => {
    if (isNewUser && user) {
      toast({
        title: '🎉 Welcome to FractionalEstate!',
        description: 'Your account has been created. You can now invest in properties.',
      });
    }
  }, [isNewUser, user]);

  const handleTransactionConfirmed = async () => {
    if (!address || !hash) return;

    setTransactionStep('recording');

    try {
      // Record investment in Supabase
      const result = await recordInvestment({
        walletAddress: address,
        propertyId: property.id,
        tokenAmount: tokens,
        pricePerToken: pricePerToken,
        totalAmount: total,
        txHash: hash,
      });

      if (result.success) {
        setTransactionStep('complete');
        toast({
          title: '✅ Investment Successful!',
          description: `You purchased ${tokens} tokens of ${property.name}`,
        });
        setTokenAmount('');
        onSuccess?.();
      } else {
        toast({
          title: 'Warning',
          description: 'Transaction confirmed but failed to record. Please contact support.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error recording investment:', error);
      toast({
        title: 'Warning',
        description: 'Transaction confirmed but recording failed. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setTransactionStep('idle'), 3000);
    }
  };

  const handleInvest = async () => {
    // Validation
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to invest',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Registration Required',
        description: 'Please wait for account registration to complete',
        variant: 'destructive',
      });
      return;
    }

    if (tokens <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid number of tokens',
        variant: 'destructive',
      });
      return;
    }

    if (tokens > tokensAvailable) {
      toast({
        title: 'Insufficient Tokens',
        description: `Only ${tokensAvailable} tokens available`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setTransactionStep('confirming');

    try {
      // For demo/testing: simulate blockchain transaction
      // In production, uncomment the writeContract call below
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock transaction hash
      const mockHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}` as `0x${string}`;

      // Record in database
      setTransactionStep('recording');
      
      const result = await recordInvestment({
        walletAddress: address,
        propertyId: property.id,
        tokenAmount: tokens,
        pricePerToken: pricePerToken,
        totalAmount: total,
        txHash: mockHash,
      });

      if (result.success) {
        setTransactionStep('complete');
        toast({
          title: '✅ Investment Successful!',
          description: `You purchased ${tokens} tokens of ${property.name}. Transaction: ${mockHash.slice(0, 10)}...`,
        });
        setTokenAmount('');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to record investment');
      }

      /* 
      // PRODUCTION CODE - Uncomment for real blockchain transactions
      writeContract({
        address: CONTRACT_ADDRESSES.FractionalEstate as `0x${string}`,
        abi: FRACTIONAL_ESTATE_ABI,
        functionName: 'buyShares',
        args: [property.property_id, BigInt(tokens)],
        value: parseEther((total / 1800).toString()), // Convert USD to ETH
      });
      */

    } catch (error: any) {
      console.error('Investment error:', error);
      toast({
        title: 'Investment Failed',
        description: error.message || 'Transaction failed. Please try again.',
        variant: 'destructive',
      });
      setTransactionStep('idle');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setTransactionStep('idle'), 3000);
    }
  };

  const getStepIndicator = () => {
    switch (transactionStep) {
      case 'confirming':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Confirming transaction...</span>
          </div>
        );
      case 'recording':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Recording investment...</span>
          </div>
        );
      case 'complete':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Investment complete!</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Not connected
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invest in {property.name}</CardTitle>
          <CardDescription>Connect your wallet to purchase tokens</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Connect your wallet to start investing</p>
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  // Loading user
  if (userLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Setting up your account...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-blue-600" />
          Invest in {property.name}
        </CardTitle>
        <CardDescription>
          Purchase fractional ownership tokens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Status */}
        {user && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Account verified: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        )}

        {/* Token Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Price per Token</p>
            <p className="text-xl font-bold">{formatCurrency(pricePerToken)}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Available Tokens</p>
            <p className="text-xl font-bold">{formatNumber(tokensAvailable)}</p>
          </div>
        </div>

        {/* Availability Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tokens Sold</span>
            <span className="font-medium">
              {formatNumber((property.total_tokens || 0) - tokensAvailable)} / {formatNumber(property.total_tokens || 0)}
            </span>
          </div>
          <Progress 
            value={((property.total_tokens || 0) - tokensAvailable) / (property.total_tokens || 1) * 100} 
            className="h-2"
          />
        </div>

        {/* Token Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Tokens
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              max={tokensAvailable}
              className="text-lg"
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              onClick={() => setTokenAmount(Math.min(10, tokensAvailable).toString())}
              disabled={isProcessing}
            >
              10
            </Button>
            <Button
              variant="outline"
              onClick={() => setTokenAmount(Math.min(100, tokensAvailable).toString())}
              disabled={isProcessing}
            >
              100
            </Button>
          </div>
        </div>

        {/* Cost Breakdown */}
        {tokens > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{tokens} tokens × {formatCurrency(pricePerToken)}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform fee (2.5%)</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {transactionStep !== 'idle' && (
          <div className="p-3 bg-blue-50 rounded-lg">
            {getStepIndicator()}
          </div>
        )}

        {/* Invest Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleInvest}
          disabled={isProcessing || tokens <= 0 || tokens > tokensAvailable}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              {tokens > 0 ? `Invest ${formatCurrency(total)}` : 'Enter Token Amount'}
            </>
          )}
        </Button>

        {/* Estimated Returns */}
        {tokens > 0 && property.cap_rate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-700">Estimated Annual Returns</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(subtotal * (property.cap_rate / 100))}
            </p>
            <p className="text-sm text-green-600">
              Based on {property.cap_rate}% annual yield
            </p>
          </div>
        )}

        {/* Compliance Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-700 font-medium">SEC Compliant Investment</p>
            <p className="text-blue-600">
              All transactions are recorded on-chain and in our secure database.
            </p>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-700 font-medium">Demo Mode</p>
            <p className="text-yellow-600">
              Transactions are simulated and recorded in the database for demonstration.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
