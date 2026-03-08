"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, MapPin, Calendar, Package, Star, Flag, CheckCircle, XCircle, User, DollarSign, Tag, Info, Clock, AlertTriangle, Eye, MessageSquare, Heart, Shield, ExternalLink, ArrowLeft } from 'lucide-react';
import { ListingService } from '../../../lib/database/ListingService';
import { AdminService } from '../../../lib/database/AdminService';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import AdminLayout from '../../../../components/admin/AdminLayout';

interface ListingData {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: string;
  location_lat?: number;
  location_lng?: number;
  images: string[];
  created_at: string;
  updated_at?: string;
  status?: 'pending' | 'approved' | 'denied';
  denial_reason?: string;
  is_sold?: boolean;
  is_draft?: boolean;
  view_count?: number;
  favorite_count?: number;
  user: {
    id: string;
    email: string;
    display_name?: string;
    profile_image_url?: string;
    created_at?: string;
  };
}

const AdminListingDetailPage = () => {
  const { listingId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListing = useCallback(async () => {
    if (!listingId) return;

    try {
      setLoading(true);

      // Get the raw listing data directly from Supabase to access created_at
      const { data: rawData, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            display_name,
            profile_image_url,
            email,
            created_at
          )
        `)
        .eq('id', listingId as string)
        .single();

      if (error || !rawData) {
        throw new Error("Listing not found");
      }

      // Also get the processed data for status info
      const listingData = await ListingService.getListingById(listingId as string, user?.id);

      setListing({
        id: rawData.id,
        title: rawData.title,
        description: rawData.description || '',
        price: rawData.price,
        category: rawData.category,
        condition: rawData.condition,
        location: rawData.location,
        location_lat: rawData.location_lat,
        location_lng: rawData.location_lng,
        images: rawData.images || [],
        created_at: rawData.created_at,
        updated_at: rawData.updated_at,
        status: listingData?.status,
        denial_reason: listingData?.denial_reason,
        is_sold: rawData.is_sold,
        is_draft: rawData.is_draft,
        view_count: rawData.view_count || 0,
        favorite_count: 0, // We'll fetch this separately if needed
        user: {
          id: rawData.user_id,
          email: rawData.user?.email || '',
          display_name: rawData.user?.display_name,
          profile_image_url: rawData.user?.profile_image_url,
          created_at: rawData.user?.created_at,
        }
      });
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err instanceof Error ? err.message : "Failed to load listing");
    } finally {
      setLoading(false);
    }
  }, [listingId, user?.id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleApprove = async () => {
    if (!user?.id) return;
    
    setActionLoading(true);
    try {
      const result = await AdminService.approveListing(listingId as string, user.id);
      if (result.success) {
        await fetchListing(); // Refresh listing data
      } else {
        alert(result.error || 'Failed to approve listing');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('An error occurred while approving the listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!user?.id) return;
    
    const reason = prompt('Please provide a reason for denying this listing:');
    if (!reason || reason.trim() === '') {
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await AdminService.denyListing(listingId as string, user.id, reason.trim());
      if (result.success) {
        await fetchListing(); // Refresh listing data
      } else {
        alert(result.error || 'Failed to deny listing');
      }
    } catch (error) {
      console.error('Error denying listing:', error);
      alert('An error occurred while denying the listing');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const result = await AdminService.deleteListing(listingId as string, user.id);
      if (result) {
        router.push('/admin/listings');
      } else {
        alert('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('An error occurred while deleting the listing');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status?: string, denialReason?: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Package size={14} className="mr-1" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} className="mr-1" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800" title={denialReason}>
            <XCircle size={14} className="mr-1" />
            Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
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

  if (error || !listing) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Listing not found"}</p>
            <button
              onClick={() => router.push('/admin/listings')}
              className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft size={16} />
              Back to Listings
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
              onClick={() => router.push('/admin/listings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-4">
              <Package className="text-[#bf5700]" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {getStatusBadge(listing.status, listing.denial_reason)}
                  {listing.is_sold && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <Flag size={12} className="mr-1" />
                      Sold
                    </span>
                  )}
                  {listing.is_draft && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                      <Info size={12} className="mr-1" />
                      Draft
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <DollarSign className="mx-auto text-blue-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-blue-900">${listing.price}</div>
            <div className="text-sm text-blue-600">Price</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <Eye className="mx-auto text-green-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-green-900">{listing.view_count || 0}</div>
            <div className="text-sm text-green-600">Views</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <Calendar className="mx-auto text-purple-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-purple-900">
              {Math.ceil((new Date().getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))}
            </div>
            <div className="text-sm text-purple-600">Days ago</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <Tag className="mx-auto text-orange-600 mb-2" size={24} />
            <div className="text-lg font-bold text-orange-900">{listing.category}</div>
            <div className="text-sm text-orange-600">Category</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enhanced Images Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye size={20} />
                Images ({listing.images.length})
              </h3>
              {listing.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.images.map((image, index) => (
                    <div key={index} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                      <Image
                        src={image}
                        alt={`${listing.title} - Image ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Package className="mx-auto text-gray-400 mb-2" size={48} />
                    <span className="text-gray-500">No images uploaded</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Description */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={20} />
                Description
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Listing Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Listing Details
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <Tag size={16} />
                    Category:
                  </span>
                  <p className="text-gray-900 mt-1">{listing.category}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <Package size={16} />
                    Condition:
                  </span>
                  <p className="text-gray-900 mt-1">{listing.condition}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin size={16} />
                    Location:
                  </span>
                  <p className="text-gray-900 mt-1">{listing.location}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign size={16} />
                    Price:
                  </span>
                  <p className="text-gray-900 mt-1 text-2xl font-bold text-[#bf5700]">${listing.price}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Seller Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} />
                Seller Information
              </h3>
              <Link
                href={`/admin/users/${listing.user.id}`}
                className="w-full block text-left hover:bg-blue-100/50 p-3 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                    {listing.user.profile_image_url ? (
                      <Image
                        src={listing.user.profile_image_url}
                        alt={listing.user.display_name || listing.user.email}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-xl font-bold">
                        {(listing.user.display_name || listing.user.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-lg">
                        {listing.user.display_name || 'Anonymous User'}
                      </p>
                      <ExternalLink size={16} className="text-blue-600 group-hover:text-blue-800" />
                    </div>
                    <p className="text-sm text-gray-600">{listing.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      User ID: {listing.user.id}
                    </p>
                    {listing.user.created_at && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        Joined {new Date(listing.user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600 text-center">
                  Click to view detailed user profile
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Posted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(listing.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
                {listing.updated_at && listing.updated_at !== listing.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-600">
                        {new Date(listing.updated_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Alert */}
            {listing.status === 'denied' && listing.denial_reason && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Denial Reason
                </h3>
                <p className="text-red-800 bg-red-100 p-3 rounded-lg">{listing.denial_reason}</p>
              </div>
            )}

            {/* Admin Actions */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={20} />
                Admin Actions
              </h3>
              <div className="space-y-3">
                {listing.status === 'pending' && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      <CheckCircle size={18} />
                      {actionLoading ? 'Processing...' : 'Approve Listing'}
                    </button>
                    <button
                      onClick={handleDeny}
                      disabled={actionLoading}
                      className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                    >
                      <XCircle size={18} />
                      {actionLoading ? 'Processing...' : 'Deny Listing'}
                    </button>
                  </>
                )}
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full bg-red-800 text-white px-4 py-3 rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <Flag size={18} />
                  {actionLoading ? 'Processing...' : 'Delete Listing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminListingDetailPage;
