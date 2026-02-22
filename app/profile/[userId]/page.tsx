"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "../../browse/components/ListingCard";
import * as timeago from "timeago.js";
import { Mail, Star, CheckCircle2, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useAuth } from '../../context/AuthContext';
import { Listing } from "../../props/listing";
import { Rating } from "../../props/rating";

const PublicProfile = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [userHasRated, setUserHasRated] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    
    const fetchUserData = async () => {
      setLoading(true);
      
      if (!userId) {
        setLoading(false);
        return;
      }

      // Fetch user data from users table by id (like mobile app)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, display_name, profile_image_url, bio')
        .eq('id', userId)
        .single();
        
      if (userError || !userData) {
        console.error('User not found:', userError);
        setLoading(false);
        return;
      }

      setDisplayName(userData.display_name || null);
      setProfileImage(userData.profile_image_url || null);
      setBio(userData.bio || null);
      setUserEmail(userData.email);
      setProfileUserId(userData.id);
      setUserName(userData.display_name || userData.email?.split('@')[0] || 'User');

      // Fetch user's listings by user_id
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", userId)
        .eq("is_draft", false)
        .order("created_at", { ascending: false });
      console.log("listingsData", listingsData);
      console.log("listingsError", listingsError);
      if (listingsError) {
        setLoading(false);
        return;
      }
      setListings(listingsData || []);
      
      // Fetch ratings for this user (same as mobile app)
      const { data: ratingsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId)
        .order('created_at', { ascending: false });

      // Get rater names for each rating (same as mobile app)
      const formattedRatings = [];
      if (ratingsData) {
        for (const rating of ratingsData) {
          const { data: raterData } = await supabase
            .from('users')
            .select('display_name, profile_image_url')
            .eq('id', rating.reviewer_id)
            .single();

          formattedRatings.push({
            ...rating,
            rater_name: raterData?.display_name || 'Anonymous User',
            rater_id: rating.reviewer_id,
            rated_id: rating.reviewed_id,
          });
        }
      }

      setRatings(formattedRatings);
      
      // Check if current user has rated
      if (user?.id) {
        const foundUserRating = formattedRatings.find(r => r.reviewer_id === user.id) || null;
        if (foundUserRating) {
          setUserHasRated(true);
          setUserRating(foundUserRating.rating);
          setRatingComment(foundUserRating.comment);
        } else {
          setUserHasRated(false);
          setUserRating(0);
          setRatingComment("");
        }
      }
      setLoading(false);
    };
    if (userId) {
      fetchUserData();
    }
  }, [params.userId, user]);

  const handleSubmitRating = async () => {
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    if (!user?.id || !userId) return;
    try {
      // Check if a review exists
      const { data: existing, error: fetchError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewer_id", user.id)
        .eq("reviewed_id", userId)
        .single();

      if (existing) {
        // Update the existing review
        await supabase
          .from("reviews")
          .update({
            rating: userRating,
            comment: ratingComment,
            created_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Insert a new review
        await supabase
          .from("reviews")
          .insert({
            reviewer_id: user.id,
            reviewed_id: userId,
            rating: userRating,
            comment: ratingComment,
            created_at: new Date().toISOString(),
          });
      }
      // Refresh ratings
      const { data: ratingsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewed_id", userId)
        .order('created_at', { ascending: false });
      // Get rater names for each rating (same as mobile app)
      const formattedRatings = [];
      if (ratingsData) {
        for (const rating of ratingsData) {
          const { data: raterData } = await supabase
            .from('users')
            .select('display_name, profile_image_url')
            .eq('id', rating.reviewer_id)
            .single();

          formattedRatings.push({
            ...rating,
            rater_name: raterData?.display_name || 'Anonymous User',
            rater_id: rating.reviewer_id,
            rated_id: rating.reviewed_id,
          });
        }
      }
      setRatings(formattedRatings);
      setShowRatingForm(false);
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };

  const activeListings = listings.filter(listing => !listing.is_sold);
  const soldListings = listings.filter(listing => listing.is_sold);
  const averageRating = ratings.length > 0
    ? (ratings.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratings.length).toFixed(1)
    : 'N/A';

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-32 h-32 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userName) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">The profile you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={displayName || 'User'}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              <span>{displayName?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{displayName}</h1>
            {bio && (
              <div className="text-gray-600 text-sm mb-2 whitespace-pre-line">{bio}</div>
            )}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
              {/* Removed email display */}
            </div>
            <div className="mt-4 flex items-center gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {averageRating}/5 ({ratings.length} ratings)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{activeListings.length} Active Listings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm text-gray-500">{soldListings.length} Sold</span>
              </div>
            </div>
            {/* Action Buttons */}
            {user?.id && user.id !== profileUserId ? (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push(`/messages?user=${profileUserId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#bf5700] text-[#bf5700] text-sm hover:bg-[#bf5700] hover:text-white transition"
                >
                  <MessageCircle size={16} />
                  Message
                </button>
                {userHasRated ? (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
                  >
                    Edit Review
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
                  >
                    Rate this User
                  </button>
                )}
              </div>
            ) : !user?.id ? (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#bf5700] text-[#bf5700] text-sm hover:bg-[#bf5700] hover:text-white transition"
                >
                  <MessageCircle size={16} />
                  Sign in to Message
                </button>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
                >
                  Sign in to Rate
                </button>
              </div>
            ) : null}
            {/* Recent Ratings */}
            {ratings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Ratings</h3>
                <div className="space-y-4">
                  {ratings.slice(0, 3).map((rating) => (
                    <div key={rating.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                          <span>{(rating.rater_name || 'Anonymous')?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${star <= rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {timeago.format(rating.created_at)}
                        </span>
                        <span className="text-xs text-gray-700 ml-2">by {rating.rater_name || 'Anonymous'}</span>
                      </div>
                      {rating.comment && (
                        <p className="text-sm text-gray-600">{rating.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Active Listings Section */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Active Listings</h2>
        {activeListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600">No active listings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="cursor-pointer"
              >
                <ListingCard
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  category={listing.category}
                  timePosted={timeago.format(listing.created_at)}
                  images={listing.images}
                  user={{ name: displayName || listing.user_name, user_id: listing.user_id, image: profileImage }}
                  condition={listing.condition}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Sold Listings Section */}
      {soldListings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sold Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {soldListings.map((listing) => (
              <div key={listing.id} className="relative group">
                <div className="absolute inset-0 bg-gray-800/50 rounded-xl z-10 flex items-center justify-center">
                  <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span className="font-semibold">Sold</span>
                  </div>
                </div>
                <ListingCard
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  category={listing.category}
                  timePosted={timeago.format(listing.created_at)}
                  images={listing.images}
                  user={{ name: displayName || listing.user_name, user_id: listing.user_id, image: profileImage }}
                  condition={listing.condition}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-gray-600">
                  {displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {displayName || 'Unknown User'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">Share your experience with this user</p>
            </div>

            <div className="space-y-4">
              <div 
                className="flex justify-center gap-1"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = star <= userRating;
                  const isHovered = star <= hoveredRating;
                  const shouldHighlight = isSelected || (hoveredRating > 0 && isHovered);
                  
                  return (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      className={`text-4xl transition-all duration-200 ${
                        shouldHighlight
                          ? 'text-yellow-400 scale-110' 
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
              
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Write a review (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#bf5700] focus:border-transparent"
                rows={4}
              />
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitRating}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#bf5700] text-white font-medium hover:bg-[#a54700] transition"
                >
                  Submit Rating
                </button>
                <button
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
