"use client";
import { Search } from "lucide-react";
import * as timeago from "timeago.js";
import { Conversation } from "../../props/listing";
import Link from "next/link";
import Image from "next/image";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (key: string) => void;
}

export const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) => {
  return (
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
            key={conversation.user_id + ":" + conversation.listing_id}
            onClick={() => onSelectConversation(conversation.user_id + ":" + conversation.listing_id)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
              selectedConversation === conversation.user_id + ":" + conversation.listing_id
                ? "bg-orange-50"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600 overflow-hidden">
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
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <Link
                    href={`/profile/${conversation.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-gray-900 truncate hover:text-[#bf5700] transition"
                  >
                    {conversation.user_name}
                  </Link>
                  {conversation.last_message_time && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {timeago.format(conversation.last_message_time)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.listing_title}
                  </p>
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
  );
}; 