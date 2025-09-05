import { supabase } from '../supabaseClient';
import { dbLogger } from './utils';

export interface ReportReason {
  key: string;
  label: string;
  description: string;
}

export const LISTING_REPORT_REASONS: ReportReason[] = [
  { key: 'spam', label: 'Spam', description: 'This listing is spam or unwanted commercial content' },
  { key: 'scam', label: 'Scam/Fraud', description: 'This appears to be fraudulent or a scam' },
  { key: 'inappropriate', label: 'Inappropriate Content', description: 'Contains inappropriate images or text' },
  { key: 'fake', label: 'Fake/Misleading', description: 'The listing is fake or misleading' },
  { key: 'prohibited', label: 'Prohibited Item', description: 'This item is not allowed to be sold' },
  { key: 'duplicate', label: 'Duplicate', description: 'This is a duplicate of another listing' },
  { key: 'other', label: 'Other', description: 'Other violation not listed above' }
];

export const USER_REPORT_REASONS: ReportReason[] = [
  { key: 'harassment', label: 'Harassment', description: 'This user is harassing others' },
  { key: 'spam', label: 'Spam', description: 'This user is posting spam' },
  { key: 'scam', label: 'Scammer', description: 'This user appears to be running scams' },
  { key: 'fake_profile', label: 'Fake Profile', description: 'This appears to be a fake profile' },
  { key: 'inappropriate', label: 'Inappropriate Behavior', description: 'Inappropriate messages or behavior' },
  { key: 'impersonation', label: 'Impersonation', description: 'This user is impersonating someone else' },
  { key: 'other', label: 'Other', description: 'Other violation not listed above' }
];

export interface ListingReport {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
}

export interface UserReport {
  id: string;
  reported_user_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
}

export interface CreateListingReportParams {
  listingId: string;
  reporterId: string;
  reason: string;
  description?: string;
}

export interface CreateUserReportParams {
  reportedUserId: string;
  reporterId: string;
  reason: string;
  description?: string;
}

/**
 * ReportService class for managing report operations
 * 
 * Database Schema:
 * 
 * CREATE TABLE listing_reports (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
 *   reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   reason VARCHAR(50) NOT NULL,
 *   description TEXT,
 *   status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   reviewed_at TIMESTAMP NULL,
 *   reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
 *   admin_notes TEXT,
 *   UNIQUE(listing_id, reporter_id)
 * );
 * 
 * CREATE TABLE user_reports (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   reason VARCHAR(50) NOT NULL,
 *   description TEXT,
 *   status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   reviewed_at TIMESTAMP NULL,
 *   reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
 *   admin_notes TEXT,
 *   UNIQUE(reported_user_id, reporter_id)
 * );
 * 
 * CREATE INDEX idx_listing_reports_listing_id ON listing_reports(listing_id);
 * CREATE INDEX idx_listing_reports_status ON listing_reports(status);
 * CREATE INDEX idx_user_reports_reported_user_id ON user_reports(reported_user_id);
 * CREATE INDEX idx_user_reports_status ON user_reports(status);
 */
export class ReportService {
  
