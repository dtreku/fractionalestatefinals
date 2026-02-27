'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatEther, formatUSD, formatPercent, formatAddress } from '@/lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  TrendingUp, 
  Users, 
  Clock, 
  FileText, 
  Vote, 
  DollarSign,
  Shield,
  Calendar,
  Wallet,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Mock property data - in production this would come from contract/database
const MOCK_PROPERTY = {
  id: '1',
  name: 'Sunset Boulevard Luxury Apartments',
  description: 'A premier 24-unit luxury apartment complex located in the heart of Los Angeles. This Class A property features modern amenities, underground parking, rooftop terrace, and has maintained 98% occupancy over the past 3 years. The property generates consistent rental income with long-term leases from high-quality tenants.',
  type: 'Residential',
  location: {
    address: '8500 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90069',
    country: 'USA',
    lat: 34.0928,
    lng: -118.3695
  },
  details: {
    sqft: 32000,
    bedrooms: 48,
    bathrooms: 48,
    yearBuilt: 2019,
    units: 24,
    parkingSpaces: 36,
    amenities: ['Pool', 'Gym', 'Rooftop Terrace', 'Concierge', 'Underground Parking', 'EV Charging']
  },
  financials: {
    totalValue: 12500000,
    totalShares: 10000,
    pricePerShare: 1250,
    sharesAvailable: 3500,
    fundingProgress: 65,
    annualYield: 8.2,
    monthlyRent: 85000,
    occupancyRate: 98,
    capRate: 5.8,
    platformFee: 2.5
  },
  timeline: {
    listingDate: '2024-01-15',
    fundingDeadline: '2024-06-15',
    firstDividend: '2024-07-01'
  },
  documents: [
    { name: 'Property Prospectus', type: 'PDF', size: '2.4 MB', url: '#' },
    { name: 'Financial Statements', type: 'PDF', size: '1.8 MB', url: '#' },
    { name: 'Inspection Report', type: 'PDF', size: '3.2 MB', url: '#' },
    { name: 'Title & Deed', type: 'PDF', size: '0.9 MB', url: '#' },
    { name: 'Insurance Certificate', type: 'PDF', size: '0.5 MB', url: '#' }
  ],
  gallery: [
    '/images/property-1.jpg',
    '/images/property-2.jpg',
    '/images/property-3.jpg',
    '/images/property-4.jpg'
  ],
  recentProposals: [
    { id: '1', title: 'Q2 Dividend Distribution', status: 'Active', votes: { for: 65, against: 12 } },
    { id: '2', title: 'Rooftop Solar Installation', status: 'Succeeded', votes: { for: 78, against: 8 } }
  ],
  investorCount: 156,
  contractAddress: '0x1234...5678'
};

