"use client";
import { useEffect, useRef, useState } from "react";
import { Send, ChevronDown, Trash2, Edit2 } from "lucide-react";
import * as timeago from "timeago.js";
import { supabase } from "../../lib/supabaseClient";
import { Message } from "../../props/listing";
import Link from "next/link";
import Image from "next/image";

interface ChatWindowProps {
  selectedConversation: string | null;
  messages: Message[];
  currentUserId: string;
  conversationName: string;
  conversationImage?: string;
  listingTitle: string;
  onSendMessage: (content: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onDeleteConversation: () => Promise<void>;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const ChatWindow = ({
  selectedConversation,
  messages,
  currentUserId,
  conversationName,
  conversationImage,
  listingTitle,
  onSendMessage,
  onDeleteMessage,
  onDeleteConversation,
  sidebarCollapsed,
  onToggleSidebar,
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Extract listingId from selectedConversation
  const listingId = selectedConversation ? selectedConversation.split(":")[1] : null;

  const scrollToBottom = (behavior: "auto" | "smooth" = "auto") => {
    if (messagesEndRef.current && chatContainerRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender_id === currentUserId) {
      scrollToBottom("smooth");
    }
  }, [messages, currentUserId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-600">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 overflow-hidden">
              {conversationImage ? (
                <Image
                  src={conversationImage}
                  alt={conversationName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                conversationName[0]?.toUpperCase()
              )}
            </div>
            <div>
              <Link
                href={`/profile/${selectedConversation.split(":")[0]}`}
                className="font-semibold text-gray-900 hover:text-[#bf5700] transition"
              >
                {conversationName}
              </Link>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                {listingTitle}
                {listingId && listingId !== "general" && (
                  <Link
                    href={`/listing/${listingId}`}
                    className="ml-2 px-2 py-0.5 rounded bg-[#bf5700] text-white text-xs hover:bg-[#a54700] transition"
                    title="Go to listing"
                  >
                    View Listing
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setEditMode((prev) => !prev)}
              className={`p-2 text-gray-500 hover:text-[#bf5700] ${
                editMode ? "bg-orange-100 rounded" : ""
              }`}
              title={editMode ? "Exit Edit Mode" : "Edit Messages"}
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={onDeleteConversation}
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
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 relative bg-gray-50"
        style={{ minHeight: 0 }}
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUserId ? "justify-end" : "justify-start"
            } px-1 sm:px-0`}
          >
            <div
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-2xl relative shadow-sm
                ${message.sender_id === currentUserId
                  ? "bg-[#bf5700] text-white"
                  : "bg-gray-200 text-gray-900"}
                max-w-xs sm:max-w-md md:max-w-lg
              `}
            >
              <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>
              <p className="text-[11px] sm:text-xs mt-1 opacity-60 text-right">
                {timeago.format(message.created_at)}
              </p>
              {editMode && message.sender_id === currentUserId && (
                <button
                  onClick={() => {
                    onDeleteMessage(message.id);
                    setEditMode(false);
                  }}
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
          onClick={() => scrollToBottom("smooth")}
          className="fixed sm:absolute bottom-24 right-4 sm:right-8 bg-[#bf5700] text-white p-2 rounded-full shadow-lg hover:bg-[#a54700] transition-colors z-30"
        >
          <ChevronDown size={24} />
        </button>
      )}

      {/* Message Input */}
      <div className="p-2 sm:p-4 border-t bg-white sticky bottom-0 z-20">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 sm:px-4 border rounded-lg focus:outline-none focus:border-[#bf5700] text-sm sm:text-base"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-3 sm:px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}; 