"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Calendar, Package, Star, Activity, Clock, AlertTriangle, Ban, CheckCircle, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import Image from 'next/image';
import AdminLayout from '../../../../components/admin/AdminLayout';

interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  profile_image_url?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_admin?: boolean;
  is_banned?: boolean;
}

interface UserListing {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  created_at: string;
  images?: string[];
}

interface UserReport {
  id: string;
  reason: string;
  description: string;
  created_at: string;
  reporter_id: string;
  reporter?: {
    display_name?: string;
    email: string;
  };
}

const AdminUserProfilePage = () => {
  const { userId } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    pendingListings: 0,
    averageRating: 0,
    totalReports: 0
  });

  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId as string)
        .single();

      if (userError || !userData) {
        throw new Error("User not found");
      }

      setProfile(userData);

      // Fetch user's listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title, price, category, status, created_at, images, is_sold')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false });

      const userListings = listingsData || [];
      setListings(userListings);

      // Fetch reports about this user
      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(
            display_name,
            email
          )
        `)
        .eq('reported_user_id', userId as string)
        .order('created_at', { ascending: false });

      setReports(reportsData || []);

      // Calculate stats
      const totalListings = userListings.length;
      const activeListings = userListings.filter(l => !l.is_sold && l.status === 'approved').length;
      const soldListings = userListings.filter(l => l.is_sold).length;
      const pendingListings = userListings.filter(l => l.status === 'pending').length;

      // Try to get average rating
      let averageRating = 0;
      try {
        const { data: ratings } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewed_id', userId as string);
        
        if (ratings && ratings.length > 0) {
          averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        }
      } catch (error) {
        console.log('Reviews table not accessible:', error);
      }

      setStats({
        totalListings,
        activeListings,
        soldListings,
        pendingListings,
        averageRating,
        totalReports: reportsData?.length || 0
      });

    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleBanUser = async () => {
    if (!currentUser?.id || !profile) return;
    
    const action = profile.is_banned ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !profile.is_banned })
        .eq('id', userId as string);

      if (error) {
        throw new Error(error.message);
      }

      setProfile({ ...profile, is_banned: !profile.is_banned });
    } catch (error) {
      console.error(`Error ${action}ning user:`, error);
      alert(`Failed to ${action} user`);
    } finally {
      setActionLoading(false);
    }
  };


  const getUserStatusBadge = () => {
    if (!profile) return null;
    
    if (profile.is_admin) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          <Shield size={14} className="mr-1" />
          Admin
        </span>
      );
    }
    if (profile.is_banned) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <Ban size={14} className="mr-1" />
          Banned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircle size={14} className="mr-1" />
        Active
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={10} className="mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={10} className="mr-1" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle size={10} className="mr-1" />
            Denied
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !profile) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "User not found"}</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} />
              Back to Users
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {profile.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url}
                    alt={profile.display_name || profile.email}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 text-xl font-bold">
                    {(profile.display_name || profile.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.display_name || 'Anonymous User'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  {getUserStatusBadge()}
                  <span className="text-gray-500">{profile.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Package className="mx-auto text-blue-600 mb-2" size={20} />
            <div className="text-lg font-bold text-blue-900">{stats.totalListings}</div>
            <div className="text-xs text-blue-600">Total Listings</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <Activity className="mx-auto text-green-600 mb-2" size={20} />
            <div className="text-lg font-bold text-green-900">{stats.activeListings}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <CheckCircle className="mx-auto text-purple-600 mb-2" size={20} />
            <div className="text-lg font-bold text-purple-900">{stats.soldListings}</div>
            <div className="text-xs text-purple-600">Sold</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <Clock className="mx-auto text-yellow-600 mb-2" size={20} />
            <div className="text-lg font-bold text-yellow-900">{stats.pendingListings}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <Star className="mx-auto text-orange-600 mb-2" size={20} />
            <div className="text-lg font-bold text-orange-900">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-orange-600">Rating</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <AlertTriangle className="mx-auto text-red-600 mb-2" size={20} />
            <div className="text-lg font-bold text-red-900">{stats.totalReports}</div>
            <div className="text-xs text-red-600">Reports</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Actions */}
          <div className="space-y-6">
            {/* User Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} />
                User Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={14} />
                    Email:
                  </span>
                  <p className="text-gray-900 ml-5">{profile.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <User size={14} />
                    Display Name:
                  </span>
                  <p className="text-gray-900 ml-5">{profile.display_name || 'Not set'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={14} />
                    Joined:
                  </span>
                  <p className="text-gray-900 ml-5">
                    {new Date(profile.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                {profile.last_sign_in_at && (
                  <div>
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <Activity size={14} />
                      Last Sign In:
                    </span>
                    <p className="text-gray-900 ml-5">
                      {new Date(profile.last_sign_in_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={18} />
                Admin Actions
              </h3>
              <div className="space-y-3">
                {!profile.is_admin && (
                  <button
                    onClick={handleBanUser}
                    disabled={actionLoading}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      profile.is_banned 
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {profile.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                    {actionLoading ? 'Processing...' : (profile.is_banned ? 'Unban User' : 'Ban User')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Listings & Reports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Listings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={18} />
                Recent Listings ({listings.length})
              </h3>
              {listings.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {listings.slice(0, 20).map((listing) => (
                    <Link
                      key={listing.id}
                      href={`/admin/listings/${listing.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          {listing.images && listing.images.length > 0 && (
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                              <Image
                                src={listing.images[0]}
                                alt={listing.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">{listing.title}</p>
                            <p className="text-xs text-gray-600">${listing.price} • {listing.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(listing.status)}
                          <span className="text-xs text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No listings found</p>
              )}
            </div>

            {/* Reports */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} />
                Reports Against User ({reports.length})
              </h3>
              {reports.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reports.map((report) => (
                    <div key={report.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-red-800">{report.reason}</p>
                          <p className="text-xs text-red-600 mt-1">{report.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            By {report.reporter?.display_name || report.reporter?.email || 'Unknown'} • {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No reports found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserProfilePage;