export default function PropertyDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'governance'>('overview');

  const property = MOCK_PROPERTY;
  const shareAmount = parseInt(sharesToBuy) || 0;
  const totalCost = shareAmount * property.financials.pricePerShare;
  const platformFee = totalCost * (property.financials.platformFee / 100);
  const totalWithFee = totalCost + platformFee;

  const handleInvest = async () => {
    if (shareAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid number of shares',
        variant: 'destructive'
      });
      return;
    }

    if (shareAmount > property.financials.sharesAvailable) {
      toast({
        title: 'Insufficient shares',
        description: `Only ${property.financials.sharesAvailable} shares available`,
        variant: 'destructive'
      });
      return;
    }

    setIsInvesting(true);
    
    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Investment successful!',
      description: `You purchased ${shareAmount} shares for ${formatUSD(totalWithFee)}`
    });
    
    setIsInvesting(false);
    setSharesToBuy('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/properties" 
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-slate-700">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {property.type}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Funding Open
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {property.name}
                </h1>
                <div className="flex items-center text-slate-300">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.location.address}, {property.location.city}, {property.location.state}
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-slate-400 text-sm">Property Value</p>
                <p className="text-2xl font-bold text-white">{formatUSD(property.financials.totalValue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-700 pb-2">
              {(['overview', 'financials', 'documents', 'governance'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Property Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 leading-relaxed">{property.description}</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Square Footage</p>
                        <p className="text-white font-semibold">{property.details.sqft.toLocaleString()} sq ft</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Units</p>
                        <p className="text-white font-semibold">{property.details.units}</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Year Built</p>
                        <p className="text-white font-semibold">{property.details.yearBuilt}</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Parking Spaces</p>
                        <p className="text-white font-semibold">{property.details.parkingSpaces}</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Occupancy Rate</p>
                        <p className="text-white font-semibold">{property.financials.occupancyRate}%</p>
                      </div>
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Monthly Rent</p>
                        <p className="text-white font-semibold">{formatUSD(property.financials.monthlyRent)}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-slate-400 text-sm mb-3">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {property.details.amenities.map((amenity) => (
                          <Badge 
                            key={amenity} 
                            variant="outline" 
                            className="border-slate-600 text-slate-300"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                      <p className="text-slate-400">Map Integration (Google Maps / Mapbox)</p>
                    </div>
                    <p className="text-slate-300 mt-4">
                      {property.location.address}<br />
                      {property.location.city}, {property.location.state} {property.location.zipCode}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financials Tab */}
            {activeTab === 'financials' && (
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Investment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{property.financials.annualYield}%</p>
                        <p className="text-slate-400 text-sm">Annual Yield</p>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Building2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{property.financials.capRate}%</p>
                        <p className="text-slate-400 text-sm">Cap Rate</p>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{property.investorCount}</p>
                        <p className="text-slate-400 text-sm">Investors</p>
                      </div>
                      <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                        <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-white">{formatUSD(property.financials.monthlyRent)}</p>
                        <p className="text-slate-400 text-sm">Monthly Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue Projection</CardTitle>
                    <CardDescription className="text-slate-400">
                      Estimated returns based on current performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">Per Share (Annual)</span>
                        <span className="text-white font-semibold">
                          {formatUSD(property.financials.pricePerShare * (property.financials.annualYield / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">10 Shares (Annual)</span>
                        <span className="text-white font-semibold">
                          {formatUSD(10 * property.financials.pricePerShare * (property.financials.annualYield / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300">100 Shares (Annual)</span>
                        <span className="text-white font-semibold">
                          {formatUSD(100 * property.financials.pricePerShare * (property.financials.annualYield / 100))}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-4">
                      * Projections based on historical performance. Past returns do not guarantee future results.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Fee Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Platform Fee</span>
                        <span className="text-white">{property.financials.platformFee}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Management Fee</span>
                        <span className="text-white">1.0% annually</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Exit Fee</span>
                        <span className="text-white">0.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Property Documents</CardTitle>
                  <CardDescription className="text-slate-400">
                    Review all legal and financial documents before investing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {property.documents.map((doc, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{doc.name}</p>
                            <p className="text-slate-400 text-sm">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Governance Tab */}
            {activeTab === 'governance' && (
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Vote className="w-5 h-5" />
                      Active Proposals
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Vote on property decisions as a token holder
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {property.recentProposals.map((proposal) => (
                        <div 
                          key={proposal.id}
                          className="p-4 bg-slate-700/50 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-white font-medium">{proposal.title}</p>
                              <Badge 
                                className={
                                  proposal.status === 'Active' 
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }
                              >
                                {proposal.status}
                              </Badge>
                            </div>
                            {proposal.status === 'Active' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Vote Now
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-emerald-400">For: {proposal.votes.for}%</span>
                                <span className="text-red-400">Against: {proposal.votes.against}%</span>
                              </div>
                              <Progress value={proposal.votes.for} className="h-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/governance">
                      <Button variant="outline" className="w-full mt-4 border-slate-600">
                        View All Proposals
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Governance Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-slate-300">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <p>1 share = 1 vote on all property decisions</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <p>Proposals require 25% quorum to pass</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <p>7-day voting period for standard proposals</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <p>Vote on renovations, management, and distributions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar - Investment Panel */}
          <div className="space-y-6">
            {/* Investment Card */}
            <Card className="bg-slate-800 border-slate-700 sticky top-4">
              <CardHeader>
                <CardTitle className="text-white">Invest in This Property</CardTitle>
                <CardDescription className="text-slate-400">
                  Purchase fractional ownership shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Funding Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Funding Progress</span>
                    <span className="text-white font-medium">{property.financials.fundingProgress}%</span>
                  </div>
                  <Progress value={property.financials.fundingProgress} className="h-3" />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">
                      {formatUSD((property.financials.totalShares - property.financials.sharesAvailable) * property.financials.pricePerShare)} raised
                    </span>
                    <span className="text-slate-400">
                      {formatUSD(property.financials.totalValue)} goal
                    </span>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-400">{property.financials.annualYield}%</p>
                    <p className="text-slate-400 text-sm">Est. Annual Yield</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-white">{formatUSD(property.financials.pricePerShare)}</p>
                    <p className="text-slate-400 text-sm">Per Share</p>
                  </div>
                </div>

                {/* Shares Available */}
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-400">Shares Available</span>
                  <span className="text-white font-semibold">
                    {property.financials.sharesAvailable.toLocaleString()} / {property.financials.totalShares.toLocaleString()}
                  </span>
                </div>

                {/* Investment Input */}
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Number of Shares</label>
                  <Input
                    type="number"
                    placeholder="Enter shares to buy"
                    value={sharesToBuy}
                    onChange={(e) => setSharesToBuy(e.target.value)}
                    min="1"
                    max={property.financials.sharesAvailable}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Cost Breakdown */}
                {shareAmount > 0 && (
                  <div className="space-y-2 p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Shares ({shareAmount})</span>
                      <span className="text-white">{formatUSD(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Platform Fee ({property.financials.platformFee}%)</span>
                      <span className="text-white">{formatUSD(platformFee)}</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2 flex justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-white font-bold">{formatUSD(totalWithFee)}</span>
                    </div>
                  </div>
                )}

                {/* Invest Button */}
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                  onClick={handleInvest}
                  disabled={isInvesting || shareAmount <= 0}
                >
                  {isInvesting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      {shareAmount > 0 ? `Invest ${formatUSD(totalWithFee)}` : 'Enter Amount to Invest'}
                    </>
                  )}
                </Button>

                {/* Deadline */}
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Funding deadline: {new Date(property.timeline.fundingDeadline).toLocaleDateString()}</span>
                </div>

                {/* Compliance Notice */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-400 font-medium">SEC Compliant</p>
                      <p className="text-slate-400">
                        This offering is compliant with Regulation D/A+ securities requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Contract</span>
                    <span className="text-blue-400 text-sm font-mono">{property.contractAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Network</span>
                    <Badge variant="outline" className="border-slate-600">Sepolia</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Token Standard</span>
                    <span className="text-white text-sm">ERC-1155</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
