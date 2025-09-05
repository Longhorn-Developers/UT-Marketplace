"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "./components/ConversationList";
import { ChatWindow } from "./components/ChatWindow";
import { Message, Conversation } from "../props/listing";
import { MessageService } from "../lib/database/MessageService";
import { dbLogger } from "../lib/database/utils";
import { supabase } from "../lib/supabaseClient";
import {
  containerVariants,
  headerVariants,
  itemVariants,
  emptyStateVariants,
  loadingVariants
} from "../props/animations";

const MessagesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

  const updateConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const conversations = await MessageService.getConversations(user.id);
      setConversations(conversations);
      // Clear temporary conversation when updating conversations
      setTempConversation(null);
    } catch (error) {
      dbLogger.error('Error fetching conversations', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationKey: string) => {
    if (!user?.id) return;
    const [partnerId, listingId] = conversationKey.split(":");
    
    try {
      const messages = await MessageService.getMessages({
        userId: user.id,
        otherUserId: partnerId,
        listingId: listingId === "general" ? null : listingId
      });
      
      setMessages(messages);
      
      // Mark messages as read
      const unreadMessages = messages.filter(
        (msg) => msg.receiver_id === user.id && !msg.is_read
      );
      
      if (unreadMessages.length > 0) {
        const success = await MessageService.markMessagesAsRead(
          unreadMessages.map((msg) => msg.id)
        );
        if (success) {
          updateConversations();
        }
      }
    } catch (error) {
      dbLogger.error('Error fetching messages', error);
    }
  }, [user, updateConversations]);

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !user?.id) return;
    const [partnerId, listingId] = selectedConversation.split(":");
    const tempId = `temp-${Date.now()}`;
    
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: partnerId,
      content: content,
      is_read: false,
      created_at: new Date().toISOString(),
      listing_id: listingId === "general" ? null : listingId,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      const sentMessage = await MessageService.sendMessage({
        senderId: user.id,
        receiverId: partnerId,
        content: content,
        listingId: listingId === "general" ? null : listingId,
      });
      
      if (sentMessage) {
        // Replace the temp message with the real one from the server
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? sentMessage : msg)));
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      // Remove the optimistic message and show an error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const success = await MessageService.deleteMessage(messageId);
    if (success) {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } else {
      alert("Failed to delete message");
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user?.id) return;
    if (
      !window.confirm(
        "Are you sure you want to delete all messages in this conversation? This cannot be undone."
      )
    ) {
      return;
    }
    
    const [partnerId, listingId] = selectedConversation.split(":");
    const success = await MessageService.deleteConversation({
      userId: user.id,
      otherUserId: partnerId,
      listingId: listingId === "general" ? null : listingId
    });
    
    if (success) {
      setMessages([]);
      setSelectedConversation(null);
      updateConversations();
    } else {
      alert("Failed to delete conversation");
    }
  };

  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push("/auth/signin");
      return;
    }

    if (!user?.id) return; // Only subscribe if user is loaded

    const messagesSubscription = MessageService.subscribeToMessages(
      user.id,
      (message: Message) => {
        // Only update messages if this is the current conversation
        if (selectedConversation) {
          const [partnerId, listingId] = selectedConversation.split(":");
          const messageListingId = message.listing_id || "general";
          
          if (
            (message.sender_id === user.id && message.receiver_id === partnerId) ||
            (message.sender_id === partnerId && message.receiver_id === user.id)
          ) {
            if (
              (listingId === "general" && messageListingId === "general") ||
              (listingId !== "general" && messageListingId === listingId)
            ) {
              setMessages((prev) => {
                // Don't add duplicates
                const exists = prev.find(msg => msg.id === message.id);
                return exists ? prev : [...prev, message];
              });
            }
          }
        }
        updateConversations();
      },
      (error) => {
        dbLogger.error('Message subscription error', error);
      }
    );

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, router, authLoading, updateConversations, selectedConversation]);

  useEffect(() => {
    if (!user?.id) return;
    updateConversations();
  }, [user, authLoading, updateConversations]);

  useEffect(() => {
    if (!selectedConversation || !user?.id) return;
    fetchMessages(selectedConversation);
  }, [selectedConversation, user, authLoading, fetchMessages]);

  // Handle ?listing= param for direct listing chat
  useEffect(() => {
    if (!user?.id) return;
    const listingId = searchParams.get("listing");
    if (listingId) {
      (async () => {
        try {
          // We'll need to implement a listing service for this, but for now use basic query
          const { data: listing, error } = await supabase
            .from("listings")
            .select(`
              id, 
              user_id, 
              title,
              user:user_settings!user_id(
                display_name,
                profile_image_url
              )
            `)
            .eq("id", listingId)
            .single();
          
          if (error || !listing) {
            dbLogger.error('Failed to fetch listing for chat', error);
            return;
          }
          
          if (listing.user_id === user.id) {
            dbLogger.info('User trying to chat with themselves');
            return;
          }
          
          // Check if a conversation already exists for this listing
          const existingMessages = await MessageService.getMessages({
            userId: user.id,
            otherUserId: listing.user_id,
            listingId: listingId
          });
          
          // Create a temporary conversation object with user data for the chat window
          const userData = Array.isArray(listing.user) ? listing.user[0] : listing.user;
          const tempConv: Conversation = {
            user_id: listing.user_id,
            user_name: userData?.display_name || 'Unknown User',
            user_image: userData?.profile_image_url || undefined,
            listing_id: listingId,
            listing_title: listing.title,
            last_message: existingMessages.length > 0 ? existingMessages[existingMessages.length - 1].content : '',
            last_message_time: existingMessages.length > 0 ? existingMessages[existingMessages.length - 1].created_at : new Date().toISOString(),
            unread_count: 0
          };
          
          setTempConversation(tempConv);
          setSelectedConversation(listing.user_id + ":" + listingId);
        } catch (error) {
          dbLogger.error('Error setting up listing chat', error);
        }
      })();
    }
  }, [user, searchParams]);

  if (authLoading) {
    return (
      <motion.div 
        className="flex items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-white"
        variants={loadingVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#bf5700] mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Messages</h2>
          <p className="text-gray-600">Please wait while we check your session.</p>
        </div>
      </motion.div>
    );
  }

  const selectedConversationData = tempConversation || conversations.find(
    (c) => c.user_id + ":" + c.listing_id === selectedConversation
  );

  return (
    <motion.div 
      className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={(conversationKey) => {
          setSelectedConversation(conversationKey);
          setTempConversation(null); // Clear temp conversation when selecting from list
        }}
        loading={loading}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <ChatWindow
        selectedConversation={selectedConversation}
        messages={messages}
        currentUserId={user?.id || ""}
        conversationName={selectedConversationData?.user_name || ""}
        conversationImage={selectedConversationData?.user_image || ""}
        listingTitle={selectedConversationData?.listing_title || ""}
        onSendMessage={sendMessage}
        onDeleteMessage={handleDeleteMessage}
        onDeleteConversation={handleDeleteConversation}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
    </motion.div>
  );
};

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#bf5700]"></div>
      </div>
    }>
      <MessagesPage />
    </Suspense>
  );
}
