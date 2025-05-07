"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../browse/components/ListingCard";
import SoldListingCard from "../browse/components/SoldListingCard";
import * as timeago from "timeago.js";
import { Listing } from "../props/listing";
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function MyListings() {
  const { user } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      router.push('/auth/signin');
      return;
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.email)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user, router]);

  const activeListings = listings.filter((listing) => !listing.is_sold);
  const soldListings = listings.filter((listing) => listing.is_sold);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
        {activeListings.length === 0 ? (
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
                onClick={() => window.location.href = `/listing/${listing.id}`}
                className="cursor-pointer"
              >
                <ListingCard
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  category={listing.category}
                  timePosted={timeago.format(listing.created_at)}
                  images={listing.images}
                  condition={listing.condition}
                  user={{ name: listing.user_name, user_id: listing.user_id }}
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
                user={{ name: listing.user_name, user_id: listing.user_id }}
                condition={listing.condition}
                onClick={() => window.location.href = `/listing/${listing.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
