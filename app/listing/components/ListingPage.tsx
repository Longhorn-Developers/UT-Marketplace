import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ListingPageProps } from '../../props/listing';
import { useAuth } from '../../context/AuthContext';
import UserRatingDisplay from "../../../components/user/UserRatingDisplay";
import Image from "next/image";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const ListingPage: React.FC<ListingPageProps> = ({
  title,
  price,
  location,
  category,
  timePosted,
  images,
  condition,
  description,
  listingCount,
  listingUserName,
  listingUserEmail,
  id,
  location_lat,
  location_lng,
  ...rest
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [sellerDisplayName, setSellerDisplayName] = useState<string | null>(null);
  const [sellerProfileImage, setSellerProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerRating = async () => {
      if (!listingUserEmail) return;
      setRatingLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', listingUserEmail);
      if (error) {
        setSellerRating(null);
        setRatingLoading(false);
        return;
      }
      if (data && data.length > 0) {
        const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
        setSellerRating(avg);
      } else {
        setSellerRating(null);
      }
      setRatingLoading(false);
    };
    fetchSellerRating();
  }, [listingUserEmail]);

  useEffect(() => {
    const fetchSellerDisplayName = async () => {
      if (!listingUserEmail) return;
      // listingUserEmail is actually the user ID, not email
      const { data, error } = await supabase
        .from('users')
        .select('display_name, profile_image_url')
        .eq('id', listingUserEmail)
        .single();
      
      if (!error && data) {
        setSellerDisplayName(data.display_name || null);
        setSellerProfileImage(data.profile_image_url || null);
      } else {
        setSellerDisplayName(null);
        setSellerProfileImage(null);
      }
    };
    fetchSellerDisplayName();
  }, [listingUserEmail]);

  const handleMessageSeller = () => {
    if (!currentUser?.id) {
      router.push('/auth/signin');
      return;
    }
    // Redirect to messages page with listing id as a query param
    router.push(`/messages?listing=${encodeURIComponent(id)}`);
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
            <Image
              src={images[selectedImageIdx]}
              alt={title}
              width={100}
              height={100}
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
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  width={100}
                  height={100}
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
          href={listingUserEmail ? `/profile/${listingUserEmail}` : "#"}
          className="flex items-center gap-4 mb-2 hover:underline"
        >
          <div className="w-10 h-10 rounded-full border bg-gray-200 flex items-center justify-center text-gray-400 text-lg">
            {sellerProfileImage ? (
              <Image
                src={sellerProfileImage}
                alt={sellerDisplayName || listingUserName || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span>{(sellerDisplayName || listingUserName)?.[0] || '?'}</span>
            )}
          </div>
          <div>
            <div className="text-gray-900 font-semibold text-sm">{sellerDisplayName || listingUserName}</div>
            <div className="text-gray-500 text-xs">Seller</div>
          </div>
        </Link>
        <div className="text-sm text-gray-500 mt-1 mb-6">
          <div>
            Rating: <UserRatingDisplay userId={listingUserEmail} rating={sellerRating} />
          </div>
          <div>Listings: {listingCount}</div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <button 
            onClick={handleMessageSeller}
            disabled={!currentUser || currentUser.id === listingUserEmail}
            className={`w-full font-semibold py-2 rounded transition ${
              !currentUser 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : currentUser.id === listingUserEmail
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-[#bf5700] hover:bg-[#a54700] text-white'
            }`}
          >
            {!currentUser 
              ? 'Sign in to Message'
              : currentUser.id === listingUserEmail
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

    {/* Map Section */}
    {(location_lat && location_lng) && (
      <div className="max-w-6xl mx-auto mt-8">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <MapPin size={18} className="text-[#bf5700]" />
          Location on Map
        </h2>
        <div className="rounded-xl overflow-hidden border">
          <MapPicker
            value={{ lat: location_lat, lng: location_lng }}
            onChange={undefined}
            height="250px"
          />
        </div>
      </div>
    )}
    </>
  )
}

export default ListingPage
