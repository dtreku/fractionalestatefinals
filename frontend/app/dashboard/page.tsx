"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, Wallet, TrendingUp, Vote, Bell, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/navbar";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  // Mock data - replace with actual contract reads
  const portfolioStats = {
    totalInvested: "2.5",
    totalValue: "2.75",
    unrealizedGain: "+10.00%",
    claimableDividends: "0.125",
    propertiesOwned: 3,
    totalShares: 45,
  };

  const recentInvestments = [
    { id: 1, property: "Sunset Tower", shares: 15, value: "0.75", change: "+5.2%", positive: true },
    { id: 2, property: "Ocean View Residences", shares: 20, value: "1.2", change: "+8.1%", positive: true },
    { id: 3, property: "Downtown Commercial", shares: 10, value: "0.8", change: "-2.3%", positive: false },
  ];

  const activeProposals = [
    { id: 1, property: "Sunset Tower", title: "Pool Renovation", endDate: "3 days", voted: false },
    { id: 2, property: "Ocean View", title: "New Property Manager", endDate: "5 days", voted: true },
  ];

  const notifications = [
    { id: 1, type: "dividend", message: "Dividend declared for Sunset Tower", time: "2h ago" },
    { id: 2, type: "proposal", message: "New proposal for Ocean View", time: "5h ago" },
    { id: 3, type: "investment", message: "Share purchase confirmed", time: "1d ago" },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectButton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.totalInvested} ETH</div>
              <p className="text-xs text-muted-foreground">≈ $4,500 USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.totalValue} ETH</div>
              <p className="text-xs text-green-500">{portfolioStats.unrealizedGain}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Claimable Dividends</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.claimableDividends} ETH</div>
              <Button size="sm" className="mt-2">Claim All</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Properties Owned</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolioStats.propertiesOwned}</div>
              <p className="text-xs text-muted-foreground">{portfolioStats.totalShares} total shares</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Investments */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Investments</CardTitle>
                <CardDescription>Properties you have invested in</CardDescription>
              </div>
              <Link href="/investments">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInvestments.map((investment) => (
                  <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{investment.property}</h4>
                        <p className="text-sm text-muted-foreground">{investment.shares} shares</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{investment.value} ETH</div>
                      <div className={`text-sm flex items-center justify-end gap-1 ${investment.positive ? 'text-green-500' : 'text-red-500'}`}>
                        {investment.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {investment.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Proposals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5" />
                Active Proposals
              </CardTitle>
              <CardDescription>Governance votes requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProposals.map((proposal) => (
                  <div key={proposal.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={proposal.voted ? "secondary" : "default"}>
                        {proposal.voted ? "Voted" : "Pending"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Ends in {proposal.endDate}</span>
                    </div>
                    <h4 className="font-medium mb-1">{proposal.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{proposal.property}</p>
                    {!proposal.voted && (
                      <Link href={`/governance/${proposal.id}`}>
                        <Button size="sm" className="w-full">Vote Now</Button>
                      </Link>
                    )}
                  </div>
                ))}
                <Link href="/governance">
                  <Button variant="outline" className="w-full">View All Proposals</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notifications */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.type === 'dividend' ? 'bg-green-500' :
                      notification.type === 'proposal' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-sm">{notification.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
