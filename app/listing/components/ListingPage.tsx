import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient';
import { MapPin, Calendar, Tag, Heart, Eye, Share2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { ListingPageProps } from '../../props/listing';
import { useAuth } from '../../context/AuthContext';
import { ListingService } from '../../lib/database/ListingService';
import UserRatingDisplay from "../../../components/user/UserRatingDisplay";
import ReportListingModal from "../../../components/modals/ReportListingModal";
import ReportUserModal from "../../../components/modals/ReportUserModal";
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
  status,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [sellerDisplayName, setSellerDisplayName] = useState<string | null>(null);
  const [sellerProfileImage, setSellerProfileImage] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [showReportListingModal, setShowReportListingModal] = useState(false);
  const [showReportUserModal, setShowReportUserModal] = useState(false);

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
    const fetchFavoriteStatus = async () => {
      if (!currentUser?.id || !id) return;
      
      try {
        const status = await ListingService.getFavoriteStatus(currentUser.id, id);
        setIsFavorited(status.isFavorited);
        setIsWatchlisted(status.isWatchlisted);
      } catch (error) {
        console.error('Error fetching favorite status:', error);
      }
    };
    
    fetchFavoriteStatus();
  }, [currentUser?.id, id]);

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
    
    // Check if user is trying to message themselves
    if (currentUser.id === listingUserEmail) {
      return;
    }
    
    // Redirect to messages page with listing id as a query param
    router.push(`/messages?listing=${encodeURIComponent(id)}`);
  };

  const handleToggleFavorite = async () => {
    if (!currentUser?.id) {
      router.push('/auth/signin');
      return;
    }

    setFavoriteLoading(true);
    try {
      const result = await ListingService.toggleFavorite({
        userId: currentUser.id,
        listingId: id,
        type: 'favorite'
      });
      
      if (result.success) {
        setIsFavorited(result.isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!currentUser?.id) {
      router.push('/auth/signin');
      return;
    }

    setWatchlistLoading(true);
    try {
      const result = await ListingService.toggleFavorite({
        userId: currentUser.id,
        listingId: id,
        type: 'watchlist'
      });
      
      if (result.success) {
        setIsWatchlisted(result.isFavorited);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this listing: ${title} for $${price}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const isOwner = currentUser?.id === listingUserEmail;
  const isSignedIn = Boolean(currentUser?.id);

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
          {/* Show pending message if owner and listing is pending */}
          {isOwner && status === 'pending' ? (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-orange-800 font-semibold mb-1">Please Wait for Approval</h3>
              <p className="text-orange-700 text-sm">
                Your listing is being reviewed by our admin team. All actions are disabled until approved.
              </p>
            </div>
          ) : (
            <>
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
                <button 
                  onClick={handleToggleFavorite}
                  disabled={!isSignedIn || favoriteLoading || currentUser?.id === listingUserEmail}
                  className={`flex-1 border py-2 rounded text-sm transition flex items-center justify-center gap-1 ${
                    isFavorited 
                      ? 'border-red-500 bg-red-50 text-red-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${!isSignedIn || favoriteLoading || currentUser?.id === listingUserEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart 
                    size={16} 
                    className={isFavorited ? 'text-red-500' : ''} 
                    fill={isFavorited ? 'currentColor' : 'none'}
                  />
                  {!isSignedIn ? 'Sign in to Save' : favoriteLoading ? 'Saving...' : isFavorited ? 'Saved' : 'Save'}
                </button>
                <button 
                  onClick={handleToggleWatchlist}
                  disabled={!isSignedIn || watchlistLoading || currentUser?.id === listingUserEmail}
                  className={`flex-1 border py-2 rounded text-sm transition flex items-center justify-center gap-1 ${
                    isWatchlisted 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  } ${!isSignedIn || watchlistLoading || currentUser?.id === listingUserEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Eye 
                    size={16} 
                    className={isWatchlisted ? 'text-blue-500' : ''}
                  />
                  {!isSignedIn ? 'Sign in to Watch' : watchlistLoading ? 'Adding...' : isWatchlisted ? 'Watching' : 'Watch'}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 border border-gray-300 py-2 rounded text-sm hover:bg-gray-50 transition flex items-center justify-center gap-1"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setShowReportListingModal(true)}
                  disabled={!currentUser || currentUser.id === listingUserEmail}
                  className={`text-sm hover:underline text-left ${
                    !currentUser || currentUser.id === listingUserEmail
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  {!currentUser ? 'Sign in to report' : 'Report this listing'}
                </button>
                {currentUser && currentUser.id !== listingUserEmail && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button 
                      onClick={() => setShowReportUserModal(true)}
                      className="text-sm text-gray-500 hover:text-red-600 hover:underline text-left"
                    >
                      Report seller
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Map Section */}
    {(location_lat && location_lng) && (
      <div className="max-w-6xl mx-auto mt-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#fff2e6] text-[#bf5700] flex items-center justify-center shadow-sm">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Location</p>
              <p className="text-xs text-gray-500">
                Approximate area {location ? `• ${location}` : ""}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400">Map data © OpenStreetMap</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_55%)]" />
          <MapPicker
            value={{ lat: location_lat, lng: location_lng }}
            onChange={undefined}
            height="260px"
          />
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow-lg backdrop-blur">
            <MapPin size={14} className="text-[#bf5700]" />
            {location || "UT Austin area"}
          </div>
        </div>
      </div>
    )}

    {/* Report Modals */}
    <ReportListingModal
      isOpen={showReportListingModal}
      onClose={() => setShowReportListingModal(false)}
      listingId={id}
      listingTitle={title}
      userId={currentUser?.id || null}
    />

    <ReportUserModal
      isOpen={showReportUserModal}
      onClose={() => setShowReportUserModal(false)}
      reportedUserId={listingUserEmail || ''}
      reportedUserName={sellerDisplayName || listingUserName || 'Unknown User'}
      reporterId={currentUser?.id || null}
    />
    </>
  )
}

export default ListingPage
