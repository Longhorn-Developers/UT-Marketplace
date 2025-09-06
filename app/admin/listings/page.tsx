"use client";
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../lib/database/AdminService';
import { ListingService } from '../../lib/database/ListingService';
import { determineListingStatus } from '../../lib/utils/statusUtils';
import { Clock, CheckCircle2, XCircle, Eye, Edit3, Trash2, Search, Filter, ExternalLink } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';

interface ListingData {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  created_at: string;
  images?: string[];
  status: 'pending' | 'approved' | 'denied';
  denial_reason?: string;
  user_id: string;
  description: string;
  condition: string;
}

const AdminListingsPage = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<ListingData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const categories = ['Furniture', 'Subleases', 'Tech', 'Vehicles', 'Textbooks', 'Clothing', 'Kitchen', 'Other'];

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const result = await ListingService.getAllListings();
      if (result.success && result.listings) {
        // Process listings with status information
        const processedListings = result.listings.map(listing => ({
          ...listing,
          ...determineListingStatus(listing)
        }));
        setListings(processedListings);
      } else {
        toast.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Error fetching listings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      const result = await AdminService.approveListing(listingId);
      if (result.success) {
        toast.success('Listing approved successfully');
        await fetchListings(); // Refresh the list
      } else {
        toast.error('Failed to approve listing');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Error approving listing');
    }
  };

  const handleDeny = async (listingId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for denial');
      return;
    }
    
    try {
      const result = await AdminService.denyListing(listingId, reason);
      if (result.success) {
        toast.success('Listing denied');
        setShowModal(false);
        setDenialReason('');
        setSelectedListing(null);
        await fetchListings(); // Refresh the list
      } else {
        toast.error('Failed to deny listing');
      }
    } catch (error) {
      console.error('Error denying listing:', error);
      toast.error('Error denying listing');
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await AdminService.deleteListing(listingId);
      if (result.success) {
        toast.success('Listing deleted successfully');
        await fetchListings(); // Refresh the list
      } else {
        toast.error('Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Error deleting listing');
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string, denialReason?: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 size={12} className="mr-1" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800" title={denialReason}>
            <XCircle size={12} className="mr-1" />
            Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Listings Management</h1>
            <p className="text-gray-600">Manage all marketplace listings</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredListings.length} listings
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
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
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 mr-4">
                        {listing.images && listing.images.length > 0 ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No img</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-48 truncate">
                          {listing.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-48 truncate">
                          {listing.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(listing.status, listing.denial_reason)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {listing.category}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${listing.price}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {listing.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(listing.id)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Approve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Deny"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/admin/listings/${listing.id}`}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 inline-flex items-center"
                        title="View Listing"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No listings found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Denial Modal */}
      {showModal && selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Deny Listing: {selectedListing.title}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for denial:
                </label>
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent resize-none"
                  placeholder="Please provide a reason for denying this listing..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setDenialReason('');
                    setSelectedListing(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeny(selectedListing.id, denialReason)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Deny Listing
                </button>
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

export default AdminListingsPage;