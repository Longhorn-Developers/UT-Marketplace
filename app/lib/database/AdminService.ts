import { supabase } from '../supabaseClient';
import { Listing } from '../../props/listing';
import { dbLogger } from './utils';

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  profile_image_url: string | null;
  created_at: string;
  is_admin: boolean;
  is_banned: boolean;
  listing_count?: number;
  last_active?: string;
}

export interface AdminListing extends Listing {
  user: {
    id: string;
    email: string;
    display_name: string | null;
  };
  status: 'pending' | 'approved' | 'denied';
  reported_count?: number;
  created_at: string;
  denial_reason?: string;
}

export interface AdminStats {
  total_users: number;
  total_listings: number;
  pending_listings: number;
  reported_listings: number;
  reported_users: number;
  banned_users: number;
  active_users_today: number;
}

export interface AdminListingReport {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  listing: {
    id: string;
    title: string;
    price: number;
    user_id: string;
    images?: string[];
  };
  reporter: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export interface AdminUserReport {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reported_user: {
    id: string;
    email: string;
    display_name?: string;
  };
  reporter: {
    id: string;
    email: string;
    display_name?: string;
  };
}

/**
 * AdminService class for managing administrative operations
 * Controls both web app and mobile app data through shared database
 */
export class AdminService {
  
  /**
   * Check if user is an admin
   */
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        dbLogger.error('Error checking admin status:', error);
        return false;
      }

