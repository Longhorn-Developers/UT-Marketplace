import { supabaseAdmin } from '../supabaseAdmin';
import { supabase } from '../supabaseClient';

export type NotificationType =
  | 'report_received'   // Reporter: "Thank you for reporting"
  | 'action_taken'      // Reporter: "We have taken action"
  | 'warning'           // Reported user: listing removed - 1st strike warning
  | 'temp_suspension'   // Reported user: account temporarily restricted
  | 'permanent_ban';    // Reported user: account permanently removed

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export class NotificationService {
  /**
   * Create a notification for a user (server-side, uses admin client to bypass RLS)
   */
  static async createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          related_id: params.relatedId ?? null,
          is_read: false,
        });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  /**
   * Fetch all notifications for a user 
   */
  static async getUserNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      return !error;
    } catch {
      return false;
    }
  }


  /**
   * Notify reporter that their report was received (sent at report submission time)
   */
  static async notifyReportReceived(reporterId: string): Promise<void> {
    await this.createNotification({
      userId: reporterId,
      type: 'report_received',
      title: 'Report Received',
      message:
        'Thank you for reporting. We are reviewing your report and will keep you updated.',
    });
  }

  /**
   * Notify reporter that action was taken on the account they reported
   */
  static async notifyReporterActionTaken(reporterId: string): Promise<void> {
    await this.createNotification({
      userId: reporterId,
      type: 'action_taken',
      title: 'Report Update',
      message:
        'Update: The account you reported has been actioned by our moderation team.',
    });
  }

  /**
   * Notify reported user of a 1st-strike warning (listing removed)
   */
  static async notifyWarning(
    userId: string,
    listingTitle?: string,
    reason?: string
  ): Promise<void> {
    const listingPart = listingTitle ? ` for "${listingTitle}"` : '';
    const violationPart = reason ? ` ${reason}.` : ' our community guidelines.';
    await this.createNotification({
      userId,
      type: 'warning',
      title: 'Policy Violation Warning',
      message: `Your listing${listingPart} was removed for violating${violationPart} This is a warning.`,
    });
  }

  /**
   * Notify reported user that their account is temporarily suspended
   */
  static async notifyTempSuspension(userId: string, until: Date): Promise<void> {
    const untilStr = until.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    await this.createNotification({
      userId,
      type: 'temp_suspension',
      title: 'Account Temporarily Restricted',
      message: `Your account is temporarily restricted. You may browse but cannot message or create listings until ${untilStr}.`,
    });
  }

  /**
   * Notify reported user that their account has been permanently banned
   */
  static async notifyPermanentBan(userId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'permanent_ban',
      title: 'Account Removed',
      message:
        'Your account has been permanently removed from UT Marketplace due to repeated or severe policy violations.',
    });
  }
}
