"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Send, Search, ChevronDown } from "lucide-react";
import * as timeago from "timeago.js";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  user_id: string;
  user_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Handle chat container scroll
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth/signin');
      return;
    }

    // Subscribe to new messages
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

  // Scroll to bottom on initial load and conversation change
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation, messages]);

  useEffect(() => {
    if (!user?.email) return;
    updateConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedConversation || !user?.email) return;
    fetchMessages(selectedConversation);
  }, [selectedConversation, user]);

  const updateConversations = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      // Fetch all messages where the user is either sender or receiver
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.email},receiver_id.eq.${user.email}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Additional security check
      const userEmail = user.email;
      const filteredMessages = messagesData?.filter(
        msg => msg.sender_id === userEmail || msg.receiver_id === userEmail
      ) || [];

      // Group messages by conversation partner
      const conversationMap = new Map<string, Conversation>();
      
      filteredMessages.forEach(message => {
        const partnerId = message.sender_id === user.email ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user_id: partnerId,
            user_name: '', // We'll fetch this later
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: message.receiver_id === user.email && !message.read ? 1 : 0
          });
        } else {
          const conv = conversationMap.get(partnerId)!;
          if (message.receiver_id === user.email && !message.read) {
            conv.unread_count++;
          }
        }
      });

      // Fetch user names for all conversation partners
      const partnerIds = Array.from(conversationMap.keys());
      const { data: userData, error: userError } = await supabase
        .from('listings')
        .select('user_id, user_name')
        .in('user_id', partnerIds)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Update conversation map with user names
      userData?.forEach(user => {
        const conv = conversationMap.get(user.user_id);
        if (conv) {
          conv.user_name = user.user_name;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.email},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.email})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Additional security check
      const userEmail = user.email;
      const filteredMessages = data?.filter(
        msg => (msg.sender_id === userEmail && msg.receiver_id === partnerId) ||
               (msg.sender_id === partnerId && msg.receiver_id === userEmail)
      ) || [];

      setMessages(filteredMessages);

      // Mark messages as read in a single batch update
      const unreadMessages = filteredMessages.filter(
        msg => msg.receiver_id === userEmail && !msg.read
      );

      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages.map(msg => msg.id));

        if (updateError) throw updateError;

        // Update conversations list to reflect read messages
        updateConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !user?.email || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.email,
          receiver_id: selectedConversation,
          content: newMessage.trim(),
          read: false,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view messages</h2>
          <p className="text-gray-600">You need to be signed in to access your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation List */}
      <div className="w-1/3 border-r bg-white overflow-hidden flex flex-col">
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
              key={conversation.user_id}
              onClick={() => setSelectedConversation(conversation.user_id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
                selectedConversation === conversation.user_id ? 'bg-orange-50' : ''
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
                    <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
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
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                  {conversations.find(c => c.user_id === selectedConversation)?.user_name[0]?.toUpperCase()}
                </div>
                <h2 className="font-semibold text-gray-900">
                  {conversations.find(c => c.user_id === selectedConversation)?.user_name}
                </h2>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.email ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2 rounded-lg ${
                      message.sender_id === user.email
                        ? 'bg-[#bf5700] text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {timeago.format(message.created_at)}
                    </p>
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
            <div className="p-4 border-t bg-white sticky bottom-0">
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
