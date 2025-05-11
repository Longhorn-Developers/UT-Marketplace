"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "./components/ConversationList";
import { ChatWindow } from "./components/ChatWindow";
import { Message, Conversation } from "../props/listing";

const MessagesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const updateConversations = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.email},receiver_id.eq.${user.email}`)
        .order("created_at", { ascending: false });
      if (messagesError) throw messagesError;
      const userEmail = user.email;
      const filteredMessages = messagesData?.filter(
        (msg) => msg.sender_id === userEmail || msg.receiver_id === userEmail
      ) || [];
      // Group by user_id and listing_id
      const conversationMap = new Map<string, Conversation>();
      for (const message of filteredMessages) {
        const partnerId = message.sender_id === user.email ? message.receiver_id : message.sender_id;
        const listingId = message.listing_id || "general";
        const key = `${partnerId}:${listingId}`;
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            user_id: partnerId,
            user_name: "", // We'll fetch this later
            user_image: undefined, // We'll fetch this later
            listing_id: listingId,
            listing_title: "",
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.receiver_id === user.email && !message.read ? 1 : 0,
          });
        } else {
          const conv = conversationMap.get(key)!;
          if (message.receiver_id === user.email && !message.read) {
            conv.unread_count++;
          }
        }
      }
      // Fetch user_settings for all partnerIds (emails)
      const partnerIds = Array.from(conversationMap.values()).map((c) => c.user_id);
      const listingIds = Array.from(conversationMap.values())
        .map((c) => c.listing_id)
        .filter((id) => id !== "general");
      const { data: userSettingsData } = await supabase
        .from('user_settings')
        .select('email, display_name, profile_image_url')
        .in('email', partnerIds);
      // Fetch listing titles for all listingIds
      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds.length > 0 ? listingIds : [""]);
      // Update conversation map with user info and listing titles
      for (const conv of conversationMap.values()) {
        const userSettings = userSettingsData?.find((u) => u.email === conv.user_id);
        if (userSettings) {
          conv.user_name = userSettings.display_name || conv.user_id;
          conv.user_image = userSettings.profile_image_url || undefined;
        }
        const listing = listingData?.find((l) => l.id === conv.listing_id);
        if (listing) {
          conv.listing_title = listing.title;
        }
      }
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationKey: string) => {
    if (!user?.email) return;
    const [partnerId, listingId] = conversationKey.split(":");
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.email},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.email})`
        )
        .eq("listing_id", listingId === "general" ? null : listingId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const userEmail = user.email;
      const filteredMessages =
        data?.filter(
          (msg) =>
            (msg.sender_id === userEmail && msg.receiver_id === partnerId) ||
            (msg.sender_id === partnerId && msg.receiver_id === userEmail)
        ) || [];
      setMessages(filteredMessages);
      // Mark messages as read
      const unreadMessages = filteredMessages.filter(
        (msg) => msg.receiver_id === userEmail && !msg.read
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .in(
            "id",
            unreadMessages.map((msg) => msg.id)
          );
        updateConversations();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [user, updateConversations]);

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !user?.email) return;
    const [partnerId, listingId] = selectedConversation.split(":");
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender_id: user.email,
      receiver_id: partnerId,
      content: content,
      read: false,
      created_at: new Date().toISOString(),
      listing_id: listingId === "general" ? null : listingId,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.email,
          receiver_id: partnerId,
          content: optimisticMessage.content,
          read: false,
          listing_id: optimisticMessage.listing_id,
        })
        .select();
      if (error) throw error;
      // Replace the temp message with the real one from the server
      if (data && data.length > 0) {
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? data[0] : msg)));
      }
    } catch (error) {
      // Remove the optimistic message and show an error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      alert("Failed to delete message");
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user?.email) return;
    if (
      !window.confirm(
        "Are you sure you want to delete all messages in this conversation? This cannot be undone."
      )
    ) {
      return;
    }
    const [partnerId, listingId] = selectedConversation.split(":");
    const { error } = await supabase
      .from("messages")
      .delete()
      .or(
        `and(sender_id.eq.${user.email},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.email})`
      )
      .eq("listing_id", listingId);
    if (error) {
      alert("Failed to delete conversation");
    } else {
      setMessages([]);
      setSelectedConversation(null);
      updateConversations();
    }
  };

  useEffect(() => {
    if (!authLoading && !user?.email) {
      router.push("/auth/signin");
      return;
    }

    if (!user?.email) return; // Only subscribe if user is loaded

    const messagesSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.email}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === user.email || newMessage.receiver_id === user.email) {
            setMessages((prev) => [...prev, newMessage]);
            updateConversations();
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, router, authLoading, updateConversations]);

  useEffect(() => {
    if (!user?.email) return;
    updateConversations();
  }, [user, authLoading, updateConversations]);

  useEffect(() => {
    if (!selectedConversation || !user?.email) return;
    fetchMessages(selectedConversation);
  }, [selectedConversation, user, authLoading, fetchMessages]);

  // Handle ?listing= param for direct listing chat
  useEffect(() => {
    if (!user?.email) return;
    const listingId = searchParams.get("listing");
    if (listingId) {
      (async () => {
        // Fetch the listing to get the seller
        const { data: listing, error } = await supabase
          .from("listings")
          .select("id, user_id, user_name, title")
          .eq("id", listingId)
          .single();
        if (error || !listing) return;
        if (listing.user_id === user.email) return;
        // Check if a conversation already exists for this listing
        const { data: existingMessages, error: msgError } = await supabase
          .from("messages")
          .select("id")
          .eq("listing_id", listingId)
          .or(
            `and(sender_id.eq.${user.email},receiver_id.eq.${listing.user_id}),and(sender_id.eq.${listing.user_id},receiver_id.eq.${user.email})`
          )
          .limit(1);
        if (msgError) return;
        if (existingMessages && existingMessages.length > 0) {
          setSelectedConversation(listing.user_id + ":" + listingId);
        } else {
          // No conversation yet, set up the key so the user can send the first message
          setSelectedConversation(listing.user_id + ":" + listingId);
        }
      })();
    }
  }, [user, searchParams]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we check your session.</p>
        </div>
      </div>
    );
  }

  const selectedConversationData = conversations.find(
    (c) => c.user_id + ":" + c.listing_id === selectedConversation
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden min-h-0">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <ChatWindow
        selectedConversation={selectedConversation}
        messages={messages}
        currentUserEmail={user?.email || ""}
        conversationName={selectedConversationData?.user_name || ""}
        conversationImage={selectedConversationData?.user_image || ""}
        listingTitle={selectedConversationData?.listing_title || ""}
        onSendMessage={sendMessage}
        onDeleteMessage={handleDeleteMessage}
        onDeleteConversation={handleDeleteConversation}
      />
    </div>
  );
};

export default MessagesPage;
