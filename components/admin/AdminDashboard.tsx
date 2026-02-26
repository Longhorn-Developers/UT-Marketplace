"use client";
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  Activity,
  UserCheck,
  AlertCircle,
  Shield,
  ChevronRight
} from 'lucide-react';
import { AdminService, AdminStats, AdminListingReport, AdminUserReport, AdminListing } from '../../app/lib/database/AdminService';
import { useAuth } from '../../app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface RecentActivity {
  id: string;
  type: 'listing_created' | 'user_joined' | 'listing_reported' | 'user_banned';
  description: string;
  time: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [listingReports, setListingReports] = useState<AdminListingReport[]>([]);
  const [userReports, setUserReports] = useState<AdminUserReport[]>([]);
  const [pendingListings, setPendingListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState({
    api: 'operational',
    database: 'healthy',
    storage: '25% used'
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'listing_created',
      description: 'New listing "iPhone 14 Pro" created',
      time: '5 mins ago',
      user: 'john.doe@utexas.edu'
    },
    {
      id: '2',
      type: 'user_joined',
      description: 'New user registered',
      time: '12 mins ago',
      user: 'jane.smith@utexas.edu'
    },
    {
      id: '3',
      type: 'listing_reported',
      description: 'Listing "Suspicious Item" reported by user',
      time: '25 mins ago',
      user: 'reporter@utexas.edu'
    },
    {
      id: '4',
      type: 'user_banned',
      description: 'User banned for policy violation',
      time: '1 hour ago',
      user: 'violator@utexas.edu'
    }
  ]);

  const checkSystemHealth = async () => {
    try {
      // Check API status by trying to fetch stats
      const startTime = Date.now();
      const statsData = await AdminService.getAdminStats();
      const responseTime = Date.now() - startTime;
      
      // Update system status based on response
      const apiStatus = responseTime < 1000 ? 'operational' : responseTime < 3000 ? 'slow' : 'degraded';
      
      // Check database health based on query success
      const databaseStatus = statsData ? 'healthy' : 'degraded';
      
      // Calculate storage usage based on total listings (simple approximation)
      const storageUsed = Math.min(95, Math.floor((statsData?.total_listings || 0) / 100 * 75) + 25);
      const storageStatus = `${storageUsed}% used`;
      
      setSystemStatus({
        api: apiStatus,
        database: databaseStatus,
        storage: storageStatus
      });
      
      return statsData;
    } catch (error) {
      setSystemStatus({
        api: 'error',
        database: 'error',
        storage: 'unknown'
      });
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 6000);
      try {
        // Check system health and fetch stats
        const statsData = await checkSystemHealth();
        setStats(statsData);

        // Fetch reports and pending listings
        const [listingReportsData, userReportsData, pendingListingsData] = await Promise.all([
          AdminService.getListingReports(10, 0), // Get first 10 reports
          AdminService.getUserReports(10, 0),
          AdminService.getPendingListings(10, 0) // Get first 10 pending listings
        ]);

        setListingReports(listingReportsData);
        setUserReports(userReportsData);
        setPendingListings(pendingListingsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveListingReport = async (reportId: string) => {
    if (!user?.id) return;
    
    setActionLoading(reportId);
    try {
      const result = await AdminService.approveListingReport(reportId, user.id);
      if (result.success) {
        // Remove the report from the list
        setListingReports(prev => prev.filter(report => report.id !== reportId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        alert(result.error || 'Failed to approve report');
      }
    } catch (error) {
      alert('An error occurred while processing the report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectListingReport = async (reportId: string) => {
    if (!user?.id) return;
    
    setActionLoading(reportId);
    try {
      const result = await AdminService.rejectListingReport(reportId, user.id);
      if (result.success) {
        // Remove the report from the list
        setListingReports(prev => prev.filter(report => report.id !== reportId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        alert(result.error || 'Failed to reject report');
      }
    } catch (error) {
      alert('An error occurred while processing the report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUserReport = async (reportId: string) => {
    if (!user?.id) return;
    
    setActionLoading(reportId);
    try {
      const result = await AdminService.approveUserReport(reportId, user.id);
      if (result.success) {
        // Remove the report from the list
        setUserReports(prev => prev.filter(report => report.id !== reportId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        alert(result.error || 'Failed to approve report');
      }
    } catch (error) {
      alert('An error occurred while processing the report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUserReport = async (reportId: string) => {
    if (!user?.id) return;
    
    setActionLoading(reportId);
    try {
      const result = await AdminService.rejectUserReport(reportId, user.id);
      if (result.success) {
        // Remove the report from the list
        setUserReports(prev => prev.filter(report => report.id !== reportId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        alert(result.error || 'Failed to reject report');
      }
    } catch (error) {
      alert('An error occurred while processing the report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveListing = async (listingId: string) => {
    if (!user?.id) return;
    
    setActionLoading(listingId);
    try {
      const result = await AdminService.approveListing(listingId, user.id);
      if (result.success) {
        // Remove the listing from pending list
        setPendingListings(prev => prev.filter(listing => listing.id !== listingId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        console.error('Approval failed:', result);
        alert(result.error || 'Failed to approve listing');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('An error occurred while approving the listing');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDenyListing = async (listingId: string) => {
    if (!user?.id) return;
    
    const reason = prompt('Please provide a reason for denying this listing:');
    if (!reason || reason.trim() === '') {
      return; // User cancelled or didn't provide a reason
    }
    
    setActionLoading(listingId);
    try {
      const result = await AdminService.denyListing(listingId, user.id, reason.trim());
      if (result.success) {
        // Remove the listing from pending list
        setPendingListings(prev => prev.filter(listing => listing.id !== listingId));
        // Update stats
        const newStats = await AdminService.getAdminStats();
        setStats(newStats);
      } else {
        console.error('Denial failed:', result);
        alert(result.error || 'Failed to deny listing');
      }
    } catch (error) {
      console.error('Error denying listing:', error);
      alert('An error occurred while denying the listing');
    } finally {
      setActionLoading(null);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    change, 
    color = 'blue' 
  }: { 
    icon: React.ElementType; 
    title: string; 
    value: number | string;
    change?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white', 
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white',
      purple: 'bg-purple-500 text-white'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
          {change && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {change}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
      </div>
    );
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'listing_created':
        return <FileText size={16} className="text-blue-500" />;
      case 'user_joined':
        return <UserCheck size={16} className="text-green-500" />;
      case 'listing_reported':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'user_banned':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Admin
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with UT Marketplace today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard 
          icon={Users} 
          title="Total Users" 
          value={stats.total_users.toLocaleString()} 
          color="blue" 
        />
        <StatCard 
          icon={FileText} 
          title="Total Listings" 
          value={stats.total_listings.toLocaleString()} 
          color="green" 
        />
        <StatCard 
          icon={Clock} 
          title="Pending Approval" 
          value={stats.pending_listings} 
          color="yellow" 
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Reported Listings" 
          value={stats.reported_listings} 
          color="red" 
        />
        <StatCard 
          icon={Shield} 
          title="Reported Users" 
          value={stats.reported_users} 
          color="red" 
        />
        <StatCard 
          icon={Activity} 
          title="Active Today" 
          value={stats.active_users_today} 
          color="purple" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/admin/listings')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review Pending</p>
                  <p className="text-sm text-gray-600">{stats.pending_listings} listings waiting</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/admin/reports')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Handle Reports</p>
                  <p className="text-sm text-gray-600">{stats.reported_listings + stats.reported_users} items reported</p>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/admin/users')}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-600">View all users</p>
                </div>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">API Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.api === 'operational' ? 'bg-green-500' :
                    systemStatus.api === 'slow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    systemStatus.api === 'operational' ? 'text-green-600' :
                    systemStatus.api === 'slow' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {systemStatus.api.charAt(0).toUpperCase() + systemStatus.api.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    systemStatus.database === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {systemStatus.database.charAt(0).toUpperCase() + systemStatus.database.slice(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Storage</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.storage.includes('unknown') ? 'bg-gray-500' :
                    parseInt(systemStatus.storage) > 80 ? 'bg-red-500' :
                    parseInt(systemStatus.storage) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    systemStatus.storage.includes('unknown') ? 'text-gray-600' :
                    parseInt(systemStatus.storage) > 80 ? 'text-red-600' :
                    parseInt(systemStatus.storage) > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {systemStatus.storage.charAt(0).toUpperCase() + systemStatus.storage.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports & Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Listings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pending Listings for Approval</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{pendingListings.length} pending</span>
                <button 
                  onClick={() => router.push('/admin/listings')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {pendingListings.length > 0 ? (
                pendingListings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-start justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {listing.images && listing.images.length > 0 && (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{listing.title}</p>
                          <p className="text-sm text-gray-600">${listing.price} • {listing.category}</p>
                          <p className="text-sm text-gray-600 mt-1">{listing.description?.slice(0, 100)}...</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {listing.user?.display_name || listing.user?.email} • {new Date(listing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApproveListing(listing.id)}
                        disabled={actionLoading === listing.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === listing.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleDenyListing(listing.id)}
                        disabled={actionLoading === listing.id}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === listing.id ? 'Processing...' : 'Deny'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No listings pending approval</p>
                </div>
              )}
            </div>
          </div>

          {/* Listing Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Listing Reports</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{listingReports.length} pending</span>
                <button 
                  onClick={() => router.push('/admin/reports')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {listingReports.length > 0 ? (
                listingReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{report.listing?.title || 'Unknown Listing'}</p>
                      <p className="text-sm text-gray-600">Reason: {report.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Reported by {report.reporter?.display_name || report.reporter?.email} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApproveListingReport(report.id)}
                        disabled={actionLoading === report.id}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === report.id ? 'Processing...' : 'Remove Listing'}
                      </button>
                      <button
                        onClick={() => handleRejectListingReport(report.id)}
                        disabled={actionLoading === report.id}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === report.id ? 'Processing...' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No listing reports to review</p>
                </div>
              )}
            </div>
          </div>

          {/* User Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent User Reports</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{userReports.length} pending</span>
                <button 
                  onClick={() => router.push('/admin/reports')}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {userReports.length > 0 ? (
                userReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-start justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{report.reported_user?.display_name || report.reported_user?.email}</p>
                      <p className="text-sm text-gray-600">Reason: {report.reason}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Reported by {report.reporter?.display_name || report.reporter?.email} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApproveUserReport(report.id)}
                        disabled={actionLoading === report.id}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === report.id ? 'Processing...' : 'Ban User'}
                      </button>
                      <button
                        onClick={() => handleRejectUserReport(report.id)}
                        disabled={actionLoading === report.id}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === report.id ? 'Processing...' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No user reports to review</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
