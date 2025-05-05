import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "./ListingCard";
import * as timeago from "timeago.js";
import { Listing } from "../../props/listing";

const Recents = () => {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("is_sold", false)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;
        setRecentListings(data || []);
      } catch (error) {
        console.error("Error fetching recent listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentListings.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gray-200 mb-10">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {recentListings.map((listing) => (
          <ListingCard
            key={listing.id}
            title={listing.title}
            price={listing.price}
            location={listing.location}
            category={listing.category}
            timePosted={timeago.format(listing.created_at)}
            images={listing.images}
            user={{ name: listing.user_name, user_id: listing.user_id }}
            condition={listing.condition}
          />
        ))}
      </div>
    </div>
  );
};

export default Recents; 