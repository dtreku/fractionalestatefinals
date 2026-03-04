// frontend/app/investments/page.tsx
// ============================================================================
// USER INVESTMENTS PAGE
// Shows user's property holdings, transactions, and dividends
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { getUserByWallet, getUserHoldings, getUserTransactions } from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/contracts';
import {
  Wallet,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  PieChart,
  History,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Holding {
  id: string;
  property_id: string;
  property_name: string;
  property_city: string;
  property_state: string;
  token_balance: number;
  ownership_percentage: number;
  current_value: number;
  total_invested: number;
  unrealized_gain: number;
  dividends_earned: number;
}

interface Transaction {
  id: string;
  property_name: string;
  transaction_type: 'purchase' | 'sale' | 'dividend' | 'transfer';
  token_amount: number;
  total_amount: number;
  created_at: string;
  tx_hash?: string;
}

// ============================================================================
// MOCK DATA FALLBACK
// ============================================================================

const MOCK_HOLDINGS: Holding[] = [
  {
    id: 'hold-1',
    property_id: 'mock-1',
    property_name: 'Sunset Tower Apartments',
    property_city: 'Los Angeles',
    property_state: 'CA',
    token_balance: 50,
    ownership_percentage: 0.5,
    current_value: 62500,
    total_invested: 50000,
    unrealized_gain: 12500,
    dividends_earned: 2050,
  },
  {
    id: 'hold-2',
    property_id: 'mock-2',
    property_name: 'Ocean View Residences',
    property_city: 'Miami',
    property_state: 'FL',
    token_balance: 25,
    ownership_percentage: 0.25,
    current_value: 46250,
    total_invested: 37500,
    unrealized_gain: 8750,
    dividends_earned: 1725,
  },
  {
    id: 'hold-3',
    property_id: 'mock-5',
    property_name: 'Lakeside Apartments',
    property_city: 'Chicago',
    property_state: 'IL',
    token_balance: 30,
    ownership_percentage: 0.3,
    current_value: 28500,
    total_invested: 25000,
    unrealized_gain: 3500,
    dividends_earned: 1100,
  },
  {
    id: 'hold-4',
    property_id: 'mock-6',
    property_name: 'Industrial Warehouse Complex',
    property_city: 'Dallas',
    property_state: 'TX',
    token_balance: 10,
    ownership_percentage: 0.1,
    current_value: 15000,
    total_invested: 12500,
    unrealized_gain: 2500,
    dividends_earned: 875,
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    property_name: 'Sunset Tower Apartments',
    transaction_type: 'purchase',
    token_amount: 50,
    total_amount: 50000,
    created_at: '2024-01-15T10:30:00Z',
    tx_hash: '0xabc123...',
  },
  {
    id: 'tx-2',
    property_name: 'Sunset Tower Apartments',
    transaction_type: 'dividend',
    token_amount: 0,
    total_amount: 1025,
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'tx-3',
    property_name: 'Ocean View Residences',
    transaction_type: 'purchase',
    token_amount: 25,
    total_amount: 37500,
    created_at: '2024-02-10T14:20:00Z',
    tx_hash: '0xdef456...',
  },
  {
    id: 'tx-4',
    property_name: 'Lakeside Apartments',
    transaction_type: 'purchase',
    token_amount: 30,
    total_amount: 25000,
    created_at: '2024-02-20T09:15:00Z',
    tx_hash: '0xghi789...',
  },
  {
    id: 'tx-5',
    property_name: 'Sunset Tower Apartments',
    transaction_type: 'dividend',
    token_amount: 0,
    total_amount: 1025,
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'tx-6',
    property_name: 'Industrial Warehouse Complex',
    transaction_type: 'purchase',
    token_amount: 10,
    total_amount: 12500,
    created_at: '2024-03-05T11:45:00Z',
    tx_hash: '0xjkl012...',
  },
  {
    id: 'tx-7',
    property_name: 'Ocean View Residences',
    transaction_type: 'dividend',
    token_amount: 0,
    total_amount: 862.50,
    created_at: '2024-03-01T00:00:00Z',
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function InvestmentsPage() {
  const { address, isConnected } = useAccount();

  // State
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');

  // Load user data
  useEffect(() => {
    if (address) {
      loadInvestments();
    } else {
      setLoading(false);
    }
  }, [address]);

  const loadInvestments = async () => {
    if (!address) return;
    
    setLoading(true);
    setUsingMockData(false);

    try {
      const user = await getUserByWallet(address);
      
      if (user) {
        // Fetch holdings with property details
        const { data: holdingsData } = await supabase
          .from('investor_holdings')
          .select(`
            *,
            properties (
              name,
              city,
              state,
              token_price,
              total_valuation
            )
          `)
          .eq('user_id', user.id);

        // Fetch transactions with property details
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select(`
            *,
            properties (name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (holdingsData && holdingsData.length > 0) {
          const formattedHoldings: Holding[] = holdingsData.map(h => ({
            id: h.id,
            property_id: h.property_id,
            property_name: h.properties?.name || 'Unknown Property',
            property_city: h.properties?.city || '',
            property_state: h.properties?.state || '',
            token_balance: h.token_balance || 0,
            ownership_percentage: h.ownership_percentage || 0,
            current_value: (h.token_balance || 0) * (h.properties?.token_price || 0),
            total_invested: h.total_invested || 0,
            unrealized_gain: h.unrealized_gain || 0,
            dividends_earned: h.dividends_claimed || 0,
          }));
          setHoldings(formattedHoldings);
        } else {
          setHoldings(MOCK_HOLDINGS);
          setUsingMockData(true);
        }

        if (transactionsData && transactionsData.length > 0) {
          const formattedTransactions: Transaction[] = transactionsData.map(t => ({
            id: t.id,
            property_name: t.properties?.name || 'Unknown Property',
            transaction_type: t.transaction_type,
            token_amount: t.token_amount || 0,
            total_amount: t.total_amount || 0,
            created_at: t.created_at,
            tx_hash: t.tx_hash,
          }));
          setTransactions(formattedTransactions);
        } else {
          setTransactions(MOCK_TRANSACTIONS);
          setUsingMockData(true);
        }
      } else {
        // Use mock data
        setHoldings(MOCK_HOLDINGS);
        setTransactions(MOCK_TRANSACTIONS);
        setUsingMockData(true);
      }
    } catch (err) {
      console.error('Failed to load investments:', err);
      setHoldings(MOCK_HOLDINGS);
      setTransactions(MOCK_TRANSACTIONS);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.total_invested, 0);
  const totalGain = holdings.reduce((sum, h) => sum + h.unrealized_gain, 0);
  const totalDividends = holdings.reduce((sum, h) => sum + h.dividends_earned, 0);
  const gainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowDownRight className="w-4 h-4 text-blue-600" />;
      case 'sale':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'dividend':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <ArrowUpRight className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'text-blue-600';
      case 'sale':
      case 'dividend':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to view your investments
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Investments</h1>
          <p className="text-muted-foreground">
            Track your property holdings, returns, and transaction history
          </p>
        </div>

        {/* Mock Data Banner */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-900 text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-yellow-800 font-medium">Demo Data</p>
              <p className="text-yellow-700 text-sm">
                Showing sample investment data. Your actual holdings will appear once you make investments.
              </p>
              <Link href="/properties">
                <Button variant="outline" size="sm" className="mt-2 border-yellow-400 text-yellow-800 hover:bg-yellow-100">
                  Browse Properties to Invest
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PieChart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Portfolio Value</p>
                  <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  {totalGain >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unrealized Gain</p>
                  <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
                    <span className="text-sm ml-1">({gainPercentage.toFixed(1)}%)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Dividends</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(totalDividends)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Properties</p>
                  <p className="text-xl font-bold">{holdings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'holdings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Coins className="w-4 h-4 inline mr-2" />
            Holdings ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === 'transactions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Transactions ({transactions.length})
          </button>
        </div>

        {/* Holdings Tab */}
        {activeTab === 'holdings' && (
          <div className="space-y-4">
            {holdings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start investing in properties to build your portfolio
                  </p>
                  <Link href="/properties">
                    <Button>Browse Properties</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              holdings.map((holding) => (
                <Card key={holding.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{holding.property_name}</h3>
                          <p className="text-gray-500 text-sm">
                            {holding.property_city}, {holding.property_state}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                              {formatNumber(holding.token_balance)} tokens
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {holding.ownership_percentage.toFixed(2)}% ownership
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 md:text-right">
                        <div>
                          <p className="text-sm text-gray-500">Current Value</p>
                          <p className="font-semibold">{formatCurrency(holding.current_value)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Gain/Loss</p>
                          <p className={`font-semibold ${holding.unrealized_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.unrealized_gain >= 0 ? '+' : ''}{formatCurrency(holding.unrealized_gain)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Dividends</p>
                          <p className="font-semibold text-purple-600">{formatCurrency(holding.dividends_earned)}</p>
                        </div>
                      </div>

                      <Link href={`/properties/${holding.property_id}`}>
                        <Button variant="outline" size="sm">
                          View
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your investment activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                  <p className="text-gray-600">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'purchase' ? 'bg-blue-100' :
                          tx.transaction_type === 'dividend' ? 'bg-green-100' :
                          'bg-gray-100'
                        }`}>
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        <div>
                          <p className="font-medium">{tx.property_name}</p>
                          <p className="text-sm text-gray-500">
                            {tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}
                            {tx.token_amount > 0 && ` • ${tx.token_amount} tokens`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(tx.transaction_type)}`}>
                          {tx.transaction_type === 'purchase' ? '-' : '+'}
                          {formatCurrency(tx.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {tx.tx_hash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
