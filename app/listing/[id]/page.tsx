"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ListingPage from "../components/ListingPage";
import OwnerPage from "../components/OwnerPage";
import { supabase } from "../../lib/supabaseClient";
import { useSession } from "next-auth/react";
import RelatedListings from "../../browse/components/RelatedListings";

const Listing = () => {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<any>(null);
  const { data: sessionData } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [listingCount, setListingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: listingData, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching listing:", error);
      } else {
        setListing(listingData);

        const { count } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", listingData.user_id);

        setListingCount(count || 0);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;
  if (!listing) return <div>Listing not found.</div>;

  const isOwner = sessionData?.user?.email === listing.user_id;

  const commonProps = {
    title: listing.title,
    price: listing.price,
    location: listing.location,
    category: listing.category,
    timePosted: new Date(listing.created_at).toLocaleString(),
    images: listing.images,
    condition: listing.condition,
    description: listing.description || '',
    id: listing.id, // pass id for delete/edit
  };

  const userProps = {
    name: listing.user_name || 'Unknown',
    image: listing.user_image,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* ... existing image gallery code ... */}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        {isOwner ? (
          <OwnerPage {...commonProps} />
        ) : (
          <ListingPage {...commonProps} user={userProps} listingCount={listingCount} listingUserName={listing.user_name} listingUserEmail={listing.user_id} />
        )}
      </div>

      <RelatedListings
        currentListingId={listing.id}
        category={listing.category}
        title={listing.title}
        excludeSold={true}
      />
    </div>
  );
};

export default Listing;
