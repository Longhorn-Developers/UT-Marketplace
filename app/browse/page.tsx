"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import SearchBar from "./components/SearchBar";
import ListingCard from "./components/ListingCard";
import * as timeago from "timeago.js";
import Link from "next/link";
import { toast } from "react-hot-toast";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        let query = supabase
          .from("listings")
          .select("*")
          .eq("is_sold", false)
          .eq("is_draft", false)
          .order("created_at", { ascending: sortOrder === "oldest" });

        if (queryCategory) {
          query = query.eq("category", queryCategory);
        }

        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Fetch user_settings for all unique user_ids
        const userIds = [...new Set((data || []).map(l => l.user_id))];
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("email, display_name, profile_image_url")
          .in("email", userIds);
        const userMap = {};
        (userSettings || []).forEach(u => {
          userMap[u.email] = {
            name: u.display_name || u.email,
            image: u.profile_image_url || null,
          };
        });
        const listingsWithUser = (data || []).map(listing => ({
          ...listing,
          user_name: userMap[listing.user_id]?.name || listing.user_name,
          user_image: userMap[listing.user_id]?.image || null,
        }));
        setListings(listingsWithUser);
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [queryCategory, searchTerm, sortOrder]);

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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-gray-500 text-lg mb-4">Loading listings...</span>
          </div>
        ) : filteredListings.length === 0 ? (
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
                  user={{ name: listing.user_name, user_id: listing.user_id, image: listing.user_image }}
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

export default function BrowsePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Browse />
    </Suspense>
  );
}
