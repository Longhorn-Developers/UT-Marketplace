import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import ListingCard from './ListingCard';
import * as timeago from 'timeago.js';
import { Listing } from '../../props/listing';
import { processListingsWithStatus } from '../../lib/utils/statusUtils';

// Helper function to convert UI values to database enum values (same as mobile app)
const convertToDbFormat = (value: string, type: 'category' | 'condition') => {
  if (type === 'category') {
    const categoryMap: Record<string, string> = {
      'Furniture': 'furniture',
      'Subleases': 'subleases', 
      'Tech': 'tech',
      'Vehicles': 'vehicles',
      'Textbooks': 'textbooks',
      'Clothing': 'clothing',
      'Kitchen': 'kitchen',
      'Other': 'other',
    };
    return categoryMap[value] || value.toLowerCase();
  }
  
  if (type === 'condition') {
    const conditionMap: Record<string, string> = {
      'New': 'new',
      'Like New': 'like_new',
      'Good': 'good',
      'Fair': 'fair',
      'Poor': 'poor',
    };
    return conditionMap[value] || value.toLowerCase();
  }
  
  return value;
};

// Helper function to convert database enum values to UI values (same as mobile app)
const convertFromDbFormat = (value: string, type: 'category' | 'condition') => {
  if (type === 'category') {
    const categoryMap: Record<string, string> = {
      'furniture': 'Furniture',
      'subleases': 'Subleases', 
      'tech': 'Tech',
      'vehicles': 'Vehicles',
      'textbooks': 'Textbooks',
      'clothing': 'Clothing',
      'kitchen': 'Kitchen',
      'other': 'Other',
    };
    return categoryMap[value] || value;
  }
  
  if (type === 'condition') {
    const conditionMap: Record<string, string> = {
      'new': 'New',
      'like_new': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor',
    };
    return conditionMap[value] || value;
  }
  
  return value;
};

interface RelatedListingsProps {
  currentListingId: string;
  category: string;
  title: string;
  excludeSold?: boolean;
}

interface RelatedListing extends Listing {
  user?: {
    id?: string;
    display_name?: string;
    email?: string;
    profile_image_url?: string;
  };
}

const RelatedListings: React.FC<RelatedListingsProps> = ({
  currentListingId,
  category,
  title,
  excludeSold = true,
}) => {
  const [relatedListings, setRelatedListings] = useState<RelatedListing[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRelated = async () => {
      if (!category) return;

      try {
        console.log('Fetching related listings for:', { category, currentListingId });
        
        let query = supabase
          .from("listings")
          .select(`
            *,
            user:users!user_id(
              id,
              display_name,
              email,
              profile_image_url
            )
          `)
          .eq("category", convertToDbFormat(category, 'category'))
          .neq("id", currentListingId);

        if (excludeSold) {
          query = query.eq("is_sold", false);
        }
        
        // Always exclude draft listings
        query = query.eq("is_draft", false);

        const { data, error } = await query.limit(4);
        
        console.log('Related listings response:', { data, error });

        if (error) {
          console.error('Error fetching related listings:', error);
          return;
        }

        if (data) {
          // Convert database values to UI format
          const convertedData = data.map(listing => ({
            ...listing,
            category: convertFromDbFormat(listing.category, 'category'),
            condition: convertFromDbFormat(listing.condition, 'condition'),
          }));
          
          // Add status information and filter out non-approved listings
          const listingsWithStatus = processListingsWithStatus(convertedData);
          const approvedListings = listingsWithStatus.filter(listing => listing.status === 'approved');
          
          setRelatedListings(approvedListings);
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
              user={{
                name:
                  item.user?.display_name ||
                  item.user?.email?.split('@')[0] ||
                  item.user_name ||
                  'User',
                user_id: item.user?.id || item.user_id,
                image: item.user?.profile_image_url || item.user_image || null
              }}
              condition={item.condition}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedListings; 
