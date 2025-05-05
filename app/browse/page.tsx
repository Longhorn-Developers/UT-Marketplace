"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import SearchBar from "./components/SearchBar";
import ListingCard from "./components/ListingCard";
import * as timeago from "timeago.js";
import Link from "next/link";

const Browse = () => {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");
  const searchTerm = searchParams.get("search") || "";
  const sortOrder = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const postedAfter = searchParams.get("postedAfter");
  const postedBefore = searchParams.get("postedBefore");

  const [listings, setListings] = useState<any[]>([]);
  const searchBarRef = useRef<any>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: sortOrder === "oldest" });

      if (error) {
        console.error("Upload error:", error);
        alert(`Upload error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setListings(data);
      }
    };

    fetchListings();
  }, [sortOrder]);

  let filteredListings = listings;
  if (queryCategory && queryCategory !== "All") {
    filteredListings = filteredListings.filter((listing) => listing.category === queryCategory);
  }
  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filteredListings = filteredListings.filter(
      (listing) =>
        (listing.title && listing.title.toLowerCase().includes(lower)) ||
        (listing.description && listing.description.toLowerCase().includes(lower))
    );
  }
  if (minPrice) {
    filteredListings = filteredListings.filter((listing) => Number(listing.price) >= Number(minPrice));
  }
  if (maxPrice) {
    filteredListings = filteredListings.filter((listing) => Number(listing.price) <= Number(maxPrice));
  }
  if (postedAfter) {
    filteredListings = filteredListings.filter((listing) => new Date(listing.created_at) >= new Date(postedAfter));
  }
  if (postedBefore) {
    filteredListings = filteredListings.filter((listing) => new Date(listing.created_at) <= new Date(postedBefore));
  }

  // Helper to clear filters from child
  const handleClearFilters = () => {
    if (searchBarRef.current && typeof searchBarRef.current.handleClearFilters === 'function') {
      searchBarRef.current.handleClearFilters();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <SearchBar ref={searchBarRef} />
        {filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-gray-500 text-lg mb-4">No listings match your search or filters.</span>
            <button
              className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700] flex items-center gap-2"
              onClick={handleClearFilters}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => (window.location.href = `/listing/${listing.id}`)}
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
                  user={{ name: listing.user_name, user_id: listing.user_id }}
                  condition={listing.condition}
                  searchTerm={searchTerm}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
