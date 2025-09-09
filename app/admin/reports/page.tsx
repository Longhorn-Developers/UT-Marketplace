"use client";
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../lib/database/AdminService';
import { supabase } from '../../lib/supabaseClient';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Eye, Search, Filter, User, FileText, Calendar } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import AdminLayout from '../../../components/admin/AdminLayout';

interface ReportData {
  id: string;
  type: 'listing' | 'user';
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter_id: string;
  reported_listing_id?: string;
  reported_user_id?: string;
  listing_title?: string;
  reported_user_name?: string;
  reporter_name?: string;
}

const AdminReportsPage = () => {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'listing' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Try different possible report table structures
      let allReports: any[] = [];
      
      // First, try the unified 'reports' table
      try {
        const { data: reportsData, error: reportsError } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!reportsError && reportsData) {
          console.log('Found reports table with columns:', Object.keys(reportsData[0] || {}));
          
          // Process each report to get additional details
          for (const report of reportsData) {
            try {
              // Try to get listing details if this is a listing report
              if (report.reported_listing_id || report.listing_id) {
                const listingId = report.reported_listing_id || report.listing_id;
                const { data: listing } = await supabase
                  .from('listings')
                  .select('title, user_id')
                  .eq('id', listingId)
                  .single();

                if (listing) {
                  report.listing_title = listing.title;
                }
              }

              // Try to get reporter details
              if (report.reporter_id) {
                const { data: reporter } = await supabase
                  .from('users')
                  .select('display_name, email')
                  .eq('id', report.reporter_id)
                  .single();

                if (reporter) {
                  report.reporter_name = reporter.display_name || reporter.email?.split('@')[0] || 'Unknown';
                }
              }

              // Try to get reported user details
              if (report.reported_user_id) {
                const { data: reportedUser } = await supabase
                  .from('users')
                  .select('display_name, email')
                  .eq('id', report.reported_user_id)
                  .single();

                if (reportedUser) {
                  report.reported_user_name = reportedUser.display_name || reportedUser.email?.split('@')[0] || 'Unknown';
                }
              }

              allReports.push(report);
            } catch (processError) {
              console.warn('Error processing report:', report.id, processError);
              // Still add the report even if we can't get all details
              allReports.push(report);
            }
          }
        } else {
          console.log('Reports table not accessible or empty:', reportsError);
        }
      } catch (unifiedReportsError) {
        console.log('Unified reports table not available:', unifiedReportsError);
        
        // Try separate tables as fallback
        try {
          // Try listing_reports table
          const { data: listingReports } = await supabase
            .from('listing_reports')
            .select('*')
            .order('created_at', { ascending: false });

          if (listingReports) {
            allReports.push(...listingReports.map(report => ({ ...report, type: 'listing' })));
          }
        } catch (listingReportsError) {
          console.log('listing_reports table not available:', listingReportsError);
        }

        try {
          // Try user_reports table  
          const { data: userReports } = await supabase
            .from('user_reports')
            .select('*')
            .order('created_at', { ascending: false });

          if (userReports) {
            allReports.push(...userReports.map(report => ({ ...report, type: 'user' })));
          }
        } catch (userReportsError) {
          console.log('user_reports table not available:', userReportsError);
        }
      }

      // Format all reports with consistent structure
      const formattedReports = allReports.map(report => {
        // Determine report type
        let reportType: 'listing' | 'user' = 'user';
        if (report.reported_listing_id || report.listing_id || report.type === 'listing') {
          reportType = 'listing';
        }

        return {
          id: report.id,
          type: reportType,
          reason: report.reason || 'No reason provided',
          description: report.description || '',
          status: report.status || 'pending',
          created_at: report.created_at,
          reporter_id: report.reporter_id,
          reported_listing_id: report.reported_listing_id || report.listing_id,
          reported_user_id: report.reported_user_id,
          listing_title: report.listing_title || 'Unknown Listing',
          reported_user_name: report.reported_user_name || 'Unknown User',
          reporter_name: report.reporter_name || 'Unknown Reporter'
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReports(formattedReports);

      // If no reports found, show a message in console for debugging
      if (formattedReports.length === 0) {
        console.log('No reports found. This could mean:');
        console.log('1. No reports table exists in database');
        console.log('2. Reports table is empty'); 
        console.log('3. Database permissions issue');
        console.log('4. Different table structure than expected');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to fetch reports');
      // Set empty array so the UI still renders
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, type: 'listing' | 'user') => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) {
        toast.error('Failed to resolve report');
        return;
      }

      toast.success('Report resolved successfully');
      await fetchReports();
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Error resolving report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissReport = async (reportId: string, type: 'listing' | 'user') => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (error) {
        toast.error('Failed to dismiss report');
        return;
      }

      toast.success('Report dismissed successfully');
      await fetchReports();
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Error dismissing report');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.listing_title && report.listing_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.reported_user_name && report.reported_user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.reporter_name && report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 size={12} className="mr-1" />
            Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle size={12} className="mr-1" />
            Dismissed
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

  const getTypeIcon = (type: string) => {
    return type === 'listing' ? <FileText size={16} /> : <User size={16} />;
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
            <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
            <p className="text-gray-600">Review and manage user reports</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {filteredReports.length} reports
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-3">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Listing Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'listing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">User Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter(r => r.type === 'user').length}
              </p>
            </div>
          </div>
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
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="listing">Listing Reports</option>
            <option value="user">User Reports</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={`${report.type}-${report.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        <div className="p-1 bg-orange-100 rounded">
                          <AlertTriangle size={16} className="text-orange-600" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {report.reason}
                        </div>
                        {report.type === 'listing' && report.listing_title && (
                          <div className="text-xs text-blue-600 mb-1">
                            Listing: {report.listing_title}
                          </div>
                        )}
                        {report.type === 'user' && report.reported_user_name && (
                          <div className="text-xs text-purple-600 mb-1">
                            User: {report.reported_user_name}
                          </div>
                        )}
                        {report.description && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      {getTypeIcon(report.type)}
                      <span className="ml-1 capitalize">{report.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.reporter_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolveReport(report.id, report.type)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Resolve"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDismissReport(report.id, report.type)}
                            className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                            title="Dismiss"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <AlertTriangle size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">No reports found</p>
            <p className="text-gray-400 text-sm">
              {reports.length === 0 
                ? "No reports have been submitted yet, or the reports table hasn't been set up."
                : "Try adjusting your search criteria or filters."
              }
            </p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Report Details
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedReport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Report Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getTypeIcon(selectedReport.type)}
                      <span className="ml-2 font-medium capitalize">{selectedReport.type} Report</span>
                    </div>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="font-medium text-sm text-gray-700">Reason:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedReport.reason}</p>
                    </div>
                    
                    {selectedReport.description && (
                      <div>
                        <span className="font-medium text-sm text-gray-700">Description:</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedReport.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                      <div>
                        <span className="font-medium text-sm text-gray-700">Reported by:</span>
                        <p className="text-sm text-gray-900">{selectedReport.reporter_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-700">Date:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedReport.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {selectedReport.type === 'listing' && selectedReport.listing_title && (
                      <div>
                        <span className="font-medium text-sm text-gray-700">Reported Listing:</span>
                        <p className="text-sm text-blue-600">{selectedReport.listing_title}</p>
                      </div>
                    )}

                    {selectedReport.type === 'user' && selectedReport.reported_user_name && (
                      <div>
                        <span className="font-medium text-sm text-gray-700">Reported User:</span>
                        <p className="text-sm text-purple-600">{selectedReport.reported_user_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleDismissReport(selectedReport.id, selectedReport.type)}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Dismiss'}
                    </button>
                    <button
                      onClick={() => handleResolveReport(selectedReport.id, selectedReport.type)}
                      disabled={actionLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Resolve'}
                    </button>
                  </div>
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

export default AdminReportsPage;