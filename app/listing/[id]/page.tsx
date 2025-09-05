"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ListingPage from "../components/ListingPage";
import OwnerPage from "../components/OwnerPage";
import { useAuth } from '../../context/AuthContext';
import RelatedListings from "../../browse/components/RelatedListings";
import { Loader2 } from "lucide-react";
import { ListingService } from '../../lib/database/ListingService';
import { UserService } from '../../lib/database/UserService';
import { dbLogger } from '../../lib/database/utils';
import { ListingPageProps } from '../../props/listing';

const Listing = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingPageProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const listingData = await ListingService.getListingById(id as string);
        
        if (!listingData) {
          throw new Error("Listing not found");
        }

        setListing(listingData);
      } catch (err) {
        dbLogger.error('Error fetching listing', err);
        setError(err instanceof Error ? err.message : "Failed to load listing");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center w-full max-w-xl">
          <div className="mb-6">
            <Loader2 className="h-12 w-12 animate-spin text-[#bf5700]" />
          </div>
          <div className="w-full flex flex-col gap-4">
            <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto animate-pulse" />
            <div className="h-6 bg-gray-100 rounded w-1/3 mx-auto animate-pulse" />
            <div className="h-48 bg-gray-100 rounded-xl w-full animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto animate-pulse" />
            <div className="flex gap-2 mt-4">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <span className="text-gray-600 mt-8 text-lg font-medium">Loading listing...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Listing not found"}</p>
          <button
            onClick={() => router.push("/browse")}
            className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700]"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.listingUserEmail; // listingUserEmail contains user ID
  const isDraft = false; // Will be handled by the service

  // If the listing is a draft and the current user is not the owner, show 404
  if (isDraft && !isOwner) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">404 - Listing Not Found</h2>
          <p className="text-gray-600 mb-6">This listing either doesn&apos;t exist or is not available for viewing.</p>
          <button
            onClick={() => router.push("/browse")}
            className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700]"
          >
            Browse Other Listings
          </button>
        </div>
      </div>
    );
  }

  const commonProps = {
    title: listing.title,
    price: listing.price,
    location: listing.location,
    category: listing.category,
    timePosted: listing.timePosted,
    images: listing.images,
    condition: listing.condition,
    description: listing.description || '',
    id: listing.id,
    is_sold: false, // Will be handled by the service
    is_draft: false, // Will be handled by the service
    location_lat: listing.location_lat,
    location_lng: listing.location_lng,
  };

  const userProps = {
    name: listing.user.name,
    image: listing.user.image,
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {isOwner ? (
          <OwnerPage {...commonProps} />
        ) : (
          <ListingPage 
            {...listing}
          />
        )}
        
        {/* Only show related listings if the current listing is not a draft or if the user is the owner */}
        {(!isDraft || isOwner) && (
          <RelatedListings
            currentListingId={listing.id}
            category={listing.category}
            title={listing.title}
            excludeSold={true}
          />
        )}
      </div>
    </div>
  );
};

export default Listing;
