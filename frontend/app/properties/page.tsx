// frontend/app/properties/page.tsx
// ============================================================================
// PROPERTIES LISTING PAGE
// Browse and filter tokenized real estate opportunities
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, TrendingUp, Clock, Search, Grid, List, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navbar } from '@/components/layout/navbar';
import { supabase } from '@/lib/supabase';
import { Property } from '@/lib/supabase';
import { formatCurrency, formatNumber } from '@/lib/contracts';

// ============================================================================
// MOCK DATA FALLBACK
// Used when Supabase is unavailable or returns no data
// ============================================================================
const MOCK_PROPERTIES: Property[] = [
  {
    id: 'mock-1',
    name: 'Sunset Tower Apartments',
    description: 'A premier 24-unit luxury apartment complex in the heart of Los Angeles with modern amenities and high occupancy rates.',
    property_type: 'Residential',
    status: 'active',
    street_address: '8500 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    postal_code: '90069',
    country: 'USA',
    total_valuation: 12500000,
    token_price: 1250,
    total_tokens: 10000,
    tokens_available: 3500,
    cap_rate: 8.2,
    annual_rent_income: 1020000,
    occupancy_rate: 98,
    square_feet: 32000,
    year_built: 2019,
    bedrooms: 48,
    bathrooms: 48,
    minimum_investment: 1250,
    offering_start: '2024-01-15',
    offering_end: '2024-06-15',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'mock-2',
    name: 'Ocean View Residences',
    description: 'Beachfront luxury condominiums with stunning ocean views and resort-style amenities.',
    property_type: 'Residential',
    status: 'active',
    street_address: '1200 Ocean Drive',
    city: 'Miami',
    state: 'FL',
    postal_code: '33139',
    country: 'USA',
    total_valuation: 18500000,
    token_price: 1850,
    total_tokens: 10000,
    tokens_available: 2000,
    cap_rate: 9.2,
    annual_rent_income: 1702000,
    occupancy_rate: 96,
    square_feet: 45000,
    year_built: 2021,
    bedrooms: 36,
    bathrooms: 40,
    minimum_investment: 1850,
    offering_start: '2024-02-01',
    offering_end: '2024-07-01',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'mock-3',
    name: 'Downtown Commercial Hub',
    description: 'Prime commercial office space in Manhattan with long-term corporate tenants.',
    property_type: 'Commercial',
    status: 'funded',
    street_address: '350 Fifth Avenue',
    city: 'New York',
    state: 'NY',
    postal_code: '10118',
    country: 'USA',
    total_valuation: 35000000,
    token_price: 3500,
    total_tokens: 10000,
    tokens_available: 0,
    cap_rate: 7.8,
    annual_rent_income: 2730000,
    occupancy_rate: 100,
    square_feet: 75000,
    year_built: 2015,
    minimum_investment: 3500,
    offering_start: '2023-06-01',
    offering_end: '2024-01-01',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock-4',
    name: 'Tech Park Plaza',
    description: 'Modern tech campus with flexible office spaces, ideal for startups and established tech companies.',
    property_type: 'Commercial',
    status: 'active',
    street_address: '500 Innovation Way',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94107',
    country: 'USA',
    total_valuation: 28000000,
    token_price: 2800,
    total_tokens: 10000,
    tokens_available: 6000,
    cap_rate: 8.0,
    annual_rent_income: 2240000,
    occupancy_rate: 92,
    square_feet: 60000,
    year_built: 2020,
    minimum_investment: 2800,
    offering_start: '2024-03-01',
    offering_end: '2024-09-01',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'mock-5',
    name: 'Lakeside Apartments',
    description: 'Waterfront residential complex with private boat dock access and scenic lake views.',
    property_type: 'Residential',
    status: 'active',
    street_address: '789 Lakeshore Drive',
    city: 'Chicago',
    state: 'IL',
    postal_code: '60611',
    country: 'USA',
    total_valuation: 9500000,
    token_price: 950,
    total_tokens: 10000,
    tokens_available: 4500,
    cap_rate: 8.8,
    annual_rent_income: 836000,
    occupancy_rate: 94,
    square_feet: 28000,
    year_built: 2018,
    bedrooms: 32,
    bathrooms: 32,
    minimum_investment: 950,
    offering_start: '2024-02-15',
    offering_end: '2024-08-15',
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'mock-6',
    name: 'Industrial Warehouse Complex',
    description: 'State-of-the-art logistics and distribution center with excellent highway access.',
    property_type: 'Industrial',
    status: 'active',
    street_address: '2000 Commerce Park',
    city: 'Dallas',
    state: 'TX',
    postal_code: '75201',
    country: 'USA',
    total_valuation: 15000000,
    token_price: 1500,
    total_tokens: 10000,
    tokens_available: 1000,
    cap_rate: 10.5,
    annual_rent_income: 1575000,
    occupancy_rate: 100,
    square_feet: 120000,
    year_built: 2022,
    minimum_investment: 1500,
    offering_start: '2024-01-01',
    offering_end: '2024-05-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export default function PropertiesPage() {
  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch properties from Supabase
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setUsingMockData(false);

    try {
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // If no data returned, use mock data
      if (!data || data.length === 0) {
        console.log('No properties in database, using mock data');
        setProperties(MOCK_PROPERTIES);
        setUsingMockData(true);
      } else {
        setProperties(data);
      }
    } catch (err) {
      console.error('Failed to fetch properties, falling back to mock data:', err);
      setProperties(MOCK_PROPERTIES);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort properties
  const filteredProperties = properties
    .filter((property) => {
      const matchesSearch = 
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = propertyType === 'all' || 
        property.property_type?.toLowerCase() === propertyType.toLowerCase();
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'yield-high':
          return (b.cap_rate || 0) - (a.cap_rate || 0);
        case 'yield-low':
          return (a.cap_rate || 0) - (b.cap_rate || 0);
        case 'price-high':
          return (b.token_price || 0) - (a.token_price || 0);
        case 'price-low':
          return (a.token_price || 0) - (b.token_price || 0);
        case 'value-high':
          return (b.total_valuation || 0) - (a.total_valuation || 0);
        case 'value-low':
          return (a.total_valuation || 0) - (b.total_valuation || 0);
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Calculate funding progress
  const getFundingProgress = (totalTokens: number | null, availableTokens: number | null) => {
    if (!totalTokens || totalTokens === 0) return 0;
    const sold = totalTokens - (availableTokens || 0);
    return (sold / totalTokens) * 100;
  };

  // Get status badge color
  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'offering':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'funded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats
  const stats = {
    totalProperties: properties.length,
    activeListings: properties.filter(p => p.status === 'active' || p.status === 'offering').length,
    avgYield: properties.length > 0 
      ? (properties.reduce((sum, p) => sum + (p.cap_rate || 0), 0) / properties.length).toFixed(1)
      : '0',
    minInvestment: properties.length > 0
      ? Math.min(...properties.map(p => p.token_price || 0))
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Investment Properties</h1>
          <p className="text-muted-foreground">
            Browse and invest in tokenized real estate opportunities
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="mixed-use">Mixed Use</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="yield-high">Highest Yield</SelectItem>
              <SelectItem value="yield-low">Lowest Yield</SelectItem>
              <SelectItem value="price-high">Highest Token Price</SelectItem>
              <SelectItem value="price-low">Lowest Token Price</SelectItem>
              <SelectItem value="value-high">Highest Value</SelectItem>
              <SelectItem value="value-low">Lowest Value</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
              <p className="text-sm text-muted-foreground">Total Properties</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.avgYield}%</div>
              <p className="text-sm text-muted-foreground">Avg. Annual Yield</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{formatCurrency(stats.minInvestment)}</div>
              <p className="text-sm text-muted-foreground">Min. Investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Mock Data Banner */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-900 text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-yellow-800 font-medium">Showing Demo Properties</p>
              <p className="text-yellow-700 text-sm">
                Unable to connect to database or no properties found. Displaying sample data for demonstration purposes.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                onClick={fetchProperties}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading properties...</span>
          </div>
        )}

        {/* Properties Grid */}
        {!loading && (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProperties.map((property) => (
              <Card key={property.id} className="property-card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-blue-500/50" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className={getStatusColor(property.status)}>
                      {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : 'Active'}
                    </Badge>
                  </div>
                  {property.property_type && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary">{property.property_type}</Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{property.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{property.city}, {property.state}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(property.token_price || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">per token</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-sm font-medium">{formatCurrency(property.total_valuation || 0)}</div>
                      <div className="text-xs text-muted-foreground">Total Value</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium flex items-center justify-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {property.cap_rate || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Est. Yield</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">{formatNumber(property.tokens_available || 0)}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-medium">
                        {getFundingProgress(property.total_tokens, property.tokens_available).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={getFundingProgress(property.total_tokens, property.tokens_available)} />
                  </div>

                  {/* Deadline */}
                  {property.offering_end && (property.status === 'active' || property.status === 'offering') && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Deadline: {new Date(property.offering_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Link href={`/properties/${property.id}`} className="w-full">
                    <Button 
                      className="w-full" 
                      disabled={property.status === 'funded' || property.status === 'closed'}
                    >
                      {property.status === 'funded' || property.status === 'closed' 
                        ? 'Fully Funded' 
                        : 'View Details'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProperties.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
              <p className="text-muted-foreground">
                {properties.length === 0 
                  ? 'No properties are currently available. Check back soon!'
                  : 'Try adjusting your filters or search term'}
              </p>
              {properties.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setPropertyType('all');
                    setSortBy('newest');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
