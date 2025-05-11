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
      if (!category) return;

      try {
        console.log('Fetching related listings for:', { category, currentListingId });
        
        let query = supabase
          .from("listings")
          .select("*")
          .eq("category", category)
          .neq("id", currentListingId);

        if (excludeSold) {
          query = query.eq("is_sold", false);
        }

        const { data, error } = await query.limit(4);
        
        console.log('Related listings response:', { data, error });

        if (error) {
          console.error('Error fetching related listings:', error);
          return;
        }

        if (data) {
          setRelatedListings(data);
        }
      } catch (err) {
        console.error('Error in fetchRelated:', err);
      }
    };

    fetchRelated();
  }, [category, currentListingId, excludeSold]);

  // Only hide if we have no listings at all
  if (relatedListings.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-8">
      <div className="border-b border-gray-200 pb-4 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Similar Listings
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          More items from the {category} category
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {relatedListings.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/listing/${item.id}`)}
            className="transform transition duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
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