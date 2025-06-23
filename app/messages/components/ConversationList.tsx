"use client";
import { motion } from "framer-motion";
import { Search, MessageCircle, Users } from "lucide-react";
import * as timeago from "timeago.js";
import { Conversation } from "../../props/listing";
import Link from "next/link";
import Image from "next/image";
import {
  containerVariants,
  headerVariants,
  itemVariants,
  emptyStateVariants,
  loadingVariants
} from "../../props/animations";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (key: string) => void;
  loading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  collapsed,
  onToggleCollapse
}: ConversationListProps) => {
  return (
    <motion.div 
      className={`border-r border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden flex flex-col min-h-0 shadow-lg transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-full md:w-1/3 lg:w-1/4'
      }`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="p-6 border-b border-gray-200 bg-white shadow-sm relative"
        variants={headerVariants}
      >
        {!collapsed && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageCircle size={24} className="text-[#bf5700]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-gray-600 text-sm">{conversations.length} conversations</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#bf5700] focus:border-[#bf5700] transition"
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>
          </>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className={`absolute top-4 transition-all duration-300 ${
            collapsed ? 'right-4' : 'right-4'
          } p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-[#bf5700]`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </motion.div>
        </button>
      </motion.div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            variants={loadingVariants}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#bf5700] mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Loading conversations...</p>
            </div>
          </motion.div>
        ) : conversations.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 px-6"
            variants={emptyStateVariants}
          >
            {!collapsed && (
              <>
                <div className="p-4 bg-orange-100 rounded-full mb-4">
                  <Users size={32} className="text-[#bf5700]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 text-center text-sm mb-4">
                  Start messaging with other Longhorns by browsing listings and reaching out to sellers.
                </p>
                <Link
                  href="/browse"
                  className="px-4 py-2 bg-[#bf5700] text-white rounded-lg hover:bg-[#a54700] transition text-sm font-medium"
                >
                  Browse Listings
                </Link>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="p-2"
            variants={containerVariants}
          >
            {conversations.map((conversation, index) => (
              <motion.div
                key={conversation.user_id + ":" + conversation.listing_id}
                onClick={() => onSelectConversation(conversation.user_id + ":" + conversation.listing_id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                  selectedConversation === conversation.user_id + ":" + conversation.listing_id
                    ? "bg-gradient-to-r from-[#bf5700] to-orange-500 text-white shadow-lg transform scale-[1.02]"
                    : "bg-white hover:bg-gray-50 hover:shadow-md"
                }`}
                variants={itemVariants}
                whileHover={{ 
                  scale: selectedConversation === conversation.user_id + ":" + conversation.listing_id ? 1.02 : 1.01,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold overflow-hidden shadow-md ${
                    selectedConversation === conversation.user_id + ":" + conversation.listing_id
                      ? "bg-white/20 text-white"
                      : "bg-gradient-to-br from-[#bf5700] to-orange-500 text-white"
                  }`}>
                    {conversation.user_image ? (
                      <Image
                        src={conversation.user_image}
                        alt={conversation.user_name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      conversation.user_name[0]?.toUpperCase()
                    )}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <Link
                          href={`/profile/${conversation.user_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`font-semibold truncate transition ${
                            selectedConversation === conversation.user_id + ":" + conversation.listing_id
                              ? "text-white hover:text-white/80"
                              : "text-gray-900 hover:text-[#bf5700]"
                          }`}
                        >
                          {conversation.user_name}
                        </Link>
                        {conversation.last_message_time && (
                          <span className={`text-xs flex-shrink-0 ${
                            selectedConversation === conversation.user_id + ":" + conversation.listing_id
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}>
                            {timeago.format(conversation.last_message_time)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate ${
                          selectedConversation === conversation.user_id + ":" + conversation.listing_id
                            ? "text-white/80"
                            : "text-gray-600"
                        }`}>
                          {conversation.listing_title || "General Chat"}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 font-medium ${
                            selectedConversation === conversation.user_id + ":" + conversation.listing_id
                              ? "bg-white/20 text-white"
                              : "bg-[#bf5700] text-white"
                          }`}>
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate mt-1 ${
                        selectedConversation === conversation.user_id + ":" + conversation.listing_id
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}>
                        {conversation.last_message}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}; 