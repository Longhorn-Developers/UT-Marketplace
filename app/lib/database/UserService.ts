import { supabase } from '../supabaseClient';
import { dbLogger } from './utils';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  profile_image_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  onboard_complete?: boolean;
  status?: 'pending' | 'active';
  email_verified_at?: string | null;
  notification_preferences?: {
    email_notifications: boolean;
    browser_notifications: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserRating {
  id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  rater_name?: string;
}

export interface CreateUserProfileParams {
  id: string;
  email: string;
  display_name?: string;
  profile_image_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  onboard_complete?: boolean;
  status?: 'pending' | 'active';
  email_verified_at?: string | null;
  notification_preferences?: {
    email_notifications: boolean;
    browser_notifications: boolean;
  };
}

export interface UpdateUserProfileParams {
  id: string;
  display_name?: string;
  profile_image_url?: string;
  bio?: string;
  phone?: string;
  location?: string;
  onboard_complete?: boolean;
  status?: 'pending' | 'active';
  email_verified_at?: string | null;
}

export interface CreateRatingParams {
  raterId: string;
  ratedId: string;
  rating: number;
  comment?: string;
}

export interface UserStats {
  listingsCount: number;
  averageRating: number;
  totalRatings: number;
  completedTransactions: number;
  memberSince: string;
}

/**
 * UserService class following mobile app service layer pattern
 * Provides consistent database operations for user functionality
 */
export class UserService {
  /**
   * Create or update user profile
   */
  static async upsertUserProfile(params: CreateUserProfileParams): Promise<UserProfile | null> {
    const {
      id,
      email,
      display_name,
      profile_image_url,
      bio,
      phone,
      location,
      onboard_complete,
      status,
      email_verified_at,
      notification_preferences
    } = params;

    try {
      dbLogger.info('Upserting user profile', { userId: id, email });

      const payload: Record<string, any> = {
        id,
        email,
        display_name: display_name || email.split('@')[0],
        profile_image_url,
        bio,
        phone,
        location,
        onboard_complete,
        notification_preferences,
        updated_at: new Date().toISOString(),
      };

      if (status !== undefined) {
        payload.status = status;
      }

      if (email_verified_at !== undefined) {
        payload.email_verified_at = email_verified_at;
      }

      const { data, error } = await supabase
        .from('users')
        .upsert(payload, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to upsert user profile', error);
        return null;
      }

      dbLogger.success('User profile upserted successfully', { userId: data.id });
      return data as UserProfile;
    } catch (error) {
      dbLogger.error('Error in upsertUserProfile', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      dbLogger.info('Fetching user profile', { userId });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          dbLogger.warn('User profile not found', { userId });
          return null;
        }
        dbLogger.error('Failed to fetch user profile', error);
        return null;
      }

      dbLogger.success('User profile fetched successfully', { userId });
      return data as UserProfile;
    } catch (error) {
      dbLogger.error('Error in getUserProfile', error);
      return null;
    }
  }

  /**
   * Get user profile by email (for legacy compatibility)
   */
  static async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      dbLogger.info('Fetching user profile by email', { email });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          dbLogger.warn('User profile not found by email', { email });
          return null;
        }
        dbLogger.error('Failed to fetch user profile by email', error);
        return null;
      }

      dbLogger.success('User profile fetched by email successfully', { email });
      return data as UserProfile;
    } catch (error) {
      dbLogger.error('Error in getUserProfileByEmail', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(params: UpdateUserProfileParams): Promise<UserProfile | null> {
    const { id, ...updateData } = params;

    try {
      dbLogger.info('Updating user profile', { userId: id });

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to update user profile', error);
        return null;
      }

      dbLogger.success('User profile updated successfully', { userId: data.id });
      return data as UserProfile;
    } catch (error) {
      dbLogger.error('Error in updateUserProfile', error);
      return null;
    }
  }

  /**
   * Create or update user rating
   */
  static async upsertUserRating(params: CreateRatingParams): Promise<UserRating | null> {
    const { raterId, ratedId, rating, comment } = params;

    if (raterId === ratedId) {
      dbLogger.warn('User cannot rate themselves', { raterId, ratedId });
      return null;
    }

    try {
      dbLogger.info('Upserting user rating', { raterId, ratedId, rating });

      const { data, error } = await supabase
        .from('user_ratings')
        .upsert({
          rater_id: raterId,
          rated_id: ratedId,
          rating,
          comment,
        }, {
          onConflict: 'rater_id,rated_id'
        })
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to upsert user rating', error);
        return null;
      }

      dbLogger.success('User rating upserted successfully', { ratingId: data.id });
      return data as UserRating;
    } catch (error) {
      dbLogger.error('Error in upsertUserRating', error);
      return null;
    }
  }

  /**
   * Get user ratings (received by user)
   */
  static async getUserRatings(userId: string): Promise<UserRating[]> {
    try {
      dbLogger.info('Fetching user ratings', { userId });

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          rater:users!reviewer_id(
            display_name,
            profile_image_url
          )
        `)
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Failed to fetch user ratings', error);
        return [];
      }

      const ratings = data?.map(rating => ({
        ...rating,
        rater_name: rating.rater?.display_name || 'Anonymous',
      })) as UserRating[] || [];

      dbLogger.success('User ratings fetched successfully', { userId, count: ratings.length });
      return ratings;
    } catch (error) {
      dbLogger.error('Error in getUserRatings', error);
      return [];
    }
  }

  /**
   * Get user's given rating for another user
   */
  static async getUserRatingFor(raterId: string, ratedId: string): Promise<UserRating | null> {
    try {
      dbLogger.info('Fetching user rating for specific user', { raterId, ratedId });

      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('rater_id', raterId)
        .eq('rated_id', ratedId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rating found
        }
        dbLogger.error('Failed to fetch user rating', error);
        return null;
      }

      dbLogger.success('User rating fetched successfully');
      return data as UserRating;
    } catch (error) {
      dbLogger.error('Error in getUserRatingFor', error);
      return null;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    try {
      dbLogger.info('Fetching user stats', { userId });

      // Get listings count
      const { data: listings } = await supabase
        .from('listings')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('is_draft', false);

      // Get ratings
      const { data: ratings } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', userId);

      // Get user profile for member since date
      const { data: profile } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      const stats: UserStats = {
        listingsCount: listings?.length || 0,
        averageRating,
        totalRatings: ratings?.length || 0,
        completedTransactions: 0, // This would need a transactions table
        memberSince: profile?.created_at || new Date().toISOString(),
      };

      dbLogger.success('User stats fetched successfully', { userId });
      return stats;
    } catch (error) {
      dbLogger.error('Error in getUserStats', error);
      return {
        listingsCount: 0,
        averageRating: 0,
        totalRatings: 0,
        completedTransactions: 0,
        memberSince: new Date().toISOString(),
      };
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(userId: string, imageFile: File): Promise<string | null> {
    try {
      dbLogger.info('Uploading profile image', { userId });

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, imageFile);

      if (error) {
        dbLogger.error('Failed to upload profile image', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);

      // Update user profile with new image URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        dbLogger.error('Failed to update profile with image URL', updateError);
        return null;
      }

      dbLogger.success('Profile image uploaded successfully', { userId });
      return urlData.publicUrl;
    } catch (error) {
      dbLogger.error('Error in uploadProfileImage', error);
      return null;
    }
  }

  /**
   * Search users by display name or email
   */
  static async searchUsers(searchTerm: string): Promise<UserProfile[]> {
    try {
      dbLogger.info('Searching users', { searchTerm });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('display_name')
        .limit(10);

      if (error) {
        dbLogger.error('Failed to search users', error);
        return [];
      }

      dbLogger.success('User search completed', { count: data?.length || 0 });
      return data as UserProfile[] || [];
    } catch (error) {
      dbLogger.error('Error in searchUsers', error);
      return [];
    }
  }

  /**
   * Check if user can be contacted (not blocked, etc.)
   */
  static async canContactUser(fromUserId: string, toUserId: string): Promise<boolean> {
    try {
      dbLogger.info('Checking if user can be contacted', { fromUserId, toUserId });

      // For now, just check if both users exist
      // In the future, this could check for blocks, restrictions, etc.
      const { data: fromUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', fromUserId)
        .single();

      const { data: toUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', toUserId)
        .single();

      const canContact = !!(fromUser && toUser);
      
      dbLogger.success('Contact check completed', { canContact });
      return canContact;
    } catch (error) {
      dbLogger.error('Error in canContactUser', error);
      return false;
    }
  }

  /**
   * Get recent activity for user
   */
  static async getUserActivity(userId: string, limit: number = 10): Promise<any[]> {
    try {
      dbLogger.info('Fetching user activity', { userId, limit });

      // Get recent listings
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, created_at, is_sold')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Get recent ratings received
      const { data: ratings } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          rater:users!reviewer_id(display_name)
        `)
        .eq('reviewed_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Combine and sort activities
      const activities = [
        ...(listings?.map(l => ({
          type: 'listing',
          id: l.id,
          title: l.title,
          created_at: l.created_at,
          data: l,
        })) || []),
        ...(ratings?.map(r => ({
          type: 'rating',
          id: r.id,
          title: `Received ${r.rating}-star rating`,
          created_at: r.created_at,
          data: r,
        })) || []),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      dbLogger.success('User activity fetched successfully', { userId, count: activities.length });
      return activities;
    } catch (error) {
      dbLogger.error('Error in getUserActivity', error);
      return [];
    }
  }
}
