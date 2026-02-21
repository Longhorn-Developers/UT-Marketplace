 "use client";
import React, { useState } from "react";
import Link from "next/link";
import { ListingCardProps } from "../../props/listing";
import UserRatingDisplay from "../../../components/user/UserRatingDisplay";
import Image from 'next/image';
import { Image as ImageIcon } from "lucide-react";
import { Suspense } from "react";

const highlight = (text: string, searchTerm?: string) => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark> : part
  );
};

const ListingCard: React.FC<ListingCardProps> = ({
  title,
  price,
  location,
  category,
  timePosted,
  images,
  user,
  condition,
  searchTerm,
  userRating,
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(user.image) && !avatarFailed;

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt={title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority={true}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-100">
            <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-2 text-gray-500">
              <ImageIcon size={20} />
            </div>
            <div className="text-xs font-medium text-gray-500">Add a photo</div>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[#bf5700] text-white text-xs font-semibold px-2 py-1 rounded">
          {category}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-1">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#bf5700] transition-colors duration-200">
            {highlight(title, searchTerm)}
          </h3>
          <span className="text-[#bf5700] font-bold text-sm">${price}</span>
        </div>
        <p className="text-xs text-gray-500">{highlight(location, searchTerm)}</p>
        <p className="text-xs text-gray-500">
          {category === "Subleases" ? "Lease Duration" : "Condition"}: {highlight(condition, searchTerm)}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <div className="flex flex-row items-center gap-2">
            <Link href={`/profile/${user.user_id}`}>
              {showAvatar ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full border border-gray-200 object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  <span>{user.name?.[0] || '?'}</span>
                </div>
              )}
            </Link>
            <Link href={`/profile/${user.user_id}`}>
              <span className="text-gray-700 font-medium">{user.name}</span>
            </Link>
            <UserRatingDisplay userId={user.user_id} rating={userRating} className="" />
          </div>
          <span>{timePosted}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
