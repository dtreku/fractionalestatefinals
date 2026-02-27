"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, TrendingUp, Clock, Filter, Search, Grid, List } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/layout/navbar";

// Mock property data - replace with contract reads
const mockProperties = [
  {
    id: 1,
    name: "Sunset Tower",
    location: "Los Angeles, CA",
    type: "residential",
    totalValue: "50",
    pricePerShare: "0.05",
    totalShares: 1000,
    availableShares: 350,
    annualYield: 8.5,
    fundingDeadline: "2024-03-15",
    image: "/images/property1.jpg",
    status: "active",
  },
  {
    id: 2,
    name: "Ocean View Residences",
    location: "Miami, FL",
    type: "residential",
    totalValue: "75",
    pricePerShare: "0.075",
    totalShares: 1000,
    availableShares: 200,
    annualYield: 9.2,
    fundingDeadline: "2024-03-20",
    image: "/images/property2.jpg",
    status: "active",
  },
  {
    id: 3,
    name: "Downtown Commercial Hub",
    location: "New York, NY",
    type: "commercial",
    totalValue: "120",
    pricePerShare: "0.12",
    totalShares: 1000,
    availableShares: 0,
    annualYield: 7.8,
    fundingDeadline: "2024-02-01",
    image: "/images/property3.jpg",
    status: "funded",
  },
  {
    id: 4,
    name: "Tech Park Plaza",
    location: "San Francisco, CA",
    type: "commercial",
    totalValue: "200",
    pricePerShare: "0.2",
    totalShares: 1000,
    availableShares: 600,
    annualYield: 8.0,
    fundingDeadline: "2024-04-01",
    image: "/images/property4.jpg",
    status: "active",
  },
  {
    id: 5,
    name: "Lakeside Apartments",
    location: "Chicago, IL",
    type: "residential",
    totalValue: "45",
    pricePerShare: "0.045",
    totalShares: 1000,
    availableShares: 450,
    annualYield: 8.8,
    fundingDeadline: "2024-03-25",
    image: "/images/property5.jpg",
    status: "active",
  },
  {
    id: 6,
    name: "Industrial Warehouse Complex",
    location: "Dallas, TX",
    type: "industrial",
    totalValue: "80",
    pricePerShare: "0.08",
    totalShares: 1000,
    availableShares: 100,
    annualYield: 10.5,
    fundingDeadline: "2024-03-10",
    image: "/images/property6.jpg",
    status: "active",
  },
];

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProperties = mockProperties
    .filter((property) => {
      const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = propertyType === "all" || property.type === propertyType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "yield-high":
          return b.annualYield - a.annualYield;
        case "yield-low":
          return a.annualYield - b.annualYield;
        case "price-high":
          return parseFloat(b.pricePerShare) - parseFloat(a.pricePerShare);
        case "price-low":
          return parseFloat(a.pricePerShare) - parseFloat(b.pricePerShare);
        default:
          return b.id - a.id;
      }
    });

  const getFundingProgress = (total: number, available: number) => {
    return ((total - available) / total) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "funded": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "";
    }
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
              placeholder="Search properties..."
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
              <SelectItem value="price-high">Highest Price</SelectItem>
              <SelectItem value="price-low">Lowest Price</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{mockProperties.length}</div>
              <p className="text-sm text-muted-foreground">Total Properties</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{mockProperties.filter(p => p.status === "active").length}</div>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">8.7%</div>
              <p className="text-sm text-muted-foreground">Avg. Annual Yield</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">0.05 ETH</div>
              <p className="text-sm text-muted-foreground">Min. Investment</p>
            </CardContent>
          </Card>
        </div>

        {/* Properties Grid */}
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredProperties.map((property) => (
            <Card key={property.id} className="property-card overflow-hidden">
              {/* Property Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-blue-500/50" />
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className={getStatusColor(property.status)}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary">{property.type}</Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{property.pricePerShare} ETH</div>
                    <div className="text-xs text-muted-foreground">per share</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-medium">{property.totalValue} ETH</div>
                    <div className="text-xs text-muted-foreground">Total Value</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium flex items-center justify-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      {property.annualYield}%
                    </div>
                    <div className="text-xs text-muted-foreground">Est. Yield</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{property.availableShares}</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                </div>

                {/* Funding Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Funding Progress</span>
                    <span className="font-medium">
                      {getFundingProgress(property.totalShares, property.availableShares).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={getFundingProgress(property.totalShares, property.availableShares)} />
                </div>

                {/* Deadline */}
                {property.status === "active" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Funding deadline: {new Date(property.fundingDeadline).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Link href={`/properties/${property.id}`} className="w-full">
                  <Button className="w-full" disabled={property.status !== "active"}>
                    {property.status === "active" ? "View Details" : "Fully Funded"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search term
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
