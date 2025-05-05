import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ListingCard from './ListingCard';
import * as timeago from 'timeago.js';
import { Listing } from '../../props/listing';

interface RelatedListingsProps {
  currentListingId: string;
  category: string;
  title: string;
  excludeSold?: boolean;
}

const RelatedListings: React.FC<RelatedListingsProps> = ({
  currentListingId,
  category,
  title,
  excludeSold = true,
}) => {
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRelated = async () => {
      if (!category || !title) return;

      let query = supabase
        .from("listings")
        .select("*")
        .eq("category", category)
        .neq("id", currentListingId)
        .neq("title", title);

      if (excludeSold) {
        query = query.eq("is_sold", false);
      }

      const { data, error } = await query.limit(4);

      if (!error) {
        setRelatedListings(data || []);
      }
    };

    fetchRelated();
  }, [category, title, currentListingId, excludeSold]);

  if (relatedListings.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-gray-200 mb-10">
      <h2 className="text-xl font-bold mb-4 text-gray-900">
        Related Listings
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {relatedListings.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/listing/${item.id}`)}
            className="cursor-pointer"
          >
            <ListingCard
              title={item.title}
              price={item.price}
              location={item.location}
              category={item.category}
              timePosted={timeago.format(item.created_at)}
              images={item.images}
              user={{ name: item.user_name, user_id: item.user_id }}
              condition={item.condition}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedListings; 