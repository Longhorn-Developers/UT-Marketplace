"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ListingPage from "../components/ListingPage";
import OwnerPage from "../components/OwnerPage";
import { supabase } from "../../lib/supabaseClient";
import { useSession } from "next-auth/react";

const Listing = () => {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const { data: sessionData } = useSession();
  const [isLoading, setIsLoading] = useState(true);

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
    <div>
      {isOwner ? (
        <OwnerPage {...commonProps} />
      ) : (
        <ListingPage {...commonProps} user={userProps} />
      )}
    </div>
  );
};

export default Listing;
