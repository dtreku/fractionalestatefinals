// frontend/app/governance/[id]/page.tsx
// ============================================================================
// PROPOSAL DETAIL PAGE
// Shows individual proposal details, voting, and results
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  getUserByWallet, 
  getUserPropertyHolding, 
  castVote, 
  getUserVote 
} from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/contracts';
import type { Proposal, Vote, Property } from '@/lib/supabase';
import {
  ArrowLeft,
  Vote as VoteIcon,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Users,
  Building2,
  Calendar,
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Scale
} from 'lucide-react';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROPOSAL: Proposal & { property?: Property } = {
  id: 'mock-proposal-1',
  property_id: 'mock-1',
  proposal_number: 1,
  title: 'Q2 2024 Dividend Distribution',
  description: `This proposal seeks approval for the Q2 2024 dividend distribution to all token holders of Sunset Tower Apartments.

**Distribution Details:**
- Total Amount: $85,000
- Per Token: $8.50
- Record Date: June 30, 2024
- Payment Date: July 15, 2024

**Rationale:**
The property has maintained 98% occupancy and collected all rent payments for Q2. After operating expenses and management fees, we have $85,000 available for distribution.

**Voting:**
- Vote FOR to approve the distribution
- Vote AGAINST to hold funds for property improvements
- ABSTAIN if you have no preference

This proposal requires a simple majority (>50%) to pass with a minimum 25% quorum.`,
  proposal_type: 'distribution',
  created_at: '2024-06-01T10:00:00Z',
  voting_start: '2024-06-01T10:00:00Z',
  voting_end: '2024-06-08T10:00:00Z',
  status: 'active',
  for_votes: 4250,
  against_votes: 750,
  abstain_votes: 500,
  total_voters: 156,
  quorum_required: 2500,
  proposer_id: 'user-1',
  proposer_address: '0x1234...5678',
  property: {
    id: 'mock-1',
    property_id: 'PROP001',
    name: 'Sunset Tower Apartments',
    symbol: 'STA',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    total_valuation: 12500000,
    total_tokens: 10000,
    status: 'active',
    property_type: 'residential',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
};

const MOCK_VOTES: Array<Vote & { user?: { wallet_address: string } }> = [
  {
    id: 'vote-1',
    proposal_id: 'mock-proposal-1',
    user_id: 'user-1',
    vote_option: 1,
    weight: 500,
    reason: 'Strong Q2 performance deserves reward to investors.',
    voted_at: '2024-06-02T14:30:00Z',
    user: { wallet_address: '0xabc1...def1' },
  },
  {
    id: 'vote-2',
    proposal_id: 'mock-proposal-1',
    user_id: 'user-2',
    vote_option: 1,
    weight: 250,
    reason: 'Consistent dividends build investor confidence.',
    voted_at: '2024-06-02T16:45:00Z',
    user: { wallet_address: '0xabc2...def2' },
  },
  {
    id: 'vote-3',
    proposal_id: 'mock-proposal-1',
    user_id: 'user-3',
    vote_option: 2,
    weight: 100,
    reason: 'Would prefer to see funds used for solar panel installation.',
    voted_at: '2024-06-03T09:15:00Z',
    user: { wallet_address: '0xabc3...def3' },
  },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params?.id as string;
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // State
  const [proposal, setProposal] = useState<(Proposal & { property?: Property }) | null>(null);
  const [votes, setVotes] = useState<Array<Vote & { user?: { wallet_address: string } }>>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [userHolding, setUserHolding] = useState<{ token_balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [voteReason, setVoteReason] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  // Load data
  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  useEffect(() => {
    if (address && proposal) {
      loadUserData();
    }
  }, [address, proposal]);

  const loadProposal = async () => {
    setLoading(true);
    setUsingMockData(false);

    try {
      // Fetch proposal with property details
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select(`
          *,
          properties (*)
        `)
        .eq('id', proposalId)
        .single();

      if (proposalError || !proposalData) {
        console.log('Proposal not found, using mock data');
        setProposal(MOCK_PROPOSAL);
        setVotes(MOCK_VOTES);
        setUsingMockData(true);
      } else {
        setProposal({
          ...proposalData,
          property: proposalData.properties,
        });

        // Fetch votes
        const { data: votesData } = await supabase
          .from('votes')
          .select(`
            *,
            users (wallet_address)
          `)
          .eq('proposal_id', proposalId)
          .order('voted_at', { ascending: false })
          .limit(20);

        setVotes(votesData?.map(v => ({ ...v, user: v.users })) || []);
      }
    } catch (err) {
      console.error('Error loading proposal:', err);
      setProposal(MOCK_PROPOSAL);
      setVotes(MOCK_VOTES);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!address || !proposal) return;

    try {
      const user = await getUserByWallet(address);
      if (user) {
        // Check if user already voted
        const existingVote = await getUserVote(proposal.id, user.id);
        setUserVote(existingVote);

        // Get user's token balance for this property
        if (proposal.property_id) {
          const holding = await getUserPropertyHolding(user.id, proposal.property_id);
          setUserHolding(holding);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  const handleVote = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to vote',
        variant: 'destructive',
      });
      return;
    }

    if (selectedVote === null) {
      toast({
        title: 'Select Vote',
        description: 'Please select For, Against, or Abstain',
        variant: 'destructive',
      });
      return;
    }

    if (!userHolding || userHolding.token_balance <= 0) {
      toast({
        title: 'No Voting Power',
        description: 'You need to own tokens in this property to vote',
        variant: 'destructive',
      });
      return;
    }

    if (userVote) {
      toast({
        title: 'Already Voted',
        description: 'You have already voted on this proposal',
        variant: 'destructive',
      });
      return;
    }

    setIsVoting(true);

    try {
      if (usingMockData) {
        // Simulate vote for demo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setUserVote({
          id: 'new-vote',
          proposal_id: proposal!.id,
          user_id: 'current-user',
          vote_option: selectedVote,
          weight: userHolding.token_balance,
          reason: voteReason,
          voted_at: new Date().toISOString(),
        });

        toast({
          title: '✅ Vote Submitted!',
          description: `Your vote has been recorded with ${userHolding.token_balance} voting power`,
        });
      } else {
        const user = await getUserByWallet(address);
        if (!user) throw new Error('User not found');

        const vote = await castVote({
          proposalId: proposal!.id,
          userId: user.id,
          voteOption: selectedVote,
          weight: userHolding.token_balance,
          reason: voteReason,
        });

        if (vote) {
          setUserVote(vote);
          toast({
            title: '✅ Vote Submitted!',
            description: `Your vote has been recorded with ${userHolding.token_balance} voting power`,
          });
          loadProposal(); // Refresh vote counts
        } else {
          throw new Error('Failed to cast vote');
        }
      }
    } catch (error: any) {
      console.error('Voting error:', error);
      toast({
        title: 'Voting Failed',
        description: error.message || 'Failed to submit vote',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'passed':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'executed':
        return <Badge className="bg-purple-100 text-purple-800">Executed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getVoteOptionLabel = (option: number) => {
    switch (option) {
      case 1: return 'For';
      case 2: return 'Against';
      case 0: return 'Abstain';
      default: return 'Unknown';
    }
  };

  const getVoteOptionIcon = (option: number) => {
    switch (option) {
      case 1: return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 2: return <ThumbsDown className="w-4 h-4 text-red-600" />;
      case 0: return <MinusCircle className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const totalVotes = (proposal?.for_votes || 0) + (proposal?.against_votes || 0) + (proposal?.abstain_votes || 0);
  const forPercentage = totalVotes > 0 ? ((proposal?.for_votes || 0) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? ((proposal?.against_votes || 0) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? ((proposal?.abstain_votes || 0) / totalVotes) * 100 : 0;
  const quorumReached = totalVotes >= (proposal?.quorum_required || 0);

  const isVotingOpen = proposal?.status === 'active' && 
    new Date(proposal.voting_end) > new Date();

  const timeRemaining = proposal?.voting_end 
    ? Math.max(0, new Date(proposal.voting_end).getTime() - Date.now())
    : 0;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not found state
  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Proposal Not Found</h2>
              <p className="text-gray-600 mb-4">The requested proposal could not be found.</p>
              <Link href="/governance">
                <Button>Back to Governance</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          href="/governance" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Governance
        </Link>

        {/* Mock Data Banner */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">Demo Proposal</p>
              <p className="text-yellow-700 text-sm">
                Showing sample data for demonstration purposes.
              </p>
            </div>
          </div>
        )}

        {/* Proposal Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(proposal.status)}
                  <Badge variant="outline">{proposal.proposal_type}</Badge>
                  <span className="text-sm text-gray-500">#{proposal.proposal_number}</span>
                </div>
                <CardTitle className="text-2xl">{proposal.title}</CardTitle>
                {proposal.property && (
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Building2 className="w-4 h-4" />
                    {proposal.property.name} • {proposal.property.city}, {proposal.property.state}
                  </CardDescription>
                )}
              </div>
              {isVotingOpen && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {daysRemaining}d {hoursRemaining}h remaining
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {proposal.description?.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vote Results */}
            <Card>
              <CardHeader>
                <CardTitle>Current Results</CardTitle>
                <CardDescription>
                  {proposal.total_voters} voters • {formatNumber(totalVotes)} votes cast
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* For */}
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="font-medium">For</span>
                    </div>
                    <span className="text-green-600 font-medium">
                      {formatNumber(proposal.for_votes || 0)} ({forPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={forPercentage} className="h-3 bg-gray-200" />
                </div>

                {/* Against */}
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="font-medium">Against</span>
                    </div>
                    <span className="text-red-600 font-medium">
                      {formatNumber(proposal.against_votes || 0)} ({againstPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={againstPercentage} className="h-3 bg-gray-200" />
                </div>

                {/* Abstain */}
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MinusCircle className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">Abstain</span>
                    </div>
                    <span className="text-gray-600 font-medium">
                      {formatNumber(proposal.abstain_votes || 0)} ({abstainPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={abstainPercentage} className="h-3 bg-gray-200" />
                </div>

                {/* Quorum */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quorum Required</span>
                    <div className="flex items-center gap-2">
                      {quorumReached ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={quorumReached ? 'text-green-600' : 'text-yellow-600'}>
                        {formatNumber(totalVotes)} / {formatNumber(proposal.quorum_required || 0)}
                        {quorumReached ? ' (Reached)' : ' (Not Reached)'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Votes */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Votes</CardTitle>
              </CardHeader>
              <CardContent>
                {votes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No votes yet</p>
                ) : (
                  <div className="space-y-4">
                    {votes.map((vote) => (
                      <div key={vote.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getVoteOptionIcon(vote.vote_option)}
                            <span className="font-medium">{getVoteOptionLabel(vote.vote_option)}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-sm text-gray-500">
                              {formatNumber(vote.weight)} votes
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(vote.voted_at).toLocaleDateString()}
                          </span>
                        </div>
                        {vote.reason && (
                          <p className="text-gray-600 text-sm mt-2">{vote.reason}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {vote.user?.wallet_address || 'Anonymous'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voting Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <VoteIcon className="w-5 h-5" />
                  Cast Your Vote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Connect wallet to vote</p>
                    <ConnectButton />
                  </div>
                ) : userVote ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                    <p className="font-medium">You already voted</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {getVoteOptionIcon(userVote.vote_option)}
                      <span>{getVoteOptionLabel(userVote.vote_option)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatNumber(userVote.weight)} voting power
                    </p>
                  </div>
                ) : !isVotingOpen ? (
                  <div className="text-center py-4">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="font-medium">Voting has ended</p>
                  </div>
                ) : (
                  <>
                    {/* Voting Power */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Your Voting Power</p>
                      <p className="text-xl font-bold text-blue-700">
                        {userHolding ? formatNumber(userHolding.token_balance) : 0} votes
                      </p>
                    </div>

                    {!userHolding || userHolding.token_balance <= 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                        <p className="text-sm text-gray-600">
                          You need tokens in this property to vote
                        </p>
                        <Link href={`/properties/${proposal.property_id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            Invest to Vote
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Vote Options */}
                        <div className="space-y-2">
                          <Button
                            variant={selectedVote === 1 ? 'default' : 'outline'}
                            className={`w-full justify-start ${selectedVote === 1 ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            onClick={() => setSelectedVote(1)}
                          >
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            Vote For
                          </Button>
                          <Button
                            variant={selectedVote === 2 ? 'default' : 'outline'}
                            className={`w-full justify-start ${selectedVote === 2 ? 'bg-red-600 hover:bg-red-700' : ''}`}
                            onClick={() => setSelectedVote(2)}
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            Vote Against
                          </Button>
                          <Button
                            variant={selectedVote === 0 ? 'default' : 'outline'}
                            className={`w-full justify-start ${selectedVote === 0 ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
                            onClick={() => setSelectedVote(0)}
                          >
                            <MinusCircle className="w-4 h-4 mr-2" />
                            Abstain
                          </Button>
                        </div>

                        {/* Reason */}
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">
                            Reason (optional)
                          </label>
                          <Textarea
                            value={voteReason}
                            onChange={(e) => setVoteReason(e.target.value)}
                            placeholder="Share your reasoning..."
                            rows={3}
                          />
                        </div>

                        {/* Submit */}
                        <Button
                          className="w-full"
                          onClick={handleVote}
                          disabled={isVoting || selectedVote === null}
                        >
                          {isVoting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Vote'
                          )}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Proposal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voting Started</span>
                  <span>{new Date(proposal.voting_start).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voting Ends</span>
                  <span>{new Date(proposal.voting_end).toLocaleDateString()}</span>
                </div>
                {proposal.proposer_address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proposer</span>
                    <span className="font-mono text-sm">{proposal.proposer_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Link */}
            {proposal.property && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Property</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-10 h-10 text-blue-600" />
                      <div>
                        <p className="font-medium">{proposal.property.name}</p>
                        <p className="text-sm text-gray-500">
                          {proposal.property.city}, {proposal.property.state}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/properties/${proposal.property_id}`}>
                    <Button variant="outline" className="w-full mt-3">
                      View Property
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
