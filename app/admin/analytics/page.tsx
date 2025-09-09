"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BarChart3, TrendingUp, Users, FileText, ShoppingBag, Star, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import AdminLayout from '../../../components/admin/AdminLayout';

interface AnalyticsData {
  totalUsers: number;
  totalListings: number;
  totalReports: number;
  averageRating: number;
  newUsersThisMonth: number;
  newListingsThisMonth: number;
  activeListings: number;
  soldListings: number;
  pendingListings: number;
  approvedListings: number;
  deniedListings: number;
  listingsByCategory: { [key: string]: number };
  dailyActivity: { date: string; users: number; listings: number }[];
  topCategories: { category: string; count: number; percentage: number }[];
  userGrowth: { month: string; count: number }[];
  revenueByCategory: { category: string; total: number }[];
}

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const monthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch basic counts
      const [
        { count: totalUsers },
        { count: totalListings },
        { count: totalReports },
        { count: newUsersThisMonth },
        { count: newListingsThisMonth },
        { count: activeListings },
        { count: soldListings },
        { count: pendingListings },
        { count: approvedListings },
        { count: deniedListings }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStartDate.toISOString()),
        supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', monthStartDate.toISOString()),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', false).eq('is_draft', false),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_sold', true),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'denied')
      ]);

      // Fetch average rating
      const { data: ratingsData } = await supabase
        .from('reviews')
        .select('rating');

      const averageRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, review) => sum + review.rating, 0) / ratingsData.length
        : 0;

      // Fetch listings by category
      const { data: categoryData } = await supabase
        .from('listings')
        .select('category');

      const listingsByCategory: { [key: string]: number } = {};
      categoryData?.forEach(listing => {
        listingsByCategory[listing.category] = (listingsByCategory[listing.category] || 0) + 1;
      });

      // Calculate top categories with percentages
      const totalCategoryCount = Object.values(listingsByCategory).reduce((sum, count) => sum + count, 0);
      const topCategories = Object.entries(listingsByCategory)
        .map(([category, count]) => ({
          category,
          count,
          percentage: totalCategoryCount > 0 ? Math.round((count / totalCategoryCount) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Fetch revenue by category (total listing prices)
      const { data: listingsWithPrices } = await supabase
        .from('listings')
        .select('category, price')
        .eq('is_sold', true);

      const revenueByCategory: { [key: string]: number } = {};
      listingsWithPrices?.forEach(listing => {
        revenueByCategory[listing.category] = (revenueByCategory[listing.category] || 0) + listing.price;
      });

      const revenueArray = Object.entries(revenueByCategory)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      // Generate daily activity data for the selected time range
      const dailyActivity = [];
      for (let i = daysAgo - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        const { count: listingCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        dailyActivity.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: userCount || 0,
          listings: listingCount || 0
        });
      }

      // Generate user growth data (last 12 months)
      const userGrowth = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

        userGrowth.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          count: count || 0
        });
      }

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        totalReports: totalReports || 0,
        averageRating,
        newUsersThisMonth: newUsersThisMonth || 0,
        newListingsThisMonth: newListingsThisMonth || 0,
        activeListings: activeListings || 0,
        soldListings: soldListings || 0,
        pendingListings: pendingListings || 0,
        approvedListings: approvedListings || 0,
        deniedListings: deniedListings || 0,
        listingsByCategory,
        dailyActivity,
        topCategories,
        userGrowth,
        revenueByCategory: revenueArray
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bf5700]"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Platform insights and statistics</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600">+{analytics.newUsersThisMonth} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalListings.toLocaleString()}</p>
              <p className="text-xs text-green-600">+{analytics.newListingsThisMonth} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeListings.toLocaleString()}</p>
              <p className="text-xs text-blue-600">{analytics.soldListings} sold</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg mr-4">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {analytics.averageRating > 0 ? '★★★★★' : 'No ratings yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Listing Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{analytics.pendingListings}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{analytics.approvedListings}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Denied</p>
              <p className="text-2xl font-bold text-red-600">{analytics.deniedListings}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-4">
            {analytics.topCategories.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm font-medium text-gray-900 w-20 truncate">
                    {category.category}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#bf5700] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{category.count}</span>
                  <span className="text-xs text-gray-500 ml-1">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign size={20} className="mr-2" />
            Revenue by Category
          </h3>
          <div className="space-y-4">
            {analytics.revenueByCategory.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{item.category}</span>
                <span className="text-sm font-bold text-green-600">
                  ${item.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity ({timeRange})</h3>
        <div className="grid grid-cols-7 md:grid-cols-14 gap-2 mb-4">
          {analytics.dailyActivity.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{day.date}</div>
              <div className="flex flex-col space-y-1">
                <div
                  className="bg-blue-200 rounded text-xs py-1 min-h-[20px] flex items-center justify-center"
                  style={{
                    backgroundColor: day.users > 0 ? '#3B82F6' : '#E5E7EB',
                    color: day.users > 0 ? 'white' : '#6B7280',
                    height: `${Math.max(20, day.users * 4)}px`
                  }}
                  title={`${day.users} new users`}
                >
                  {day.users > 0 && day.users}
                </div>
                <div
                  className="bg-green-200 rounded text-xs py-1 min-h-[20px] flex items-center justify-center"
                  style={{
                    backgroundColor: day.listings > 0 ? '#10B981' : '#E5E7EB',
                    color: day.listings > 0 ? 'white' : '#6B7280',
                    height: `${Math.max(20, day.listings * 4)}px`
                  }}
                  title={`${day.listings} new listings`}
                >
                  {day.listings > 0 && day.listings}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>New Users</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>New Listings</span>
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth (Last 12 Months)</h3>
        <div className="flex items-end justify-between space-x-2 h-64">
          {analytics.userGrowth.map((month, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-[#bf5700] rounded-t w-full transition-all duration-300 hover:bg-[#a54700]"
                style={{
                  height: `${Math.max(20, (month.count / Math.max(...analytics.userGrowth.map(m => m.count))) * 200)}px`
                }}
                title={`${month.count} users joined in ${month.month}`}
              />
              <div className="text-xs text-gray-600 mt-2 text-center">{month.month}</div>
              <div className="text-xs font-medium text-gray-900">{month.count}</div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;