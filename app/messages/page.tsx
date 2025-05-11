"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Send, Search, ChevronDown, Trash2, Edit2 } from "lucide-react";
import * as timeago from "timeago.js";
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  listing_id?: string;
}

interface Conversation {
  user_id: string;
  user_name: string;
  listing_id: string;
  listing_title: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const MessagesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Handle chat container scroll
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (!authLoading && !user?.email) {
      router.push('/auth/signin');
      return;
    }

    if (!user?.email) return; // Only subscribe if user is loaded

    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.email}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === user.email || newMessage.receiver_id === user.email) {
            setMessages(prev => [...prev, newMessage]);
            updateConversations();
            // Only auto-scroll if we're already near the bottom
            if (chatContainerRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
              if (scrollHeight - scrollTop - clientHeight < 100) {
                scrollToBottom('smooth');
              } else {
                setShowScrollButton(true);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [user, router]);

  useEffect(() => {
    if (!user?.email) return;
    updateConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation || !user?.email) return;
    fetchMessages(selectedConversation);
  }, [selectedConversation, user]);

  // Handle ?listing= param for direct listing chat
  useEffect(() => {
    if (!user?.email) return;
    const listingId = searchParams.get('listing');
    if (listingId) {
      (async () => {
        // Fetch the listing to get the seller
        const { data: listing, error } = await supabase
          .from('listings')
          .select('id, user_id, user_name, title')
          .eq('id', listingId)
          .single();
        if (error || !listing) return;
        if (listing.user_id === user.email) return;
        // Check if a conversation already exists for this listing
        const { data: existingMessages, error: msgError } = await supabase
          .from('messages')
          .select('id')
          .eq('listing_id', listingId)
          .or(`and(sender_id.eq.${user.email},receiver_id.eq.${listing.user_id}),and(sender_id.eq.${listing.user_id},receiver_id.eq.${user.email})`)
          .limit(1);
        if (msgError) return;
        if (existingMessages && existingMessages.length > 0) {
          setSelectedConversation(listing.user_id + ':' + listingId);
        } else {
          // No conversation yet, set up the key so the user can send the first message
          setSelectedConversation(listing.user_id + ':' + listingId);
        }
      })();
    }
  }, [user, searchParams]);

  const updateConversations = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.email},receiver_id.eq.${user.email}`)
        .order('created_at', { ascending: false });
      if (messagesError) throw messagesError;
      const userEmail = user.email;
      const filteredMessages = messagesData?.filter(
        msg => msg.sender_id === userEmail || msg.receiver_id === userEmail
      ) || [];
      // Group by user_id and listing_id
      const conversationMap = new Map<string, Conversation>();
      for (const message of filteredMessages) {
        const partnerId = message.sender_id === user.email ? message.receiver_id : message.sender_id;
        const listingId = message.listing_id || 'general';
        const key = `${partnerId}:${listingId}`;
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            user_id: partnerId,
            user_name: '', // We'll fetch this later
            listing_id: listingId,
            listing_title: '',
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.receiver_id === user.email && !message.read ? 1 : 0
          });
        } else {
          const conv = conversationMap.get(key)!;
          if (message.receiver_id === user.email && !message.read) {
            conv.unread_count++;
          }
        }
      }
      // Fetch user names and listing titles for all conversations
      const partnerIds = Array.from(conversationMap.values()).map(c => c.user_id);
      const listingIds = Array.from(conversationMap.values()).map(c => c.listing_id).filter(id => id !== 'general');
      const { data: userData } = await supabase
        .from('listings')
        .select('user_id, user_name, id, title')
        .in('user_id', partnerIds)
        .in('id', listingIds.length > 0 ? listingIds : ['']);
      // Update conversation map with user names and listing titles
      userData?.forEach(listing => {
        for (const conv of conversationMap.values()) {
          if (conv.user_id === listing.user_id && conv.listing_id === listing.id) {
            conv.user_name = listing.user_name;
            conv.listing_title = listing.title;
          }
        }
      });
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationKey: string) => {
    if (!user?.email) return;
    const [partnerId, listingId] = conversationKey.split(':');
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.email},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.email})`)
        .eq('listing_id', listingId === 'general' ? null : listingId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const userEmail = user.email;
      const filteredMessages = data?.filter(
        msg => (msg.sender_id === userEmail && msg.receiver_id === partnerId) ||
               (msg.sender_id === partnerId && msg.receiver_id === userEmail)
      ) || [];
      setMessages(filteredMessages);
      // Mark messages as read
      const unreadMessages = filteredMessages.filter(
        msg => msg.receiver_id === userEmail && !msg.read
      );
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages.map(msg => msg.id));
        updateConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !user?.email || !newMessage.trim()) return;
    const [partnerId, listingId] = selectedConversation.split(':');
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      sender_id: user.email,
      receiver_id: partnerId,
      content: newMessage.trim(),
      read: false,
      created_at: new Date().toISOString(),
      listing_id: listingId === 'general' ? null : listingId,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    try {
      const { data, error } = await supabase
        .from('messages')
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
        setMessages((prev) => prev.map((msg) => msg.id === tempId ? data[0] : msg));
      }
    } catch (error) {
      // Remove the optimistic message and show an error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert('Failed to send message. Please try again.');
    }
  };

  useEffect(() => {
    if (!user?.email) return;
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id === user.email) {
      scrollToBottom('smooth');
    }
  }, [messages, user]);

  // Add delete message handler
  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    if (error) {
      alert('Failed to delete message');
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    }
  };

  // Add delete conversation handler
  const handleDeleteConversation = async () => {
    if (!selectedConversation || !user?.email) return;
    if (!window.confirm('Are you sure you want to delete all messages in this conversation? This cannot be undone.')) {
      return;
    }
    const [partnerId, listingId] = selectedConversation.split(':');
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${user.email},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.email})`)
      .eq('listing_id', listingId);
    if (error) {
      alert('Failed to delete conversation');
    } else {
      setMessages([]);
      setSelectedConversation(null);
      updateConversations();
    }
  };

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden min-h-0">
      {/* Conversation List */}
      <div className="w-1/3 border-r bg-white overflow-hidden flex flex-col min-h-0">
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-[#bf5700]"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.user_id + ':' + conversation.listing_id}
              onClick={() => setSelectedConversation(conversation.user_id + ':' + conversation.listing_id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                selectedConversation === conversation.user_id + ':' + conversation.listing_id ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                  {conversation.user_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 truncate">{conversation.user_name}</h3>
                    {conversation.last_message_time && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {timeago.format(conversation.last_message_time)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate">{conversation.listing_title}</p>
                    {conversation.unread_count > 0 && (
                      <span className="bg-[#bf5700] text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                    {conversations.find(c => c.user_id + ':' + c.listing_id === selectedConversation)?.user_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {conversations.find(c => c.user_id + ':' + c.listing_id === selectedConversation)?.user_name}
                    </h2>
                    <div className="text-xs text-gray-500">
                      {conversations.find(c => c.user_id + ':' + c.listing_id === selectedConversation)?.listing_title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setEditMode((prev) => !prev)}
                    className={`p-2 text-gray-500 hover:text-[#bf5700] ${editMode ? 'bg-orange-100 rounded' : ''}`}
                    title={editMode ? 'Exit Edit Mode' : 'Edit Messages'}
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={handleDeleteConversation}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="Delete Conversation"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
              style={{ minHeight: 0 }}
              onScroll={handleScroll}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] px-4 py-2 rounded-lg relative ${
                    message.sender_id === user.email
                      ? 'bg-[#bf5700] text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {timeago.format(message.created_at)}
                    </p>
                    {editMode && message.sender_id === user.email && (
                      <button
                        onClick={() => { handleDeleteMessage(message.id); setEditMode(false); }}
                        className="absolute top-1 right-1 text-xs text-white/70 hover:text-red-400"
                        title="Delete Message"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-20 right-8 bg-[#bf5700] text-white p-2 rounded-full shadow-lg hover:bg-[#a54700] transition-colors"
              >
                <ChevronDown size={24} />
              </button>
            )}

            {/* Message Input */}
            <div className="p-4 border-t bg-white sticky bottom-0 z-20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-[#bf5700]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
