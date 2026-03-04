// frontend/components/portfolio/Portfolio.tsx
// ============================================================================
// PORTFOLIO COMPONENT
// Displays user's investment holdings, transactions, and dividends
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  getUserHoldings, 
  getUserTransactions, 
  getPortfolioSummary,
  getUserClaimableDividends,
  getUserByWallet 
} from '@/lib/database';
import { formatCurrency, formatNumber, shortenAddress } from '@/lib/contracts';
import { InvestorHolding, Transaction, Property } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'holdings' | 'transactions' | 'dividends';

interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalDividends: number;
  propertyCount: number;
  totalTokens: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Portfolio() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('holdings');
  const [holdings, setHoldings] = useState<(InvestorHolding & { property: Property })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claimableDividends, setClaimableDividends] = useState<any[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Wagmi
  const { address, isConnected } = useAccount();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (address) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [address]);

  const loadUserData = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      // Get user
      const user = await getUserByWallet(address);
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Load all data in parallel
      const [holdingsData, transactionsData, summaryData, dividendsData] = await Promise.all([
        getUserHoldings(user.id),
        getUserTransactions(user.id),
        getPortfolioSummary(user.id),
        getUserClaimableDividends(user.id),
      ]);

      setHoldings(holdingsData);
      setTransactions(transactionsData);
      setSummary(summaryData);
      setClaimableDividends(dividendsData);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderNotConnected = () => (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-gray-600">Connect your wallet to view your portfolio</p>
    </div>
  );

  const renderLoading = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  const renderSummary = () => {
    if (!summary) return null;

    const profitLoss = summary.totalCurrentValue - summary.totalInvested;
    const profitLossPercent = summary.totalInvested > 0 
      ? ((profitLoss / summary.totalInvested) * 100).toFixed(2)
      : '0';

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Total Invested</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Current Value</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalCurrentValue)}</p>
          <p className={`text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)} ({profitLossPercent}%)
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Total Dividends</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalDividends)}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-1">Properties Owned</p>
          <p className="text-2xl font-bold">{summary.propertyCount}</p>
          <p className="text-sm text-gray-500">{formatNumber(summary.totalTokens)} tokens</p>
        </div>
      </div>
    );
  };

  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6">
      {[
        { key: 'holdings', label: 'Holdings', count: holdings.length },
        { key: 'transactions', label: 'Transactions', count: transactions.length },
        { key: 'dividends', label: 'Dividends', count: claimableDividends.filter(d => !d.is_claimed).length },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as TabType)}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const renderHoldings = () => (
    <div className="space-y-4">
      {holdings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p>No holdings yet</p>
          <a href="/properties" className="text-blue-600 hover:underline mt-2 inline-block">
            Browse properties to invest
          </a>
        </div>
      ) : (
        holdings.map((holding) => (
          <HoldingCard key={holding.id} holding={holding} />
        ))
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No transactions yet</p>
        </div>
      ) : (
        transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))
      )}
    </div>
  );

  const renderDividends = () => (
    <div className="space-y-4">
      {claimableDividends.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No dividends available</p>
        </div>
      ) : (
        claimableDividends.map((dividend) => (
          <DividendCard key={dividend.id} dividend={dividend} onClaim={loadUserData} />
        ))
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isConnected) {
    return renderNotConnected();
  }

  if (loading) {
    return renderLoading();
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {renderSummary()}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            {error}
          </div>
        )}

        {renderTabs()}

        {activeTab === 'holdings' && renderHoldings()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'dividends' && renderDividends()}
      </div>
    </div>
  );
}

// ============================================================================
// HOLDING CARD COMPONENT
// ============================================================================

interface HoldingCardProps {
  holding: InvestorHolding & { property: Property };
}

function HoldingCard({ holding }: HoldingCardProps) {
  const { property } = holding;
  const profitLoss = (holding.current_value || 0) - holding.total_invested;
  const profitLossPercent = holding.total_invested > 0
    ? ((profitLoss / holding.total_invested) * 100).toFixed(2)
    : '0';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{property.name}</h4>
          <p className="text-sm text-gray-500">{property.city}, {property.state}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          property.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {property.status}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-500">Tokens Held</p>
          <p className="font-semibold">{formatNumber(holding.token_balance)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ownership</p>
          <p className="font-semibold">{(holding.ownership_percentage || 0).toFixed(4)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Invested</p>
          <p className="font-semibold">{formatCurrency(holding.total_invested)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Current Value</p>
          <p className="font-semibold">{formatCurrency(holding.current_value || 0)}</p>
          <p className={`text-xs ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitLoss >= 0 ? '+' : ''}{profitLossPercent}%
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <a 
          href={`/properties/${property.id}`}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          View Property
        </a>
        <a 
          href={`/governance?property=${property.id}`}
          className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
        >
          Governance
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// TRANSACTION ROW COMPONENT
// ============================================================================

