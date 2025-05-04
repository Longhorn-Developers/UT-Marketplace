"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";
import ListingCard from "../browse/components/ListingCard";
import * as timeago from "timeago.js";
import Link from "next/link";

const MyListings = () => {
  const { data: session } = useSession();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          location,
          category,
          created_at,
          user_id,
          user_name,
          user_image,
          images,
          condition
        `)
        .eq("user_id", session.user.email)
        .order("created_at", { ascending: false });
      if (!error) setListings(data);
      setLoading(false);
    };
    fetchListings();
  }, [session?.user?.email]);

  if (!session?.user?.email) {
    return <div className="p-8 text-center text-gray-500">Please sign in to view your listings.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6 text-[#bf5700]">My Listings</h1>
        {loading ? (
          <div>Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-gray-500">You have not posted any listings yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <ListingCard
                  key={listing.id}
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  category={listing.category}
                  timePosted={timeago.format(listing.created_at)}
                  images={listing.images}
                  user={{ name: listing.user_name }}
                  condition={listing.condition}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;
