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
import { encryptMessage, decryptMessage } from '../encryption';
import { getPublicKey } from './KeyService';

export interface SendMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  listingId?: string | null;
  encryptionEnabled?: boolean; // Flag to enable/disable encryption (default: true)
}

export interface GetMessagesParams {
  userId: string;
  otherUserId: string;
  listingId?: string | null;
  privateKey?: string; // User's private key for decryption (optional for backwards compatibility)
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
   * Send a new message (with optional encryption)
   */
  static async sendMessage(params: SendMessageParams): Promise<Message | null> {
    const { senderId, receiverId, content, listingId, encryptionEnabled = true } = params;

    try {
      dbLogger.info('Sending message', { senderId, receiverId, listingId, encrypted: encryptionEnabled });

      let contentToStore = content;

      // Encrypt message if encryption is enabled
      if (encryptionEnabled) {
        // Fetch receiver's public key
        const receiverPublicKey = await getPublicKey(receiverId);

        if (!receiverPublicKey) {
          dbLogger.warn('Receiver has no public key, sending unencrypted', { receiverId });
          // Fall back to unencrypted if receiver has no keys (backwards compatibility)
        } else {
          // Encrypt the message
          contentToStore = await encryptMessage(content, receiverPublicKey);
          dbLogger.info('Message encrypted successfully');
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: contentToStore, // Now encrypted (or plain if encryption disabled/unavailable)
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

      // Return message with original (decrypted) content for UI
      return {
        ...data,
        content: content, // Return original content, not encrypted version
      } as Message;
    } catch (error) {
      dbLogger.error('Error in sendMessage', error);
      return null;
    }
  }

  /**
   * Get messages between two users for a specific conversation (with decryption)
   */
  static async getMessages(params: GetMessagesParams): Promise<Message[]> {
    const { userId, otherUserId, listingId, privateKey } = params;

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

      const messages = data as Message[] || [];

      // Decrypt messages if private key is provided
      if (privateKey && messages.length > 0) {
        dbLogger.info('Decrypting messages', { count: messages.length });

        const decryptedMessages = await Promise.all(
          messages.map(async (msg) => {
            try {
              // Only decrypt messages where current user is the receiver
              // (messages are encrypted with receiver's public key)
              if (msg.receiver_id === userId) {
                const decryptedContent = await decryptMessage(msg.content, privateKey);
                return { ...msg, content: decryptedContent };
              }
              // For sent messages, try to decrypt (they should be encrypted with the other user's key)
              // If decryption fails, it's likely an old unencrypted message
              else if (msg.sender_id === userId) {
                // Sent messages were encrypted with receiver's public key
                // We can't decrypt them (we don't have receiver's private key)
                // Just return as-is (will show encrypted or plain text)
                return msg;
              }
              return msg;
            } catch (error) {
              // If decryption fails, it's likely an old unencrypted message
              dbLogger.warn('Failed to decrypt message, returning as-is', { messageId: msg.id });
              return msg;
            }
          })
        );

        dbLogger.success('Messages decrypted successfully');
        return decryptedMessages;
      }

      dbLogger.success('Messages fetched successfully', { count: messages.length });
      return messages;
    } catch (error) {
      dbLogger.error('Error in getMessages', error);
      return [];
    }
  }

  /**
   * Get all conversations for a user (with encrypted message preview handling)
   */
  static async getConversations(userId: string, privateKey?: string): Promise<Conversation[]> {
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

        // Decrypt last message if possible
        let lastMessage = message.content;
        if (privateKey && message.receiver_id === userId) {
          try {
            lastMessage = await decryptMessage(message.content, privateKey);
          } catch (error) {
            // If decryption fails, show encrypted indicator
            lastMessage = "🔒 Encrypted message";
          }
        } else if (this.looksEncrypted(message.content)) {
          // Message is encrypted but we can't decrypt it
          lastMessage = "🔒 Encrypted message";
        }

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            user_id: partnerId,
            user_name: "", // Will be populated later
            user_image: undefined,
            listing_id: listingId,
            listing_title: "",
            last_message: lastMessage,
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
   * Subscribe to real-time message updates (with decryption)
   */
  static subscribeToMessages(
    userId: string,
    onMessage: (message: Message) => void,
    onError?: (error: any) => void,
    privateKey?: string
  ) {
    dbLogger.info('Setting up message subscription', { userId, encrypted: !!privateKey });

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

                // Decrypt if this is a received message and we have the private key
                if (privateKey && newMessage.receiver_id === userId) {
                  try {
                    const decryptedContent = await decryptMessage(newMessage.content, privateKey);
                    onMessage({ ...newMessage, content: decryptedContent });
                  } catch (error) {
                    dbLogger.warn('Failed to decrypt incoming message', { messageId: newMessage.id });
                    onMessage(newMessage); // Pass through even if decryption fails
                  }
                } else {
                  onMessage(newMessage);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedMessage = payload.new as Message;
              if (updatedMessage.sender_id === userId || updatedMessage.receiver_id === userId) {
                dbLogger.info('Message updated via subscription', { messageId: updatedMessage.id });

                // Decrypt if this is a received message and we have the private key
                if (privateKey && updatedMessage.receiver_id === userId) {
                  try {
                    const decryptedContent = await decryptMessage(updatedMessage.content, privateKey);
                    onMessage({ ...updatedMessage, content: decryptedContent });
                  } catch (error) {
                    dbLogger.warn('Failed to decrypt updated message', { messageId: updatedMessage.id });
                    onMessage(updatedMessage); // Pass through even if decryption fails
                  }
                } else {
                  onMessage(updatedMessage);
                }
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

  /**
   * Helper: Check if a string looks like an encrypted message (base64)
   * Encrypted messages are typically long base64 strings
   */
  private static looksEncrypted(content: string): boolean {
    // Encrypted messages are base64 and typically quite long
    if (!content || content.length < 50) return false;

    // Check if it's mostly base64 characters
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(content) && content.length > 100;
  }
}