interface TransactionRowProps {
  transaction: Transaction & { properties?: { name: string; property_id: string; symbol: string } };
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'bg-green-100 text-green-800';
      case 'sale': return 'bg-red-100 text-red-800';
      case 'dividend': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '📈';
      case 'sale': return '📉';
      case 'dividend': return '💰';
      case 'transfer': return '↔️';
      default: return '📋';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <span className="text-2xl">{getTypeIcon(transaction.transaction_type)}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(transaction.transaction_type)}`}>
              {transaction.transaction_type.toUpperCase()}
            </span>
            <span className="font-medium">
              {(transaction as any).properties?.name || 'Unknown Property'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {new Date(transaction.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold">
          {transaction.transaction_type === 'purchase' ? '+' : ''}{formatNumber(transaction.token_amount)} tokens
        </p>
        <p className="text-sm text-gray-500">
          {formatCurrency(transaction.total_amount || 0)}
        </p>
        {transaction.tx_hash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${transaction.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {shortenAddress(transaction.tx_hash, 6)}
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DIVIDEND CARD COMPONENT
// ============================================================================

interface DividendCardProps {
  dividend: any;
  onClaim: () => void;
}

function DividendCard({ dividend, onClaim }: DividendCardProps) {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      // Import and call claim function
      const { recordDividendClaim } = await import('@/lib/database');
      await recordDividendClaim({
        walletAddress: '', // Get from wagmi
        dividendClaimId: dividend.id,
        claimedAmount: dividend.entitled_amount,
        txHash: '0x', // Get from blockchain transaction
      });
      onClaim();
    } catch (err) {
      console.error('Failed to claim:', err);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{dividend.property?.name || 'Property Dividend'}</h4>
          <p className="text-sm text-gray-500">
            Round #{dividend.dividend?.round_number} • {new Date(dividend.dividend?.payment_date).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          dividend.is_claimed 
            ? 'bg-gray-100 text-gray-600' 
            : 'bg-green-100 text-green-800'
        }`}>
          {dividend.is_claimed ? 'Claimed' : 'Available'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-500">Tokens Held</p>
          <p className="font-semibold">{formatNumber(dividend.token_balance_snapshot || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Entitled Amount</p>
          <p className="font-semibold text-green-600">{formatCurrency(dividend.entitled_amount || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-semibold">{dividend.is_claimed ? 'Claimed' : 'Pending'}</p>
        </div>
      </div>

      {!dividend.is_claimed && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {claiming ? 'Claiming...' : `Claim ${formatCurrency(dividend.entitled_amount || 0)}`}
        </button>
      )}

      {dividend.is_claimed && dividend.claim_tx_hash && (
        <div className="mt-4 text-center">
          <a
            href={`https://sepolia.etherscan.io/tx/${dividend.claim_tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View claim transaction
          </a>
        </div>
      )}
    </div>
  );
}
