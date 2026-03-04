'use client';

import { Navbar } from '@/components/layout/navbar';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatAddress, formatDate } from '@/lib/utils';
import {
  Vote,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Filter,
  Plus,
  Building2,
  AlertCircle,
  Calendar,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  TrendingUp
} from 'lucide-react';

// Mock proposals data
const MOCK_PROPOSALS = [
  {
    id: '1',
    propertyId: '1',
    propertyName: 'Sunset Boulevard Luxury Apartments',
    title: 'Q2 2024 Dividend Distribution',
    description: 'Proposal to distribute Q2 rental income to all token holders. Total distribution amount: $42,500 (approximately $4.25 per share).',
    proposalType: 'Distribution',
    status: 'Active',
    proposer: '0x1234...5678',
    createdAt: '2024-02-10',
    votingEnds: '2024-02-17',
    votes: {
      for: 6500,
      against: 1200,
      abstain: 800,
      total: 10000,
      quorumReached: true
    },
    hasVoted: false
  },
  {
    id: '2',
    propertyId: '1',
    propertyName: 'Sunset Boulevard Luxury Apartments',
    title: 'Rooftop Solar Panel Installation',
    description: 'Install solar panels on the rooftop to reduce energy costs by an estimated 40%. Total cost: $125,000 from property reserves.',
    proposalType: 'Renovation',
    status: 'Active',
    proposer: '0xabcd...efgh',
    createdAt: '2024-02-12',
    votingEnds: '2024-02-19',
    votes: {
      for: 4200,
      against: 2100,
      abstain: 500,
      total: 10000,
      quorumReached: false
    },
    hasVoted: true,
    userVote: 'for'
  },
  {
    id: '3',
    propertyId: '2',
    propertyName: 'Miami Beach Commercial Plaza',
    title: 'Property Management Change',
    description: 'Proposal to switch property management company from Current PM to Elite Property Management due to better fee structure (1.5% vs 2%).',
    proposalType: 'Management',
    status: 'Succeeded',
    proposer: '0x9876...5432',
    createdAt: '2024-01-20',
    votingEnds: '2024-01-27',
    executedAt: '2024-01-29',
    votes: {
      for: 7800,
      against: 800,
      abstain: 400,
      total: 10000,
      quorumReached: true
    },
    hasVoted: true,
    userVote: 'for'
  },
  {
    id: '4',
    propertyId: '3',
    propertyName: 'Chicago Industrial Warehouse',
    title: 'Emergency Roof Repair',
    description: 'Urgent repairs needed after storm damage. Estimated cost: $35,000. Requires immediate approval under emergency provisions.',
    proposalType: 'Emergency',
    status: 'Executed',
    proposer: '0x5555...6666',
    createdAt: '2024-02-01',
    votingEnds: '2024-02-03',
    executedAt: '2024-02-04',
    votes: {
      for: 8500,
      against: 200,
      abstain: 100,
      total: 10000,
      quorumReached: true
    },
    hasVoted: true,
    userVote: 'for'
  },
  {
    id: '5',
    propertyId: '2',
    propertyName: 'Miami Beach Commercial Plaza',
    title: 'Tenant Lease Modification',
    description: 'Approve modified lease terms for anchor tenant requesting 2-year extension with 3% annual rent increase.',
    proposalType: 'General',
    status: 'Defeated',
    proposer: '0x7777...8888',
    createdAt: '2024-01-10',
    votingEnds: '2024-01-17',
    votes: {
      for: 3200,
      against: 5100,
      abstain: 700,
      total: 10000,
      quorumReached: true
    },
    hasVoted: true,
    userVote: 'against'
  }
];

