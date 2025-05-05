import React from "react";
import Link from "next/link";
import { ListingCardProps } from "../../props/listing";

const ListingCard: React.FC<ListingCardProps> = ({
  title,
  price,
  location,
  category,
  timePosted,
  images,
  user,
  condition,
}) => {
  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {images && images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Image
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
            {title}
          </h3>
          <span className="text-[#bf5700] font-bold text-sm">${price}</span>
        </div>
        <p className="text-xs text-gray-500">{location}</p>
        <p className="text-xs text-gray-500">
          {category === "Subleases" ? "Lease Duration" : "Condition"}: {condition}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${encodeURIComponent(user.user_id)}`}>
              <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                <span>{user.name?.[0] || '?'}</span>
              </div>
            </Link>
            <Link href={`/profile/${encodeURIComponent(user.user_id)}`}>
              <span className="text-gray-700 font-medium">{user.name}</span>
            </Link>
          </div>
          <span>{timePosted}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
