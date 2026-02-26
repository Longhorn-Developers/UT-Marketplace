"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useSearchParams } from "next/navigation";
import SearchBar from "./components/SearchBar";
import ListingCard from "./components/ListingCard";
import * as timeago from "timeago.js";
import { toast } from "react-toastify";
import { ListingService } from "../lib/database/ListingService"; 
import {
  containerVariants,
  searchBarVariants,
  itemVariants,
  emptyStateVariants,
  loadingVariants,
} from "../props/animations";
import BrowseLoader from "./components/BrowseLoader";

const Browse = () => {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");
  const searchTerm = searchParams.get("search") || "";
  const sortOrder = searchParams.get("sort") || "relevance";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const postedAfter = searchParams.get("postedAfter");
  const postedBefore = searchParams.get("postedBefore");

  const [listings, setListings] = useState<any[]>([]);
  const searchBarRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const getScrollTop = (event?: Event) => {
      const target = event?.target;
      if (target && (target as HTMLElement).scrollTop !== undefined) {
        const element = target as HTMLElement;
        if (element.scrollHeight > element.clientHeight) {
          scrollContainerRef.current = element;
          return element.scrollTop;
        }
      }
      return (
        document.scrollingElement?.scrollTop ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        window.scrollY ||
        0
      );
    };

    const handleScroll = (event?: Event) => {
      const scrollTop = getScrollTop(event);
      setShowScrollTop(scrollTop > 400);
    };

    handleScroll();
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const listingsData = await ListingService.getListings({
          category: queryCategory || undefined,
          searchTerm: searchTerm || undefined,
          excludeSold: true,
          excludeDrafts: true,
          limit: 100 // Increased limit for browse page
        });

        // Defer sorting to client-side to support relevance/price/date
        const formattedListings = listingsData;

        setListings(formattedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [queryCategory, searchTerm, sortOrder, minPrice, maxPrice, postedAfter, postedBefore]);

  let filteredListings = listings;
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

  if (sortOrder === "price-asc") {
    filteredListings = [...filteredListings].sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortOrder === "price-desc") {
    filteredListings = [...filteredListings].sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortOrder === "oldest") {
    filteredListings = [...filteredListings].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (sortOrder === "newest") {
    filteredListings = [...filteredListings].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sortOrder === "relevance") {
    // Keep server ordering for relevance; fallback to newest if no search term
    if (!searchTerm) {
      filteredListings = [...filteredListings].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  }

  // Helper to clear filters from child
  const handleClearFilters = () => {
    if (searchBarRef.current && typeof searchBarRef.current.handleClearFilters === 'function') {
      searchBarRef.current.handleClearFilters();
    }
  };

  return (
    <>
      <motion.div 
        className="bg-gray-50 min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      <div className="p-8">
        <motion.div variants={searchBarVariants}>
          <SearchBar ref={searchBarRef} setLoading={setLoading} />
        </motion.div>
        
        {loading ? (
          <motion.div 
            className="flex items-center justify-center min-h-[60vh]"
            variants={loadingVariants}
            initial="hidden"
            animate="visible"
          >
            <BrowseLoader />
          </motion.div>
        ) : filteredListings.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center min-h-[60vh]"
            variants={emptyStateVariants}
            initial="hidden"
            animate="visible"
          >
            <span className="text-gray-500 text-lg mb-4">No listings match your search or filters.</span>
            <button
              className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700] flex items-center gap-2"
              onClick={handleClearFilters}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8"
          >
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
    </motion.div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => {
            const target =
              scrollContainerRef.current ||
              document.scrollingElement ||
              document.documentElement ||
              document.body;

            if (target && "scrollTo" in target) {
              target.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            } else {
              window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-white border border-gray-200 text-gray-700 shadow-lg hover:border-[#bf5700] hover:text-[#bf5700] transition"
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </>
  );
};

export default function BrowsePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Browse />
    </Suspense>
  );
}
