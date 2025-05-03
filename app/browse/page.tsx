"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "./components/SearchBar";
import ListingCard from "./components/ListingCard";

const mockListings = [
  {
    title: "Modern Desk Chair",
    price: 75,
    location: "West Campus",
    category: "Furniture",
    timePosted: "2 hours ago",
  },
  {
    title: "Summer Sublease - 2BR",
    price: 1200,
    location: "Riverside",
    category: "Subleases",
    timePosted: "5 hours ago",
  },
  {
    title: "MacBook Pro 2022",
    price: 1400,
    location: "North Campus",
    category: "Tech",
    timePosted: "Yesterday",
  },
  {
    title: "Textbooks - Business & Econ",
    price: 120,
    location: "UT Campus",
    category: "Textbooks",
    timePosted: "Yesterday",
  },
];

const Browse = () => {
  const searchParams = useSearchParams();
  const queryCategory = searchParams.get("category");

  const filteredListings =
    !queryCategory || queryCategory === "All"
      ? mockListings
      : mockListings.filter((listing) => listing.category === queryCategory);

  return (
    <div className="h-screen bg-gray-50">
      <div className="p-8">
        <SearchBar />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {filteredListings.map((listing, index) => (
            <ListingCard key={index} {...listing} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Browse;
