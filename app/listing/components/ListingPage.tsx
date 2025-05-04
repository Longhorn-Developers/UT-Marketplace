import React from 'react'

interface ListingPageProps {
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
  images?: string[];
  condition: string;
  description: string;
  user: {
    name: string;
    image?: string;
  };
}

const ListingPage: React.FC<ListingPageProps> = ({
  title,
  price,
  location,
  category,
  timePosted,
  images,
  condition,
  description,
  user,
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200/70 mt-8">
      <div className="relative aspect-[4/3] bg-gray-100">
        {images && images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
            No Image
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[#bf5700] text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
          {category}
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="text-2xl font-bold text-[#bf5700]">${price}</span>
        </div>
        <div className="flex items-center gap-4 mb-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1">
            <span className="material-icons text-[#bf5700]">location_on</span>
            {location}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-[#bf5700]">schedule</span>
            {timePosted}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-icons text-[#bf5700]">category</span>
            {category}
          </div>
        </div>
        <div className="mb-4">
          <span className="inline-block bg-[#bf5700]/10 text-[#bf5700] px-3 py-1 rounded-full text-xs font-semibold mr-2">
            {category === "Subleases" ? `Lease Duration: ${condition}` : `Condition: ${condition}`}
          </span>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Description</h3>
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{description}</p>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
            <span>{user.name?.[0] || '?'}</span>
          </div>
          <div>
            <div className="text-gray-900 font-semibold text-base">{user.name}</div>
            <div className="text-gray-500 text-xs">Seller</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingPage
