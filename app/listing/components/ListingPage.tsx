import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Calendar, Tag } from "lucide-react";
import ListingCard from '../../browse/components/ListingCard';
import * as timeago from 'timeago.js';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ListingPageProps } from '../../props/listing';
import { useAuth } from '../../context/AuthContext';

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
  listingCount,
  listingUserName,
  listingUserEmail,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [relatedListings, setRelatedListings] = useState<any[]>([]);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchRelatedListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images")
        .eq("category", category)
        .neq("title", title)
        .limit(4);

      if (!error) {
        setRelatedListings(data || []);
      }
    };

    fetchRelatedListings();
  }, [category, title]);

  const handleMessageSeller = async () => {
    if (!currentUser?.email) {
      router.push('/auth/signin');
      return;
    }

    try {
      // Create initial message
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUser.email,
          receiver_id: listingUserEmail,
          content: `Hi, I'm interested in your listing: ${title}`,
          created_at: new Date().toISOString(),
          read: false
        }]);

      if (error) throw error;

      // Redirect to messages page
      router.push('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  return (
    <>
    <div className="max-w-6xl mx-auto mt-4">
      <a href="/browse" className="text-[#bf5700] text-sm hover:underline flex items-center gap-1">
        ← Back to Listings
      </a>
    </div>

    <div className="max-w-6xl mx-auto mt-2">
      <h1 className="text-2xl font-bold text-gray-900">Listing Details</h1>
    </div>

    <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left: Image section */}
      <div className="flex flex-col gap-4">
        <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
          {images && images[selectedImageIdx] ? (
            <img
              src={images[selectedImageIdx]}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
              No Image
            </div>
          )}
        </div>

        {images && images.length > 1 && (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {images.slice(0, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIdx(idx)}
                className={`rounded-xl overflow-hidden border-2 ${
                  selectedImageIdx === idx ? "border-[#bf5700]" : "border-transparent"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-[80px] object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Listing Details */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md flex flex-col">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <span className="text-3xl font-bold text-[#bf5700] block mb-4">${price}</span>

          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="text-[#bf5700]" size={16} /> {location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="text-[#bf5700]" size={16} /> {timePosted}
            </span>
            <span className="inline-flex items-center gap-1">
              <Tag className="text-[#bf5700]" size={16} /> {category}
            </span>
          </div>
          <div className="mb-4">
            <span className="inline-block bg-[#bf5700]/10 text-[#bf5700] px-3 py-1 rounded-full text-xs font-semibold">
              Condition: {condition}
            </span>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Description</h3>
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        </div>

        {/* Seller Info */}
        <Link
          href={listingUserEmail ? `/profile/${encodeURIComponent(listingUserEmail)}` : "#"}
          className="flex items-center gap-4 mb-2 hover:underline"
        >
          <div className="w-10 h-10 rounded-full border bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
            <span>{listingUserName?.[0] || '?'}</span>
          </div>
          <div>
            <div className="text-gray-900 font-semibold text-sm">{listingUserName}</div>
            <div className="text-gray-500 text-xs">Seller</div>
          </div>
        </Link>
        <div className="text-sm text-gray-500 mt-1 mb-6">
          <div>Rating: ⭐ 4.8/5</div>
          <div>Listings: {listingCount}</div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button 
            onClick={handleMessageSeller}
            disabled={!currentUser || currentUser.email === listingUserEmail}
            className={`w-full font-semibold py-2 rounded transition ${
              !currentUser 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : currentUser.email === listingUserEmail
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-[#bf5700] hover:bg-[#a54700] text-white'
            }`}
          >
            {!currentUser 
              ? 'Sign in to Message'
              : currentUser.email === listingUserEmail
              ? 'This is your listing'
              : 'Message Seller'
            }
          </button>
          <div className="flex gap-2">
            <button className="flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50 transition">♡ Save</button>
            <button className="flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50 transition">⤴ Share</button>
          </div>
          <button className="block text-sm text-gray-500 mt-2 hover:underline text-left">Report this listing</button>
        </div>
      </div>
    </div>

    {relatedListings.length > 0 && (
      <div className="max-w-6xl mx-auto mt-6 pt-6 border-t mb-10">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Related Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {relatedListings.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/listing/${item.id}`)}
              className="cursor-pointer"
            >
              <ListingCard
                title={item.title}
                price={item.price}
                location=""
                category={category}
                timePosted={timeago.format(new Date())}
                images={item.images}
                condition=""
                user={{ name: listingUserName, user_id: listingUserEmail }}
              />
            </div>
          ))}
        </div>
      </div>
    )}
    </>
  )
}

export default ListingPage
