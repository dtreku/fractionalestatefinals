"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const { isConnected } = useAccount();

  const features = [
    {
      icon: Building2,
      title: "Fractional Ownership",
      description: "Own a piece of premium real estate starting from just $100. No need for large capital investments.",
    },
    {
      icon: TrendingUp,
      title: "Passive Income",
      description: "Receive regular dividend distributions from rental income and property appreciation.",
    },
    {
      icon: Shield,
      title: "SEC Compliant",
      description: "All investments are compliant with securities regulations. KYC/AML verified investors only.",
    },
    {
      icon: Users,
      title: "Community Governance",
      description: "Vote on property decisions including renovations, management changes, and sales.",
    },
  ];

  const steps = [
    { step: "1", title: "Connect Wallet", description: "Connect your MetaMask wallet to get started" },
    { step: "2", title: "Complete Verification", description: "Quick KYC verification for compliance" },
    { step: "3", title: "Browse Properties", description: "Explore tokenized real estate opportunities" },
    { step: "4", title: "Invest & Earn", description: "Purchase shares and receive dividends" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">FractionalEstate</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/properties" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Properties
            </Link>
            <Link href="/governance" className="text-sm font-medium hover:text-blue-600 transition-colors">
              Governance
            </Link>
            {isConnected && (
              <Link href="/dashboard" className="text-sm font-medium hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
            )}
          </nav>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Invest in Real Estate
            <span className="text-blue-600"> Starting at $100</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            FractionalEstate enables fractional ownership of premium properties through blockchain tokenization. 
            Earn passive income and participate in property governance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected ? (
              <Link href="/properties">
                <Button size="lg" className="gap-2">
                  Browse Properties <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button size="lg" onClick={openConnectModal} className="gap-2">
                    Connect Wallet <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
            <Link href="/properties">
              <Button size="lg" variant="outline">
                View Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Properties", value: "12" },
            { label: "Total Invested", value: "$4.2M" },
            { label: "Active Investors", value: "1,234" },
            { label: "Avg. Yield", value: "8.5%" },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose FractionalEstate?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We combine the stability of real estate with the innovation of blockchain technology.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="property-card">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started with fractional real estate investing in four simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-blue-200 dark:bg-blue-800" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-blue-600 text-white">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Investing?</h2>
            <p className="mb-6 opacity-90 max-w-xl mx-auto">
              Join thousands of investors already earning passive income through fractional real estate ownership.
            </p>
            {isConnected ? (
              <Link href="/properties">
                <Button size="lg" variant="secondary" className="gap-2">
                  Explore Properties <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button size="lg" variant="secondary" onClick={openConnectModal}>
                    Connect Wallet to Begin
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="font-bold">FractionalEstate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Democratizing real estate investment through blockchain technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/properties" className="hover:text-blue-600">Properties</Link></li>
                <li><Link href="/governance" className="hover:text-blue-600">Governance</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-600">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} FractionalEstate. Blockchain Class Capstone Project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
