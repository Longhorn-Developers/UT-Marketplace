"use client";
import { ChevronLeft, MessageCircle, Search, Users } from "lucide-react";
import * as timeago from "timeago.js";
import { Conversation } from "../../props/listing";
import Link from "next/link";
import Image from "next/image";

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
    <div
      className={`flex min-h-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-[88px]" : "w-full md:w-1/3 lg:w-[360px]"
      }`}
    >
      <div
        className={`border-b border-gray-200 bg-white ${
          collapsed ? "flex flex-col items-center gap-2 px-2 py-3" : "relative p-5"
        }`}
      >
        {collapsed ? (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <MessageCircle size={18} className="text-[#bf5700]" />
            </div>
            <button
              onClick={onToggleCollapse}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-[#bf5700]"
              title="Expand sidebar"
            >
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-2.5">
                <MessageCircle size={20} className="text-[#bf5700]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-500">{conversations.length} conversations</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-gray-900 placeholder-gray-500 focus:border-[#bf5700] focus:outline-none focus:ring-2 focus:ring-[#bf5700]/20"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
            <button
              onClick={onToggleCollapse}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-[#bf5700]"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className={`flex items-center justify-center ${collapsed ? "py-8" : "py-12"}`}>
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#bf5700]" />
              {!collapsed && <p className="text-sm text-gray-500">Loading conversations...</p>}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className={`flex flex-col items-center justify-center ${collapsed ? "px-2 py-10" : "px-6 py-12"}`}>
            <div className="mb-4 rounded-full bg-orange-50 p-4">
              <Users size={32} className="text-[#bf5700]" />
            </div>
            {!collapsed && (
              <>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No conversations yet</h3>
                <p className="mb-4 text-center text-sm text-gray-500">
                  Start messaging with other Longhorns by browsing listings and reaching out to sellers.
                </p>
                <Link
                  href="/browse"
                  className="rounded-lg bg-[#bf5700] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a54700]"
                >
                  Browse Listings
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className={collapsed ? "space-y-2 p-2" : "p-2"}>
            {conversations.map((conversation) => {
              const conversationKey = `${conversation.user_id}:${conversation.listing_id}`;
              const isSelected = selectedConversation === conversationKey;

              return (
                <div
                  key={conversationKey}
                  onClick={() => onSelectConversation(conversationKey)}
                  title={`${conversation.user_name} • ${conversation.listing_title || "General Chat"}`}
                  className={`cursor-pointer transition-colors ${
                    collapsed
                      ? `mx-auto flex h-14 w-14 items-center justify-center rounded-xl border ${
                          isSelected
                            ? "border-[#bf5700]/40 bg-orange-50"
                            : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
                        }`
                      : `mb-2 rounded-xl border p-4 ${
                          isSelected
                            ? "border-[#bf5700]/30 bg-orange-50"
                            : "border-transparent bg-white hover:border-gray-200 hover:bg-gray-50"
                        }`
                  }`}
                >
                  <div className={`flex ${collapsed ? "items-center justify-center" : "items-center gap-3"}`}>
                    <div
                      className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ${
                        isSelected ? "bg-[#bf5700] text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {conversation.user_image ? (
                        <Image
                          src={conversation.user_image}
                          alt={conversation.user_name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        conversation.user_name[0]?.toUpperCase()
                      )}
                      {collapsed && conversation.unread_count > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-[#bf5700] px-1 text-center text-[10px] font-semibold text-white">
                          {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <Link
                            href={`/profile/${conversation.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="truncate font-semibold text-gray-900 transition hover:text-[#bf5700]"
                          >
                            {conversation.user_name}
                          </Link>
                          {conversation.last_message_time && (
                            <span className="flex-shrink-0 text-xs text-gray-500">
                              {timeago.format(conversation.last_message_time)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`truncate text-sm ${isSelected ? "text-gray-700" : "text-gray-600"}`}>
                            {conversation.listing_title || "General Chat"}
                          </p>
                          {conversation.unread_count > 0 && (
                            <span
                              className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                isSelected ? "bg-[#bf5700]/10 text-[#bf5700]" : "bg-[#bf5700] text-white"
                              }`}
                            >
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-gray-500">{conversation.last_message}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
