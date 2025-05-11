"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "../../browse/components/ListingCard";
import * as timeago from "timeago.js";
import { Mail, Star, CheckCircle2 } from "lucide-react";
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
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userHasRated, setUserHasRated] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [raterProfiles, setRaterProfiles] = useState<{ [email: string]: { display_name: string, profile_image_url: string | null } }>({});

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const rawParam = Array.isArray(params.name) ? params.name[0] : params.name;
      const emailParam = decodeURIComponent(rawParam);
      // Fetch display_name and profile_image_url from user_settings
      const { data: userSettings, error: userSettingsError } = await supabase
        .from('user_settings')
        .select('display_name, profile_image_url, bio')
        .eq('email', emailParam)
        .single();
      if (!userSettingsError && userSettings) {
        setDisplayName(userSettings.display_name || null);
        setProfileImage(userSettings.profile_image_url || null);
        setBio(userSettings.bio || null);
      } else {
        setDisplayName(null);
        setProfileImage(null);
        setBio(null);
      }
      // Fetch user's listings by email
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", emailParam)
        .order("created_at", { ascending: false });
      console.log("listingsData", listingsData);
      console.log("listingsError", listingsError);
      if (listingsError) {
        setLoading(false);
        return;
      }
      setListings(listingsData || []);
      if (listingsData && listingsData.length > 0) {
        setUserName(listingsData[0].user_name);
        setUserEmail(listingsData[0].user_id);
        // Fetch ratings for this user (by email)
        const { data: ratingsData } = await supabase
          .from("ratings")
          .select("*")
          .eq("rated_id", listingsData[0].user_id);
        let uniqueRatings: Rating[] = [];
        let foundUserRating: Rating | null = null;
        let raterEmails: string[] = [];
        if (ratingsData) {
          const latestByRater = new Map<string, Rating>();
          ratingsData.forEach((rating: Rating) => {
            const existing = latestByRater.get(rating.rater_id);
            if (!existing || new Date(rating.created_at) > new Date(existing.created_at)) {
              latestByRater.set(rating.rater_id, rating);
            }
          });
          uniqueRatings = Array.from(latestByRater.values());
          raterEmails = uniqueRatings.map(r => r.rater_id);
          // Check if current user has rated
          if (user?.email) {
            foundUserRating = uniqueRatings.find(r => r.rater_id === user.email) || null;
          }
        }
        setRatings(uniqueRatings);
        if (foundUserRating) {
          setUserHasRated(true);
          setUserRating(foundUserRating.rating);
          setRatingComment(foundUserRating.comment);
        } else {
          setUserHasRated(false);
          setUserRating(0);
          setRatingComment("");
        }
        // Fetch rater profiles (display_name, profile_image_url)
        if (raterEmails.length > 0) {
          const { data: raterProfilesData } = await supabase
            .from('user_settings')
            .select('email, display_name, profile_image_url')
            .in('email', raterEmails);
          const raterMap: { [email: string]: { display_name: string, profile_image_url: string | null } } = {};
          (raterProfilesData || []).forEach((r: any) => {
            raterMap[r.email] = { display_name: r.display_name, profile_image_url: r.profile_image_url };
          });
          setRaterProfiles(raterMap);
        }
      } else {
        setUserName(null);
        setUserEmail(null);
      }
      setLoading(false);
    };
    if (params.name) {
      fetchUserData();
    }
  }, [params.name, user]);

  const handleSubmitRating = async () => {
    if (!user?.email || !userEmail) return;
    try {
      // Check if a review exists
      const { data: existing, error: fetchError } = await supabase
        .from("ratings")
        .select("*")
        .eq("rater_id", user.email)
        .eq("rated_id", userEmail)
        .single();

      if (existing) {
        // Update the existing review
        await supabase
          .from("ratings")
          .update({
            rating: userRating,
            comment: ratingComment,
            created_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Insert a new review
        await supabase
          .from("ratings")
          .insert({
            rater_id: user.email,
            rated_id: userEmail,
            rating: userRating,
            comment: ratingComment,
            created_at: new Date().toISOString(),
          });
      }
      // Refresh ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("*")
        .eq("rated_id", userEmail);
      let uniqueRatings: Rating[] = [];
      if (ratingsData) {
        const latestByRater = new Map<string, Rating>();
        ratingsData.forEach((rating: Rating) => {
          const existing = latestByRater.get(rating.rater_id);
          if (!existing || new Date(rating.created_at) > new Date(existing.created_at)) {
            latestByRater.set(rating.rater_id, rating);
          }
        });
        uniqueRatings = Array.from(latestByRater.values());
      }
      setRatings(uniqueRatings);
      setShowRatingForm(false);
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };

  const activeListings = listings.filter(listing => !listing.is_sold);
  const soldListings = listings.filter(listing => listing.is_sold);
  const averageRating = ratings.length > 0
    ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
    : 0;

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
              <img src={profileImage} alt={displayName || 'User'} className="w-32 h-32 rounded-full object-cover" />
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
                  {averageRating.toFixed(1)}/5 ({ratings.length} ratings)
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
            {/* Rating Section */}
            {user?.email && user.email !== userEmail && (
              <div className="mt-6">
                {!showRatingForm ? (
                  userHasRated ? (
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
                  )
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className={`text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      placeholder="Write a review (optional)"
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitRating}
                        className="px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
                      >
                        {userHasRated ? "Update Review" : "Submit Rating"}
                      </button>
                      <button
                        onClick={() => setShowRatingForm(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Recent Ratings */}
            {ratings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Ratings</h3>
                <div className="space-y-4">
                  {ratings.slice(0, 3).map((rating) => (
                    <div key={rating.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {raterProfiles[rating.rater_id]?.profile_image_url ? (
                          <img src={raterProfiles[rating.rater_id].profile_image_url} alt={raterProfiles[rating.rater_id].display_name || rating.rater_id} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                            <span>{(raterProfiles[rating.rater_id]?.display_name || rating.rater_id)?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                        )}
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
                        <span className="text-xs text-gray-700 ml-2">by {raterProfiles[rating.rater_id]?.display_name || rating.rater_id}</span>
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
    </div>
  );
};

export default PublicProfile;
