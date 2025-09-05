import { supabase } from '../supabaseClient';
import { Message, Conversation } from '../../props/listing';
import {
  buildMessageQuery,
  buildConversationQuery,
  buildUserSettingsQuery,
  buildListingQuery,
  buildMarkAsReadQuery,
  buildDeleteMessagesQuery,
  MessageQueryParams,
  ConversationQueryParams,
  dbLogger
} from './utils';

export interface SendMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  listingId?: string | null;
}

export interface GetMessagesParams {
  userId: string;
  otherUserId: string;
  listingId?: string | null;
}

export interface DeleteConversationParams {
  userId: string;
  otherUserId: string;
  listingId?: string | null;
}

/**
 * MessageService class following mobile app service layer pattern
 * Provides consistent database operations for messaging functionality
 */
export class MessageService {
  /**
   * Send a new message
   */
  static async sendMessage(params: SendMessageParams): Promise<Message | null> {
    const { senderId, receiverId, content, listingId } = params;
    
    try {
      dbLogger.info('Sending message', { senderId, receiverId, listingId });
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content,
          is_read: false,
          listing_id: listingId || null,
        })
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to send message', error);
        return null;
      }

      dbLogger.success('Message sent successfully', { messageId: data.id });
      return data as Message;
    } catch (error) {
      dbLogger.error('Error in sendMessage', error);
      return null;
    }
  }

  /**
   * Get messages between two users for a specific conversation
   */
  static async getMessages(params: GetMessagesParams): Promise<Message[]> {
    const { userId, otherUserId, listingId } = params;
    
    try {
      dbLogger.info('Fetching messages', { userId, otherUserId, listingId });
      
      const query = buildMessageQuery(supabase, {
        userId,
        otherUserId,
        listingId
      });

      const { data, error } = await query;

      if (error) {
        dbLogger.error('Failed to fetch messages', error);
        return [];
      }

      dbLogger.success('Messages fetched successfully', { count: data?.length || 0 });
      return data as Message[] || [];
    } catch (error) {
      dbLogger.error('Error in getMessages', error);
      return [];
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: string): Promise<Conversation[]> {
    try {
      dbLogger.info('Fetching conversations', { userId });
      
      const query = buildConversationQuery(supabase, { userId });
      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        dbLogger.error('Failed to fetch conversations', messagesError);
        return [];
      }

      const filteredMessages = messagesData?.filter(
        (msg) => msg.sender_id === userId || msg.receiver_id === userId
      ) || [];

      // Group by user_id and listing_id
      const conversationMap = new Map<string, Conversation>();
      
      for (const message of filteredMessages) {
        const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        const listingId = message.listing_id || "general";
        const key = `${partnerId}:${listingId}`;

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            user_id: partnerId,
            user_name: "", // Will be populated later
            user_image: undefined,
            listing_id: listingId,
            listing_title: "",
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.receiver_id === userId && !message.is_read ? 1 : 0,
          });
        } else {
          const conv = conversationMap.get(key)!;
          if (message.receiver_id === userId && !message.is_read) {
            conv.unread_count++;
          }
        }
      }

      // Fetch user settings for all partner IDs
      const partnerIds = Array.from(conversationMap.values()).map((c) => c.user_id);
      const listingIds = Array.from(conversationMap.values())
        .map((c) => c.listing_id)
        .filter((id) => id !== "general");

      // Fetch user information
      if (partnerIds.length > 0) {
        const { data: userSettingsData } = await buildUserSettingsQuery(supabase, partnerIds);
        
        // Update conversations with user info
        for (const conv of conversationMap.values()) {
          const userSettings = userSettingsData?.find((u) => u.id === conv.user_id);
          if (userSettings) {
            conv.user_name = userSettings.display_name || conv.user_id;
            conv.user_image = userSettings.profile_image_url || undefined;
          }
        }
      }

      // Fetch listing information
      if (listingIds.length > 0) {
        const { data: listingData } = await buildListingQuery(supabase, listingIds);
        
        // Update conversations with listing info
        for (const conv of conversationMap.values()) {
          const listing = listingData?.find((l) => l.id === conv.listing_id);
          if (listing) {
            conv.listing_title = listing.title;
          }
        }
      }

      const conversations = Array.from(conversationMap.values());
      dbLogger.success('Conversations fetched successfully', { count: conversations.length });
      return conversations;
    } catch (error) {
      dbLogger.error('Error in getConversations', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(messageIds: string[]): Promise<boolean> {
    if (messageIds.length === 0) return true;

    try {
      dbLogger.info('Marking messages as read', { count: messageIds.length });
      
      const { error } = await buildMarkAsReadQuery(supabase, messageIds);

      if (error) {
        dbLogger.error('Failed to mark messages as read', error);
        return false;
      }

      dbLogger.success('Messages marked as read successfully');
      return true;
    } catch (error) {
      dbLogger.error('Error in markMessagesAsRead', error);
      return false;
    }
  }

  /**
   * Delete a single message
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      dbLogger.info('Deleting message', { messageId });
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        dbLogger.error('Failed to delete message', error);
        return false;
      }

      dbLogger.success('Message deleted successfully');
      return true;
    } catch (error) {
      dbLogger.error('Error in deleteMessage', error);
      return false;
    }
  }

  /**
   * Delete entire conversation between two users
   */
  static async deleteConversation(params: DeleteConversationParams): Promise<boolean> {
    const { userId, otherUserId, listingId } = params;
    
    try {
      dbLogger.info('Deleting conversation', { userId, otherUserId, listingId });
      
      const query = buildDeleteMessagesQuery(supabase, {
        userId,
        otherUserId,
        listingId
      });

      const { error } = await query;

      if (error) {
        dbLogger.error('Failed to delete conversation', error);
        return false;
      }

      dbLogger.success('Conversation deleted successfully');
      return true;
    } catch (error) {
      dbLogger.error('Error in deleteConversation', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  static subscribeToMessages(
    userId: string, 
    onMessage: (message: Message) => void,
    onError?: (error: any) => void
  ) {
    dbLogger.info('Setting up message subscription', { userId });
    
    const subscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as Message;
              if (newMessage.sender_id === userId || newMessage.receiver_id === userId) {
                dbLogger.info('New message received via subscription', { messageId: newMessage.id });
                onMessage(newMessage);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedMessage = payload.new as Message;
              if (updatedMessage.sender_id === userId || updatedMessage.receiver_id === userId) {
                dbLogger.info('Message updated via subscription', { messageId: updatedMessage.id });
                onMessage(updatedMessage);
              }
            } else if (payload.eventType === 'DELETE') {
              // Handle message deletion if needed
              dbLogger.info('Message deleted via subscription');
            }
          } catch (error) {
            dbLogger.error('Error processing subscription event', error);
            if (onError) onError(error);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dbLogger.success('Message subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          dbLogger.error('Message subscription error', status);
        }
      });

    return subscription;
  }
}