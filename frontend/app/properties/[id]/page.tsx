// frontend/app/properties/[id]/page.tsx
// ============================================================================
// PROPERTY DETAIL PAGE
// Shows property details, investment form, financials, documents, and governance
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { getPropertyById, getUserByWallet, getUserHoldings } from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/contracts';
import { Property, InvestorHolding } from '@/lib/supabase';
import InvestmentForm from '@/components/investment/InvestmentForm';
import GovernanceProposals from '@/components/governance/GovernanceProposals';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
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
  Wallet,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Home,
  Calendar,
  Percent,
  Coins
} from 'lucide-react';

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function PropertyDetailPage() {
  // Get property ID from URL
  const params = useParams();
  const propertyId = params?.id as string;
  const { toast } = useToast();

  // State
  const [property, setProperty] = useState<Property | null>(null);
  const [userHolding, setUserHolding] = useState<InvestorHolding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'governance'>('overview');
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  // Wagmi
  const { address, isConnected } = useAccount();

  // Platform fee percentage
  const PLATFORM_FEE_PERCENT = 2.5;

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  useEffect(() => {
    if (address && property) {
      loadUserHolding();
    }
  }, [address, property]);

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from('properties').select('*').limit(1);
      if (error) {
        console.error('Supabase connection failed:', error.message);
      } else {
        console.log('Supabase connected! Data:', data);
      }
    }
    testConnection();
  }, []);

  const loadProperty = async () => {
    setLoading(true);
    setError(null);

    try {
      const propertyData = await getPropertyById(propertyId);
      if (!propertyData) {
        setError('Property not found');
        return;
      }
      setProperty(propertyData);
    } catch (err) {
      console.error('Failed to load property:', err);
      setError('Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  const loadUserHolding = async () => {
    if (!address || !property) return;

    try {
      const user = await getUserByWallet(address);
      if (user) {
        const holdings = await getUserHoldings(user.id);
        const holding = holdings.find((h: InvestorHolding) => h.property_id === property.id);
        setUserHolding(holding || null);
      }
    } catch (err) {
      console.error('Failed to load user holding:', err);
    }
  };

  const handleInvestmentSuccess = () => {
    loadProperty();
    loadUserHolding();
  };

  // ============================================================================
  // INVESTMENT CALCULATIONS
  // ============================================================================

  const shareAmount = parseInt(sharesToBuy) || 0;
  const pricePerShare = property?.token_price || 0;
  const totalCost = shareAmount * pricePerShare;
  const platformFee = totalCost * (PLATFORM_FEE_PERCENT / 100);
  const totalWithFee = totalCost + platformFee;
  const sharesAvailable = property?.tokens_available || 0;

  const handleQuickInvest = async () => {
    if (shareAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid number of shares',
        variant: 'destructive'
      });
      return;
    }

    if (shareAmount > sharesAvailable) {
      toast({
        title: 'Insufficient shares',
        description: `Only ${sharesAvailable} shares available`,
        variant: 'destructive'
      });
      return;
    }

    setIsInvesting(true);
    
    // Simulate transaction - replace with actual contract call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Investment successful!',
      description: `You purchased ${shareAmount} shares for ${formatCurrency(totalWithFee)}`
    });
    
    setIsInvesting(false);
    setSharesToBuy('');
    handleInvestmentSuccess();
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 h-96 bg-gray-200 rounded-xl"></div>
              <div className="h-96 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Link 
            href="/properties" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{error || 'Property not found'}</p>
              <Link href="/properties">
                <Button className="mt-4">Browse Properties</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const soldPercentage = property.total_tokens && property.tokens_available
    ? ((property.total_tokens - property.tokens_available) / property.total_tokens) * 100
    : 0;

  const annualYield = property.cap_rate || 8.0;
  const investorCount = 156; // This would come from your database

  // Mock documents - in production, fetch from database
  const documents = [
    { name: 'Property Prospectus', type: 'PDF', size: '2.4 MB', url: '#' },
    { name: 'Financial Statements', type: 'PDF', size: '1.8 MB', url: '#' },
    { name: 'Inspection Report', type: 'PDF', size: '3.2 MB', url: '#' },
    { name: 'Title & Deed', type: 'PDF', size: '0.9 MB', url: '#' },
    { name: 'Insurance Certificate', type: 'PDF', size: '0.5 MB', url: '#' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/properties" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-20 h-20 text-white/30" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="container mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${
                    property.status === 'active' 
                      ? 'bg-green-500/90 hover:bg-green-500'
                      : property.status === 'offering'
                      ? 'bg-blue-500/90 hover:bg-blue-500'
                      : 'bg-gray-500/90 hover:bg-gray-500'
                  } text-white border-0`}>
                    {property.status?.toUpperCase() || 'ACTIVE'}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {property.property_type || 'Residential'}
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {property.name}
                </h1>
                <div className="flex items-center text-white/90">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.street_address && `${property.street_address}, `}
                  {property.city}, {property.state}
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Total Valuation</p>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {formatCurrency(property.total_valuation)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Tabs and Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {([
                { key: 'overview', label: 'Overview', icon: Home },
                { key: 'financials', label: 'Financials', icon: TrendingUp },
                { key: 'documents', label: 'Documents', icon: FileText },
                { key: 'governance', label: 'Governance', icon: Vote },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Coins className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{formatCurrency(property.token_price || 0)}</p>
                      <p className="text-sm text-gray-500">Per Share</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{annualYield}%</p>
                      <p className="text-sm text-gray-500">Est. Annual Yield</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{investorCount}</p>
                      <p className="text-sm text-gray-500">Investors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Percent className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold">{property.occupancy_rate || 98}%</p>
                      <p className="text-sm text-gray-500">Occupancy</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Property Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">
                      {property.description || 'A premium investment opportunity in a high-demand location. This property offers stable returns through rental income and potential appreciation. Professional management ensures hassle-free ownership for all investors.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Property Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.square_feet && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Square Footage</p>
                          <p className="font-semibold">{formatNumber(property.square_feet)} sq ft</p>
                        </div>
                      )}
                      {property.bedrooms && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Bedrooms</p>
                          <p className="font-semibold">{property.bedrooms}</p>
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Bathrooms</p>
                          <p className="font-semibold">{property.bathrooms}</p>
                        </div>
                      )}
                      {property.year_built && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Year Built</p>
                          <p className="font-semibold">{property.year_built}</p>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Total Tokens</p>
                        <p className="font-semibold">{formatNumber(property.total_tokens || 0)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Available</p>
                        <p className="font-semibold">{formatNumber(property.tokens_available || 0)}</p>
                      </div>
                    </div>

                    {/* Amenities */}
                    {property.features && (property.features as string[]).length > 0 && (
                      <div className="mt-6">
                        <p className="text-gray-500 text-sm mb-3">Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {(property.features as string[]).map((feature, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center text-gray-400">
                        <MapPin className="w-12 h-12 mx-auto mb-2" />
                        <p>Map Integration</p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {property.street_address && `${property.street_address}, `}
                      {property.city}, {property.state} {property.postal_code}
                      {property.country && `, ${property.country}`}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Financials Tab */}
            {activeTab === 'financials' && (
              <div className="space-y-6">
                {/* Investment Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">{annualYield}%</p>
                        <p className="text-gray-500 text-sm">Annual Yield</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{property.cap_rate || 5.8}%</p>
                        <p className="text-gray-500 text-sm">Cap Rate</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-600">{investorCount}</p>
                        <p className="text-gray-500 text-sm">Investors</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <DollarSign className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(property.annual_rent_income ? property.annual_rent_income / 12 : 85000)}
                        </p>
                        <p className="text-gray-500 text-sm">Monthly Revenue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Projection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Projection</CardTitle>
                    <CardDescription>
                      Estimated returns based on current performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Per Share (Annual)</span>
                        <span className="font-semibold">
                          {formatCurrency(pricePerShare * (annualYield / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">10 Shares (Annual)</span>
                        <span className="font-semibold">
                          {formatCurrency(10 * pricePerShare * (annualYield / 100))}
                        </span>
                      </div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">100 Shares (Annual)</span>
                        <span className="font-semibold">
                          {formatCurrency(100 * pricePerShare * (annualYield / 100))}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-4">
                      * Projections based on historical performance. Past returns do not guarantee future results.
                    </p>
                  </CardContent>
                </Card>

                {/* Fee Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Platform Fee</span>
                        <span className="font-medium">{PLATFORM_FEE_PERCENT}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Management Fee</span>
                        <span className="font-medium">{property.management_fee_percent || 1.0}% annually</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Exit Fee</span>
                        <span className="font-medium">0.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Total Valuation</p>
                        <p className="text-xl font-semibold">{formatCurrency(property.total_valuation)}</p>
                      </div>
                      {property.annual_rent_income && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Annual Rent Income</p>
                          <p className="text-xl font-semibold">{formatCurrency(property.annual_rent_income)}</p>
                        </div>
                      )}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Min Investment</p>
                        <p className="text-xl font-semibold">{formatCurrency(property.minimum_investment || pricePerShare)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Token Price</p>
                        <p className="text-xl font-semibold">{formatCurrency(pricePerShare)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Documents</CardTitle>
                  <CardDescription>
                    Review all legal and financial documents before investing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map((doc, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-gray-500 text-sm">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
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
                <GovernanceProposals property={property} />
                
                {/* Governance Rights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Governance Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <p className="text-gray-600">1 share = 1 vote on all property decisions</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <p className="text-gray-600">Proposals require 25% quorum to pass</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <p className="text-gray-600">7-day voting period for standard proposals</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <p className="text-gray-600">Vote on renovations, management, and distributions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Investment Panel */}
          <div className="space-y-6">
            {/* Investment Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Invest in This Property</CardTitle>
                <CardDescription>
                  Purchase fractional ownership shares
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Funding Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Funding Progress</span>
                    <span className="font-medium">{soldPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={soldPercentage} className="h-3" />
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">
                      {formatCurrency((property.total_tokens! - property.tokens_available!) * pricePerShare)} raised
                    </span>
                    <span className="text-gray-500">
                      {formatCurrency(property.total_valuation)} goal
                    </span>
                  </div>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{annualYield}%</p>
                    <p className="text-gray-500 text-sm">Est. Annual Yield</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(pricePerShare)}</p>
                    <p className="text-gray-500 text-sm">Per Share</p>
                  </div>
                </div>

                {/* Shares Available */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-500">Shares Available</span>
                  <span className="font-semibold">
                    {formatNumber(sharesAvailable)} / {formatNumber(property.total_tokens || 0)}
                  </span>
                </div>

                {/* User Holding */}
                {userHolding && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Your Investment</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        {formatNumber(userHolding.token_balance)} shares
                      </span>
                      <span className="text-gray-600">
                        ({(userHolding.ownership_percentage || 0).toFixed(4)}% ownership)
                      </span>
                    </div>
                  </div>
                )}

                {/* Investment Input */}
                <div>
                  <label className="text-gray-500 text-sm mb-2 block">Number of Shares</label>
                  <Input
                    type="number"
                    placeholder="Enter shares to buy"
                    value={sharesToBuy}
                    onChange={(e) => setSharesToBuy(e.target.value)}
                    min="1"
                    max={sharesAvailable}
                    className="text-lg"
                  />
                </div>

                {/* Cost Breakdown */}
                {shareAmount > 0 && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shares ({shareAmount})</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-blue-600">{formatCurrency(totalWithFee)}</span>
                    </div>
                  </div>
                )}

                {/* Invest Button */}
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleQuickInvest}
                  disabled={isInvesting || shareAmount <= 0 || !isConnected}
                >
                  {isInvesting ? (
                    <>Processing...</>
                  ) : !isConnected ? (
                    <>Connect Wallet to Invest</>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      {shareAmount > 0 ? `Invest ${formatCurrency(totalWithFee)}` : 'Enter Amount'}
                    </>
                  )}
                </Button>

                {/* Timeline */}
                {property.offering_end && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Funding deadline: {new Date(property.offering_end).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Compliance Notice */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-700 font-medium">SEC Compliant</p>
                      <p className="text-gray-600">
                        This offering is compliant with Regulation D/A+ securities requirements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {property.token_address && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Contract</span>
                      <a 
                        href={`https://sepolia.etherscan.io/address/${property.token_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm font-mono hover:underline"
                      >
                        {property.token_address.slice(0, 6)}...{property.token_address.slice(-4)}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Network</span>
                    <Badge variant="outline">Sepolia</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Token Standard</span>
                    <span className="text-sm">ERC-1155</span>
                  </div>
                  {property.property_id && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Property ID</span>
                      <span className="text-sm font-mono">{property.property_id}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-gray-500">Listed</p>
                      <p className="font-medium">{new Date(property.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {property.offering_start && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-gray-500">Offering Start</p>
                        <p className="font-medium">{new Date(property.offering_start).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {property.offering_end && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-gray-500">Offering End</p>
                        <p className="font-medium">{new Date(property.offering_end).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