const PROPOSAL_TYPES = ['All Types', 'General', 'Renovation', 'Management', 'Sale', 'Distribution', 'Emergency'];
const STATUS_FILTERS = ['All Status', 'Active', 'Succeeded', 'Defeated', 'Executed', 'Cancelled'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Succeeded': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Executed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Defeated': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const getProposalTypeColor = (type: string) => {
  switch (type) {
    case 'Distribution': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Renovation': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'Management': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'Emergency': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Sale': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

export default function GovernancePage() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [votingProposal, setVotingProposal] = useState<string | null>(null);

  const filteredProposals = MOCK_PROPOSALS.filter(proposal => {
    const matchesType = typeFilter === 'All Types' || proposal.proposalType === typeFilter;
    const matchesStatus = statusFilter === 'All Status' || proposal.status === statusFilter;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          proposal.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const activeProposals = MOCK_PROPOSALS.filter(p => p.status === 'Active');
  const userVotingPower = 150; // Mock user's total voting power

  const handleVote = async (proposalId: string, support: 'for' | 'against' | 'abstain') => {
    setVotingProposal(proposalId);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Vote submitted!',
      description: `Your vote has been recorded on the blockchain.`
    });
    
    setVotingProposal(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Governance</h1>
            <p className="text-slate-400">Vote on property decisions and manage proposals</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Proposal
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Vote className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeProposals.length}</p>
                  <p className="text-slate-400 text-sm">Active Proposals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{userVotingPower}</p>
                  <p className="text-slate-400 text-sm">Your Voting Power</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {MOCK_PROPOSALS.filter(p => p.status === 'Executed').length}
                  </p>
                  <p className="text-slate-400 text-sm">Executed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">25%</p>
                  <p className="text-slate-400 text-sm">Quorum Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Votes Alert */}
        {activeProposals.filter(p => !p.hasVoted).length > 0 && (
          <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                <p className="text-blue-400">
                  You have {activeProposals.filter(p => !p.hasVoted).length} active proposal(s) waiting for your vote.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Proposal Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PROPOSAL_TYPES.map(type => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUS_FILTERS.map(status => (
                    <SelectItem key={status} value={status} className="text-white hover:bg-slate-700">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Proposal Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status}
                      </Badge>
                      <Badge className={getProposalTypeColor(proposal.proposalType)}>
                        {proposal.proposalType}
                      </Badge>
                      {proposal.hasVoted && (
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          Voted: {proposal.userVote}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">
                      {proposal.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <Building2 className="w-4 h-4" />
                      <span>{proposal.propertyName}</span>
                    </div>

                    <p className="text-slate-300 text-sm mb-4">
                      {proposal.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>Proposed by:</span>
                        <span className="text-blue-400 font-mono">{proposal.proposer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(proposal.createdAt)}</span>
                      </div>
                      {proposal.status === 'Active' && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Clock className="w-4 h-4" />
                          <span>Ends {formatDate(proposal.votingEnds)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voting Section */}
                  <div className="lg:w-80 space-y-4">
                    {/* Vote Counts */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            For
                          </span>
                          <span className="text-white">
                            {((proposal.votes.for / proposal.votes.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(proposal.votes.for / proposal.votes.total) * 100} 
                          className="h-2 bg-slate-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-red-400 flex items-center gap-1">
                            <ThumbsDown className="w-4 h-4" />
                            Against
                          </span>
                          <span className="text-white">
                            {((proposal.votes.against / proposal.votes.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(proposal.votes.against / proposal.votes.total) * 100} 
                          className="h-2 bg-slate-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MinusCircle className="w-4 h-4" />
                            Abstain
                          </span>
                          <span className="text-white">
                            {((proposal.votes.abstain / proposal.votes.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(proposal.votes.abstain / proposal.votes.total) * 100} 
                          className="h-2 bg-slate-700"
                        />
                      </div>
                    </div>

                    {/* Quorum Status */}
                    <div className={`flex items-center gap-2 text-sm ${
                      proposal.votes.quorumReached ? 'text-emerald-400' : 'text-yellow-400'
                    }`}>
                      {proposal.votes.quorumReached ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Quorum reached</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Quorum not reached</span>
                        </>
                      )}
                    </div>

                    {/* Vote Buttons */}
                    {proposal.status === 'Active' && !proposal.hasVoted && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleVote(proposal.id, 'for')}
                          disabled={votingProposal === proposal.id}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          For
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleVote(proposal.id, 'against')}
                          disabled={votingProposal === proposal.id}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Against
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-600"
                          onClick={() => handleVote(proposal.id, 'abstain')}
                          disabled={votingProposal === proposal.id}
                        >
                          <MinusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* View Details */}
                    <Link href={`/governance/${proposal.id}`}>
                      <Button variant="outline" size="sm" className="w-full border-slate-600">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Vote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No proposals found</h3>
              <p className="text-slate-400">
                Try adjusting your filters or create a new proposal.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Governance Info */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">How Governance Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-400">1</span>
                </div>
                <h4 className="text-white font-medium mb-1">Create Proposal</h4>
                <p className="text-slate-400 text-sm">
                  Any token holder can submit a proposal for property decisions.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-400">2</span>
                </div>
                <h4 className="text-white font-medium mb-1">Voting Period</h4>
                <p className="text-slate-400 text-sm">
                  7-day voting period (3 days for emergency proposals).
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-400">3</span>
                </div>
                <h4 className="text-white font-medium mb-1">Reach Quorum</h4>
                <p className="text-slate-400 text-sm">
                  25% of total shares must vote for the proposal to be valid.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-400">4</span>
                </div>
                <h4 className="text-white font-medium mb-1">Execution</h4>
                <p className="text-slate-400 text-sm">
                  Passed proposals are executed after a 2-day timelock.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
