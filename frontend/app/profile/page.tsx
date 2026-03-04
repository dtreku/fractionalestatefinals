// frontend/app/profile/page.tsx
// ============================================================================
// USER PROFILE PAGE
// Shows user wallet info, KYC status, and account settings
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { getUserByWallet } from '@/lib/database';
import { formatCurrency, formatNumber } from '@/lib/contracts';
import {
  User,
  Wallet,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  ExternalLink,
  Copy,
  TrendingUp,
  Building2,
  Coins,
  AlertCircle
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  id: string;
  wallet_address: string;
  email?: string;
  phone?: string;
  full_name?: string;
  kyc_status: 'pending' | 'verified' | 'rejected' | 'not_started';
  accreditation_status?: 'pending' | 'verified' | 'rejected' | 'not_started';
  created_at: string;
  updated_at?: string;
  total_invested?: number;
  properties_count?: number;
  total_dividends?: number;
}

// ============================================================================
// MOCK DATA FALLBACK
// ============================================================================

const getMockProfile = (walletAddress: string): UserProfile => ({
  id: 'mock-user-1',
  wallet_address: walletAddress,
  email: 'investor@example.com',
  phone: '+1 (555) 123-4567',
  full_name: 'Demo Investor',
  kyc_status: 'verified',
  accreditation_status: 'verified',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
  total_invested: 125000,
  properties_count: 4,
  total_dividends: 8750,
});

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  // Load user profile
  useEffect(() => {
    if (address) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [address]);

  const loadProfile = async () => {
    if (!address) return;
    
    setLoading(true);
    setUsingMockData(false);

    try {
      const user = await getUserByWallet(address);
      
      if (user) {
        // Fetch additional stats
        const { data: holdings } = await supabase
          .from('investor_holdings')
          .select('*')
          .eq('user_id', user.id);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id);

        const totalInvested = transactions
          ?.filter(t => t.transaction_type === 'purchase')
          ?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

        const totalDividends = transactions
          ?.filter(t => t.transaction_type === 'dividend')
          ?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

        setProfile({
          ...user,
          total_invested: totalInvested,
          properties_count: holdings?.length || 0,
          total_dividends: totalDividends,
        });
        
        setEditForm({
          full_name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      } else {
        // Use mock data
        const mockProfile = getMockProfile(address);
        setProfile(mockProfile);
        setUsingMockData(true);
        setEditForm({
          full_name: mockProfile.full_name || '',
          email: mockProfile.email || '',
          phone: mockProfile.phone || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      const mockProfile = getMockProfile(address);
      setProfile(mockProfile);
      setUsingMockData(true);
      setEditForm({
        full_name: mockProfile.full_name || '',
        email: mockProfile.email || '',
        phone: mockProfile.phone || '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || usingMockData) {
      toast({
        title: 'Demo Mode',
        description: 'Profile updates are disabled in demo mode',
        variant: 'destructive',
      });
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        ...editForm,
      });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully',
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Address copied to clipboard',
    });
  };

  const getKycStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" /> Not Started</Badge>;
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">
                Please connect your wallet to view your profile
              </p>
              <ConnectButton />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and view your investment summary
          </p>
        </div>

        {/* Mock Data Banner */}
        {usingMockData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-900 text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-yellow-800 font-medium">Demo Profile</p>
              <p className="text-yellow-700 text-sm">
                Showing sample profile data. Connect to database to see your actual profile.
              </p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Invested</p>
                  <p className="text-xl font-bold">{formatCurrency(profile?.total_invested || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Dividends</p>
                  <p className="text-xl font-bold">{formatCurrency(profile?.total_dividends || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Properties</p>
                  <p className="text-xl font-bold">{profile?.properties_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">KYC Status</p>
                  {getKycStatusBadge(profile?.kyc_status || 'not_started')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Email Address</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{profile?.email || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Phone Number</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter your phone"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wallet Information */}
            <Card>
              <CardHeader>
                <CardTitle>Wallet Information</CardTitle>
                <CardDescription>Your connected wallet details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Wallet Address</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <code className="text-sm flex-1 break-all">{address}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <a
                      href={`https://sepolia.etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Network</label>
                  <Badge variant="outline">Sepolia Testnet</Badge>
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">Member Since</label>
                  <p className="font-medium">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span>KYC Verification</span>
                  </div>
                  {getKycStatusBadge(profile?.kyc_status || 'not_started')}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-600" />
                    <span>Accreditation</span>
                  </div>
                  {getKycStatusBadge(profile?.accreditation_status || 'not_started')}
                </div>
                {(profile?.kyc_status !== 'verified' || profile?.accreditation_status !== 'verified') && (
                  <Button className="w-full" variant="outline">
                    Complete Verification
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/investments">
                  <Button variant="outline" className="w-full justify-start">
                    <Coins className="w-4 h-4 mr-2" />
                    My Investments
                  </Button>
                </Link>
                <Link href="/properties">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Browse Properties
                  </Button>
                </Link>
                <Link href="/governance">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Governance
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Disconnecting your wallet will log you out of this session.
                </p>
                <ConnectButton.Custom>
                  {({ openAccountModal }) => (
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      onClick={openAccountModal}
                    >
                      Disconnect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