  /**
   * Report a listing
   */
  static async reportListing(params: CreateListingReportParams): Promise<{ success: boolean; error?: string }> {
    const { listingId, reporterId, reason, description } = params;

    try {
      dbLogger.info('Creating listing report', { listingId, reporterId, reason });

      // Check if user has already reported this listing
      const { data: existingReport } = await supabase
        .from('listing_reports')
        .select('id')
        .eq('listing_id', listingId)
        .eq('reporter_id', reporterId)
        .single();

      if (existingReport) {
        return { success: false, error: 'You have already reported this listing' };
      }

      // Check if listing exists
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, user_id')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        return { success: false, error: 'Listing not found' };
      }

      // Don't allow users to report their own listings
      if (listing.user_id === reporterId) {
        return { success: false, error: 'You cannot report your own listing' };
      }

      // Create the report
      const { error } = await supabase
        .from('listing_reports')
        .insert({
          listing_id: listingId,
          reporter_id: reporterId,
          reason,
          description,
          status: 'pending'
        });

      if (error) {
        dbLogger.error('Failed to create listing report', error);
        return { success: false, error: 'Failed to submit report' };
      }

      dbLogger.success('Listing report created successfully', { listingId, reporterId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error in reportListing', error);
      return { success: false, error: 'An error occurred while submitting the report' };
    }
  }

  /**
   * Report a user
   */
  static async reportUser(params: CreateUserReportParams): Promise<{ success: boolean; error?: string }> {
    const { reportedUserId, reporterId, reason, description } = params;

    try {
      dbLogger.info('Creating user report', { reportedUserId, reporterId, reason });

      // Don't allow users to report themselves
      if (reportedUserId === reporterId) {
        return { success: false, error: 'You cannot report yourself' };
      }

      // Check if user has already reported this user
      const { data: existingReport } = await supabase
        .from('user_reports')
        .select('id')
        .eq('reported_user_id', reportedUserId)
        .eq('reporter_id', reporterId)
        .single();

      if (existingReport) {
        return { success: false, error: 'You have already reported this user' };
      }

      // Check if reported user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', reportedUserId)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Create the report
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reported_user_id: reportedUserId,
          reporter_id: reporterId,
          reason,
          description,
          status: 'pending'
        });

      if (error) {
        dbLogger.error('Failed to create user report', error);
        return { success: false, error: 'Failed to submit report' };
      }

      dbLogger.success('User report created successfully', { reportedUserId, reporterId });
      return { success: true };
    } catch (error) {
      dbLogger.error('Error in reportUser', error);
      return { success: false, error: 'An error occurred while submitting the report' };
    }
  }

  /**
   * Check if user has already reported a listing
   */
  static async hasReportedListing(reporterId: string, listingId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('listing_reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('listing_id', listingId)
        .single();

      return !!data;
    } catch (error) {
      dbLogger.error('Error checking listing report status', error);
      return false;
    }
  }

  /**
   * Check if user has already reported another user
   */
  static async hasReportedUser(reporterId: string, reportedUserId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_reports')
        .select('id')
        .eq('reporter_id', reporterId)
        .eq('reported_user_id', reportedUserId)
        .single();

      return !!data;
    } catch (error) {
      dbLogger.error('Error checking user report status', error);
      return false;
    }
  }

  /**
   * Get listing reports (for admin)
   */
  static async getListingReports(limit: number = 50, offset: number = 0): Promise<ListingReport[]> {
    try {
      const { data, error } = await supabase
        .from('listing_reports')
        .select(`
          *,
          listing:listings(id, title, user_id),
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
   * Get user reports (for admin)
   */
  static async getUserReports(limit: number = 50, offset: number = 0): Promise<UserReport[]> {
    try {
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
   * Get report counts for a listing
   */
  static async getListingReportCount(listingId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('listing_reports')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId);

      if (error) {
        dbLogger.error('Error getting listing report count', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      dbLogger.error('Error in getListingReportCount', error);
      return 0;
    }
  }

  /**
   * Get report counts for a user
   */
  static async getUserReportCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true })
        .eq('reported_user_id', userId);

      if (error) {
        dbLogger.error('Error getting user report count', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      dbLogger.error('Error in getUserReportCount', error);
      return 0;
    }
  }

  /**
   * Update report status (for admin)
   */
  static async updateReportStatus(
    reportId: string, 
    reportType: 'listing' | 'user',
    status: 'reviewed' | 'resolved' | 'dismissed',
    adminId: string,
    adminNotes?: string
  ): Promise<boolean> {
    try {
      const table = reportType === 'listing' ? 'listing_reports' : 'user_reports';
      
      const { error } = await supabase
        .from(table)
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          admin_notes: adminNotes
        })
        .eq('id', reportId);

      if (error) {
        dbLogger.error('Error updating report status', error);
        return false;
      }

      dbLogger.success('Report status updated', { reportId, status });
      return true;
    } catch (error) {
      dbLogger.error('Error in updateReportStatus', error);
      return false;
    }
  }
}