import { SupabaseClient } from '@supabase/supabase-js';

export interface MessageQueryParams {
  userId: string;
  otherUserId: string;
  listingId?: string | null;
}

export interface ConversationQueryParams {
  userId: string;
}

/**
 * Build a query to fetch messages between two users for a specific listing
 * Follows the same pattern as the mobile app's buildMessageQuery utility
 */
export const buildMessageQuery = (
  supabase: SupabaseClient, 
  params: MessageQueryParams
) => {
  const { userId, otherUserId, listingId } = params;
  
  let query = supabase
    .from('messages')
    .select('*');

  if (listingId === null || listingId === "general") {
    // General conversation (no specific listing)
    query = query.or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    ).is('listing_id', null);
  } else {
    // Listing-specific conversation
    query = query.or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId},listing_id.eq.${listingId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId},listing_id.eq.${listingId})`
    );
  }

  return query.order('created_at', { ascending: true });
};

/**
 * Build a query to fetch all conversations for a user
 */
export const buildConversationQuery = (
  supabase: SupabaseClient, 
  params: ConversationQueryParams
) => {
  const { userId } = params;
  
  return supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });
};

/**
 * Build a query to fetch user settings by user IDs
 */
export const buildUserSettingsQuery = (
  supabase: SupabaseClient, 
  userIds: string[]
) => {
  return supabase
    .from('users')
    .select('id, email, display_name, profile_image_url')
    .in('id', userIds);
};

/**
 * Build a query to fetch listing information by IDs
 */
export const buildListingQuery = (
  supabase: SupabaseClient, 
  listingIds: string[]
) => {
  return supabase
    .from('listings')
    .select('id, title')
    .in('id', listingIds);
};

/**
 * Build a query to mark messages as read
 */
export const buildMarkAsReadQuery = (
  supabase: SupabaseClient, 
  messageIds: string[]
) => {
  return supabase
    .from('messages')
    .update({ is_read: true })
    .in('id', messageIds);
};

/**
 * Build a query to delete messages
 */
export const buildDeleteMessagesQuery = (
  supabase: SupabaseClient, 
  params: MessageQueryParams
) => {
  const { userId, otherUserId, listingId } = params;
  
  let query = supabase
    .from('messages')
    .delete();

  if (listingId === null || listingId === "general") {
    query = query.or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    ).is('listing_id', null);
  } else {
    query = query.or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId},listing_id.eq.${listingId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId},listing_id.eq.${listingId})`
    );
  }

  return query;
};

/**
 * Utility to validate user ID format
 */
export const isValidUserId = (userId: string): boolean => {
  // Check if it's a valid UUID format (mobile app pattern)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
};

/**
 * Structured logging utility following mobile app patterns
 */
export const dbLogger = {
  success: (operation: string, details?: any) => {
    console.log(`✅ ${operation}`, details ? details : '');
  },
  
  error: (operation: string, error: any) => {
    console.log(`❌ ${operation}:`, error);
  },
  
  info: (operation: string, details?: any) => {
    console.log(`ℹ️ ${operation}`, details ? details : '');
  },
  
  warn: (operation: string, details?: any) => {
    console.log(`⚠️ ${operation}`, details ? details : '');
  }
};