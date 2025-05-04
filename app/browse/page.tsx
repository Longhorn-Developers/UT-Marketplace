"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import SearchBar from "./components/SearchBar";
import ListingCard from "./components/ListingCard";
import * as timeago from "timeago.js";
import Link from "next/link";

const Browse = () => {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");

  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
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
        .order("created_at", { ascending: false });

      console.log(data);

      if (error) {
        console.error("Upload error:", error); // already there
        alert(`Upload error: ${JSON.stringify(error, null, 2)}`); // this will show the true cause
      } else {
        setListings(data);
      }
    };

    fetchListings();
  }, []);

  const filteredListings =
    !queryCategory || queryCategory === "All"
      ? listings
      : listings.filter((listing) => listing.category === queryCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <SearchBar />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {filteredListings.map((listing) => (
            <Link key={listing.id} href={`/listing/${listing.id}`}>

              <ListingCard
                key={listing.id}
                title={listing.title}
                price={listing.price}
                location={listing.location}
                category={listing.category}
                timePosted={timeago.format(listing.created_at)}
                images={listing.images}
                user={{ name: listing.user_name}}
                condition={listing.condition}
              />
            </Link>
              
          ))}
        </div>
      </div>
    </div>
  );
};

export default Browse;
