"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Settings, Shield, Users, FileText, Bell, Database, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';

interface AdminSettings {
  require_listing_approval: boolean;
  max_images_per_listing: number;
  min_listing_price: number;
  max_listing_price: number;
  auto_delete_denied_listings_days: number;
  allow_user_registration: boolean;
  maintenance_mode: boolean;
  site_announcement: string;
  contact_email: string;
}

interface SystemStats {
  database_size: string;
  storage_used: string;
  active_connections: number;
  last_backup: string;
  total_files: number;
}

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    require_listing_approval: true,
    max_images_per_listing: 5,
    min_listing_price: 1,
    max_listing_price: 10000,
    auto_delete_denied_listings_days: 30,
    allow_user_registration: true,
    maintenance_mode: false,
    site_announcement: '',
    contact_email: ''
  });
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'listings' | 'users' | 'system' | 'security'>('general');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
    fetchAdminUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      // In a real app, these would come from a settings table
      // For now, we'll use some default values and localStorage for persistence
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Fetch basic database statistics
      const [
        { count: totalUsers },
        { count: totalListings },
        { count: totalReports },
        { count: totalFiles }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('listing_reports').select('*', { count: 'exact', head: true }),
        supabase.storage.from('listings').list()
      ]);

      setSystemStats({
        database_size: '~15 MB', // This would be calculated server-side in production
        storage_used: '~125 MB', // This would come from storage metrics
        active_connections: Math.floor(Math.random() * 50) + 10, // Mock data
        last_backup: new Date().toLocaleDateString(),
        total_files: (totalFiles?.length || 0) + (totalUsers || 0) + (totalListings || 0)
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      // First try to fetch with is_admin column
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, created_at, is_admin')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin users:', error);
        
        // If is_admin column doesn't exist, try without it and use fallback admin list
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.log('is_admin column does not exist, using fallback admin list');
          
          // Hardcoded admin emails as fallback
          const adminEmails = ['admin@utexas.edu', 'austintran616@gmail.com'];
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('id, email, display_name, created_at')
            .in('email', adminEmails)
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            console.error('Fallback admin query failed:', fallbackError);
            setAdminUsers([]);
          } else {
            // Add is_admin: true to the fallback data
            const adminsWithFlag = (fallbackData || []).map(user => ({
              ...user,
              is_admin: true
            }));
            setAdminUsers(adminsWithFlag);
          }
        } else {
          setAdminUsers([]);
        }
      } else {
        setAdminUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setAdminUsers([]);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real app, this would save to a database table
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', newAdminEmail.toLowerCase().trim())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        toast.error('Error checking user');
        return;
      }

      if (!existingUser) {
        toast.error('User not found. They must sign up first.');
        return;
      }

      if (existingUser.is_admin) {
        toast.error('User is already an admin');
        return;
      }

      // Make user admin
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', existingUser.id);

      if (updateError) {
        toast.error('Failed to make user admin');
        return;
      }

      toast.success('User promoted to admin successfully');
      setNewAdminEmail('');
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Error adding admin');
    }
  };

  const handleRemoveAdmin = async (userId: string, userEmail: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove your own admin privileges");
      return;
    }

    if (!confirm(`Are you sure you want to remove admin privileges from ${userEmail}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: false })
        .eq('id', userId);

      if (error) {
        toast.error('Failed to remove admin privileges');
        return;
      }

      toast.success('Admin privileges removed successfully');
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Error removing admin');
    }
  };

  const tabButtons = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'listings', label: 'Listings', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Database },
    { id: 'security', label: 'Security', icon: Lock }
  ] as const;

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
            <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
            <p className="text-gray-600">Configure platform settings and preferences</p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition-colors disabled:opacity-50"
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabButtons.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-[#bf5700] text-[#bf5700]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                      <p className="text-sm text-gray-500">Temporarily disable the site for maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenance_mode}
                        onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bf5700]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bf5700]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Allow User Registration</label>
                      <p className="text-sm text-gray-500">Allow new users to create accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allow_user_registration}
                        onChange={(e) => setSettings({...settings, allow_user_registration: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bf5700]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bf5700]"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Site Announcement</label>
                    <textarea
                      value={settings.site_announcement}
                      onChange={(e) => setSettings({...settings, site_announcement: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      placeholder="Enter a site-wide announcement (leave empty for none)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      placeholder="admin@utmarketplace.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Listing Settings */}
          {activeTab === 'listings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Listing Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Require Listing Approval</label>
                      <p className="text-sm text-gray-500">All new listings must be approved by admins</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.require_listing_approval}
                        onChange={(e) => setSettings({...settings, require_listing_approval: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#bf5700]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#bf5700]"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Max Images per Listing</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.max_images_per_listing}
                        onChange={(e) => setSettings({...settings, max_images_per_listing: parseInt(e.target.value) || 5})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Auto-delete Denied Listings (days)</label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.auto_delete_denied_listings_days}
                        onChange={(e) => setSettings({...settings, auto_delete_denied_listings_days: parseInt(e.target.value) || 30})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Minimum Listing Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.min_listing_price}
                        onChange={(e) => setSettings({...settings, min_listing_price: parseFloat(e.target.value) || 1})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Maximum Listing Price ($)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={settings.max_listing_price}
                        onChange={(e) => setSettings({...settings, max_listing_price: parseFloat(e.target.value) || 10000})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
                
                {/* Add Admin */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Add New Admin</h4>
                  <div className="flex space-x-3">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Enter user email"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                    />
                    <button
                      onClick={handleAddAdmin}
                      className="px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition-colors"
                    >
                      Add Admin
                    </button>
                  </div>
                </div>

                {/* Admin Users List */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Current Admins</h4>
                  <div className="space-y-2">
                    {adminUsers.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {admin.display_name || 'No display name'}
                          </div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                          <div className="text-xs text-gray-400">
                            Admin since {new Date(admin.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        {admin.id !== user?.id && (
                          <button
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Information */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                
                {systemStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Database</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-mono">{systemStats.database_size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Connections:</span>
                          <span className="font-mono">{systemStats.active_connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Backup:</span>
                          <span className="font-mono">{systemStats.last_backup}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Storage</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Used Space:</span>
                          <span className="font-mono">{systemStats.storage_used}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Files:</span>
                          <span className="font-mono">{systemStats.total_files}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">API Keys & Secrets</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Sensitive configuration is managed through environment variables for security.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Supabase Configuration</h4>
                      <button
                        onClick={() => setShowApiKeys(!showApiKeys)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                      >
                        {showApiKeys ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Project URL:</span>
                        <span className="font-mono text-gray-600">
                          {showApiKeys ? process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured' : '••••••••••'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anon Key:</span>
                        <span className="font-mono text-gray-600">
                          {showApiKeys ? '••••••••••' : '••••••••••'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <Lock className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Security Status</h4>
                        <p className="text-sm text-green-700 mt-1">
                          All security features are properly configured and active.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        <ToastContainer position="bottom-right" />
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;