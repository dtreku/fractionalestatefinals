// frontend/components/governance/GovernanceProposals.tsx
// ============================================================================
// GOVERNANCE PROPOSALS COMPONENT
// Displays proposals and allows creating new ones
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { 
  getPropertyProposals, 
  createProposal, 
  getActiveProposalsForUser,
  getUserHoldings
} from '@/lib/database';
import { 
  CONTRACT_ADDRESSES, 
  PROPERTY_GOVERNANCE_ABI, 
  getProposalTypeLabel,
  getTimeRemaining,
  formatNumber 
} from '@/lib/contracts';
import { Proposal, Property } from '@/lib/supabase';
import VotePanel from './VotePanel';

// ============================================================================
// TYPES
// ============================================================================

interface GovernanceProposalsProps {
  property?: Property;
  showAllForUser?: boolean;
}

type ProposalTypeKey = 'maintenance' | 'policy_change' | 'manager_change' | 'sale_approval' | 'distribution' | 'emergency' | 'other';

// ============================================================================
// COMPONENT
// ============================================================================

export default function GovernanceProposals({ property, showAllForUser = false }: GovernanceProposalsProps) {
  // State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [userHoldings, setUserHoldings] = useState<any[]>([]);

  // Wagmi
  const { address, isConnected } = useAccount();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    loadProposals();
    if (address) {
      loadUserHoldings();
    }
  }, [property, address, showAllForUser]);

  const loadProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      if (showAllForUser && address) {
        // Load proposals for all properties user has holdings in
        const user = await getUserByWallet(address);
        if (user) {
          const activeProposals = await getActiveProposalsForUser(user.id);
          setProposals(activeProposals);
        }
      } else if (property) {
        // Load proposals for specific property
        const propertyProposals = await getPropertyProposals(property.id);
        setProposals(propertyProposals);
      }
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const loadUserHoldings = async () => {
    if (!address) return;
    try {
      const user = await getUserByWallet(address);
      if (user) {
        const holdings = await getUserHoldings(user.id);
        setUserHoldings(holdings);
      }
    } catch (err) {
      console.error('Failed to load holdings:', err);
    }
  };

  // Import getUserByWallet from database
  const getUserByWallet = async (walletAddress: string) => {
    const { getUserByWallet } = await import('@/lib/database');
    return getUserByWallet(walletAddress);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'passed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'executed':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateProposal = () => {
    if (!property) return false;
    return userHoldings.some(h => h.property_id === property.id && h.token_balance > 0);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {showAllForUser ? 'Your Active Proposals' : 'Governance Proposals'}
            </h2>
            <p className="text-gray-600 mt-1">
              {proposals.length} {proposals.length === 1 ? 'proposal' : 'proposals'}
            </p>
          </div>
          
          {property && canCreateProposal() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Proposal
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No proposals yet</p>
            {property && canCreateProposal() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create the first proposal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => setSelectedProposal(proposal)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && property && (
        <CreateProposalModal
          property={property}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProposals();
          }}
        />
      )}

      {/* Vote Panel Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedProposal.title}</h3>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <VotePanel
                proposal={selectedProposal}
                onVoteSuccess={() => {
                  setSelectedProposal(null);
                  loadProposals();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROPOSAL CARD COMPONENT
// ============================================================================

interface ProposalCardProps {
  proposal: Proposal;
  onClick: () => void;
}

function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const totalVotes = Number(proposal.for_votes) + Number(proposal.against_votes) + Number(proposal.abstain_votes);
  const forPercentage = totalVotes > 0 ? (Number(proposal.for_votes) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (Number(proposal.against_votes) / totalVotes) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'passed': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'executed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(proposal.status)}`}>
              {proposal.status.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
              {getProposalTypeLabel(proposal.proposal_type)}
            </span>
          </div>
          <h4 className="font-semibold text-lg">{proposal.title}</h4>
        </div>
        <div className="text-right text-sm text-gray-500">
          {proposal.status === 'active' && (
            <span className="text-green-600 font-medium">
              {getTimeRemaining(proposal.voting_end)}
            </span>
          )}
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{proposal.description}</p>

      {/* Vote Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-green-600">For: {formatNumber(proposal.for_votes)}</span>
          <span className="text-red-600">Against: {formatNumber(proposal.against_votes)}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="bg-green-500 transition-all"
            style={{ width: `${forPercentage}%` }}
          />
          <div 
            className="bg-red-500 transition-all"
            style={{ width: `${againstPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{proposal.total_voters} voters</span>
          <span>{forPercentage.toFixed(1)}% approval</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE PROPOSAL MODAL
// ============================================================================

interface CreateProposalModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateProposalModal({ property, onClose, onSuccess }: CreateProposalModalProps) {
  const { address } = useAccount();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState<ProposalTypeKey>('maintenance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract interaction
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Handle confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      saveToDatabase();
    }
  }, [isConfirmed, hash]);

  const saveToDatabase = async () => {
    if (!address) return;

    try {
      await createProposal({
        walletAddress: address,
        propertyId: property.id,
        title,
        description,
        proposalType,
        txHash: hash,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to save proposal:', err);
      setError('Transaction confirmed but failed to save. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // First try blockchain transaction
      writeContract({
        address: CONTRACT_ADDRESSES.PROPERTY_GOVERNANCE,
        abi: PROPERTY_GOVERNANCE_ABI,
        functionName: 'createProposal',
        args: [
          BigInt(property.property_id.replace('PROP-', '')),
          proposalTypeToInt(proposalType),
          title,
          description,
          '', // document hash
        ],
      });
    } catch (err) {
      // If blockchain fails, save directly to database (for demo/testing)
      console.log('Blockchain unavailable, saving to database only');
      await createProposal({
        walletAddress: address!,
        propertyId: property.id,
        title,
        description,
        proposalType,
      });
      onSuccess();
    }
  };

  const proposalTypeToInt = (type: ProposalTypeKey): number => {
    const types: Record<ProposalTypeKey, number> = {
      maintenance: 0,
      policy_change: 1,
      manager_change: 2,
      sale_approval: 3,
      distribution: 4,
      emergency: 5,
      other: 6,
    };
    return types[type];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Create Proposal</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposal Type
              </label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value as ProposalTypeKey)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="maintenance">Maintenance</option>
                <option value="policy_change">Policy Change</option>
                <option value="manager_change">Manager Change</option>
                <option value="sale_approval">Sale Approval</option>
                <option value="distribution">Distribution</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brief title for your proposal"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of your proposal"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || isPending}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
              >
                {loading || isPending ? 'Creating...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
