import React from "react";

type ListingCardProps = {
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
};

const ListingCard = ({ title, price, location, category, timePosted }: ListingCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">Image</span>
        <div className="absolute top-2 left-2 bg-[#bf5700] text-white text-xs font-semibold px-2 py-1 rounded">
          {category}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-1">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {title}
          </h3>
          <span className="text-[#bf5700] font-bold text-sm">${price}</span>
        </div>
        <p className="text-xs text-gray-500">{location}</p>
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span>{timePosted}</span>
          <span className="text-[#bf5700] text-sm">💬</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
