"use client";
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../lib/database/AdminService';
import { supabase } from '../../lib/supabaseClient';
import { User, Mail, Calendar, Shield, Search, Eye, Ban, CheckCircle2, XCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import AdminLayout from '../../../components/admin/AdminLayout';

interface UserData {
  id: string;
  email: string;
  display_name?: string;
  profile_image_url?: string;
  created_at: string;
  last_sign_in_at?: string;
  is_admin?: boolean;
  is_banned?: boolean;
  listing_count?: number;
  review_count?: number;
  average_rating?: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, fetch users with error handling for missing columns
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast.error('Failed to fetch users');
        return;
      }

      if (usersData && usersData.length > 0) {
        // Check what columns are available by examining the first user
        console.log('Available user columns:', Object.keys(usersData[0]));
        
        // Fetch additional stats for each user
        const usersWithStats = await Promise.all(
          usersData.map(async (user) => {
            try {
              // Get listing count
              const { count: listingCount } = await supabase
                .from('listings')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

              // Try to get review stats - handle case where reviews table might not exist
              let averageRating = 0;
              let reviewCount = 0;
              
              try {
                const { data: reviews } = await supabase
                  .from('reviews')
                  .select('rating')
                  .eq('reviewed_id', user.id);

                if (reviews && reviews.length > 0) {
                  averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
                  reviewCount = reviews.length;
                }
              } catch (reviewError) {
                // Reviews table might not exist, that's okay
                console.log('Reviews table not accessible:', reviewError);
              }

              return {
                ...user,
                // Handle missing columns gracefully
                is_admin: user.is_admin ?? false,
                is_banned: user.is_banned ?? false,
                display_name: user.display_name ?? null,
                profile_image_url: user.profile_image_url ?? null,
                last_sign_in_at: user.last_sign_in_at ?? null,
                listing_count: listingCount || 0,
                review_count: reviewCount,
                average_rating: averageRating
              };
            } catch (userError) {
              console.error('Error processing user:', user.id, userError);
              return {
                ...user,
                is_admin: user.is_admin ?? false,
                is_banned: user.is_banned ?? false,
                display_name: user.display_name ?? null,
                profile_image_url: user.profile_image_url ?? null,
                last_sign_in_at: user.last_sign_in_at ?? null,
                listing_count: 0,
                review_count: 0,
                average_rating: 0
              };
            }
          })
        );

        setUsers(usersWithStats);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      // Fetch user's listings
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch reports about this user
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('reported_user_id', userId)
        .order('created_at', { ascending: false });

      setUserListings(listings || []);
      setUserReports(reports || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    const action = currentBanStatus ? 'unban' : 'ban';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      // Try to update the is_banned column, but handle gracefully if it doesn't exist
      const { error } = await supabase
        .from('users')
        .update({ is_banned: !currentBanStatus })
        .eq('id', userId);

      if (error) {
        // If the column doesn't exist, we could add it or show a different message
        console.error(`Error ${action}ning user:`, error);
        
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          toast.error(`Ban functionality requires database migration. Column 'is_banned' not found.`);
        } else {
          toast.error(`Failed to ${action} user: ${error.message}`);
        }
        return;
      }

      toast.success(`User ${action}ned successfully`);
      await fetchUsers();
    } catch (error) {
      console.error(`Error ${action}ning user:`, error);
      toast.error(`Error ${action}ning user`);
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    const action = currentAdminStatus ? 'remove admin privileges from' : 'make admin';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      // Try to update the is_admin column, but handle gracefully if it doesn't exist
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentAdminStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user privileges:', error);
        
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          toast.error(`Admin functionality requires database migration. Column 'is_admin' not found.`);
        } else {
          toast.error(`Failed to update user privileges: ${error.message}`);
        }
        return;
      }

      toast.success(`User privileges updated successfully`);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user privileges:', error);
      toast.error('Error updating user privileges');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && !user.is_banned && !user.is_admin) ||
      (statusFilter === 'banned' && user.is_banned === true) ||
      (statusFilter === 'admin' && user.is_admin === true);
    
    return matchesSearch && matchesStatus;
  });

  const getUserStatusBadge = (user: UserData) => {
    if (user.is_admin === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Shield size={12} className="mr-1" />
          Admin
        </span>
      );
    }
    if (user.is_banned === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Ban size={12} className="mr-1" />
          Banned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 size={12} className="mr-1" />
        Active
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700]"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600">Manage all platform users</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredUsers.length} users
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="banned">Banned Users</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 mr-3">
                        {user.profile_image_url ? (
                          <Image
                            src={user.profile_image_url}
                            alt={user.display_name || user.email}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name || 'No display name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getUserStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.listing_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.average_rating > 0 ? (
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {user.average_rating.toFixed(1)}
                        <span className="text-gray-400 ml-1">({user.review_count})</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No reviews</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          fetchUserDetails(user.id);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {user.is_admin !== true && (
                        <button
                          onClick={() => handleBanUser(user.id, user.is_banned === true)}
                          className={`p-1 rounded ${
                            user.is_banned === true
                              ? 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          }`}
                          title={user.is_banned === true ? 'Unban User' : 'Ban User'}
                        >
                          {user.is_banned === true ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  User Details: {selectedUser.display_name || selectedUser.email}
                </h3>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setUserListings([]);
                    setUserReports([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">User Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">Display Name:</span> {selectedUser.display_name || 'Not set'}</p>
                    <p><span className="font-medium">Status:</span> {getUserStatusBadge(selectedUser)}</p>
                    <p><span className="font-medium">Joined:</span> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    {selectedUser.last_sign_in_at && (
                      <p><span className="font-medium">Last Sign In:</span> {new Date(selectedUser.last_sign_in_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Statistics</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Total Listings:</span> {selectedUser.listing_count}</p>
                    <p><span className="font-medium">Reviews Received:</span> {selectedUser.review_count}</p>
                    <p><span className="font-medium">Average Rating:</span> {
                      selectedUser.average_rating && selectedUser.average_rating > 0 
                        ? `★ ${selectedUser.average_rating.toFixed(1)}`
                        : 'No ratings'
                    }</p>
                  </div>
                </div>
              </div>

              {/* User Listings */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Recent Listings ({userListings.length})</h4>
                {userListings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userListings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{listing.title}</p>
                          <p className="text-xs text-gray-500">${listing.price} • {listing.category}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No listings found</p>
                )}
              </div>

              {/* User Reports */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Reports Against User ({userReports.length})</h4>
                {userReports.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userReports.map((report) => (
                      <div key={report.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-sm text-red-800">{report.reason}</p>
                        <p className="text-xs text-red-600 mt-1">{report.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Reported on {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No reports found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        <ToastContainer position="bottom-right" />
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;