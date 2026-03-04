// frontend/components/governance/VotePanel.tsx
// ============================================================================
// VOTE PANEL COMPONENT
// Allows users to cast votes on governance proposals
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { castVote, getUserVote, getUserByWallet, getUserHoldings } from '@/lib/database';
import { CONTRACT_ADDRESSES, PROPERTY_GOVERNANCE_ABI, getVoteOptionLabel, getTimeRemaining, formatNumber } from '@/lib/contracts';
import { Proposal, Vote } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface VotePanelProps {
  proposal: Proposal;
  onVoteSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VotePanel({ proposal, onVoteSuccess }: VotePanelProps) {
  // State
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Wagmi
  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Calculate vote percentages
  const totalVotes = Number(proposal.for_votes) + Number(proposal.against_votes) + Number(proposal.abstain_votes);
  const forPercentage = totalVotes > 0 ? (Number(proposal.for_votes) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (Number(proposal.against_votes) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (Number(proposal.abstain_votes) / totalVotes) * 100 : 0;

  // Check if voting is active
  const isVotingActive = proposal.status === 'active' && new Date() < new Date(proposal.voting_end);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (address) {
      loadUserData();
    }
  }, [address, proposal]);

  useEffect(() => {
    if (isConfirmed && hash) {
      saveVoteToDatabase();
    }
  }, [isConfirmed, hash]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadUserData = async () => {
    if (!address) return;

    try {
      const user = await getUserByWallet(address);
      if (user) {
        // Check if user has already voted
        const existingVote = await getUserVote(user.id, proposal.id);
        setUserVote(existingVote);

        // Get user's voting power (token balance for this property)
        const holdings = await getUserHoldings(user.id);
        const propertyHolding = holdings.find(h => h.property_id === proposal.property_id);
        setVotingPower(propertyHolding?.token_balance || 0);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const saveVoteToDatabase = async () => {
    if (!address || selectedVote === null) return;

    try {
      await castVote({
        walletAddress: address,
        proposalId: proposal.id,
        voteOption: selectedVote,
        weight: votingPower,
        reason: reason || undefined,
        txHash: hash,
      });

      setSuccess('Vote cast successfully!');
      onVoteSuccess?.();
    } catch (err) {
      console.error('Failed to save vote:', err);
      setError('Transaction confirmed but failed to record. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (selectedVote === null) {
      setError('Please select a vote option');
      return;
    }

    if (votingPower <= 0) {
      setError('You need tokens to vote on this proposal');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Try blockchain transaction first
      writeContract({
        address: CONTRACT_ADDRESSES.PROPERTY_GOVERNANCE,
        abi: PROPERTY_GOVERNANCE_ABI,
        functionName: 'castVote',
        args: [BigInt(proposal.contract_proposal_id || 0), selectedVote, reason],
      });
    } catch (err) {
      // If blockchain fails, save directly to database (for demo/testing)
      console.log('Blockchain unavailable, saving to database only');
      try {
        await castVote({
          walletAddress: address!,
          proposalId: proposal.id,
          voteOption: selectedVote,
          weight: votingPower,
          reason: reason || undefined,
        });
        setSuccess('Vote cast successfully!');
        onVoteSuccess?.();
      } catch (dbErr) {
        setError('Failed to cast vote. Please try again.');
      }
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Proposal Details */}
      <div className="border-b border-gray-200 pb-4">
        <p className="text-gray-600 text-sm mb-2">{proposal.description}</p>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Created: {new Date(proposal.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>
            {isVotingActive 
              ? getTimeRemaining(proposal.voting_end)
              : `Ended: ${new Date(proposal.voting_end).toLocaleDateString()}`
            }
          </span>
        </div>
      </div>

      {/* Vote Results */}
      <div className="space-y-4">
        <h4 className="font-semibold">Current Results</h4>
        
        {/* For */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600 font-medium">For</span>
            <span>{formatNumber(proposal.for_votes)} ({forPercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
        </div>

        {/* Against */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-600 font-medium">Against</span>
            <span>{formatNumber(proposal.against_votes)} ({againstPercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${againstPercentage}%` }}
            />
          </div>
        </div>

        {/* Abstain */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 font-medium">Abstain</span>
            <span>{formatNumber(proposal.abstain_votes)} ({abstainPercentage.toFixed(1)}%)</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 transition-all duration-500"
              style={{ width: `${abstainPercentage}%` }}
            />
          </div>
        </div>

        <div className="text-sm text-gray-500 pt-2">
          Total Votes: {formatNumber(totalVotes)} from {proposal.total_voters} voters
        </div>
      </div>

      {/* User Vote Section */}
      {isConnected && isVotingActive && (
        <div className="border-t border-gray-200 pt-6">
          {userVote ? (
            // Already voted
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-blue-800">You have voted</span>
              </div>
              <p className="text-sm text-blue-700">
                You voted <strong>{getVoteOptionLabel(userVote.vote_option)}</strong> with {formatNumber(userVote.weight)} voting power
              </p>
              {userVote.reason && (
                <p className="text-sm text-blue-600 mt-2 italic">"{userVote.reason}"</p>
              )}
            </div>
          ) : (
            // Vote form
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Cast Your Vote</h4>
                <span className="text-sm text-gray-500">
                  Voting Power: <strong>{formatNumber(votingPower)}</strong>
                </span>
              </div>

              {votingPower <= 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
                  You need to own tokens for this property to vote on proposals.
                </div>
              ) : (
                <>
                  {/* Vote Options */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedVote(1)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 1
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">👍</span>
                      <span className={`font-medium ${selectedVote === 1 ? 'text-green-600' : 'text-gray-700'}`}>
                        For
                      </span>
                    </button>

                    <button
                      onClick={() => setSelectedVote(2)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 2
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">👎</span>
                      <span className={`font-medium ${selectedVote === 2 ? 'text-red-600' : 'text-gray-700'}`}>
                        Against
                      </span>
                    </button>

                    <button
                      onClick={() => setSelectedVote(0)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 0
                          ? 'border-gray-500 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1 block">🤷</span>
                      <span className={`font-medium ${selectedVote === 0 ? 'text-gray-600' : 'text-gray-700'}`}>
                        Abstain
                      </span>
                    </button>
                  </div>

                  {/* Reason (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your reasoning..."
                    />
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                      {success}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleVote}
                    disabled={selectedVote === null || loading || isPending}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    {loading || isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting Vote...
                      </span>
                    ) : (
                      `Vote ${selectedVote !== null ? getVoteOptionLabel(selectedVote) : ''}`
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Not Connected */}
      {!isConnected && isVotingActive && (
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-2">Connect your wallet to vote on this proposal</p>
          </div>
        </div>
      )}

      {/* Voting Ended */}
      {!isVotingActive && (
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600">
              Voting has ended. Final result: {' '}
              <strong className={forPercentage >= 50 ? 'text-green-600' : 'text-red-600'}>
                {forPercentage >= 50 ? 'Passed' : 'Rejected'}
              </strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
