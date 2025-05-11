"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../browse/components/ListingCard";
import SoldListingCard from "../browse/components/SoldListingCard";
import * as timeago from "timeago.js";
import { Mail, Star, CheckCircle2 } from "lucide-react";
import { Listing } from "../props/listing";
import { Rating } from "../props/rating";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import UserRatingDisplay from "../../components/UserRatingDisplay";

export default function ProfileClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) {
        router.push('/auth/signin');
        return;
      }

      try {
        setLoading(true);
        // Fetch display name and profile image from user_settings
        const { data: userSettings, error: userSettingsError } = await supabase
          .from('user_settings')
          .select('display_name, profile_image_url, bio')
          .eq('email', user.email)
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
        // Fetch user's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.email)
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;
        setListings(listingsData || []);

        // Fetch user's ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("ratings")
          .select("*")
          .eq("rated_id", user.email);

        if (ratingsError) throw ratingsError;
        setRatings(ratingsData || []);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, router]);

  const activeListings = listings.filter((listing) => !listing.is_sold);
  const soldListings = listings.filter((listing) => listing.is_sold);
  const averageRating =
    ratings.length > 0
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

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to UT Marketplace
          </h2>
          <p className="text-gray-600 mb-6">
            Sign in to view your profile and manage your listings.
          </p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-3 rounded-lg bg-[#bf5700] text-white font-medium hover:bg-[#a54700] transition"
          >
            Sign in
          </button>
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
              <img src={profileImage} alt={displayName || user.email} className="w-32 h-32 rounded-full object-cover" />
            ) : (
              <span>{(displayName || user.email)?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {displayName || user.email}
            </h1>
            {bio && (
              <div className="text-gray-600 text-sm mb-2 whitespace-pre-line">{bio}</div>
            )}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
              {/* Removed email display */}
            </div>
            <div className="mt-4 flex items-center gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <UserRatingDisplay userId={user.email} rating={averageRating} />
                <span className="text-sm font-medium text-gray-700">
                  ({ratings.length} ratings)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {activeListings.length} Active Listings
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm text-gray-500">
                  {soldListings.length} Sold
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                supabase.auth.signOut();
                router.push('/');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Active Listings Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Active Listings</h2>
          <a
            href="/create"
            className="px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
          >
            Create New Listing
          </a>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activeListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-4">
              You haven&apos;t created any active listings yet.
            </p>
            <a
              href="/create"
              className="inline-block px-4 py-2 rounded-lg bg-[#bf5700] text-white text-sm hover:bg-[#a54700] transition"
            >
              Create Your First Listing
            </a>
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
                  key={listing.id}
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  category={listing.category}
                  timePosted={timeago.format(listing.created_at)}
                  images={listing.images}
                  condition={listing.condition}
                  user={{ name: displayName || listing.user_name, user_id: listing.user_id, image: profileImage }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sold Listings Section */}
      {soldListings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Sold Listings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {soldListings.map((listing) => (
              <SoldListingCard
                key={listing.id}
                title={listing.title}
                price={listing.price}
                location={listing.location}
                category={listing.category}
                timePosted={timeago.format(listing.created_at)}
                images={listing.images}
                user={{ name: displayName || listing.user_name, user_id: listing.user_id, image: profileImage }}
                condition={listing.condition}
                onClick={() => router.push(`/listing/${listing.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