      return data?.is_admin || false;
    } catch (error) {
      dbLogger.error('Error in isUserAdmin:', error);
      return false;
    }
  }

  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminStats | null> {
    try {
      dbLogger.info('Fetching admin statistics');

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total listings
      const { count: totalListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Get pending listings
      const { count: pendingListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get reported listings count
      const { count: reportedListings } = await supabase
        .from('listing_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get reported users count  
      const { count: reportedUsers } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get banned users
      const { count: bannedUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_banned', true);

      // Get active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeUsersToday } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', today.toISOString());

      const stats: AdminStats = {
        total_users: totalUsers || 0,
        total_listings: totalListings || 0,
        pending_listings: pendingListings || 0,
        reported_listings: reportedListings || 0,
        reported_users: reportedUsers || 0,
        banned_users: bannedUsers || 0,
        active_users_today: activeUsersToday || 0,
      };

      dbLogger.success('Admin statistics fetched successfully', stats);
      return stats;
    } catch (error) {
      dbLogger.error('Error fetching admin statistics:', error);
      return null;
    }
  }

  /**
   * Get all users with admin information
   */
  static async getAllUsers(limit: number = 50, offset: number = 0): Promise<AdminUser[]> {
    try {
      dbLogger.info('Fetching users for admin', { limit, offset });

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          profile_image_url,
          created_at,
          is_admin,
          is_banned,
          last_sign_in_at
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Error fetching users:', error);
        return [];
      }

      // Get listing counts for each user
      const userIds = data?.map(user => user.id) || [];
      const { data: listingCounts } = await supabase
        .from('listings')
        .select('user_id')
        .in('user_id', userIds);

      const listingCountMap: Record<string, number> = {};
      listingCounts?.forEach(listing => {
        listingCountMap[listing.user_id] = (listingCountMap[listing.user_id] || 0) + 1;
      });

      const users: AdminUser[] = data?.map(user => ({
        ...user,
        listing_count: listingCountMap[user.id] || 0,
        last_active: user.last_sign_in_at,
      })) || [];

      dbLogger.success('Users fetched successfully for admin', { count: users.length });
      return users;
    } catch (error) {
      dbLogger.error('Error in getAllUsers:', error);
      return [];
    }
  }

  /**
   * Get all listings with admin information
   */
  static async getAllListings(limit: number = 50, offset: number = 0): Promise<AdminListing[]> {
    try {
      dbLogger.info('Fetching listings for admin', { limit, offset });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            email,
            display_name
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Error fetching listings:', error);
        return [];
      }

      // Get report counts for listings
      const listingIds = data?.map(listing => listing.id) || [];
      const { data: reportCounts } = await supabase
        .from('listing_reports')
        .select('listing_id')
        .in('listing_id', listingIds);

      const reportCountMap: Record<string, number> = {};
      reportCounts?.forEach(report => {
        reportCountMap[report.listing_id] = (reportCountMap[report.listing_id] || 0) + 1;
      });

      const listings: AdminListing[] = data?.map(listing => ({
        ...listing,
        status: listing.status || 'approved', // Default to approved if no status
        reported_count: reportCountMap[listing.id] || 0,
      })) || [];

      dbLogger.success('Listings fetched successfully for admin', { count: listings.length });
      return listings;
    } catch (error) {
      dbLogger.error('Error in getAllListings:', error);
      return [];
    }
  }

  /**
   * Ban/unban a user
   */
  static async toggleUserBan(userId: string, adminId: string): Promise<{ success: boolean; isBanned: boolean }> {
    try {
      dbLogger.info('Toggling user ban status', { userId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can ban users');
      }

      // Get current ban status
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newBanStatus = !currentUser.is_banned;

      // Update ban status
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_banned: newBanStatus })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      dbLogger.success('User ban status updated', { userId, isBanned: newBanStatus });
      return { success: true, isBanned: newBanStatus };
    } catch (error) {
      dbLogger.error('Error toggling user ban:', error);
      return { success: false, isBanned: false };
    }
  }

  /**
   * Delete a user and all their data
   */
  static async deleteUser(userId: string, adminId: string): Promise<boolean> {
    try {
      dbLogger.info('Deleting user', { userId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can delete users');
      }

      // Don't allow admins to delete themselves
      if (userId === adminId) {
        throw new Error('Cannot delete your own admin account');
      }

      // Delete user's listings first
      const { error: listingsError } = await supabase
        .from('listings')
        .delete()
        .eq('user_id', userId);

      if (listingsError) {
        throw listingsError;
      }

      // Delete user's favorites
      const { error: favoritesError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId);

      if (favoritesError) {
        throw favoritesError;
      }

      // Delete user's messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (messagesError) {
        throw messagesError;
      }

      // Finally delete the user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        throw userError;
      }

      dbLogger.success('User deleted successfully', { userId });
      return true;
    } catch (error) {
      dbLogger.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * Delete a listing
   */
  static async deleteListing(listingId: string, adminId: string): Promise<boolean> {
    try {
      dbLogger.info('Admin deleting listing', { listingId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can delete listings');
      }

      // Delete listing favorites first
      const { error: favoritesError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('listing_id', listingId);

      if (favoritesError) {
        throw favoritesError;
      }

      // Delete listing reports
      const { error: reportsError } = await supabase
        .from('listing_reports')
        .delete()
        .eq('listing_id', listingId);

      if (reportsError) {
        throw reportsError;
      }

      // Delete the listing
      const { error: listingError } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (listingError) {
        throw listingError;
      }

      dbLogger.success('Listing deleted successfully by admin', { listingId });
      return true;
    } catch (error) {
      dbLogger.error('Error deleting listing:', error);
      return false;
    }
  }

  /**
   * Approve/disapprove a listing
   */
  static async toggleListingApproval(listingId: string, adminId: string): Promise<{ success: boolean; isApproved: boolean }> {
    try {
      dbLogger.info('Toggling listing approval', { listingId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can approve listings');
      }

      // Get current status
      const { data: currentListing, error: fetchError } = await supabase
        .from('listings')
        .select('status')
        .eq('id', listingId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newStatus = currentListing.status === 'approved' ? 'pending' : 'approved';

      // Update status
      const { error: updateError } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (updateError) {
        throw updateError;
      }

      dbLogger.success('Listing approval status updated', { listingId, isApproved: newStatus === 'approved' });
      return { success: true, isApproved: newStatus === 'approved' };
    } catch (error) {
      dbLogger.error('Error toggling listing approval:', error);
      return { success: false, isApproved: false };
    }
  }

  /**
   * Make a user an admin
   */
  static async makeUserAdmin(userId: string, adminId: string): Promise<boolean> {
    try {
      dbLogger.info('Making user admin', { userId, adminId });

      // First check if current user is admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can make other users admin');
      }

      const { error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      dbLogger.success('User made admin successfully', { userId });
      return true;
    } catch (error) {
      dbLogger.error('Error making user admin:', error);
      return false;
    }
  }

  /**
   * Search users
   */
  static async searchUsers(searchTerm: string, limit: number = 20): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          profile_image_url,
          created_at,
          is_admin,
          is_banned,
          last_sign_in_at
        `)
        .or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return data?.map(user => ({
        ...user,
        last_active: user.last_sign_in_at,
      })) || [];
    } catch (error) {
      dbLogger.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Search listings
   */
  static async searchListings(searchTerm: string, limit: number = 20): Promise<AdminListing[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            email,
            display_name
          )
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(limit);

      if (error) throw error;

      return data?.map(listing => ({
        ...listing,
        status: listing.status || 'approved', // Default to approved if no status
        reported_count: 0, // Could fetch actual count if needed
      })) || [];
    } catch (error) {
      dbLogger.error('Error searching listings:', error);
      return [];
    }
  }

  /**
   * Get listing reports for admin
   */
  static async getListingReports(limit: number = 50, offset: number = 0): Promise<AdminListingReport[]> {
    try {
      dbLogger.info('Fetching listing reports for admin', { limit, offset });

      const { data, error } = await supabase
        .from('listing_reports')
        .select(`
          *,
          listing:listings(id, title, price, user_id, images),
          reporter:users!reporter_id(id, email, display_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        dbLogger.error('Error fetching listing reports', error);
        return [];
      }

      return data || [];
    } catch (error) {
      dbLogger.error('Error in getListingReports', error);
      return [];
    }
  }

  /**
   * Get user reports for admin
   */
  static async getUserReports(limit: number = 50, offset: number = 0): Promise<AdminUserReport[]> {
    try {
      dbLogger.info('Fetching user reports for admin', { limit, offset });

      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          *,
          reported_user:users!reported_user_id(id, email, display_name),
          reporter:users!reporter_id(id, email, display_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        dbLogger.error('Error fetching user reports', error);
        return [];
      }

      return data || [];
    } catch (error) {
      dbLogger.error('Error in getUserReports', error);
      return [];
    }
  }

  /**
   * Approve listing report (remove listing and delete report)
   */
  static async approveListingReport(reportId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Approving listing report', { reportId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can approve reports' };
      }

      // Get the report details
      const { data: report, error: reportError } = await supabase
        .from('listing_reports')
        .select('listing_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return { success: false, error: 'Report not found' };
      }

      // Delete the listing first (this will also delete related favorites, etc. due to CASCADE)
      const { error: deleteListingError } = await supabase
        .from('listings')
        .delete()
        .eq('id', report.listing_id);

      if (deleteListingError) {
        dbLogger.error('Error deleting listing', deleteListingError);
        return { success: false, error: 'Failed to remove listing' };
      }

      // Delete the report
      const { error: deleteReportError } = await supabase
        .from('listing_reports')
        .delete()
        .eq('id', reportId);

      if (deleteReportError) {
        dbLogger.error('Error deleting report', deleteReportError);
        // Listing is already deleted, but report deletion failed
        return { success: false, error: 'Listing removed but failed to delete report' };
      }

      dbLogger.success('Listing report approved and processed', { reportId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error approving listing report', error);
      return { success: false, error: 'An error occurred while processing the report' };
    }
  }

  /**
   * Reject listing report (delete report only)
   */
  static async rejectListingReport(reportId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Rejecting listing report', { reportId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can reject reports' };
      }

      // Delete the report only
      const { error: deleteError } = await supabase
        .from('listing_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) {
        dbLogger.error('Error deleting report', deleteError);
        return { success: false, error: 'Failed to delete report' };
      }

      dbLogger.success('Listing report rejected and deleted', { reportId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error rejecting listing report', error);
      return { success: false, error: 'An error occurred while processing the report' };
    }
  }

  /**
   * Approve user report (ban user and delete report)
   */
  static async approveUserReport(reportId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Approving user report', { reportId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can approve reports' };
      }

      // Get the report details
      const { data: report, error: reportError } = await supabase
        .from('user_reports')
        .select('reported_user_id')
        .eq('id', reportId)
        .single();

      if (reportError || !report) {
        return { success: false, error: 'Report not found' };
      }

      // Ban the user
      const { error: banError } = await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', report.reported_user_id);

      if (banError) {
        dbLogger.error('Error banning user', banError);
        return { success: false, error: 'Failed to ban user' };
      }

      // Delete the report
      const { error: deleteError } = await supabase
        .from('user_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) {
        dbLogger.error('Error deleting user report', deleteError);
        // User is already banned, but report deletion failed
        return { success: false, error: 'User banned but failed to delete report' };
      }

      dbLogger.success('User report approved and user banned', { reportId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error approving user report', error);
      return { success: false, error: 'An error occurred while processing the report' };
    }
  }

  /**
   * Reject user report (delete report only)
   */
  static async rejectUserReport(reportId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Rejecting user report', { reportId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can reject reports' };
      }

      // Delete the report only
      const { error: deleteError } = await supabase
        .from('user_reports')
        .delete()
        .eq('id', reportId);

      if (deleteError) {
        dbLogger.error('Error deleting user report', deleteError);
        return { success: false, error: 'Failed to delete report' };
      }

      dbLogger.success('User report rejected and deleted', { reportId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error rejecting user report', error);
      return { success: false, error: 'An error occurred while processing the report' };
    }
  }

  /**
   * Get pending listings for admin approval
   */
  static async getPendingListings(limit: number = 50, offset: number = 0): Promise<AdminListing[]> {
    try {
      dbLogger.info('Fetching pending listings for admin', { limit, offset });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            email,
            display_name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        dbLogger.error('Error fetching pending listings', error);
        return [];
      }

      return data?.map(listing => ({
        ...listing,
        status: listing.status || 'pending',
        reported_count: 0, // Could fetch actual count if needed
      })) || [];
    } catch (error) {
      dbLogger.error('Error in getPendingListings', error);
      return [];
    }
  }

  /**
   * Approve a listing
   */
  static async approveListing(listingId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Approving listing', { listingId, adminId });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can approve listings' };
      }

      // Update listing status to approved
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'approved',
          denial_reason: null
        })
        .eq('id', listingId);

      if (error) {
        dbLogger.error('Error approving listing', error);
        return { success: false, error: 'Failed to approve listing' };
      }

      dbLogger.success('Listing approved successfully', { listingId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error in approveListing', error);
      return { success: false, error: 'An error occurred while approving the listing' };
    }
  }

  /**
   * Deny a listing with reason
   */
  static async denyListing(listingId: string, adminId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Denying listing', { listingId, adminId, reason });

      // First check if admin
      const isAdmin = await this.isUserAdmin(adminId);
      if (!isAdmin) {
        return { success: false, error: 'Unauthorized: Only admins can deny listings' };
      }

      // Update listing status to denied with reason
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'denied',
          denial_reason: reason
        })
        .eq('id', listingId);

      if (error) {
        dbLogger.error('Error denying listing', error);
        return { success: false, error: 'Failed to deny listing' };
      }

      dbLogger.success('Listing denied successfully', { listingId, reason });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error in denyListing', error);
      return { success: false, error: 'An error occurred while denying the listing' };
    }
  }

  /**
   * Get denied listings for a user (so they can edit and resubmit)
   */
  static async getDeniedListings(userId: string): Promise<AdminListing[]> {
    try {
      dbLogger.info('Fetching denied listings for user', { userId });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            email,
            display_name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'denied')
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Error fetching denied listings', error);
        return [];
      }

      return data?.map(listing => ({
        ...listing,
        status: listing.status || 'denied',
        reported_count: 0,
      })) || [];
    } catch (error) {
      dbLogger.error('Error in getDeniedListings', error);
      return [];
    }
  }

  /**
   * Resubmit a denied listing for approval (user action)
   */
  static async resubmitListing(listingId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      dbLogger.info('Resubmitting listing', { listingId, userId });

      // Check if user owns the listing and it's denied
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('user_id, status')
        .eq('id', listingId)
        .single();

      if (fetchError || !listing) {
        return { success: false, error: 'Listing not found' };
      }

      if (listing.user_id !== userId) {
        return { success: false, error: 'You can only resubmit your own listings' };
      }

      if (listing.status !== 'denied') {
        return { success: false, error: 'Only denied listings can be resubmitted' };
      }

      // Update listing status back to pending
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'pending',
          denial_reason: null
        })
        .eq('id', listingId);

      if (error) {
        dbLogger.error('Error resubmitting listing', error);
        return { success: false, error: 'Failed to resubmit listing' };
      }

      dbLogger.success('Listing resubmitted successfully', { listingId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error in resubmitListing', error);
      return { success: false, error: 'An error occurred while resubmitting the listing' };
    }
  }
}