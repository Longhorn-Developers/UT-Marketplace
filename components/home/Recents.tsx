"use client"
import Link from "next/link"
import ListingCard from "../../app/browse/components/ListingCard"
import { useEffect, useState } from "react"
import * as timeago from "timeago.js"
import { ListingService } from "../../app/lib/database/ListingService"
import { UserService } from "../../app/lib/database/UserService"
import { Listing } from "../../app/props/listing"
import { dbLogger } from "../../app/lib/database/utils"
import { supabase } from "../../app/lib/supabaseClient"

const RecentListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        setLoading(true);
        const data = await ListingService.getListings({
          limit: 6,
          excludeSold: true,
          excludeDrafts: true
        });

        // Fetch user data for all listings
        if (data && data.length > 0) {
          const userIds = [...new Set(data.map(listing => listing.user_id))];
          const { data: userSettings } = await supabase
            .from('users')
            .select('id, email, display_name, profile_image_url')
            .in('id', userIds);

          const userMap: { [key: string]: { name: string; image: string | null } } = {};
          (userSettings || []).forEach((u: any) => {
            userMap[u.id] = {
              name: u.display_name || (u.email ? u.email.split('@')[0] : 'User'),
              image: u.profile_image_url || null,
            };
          });

          // Add user data to listings
          const listingsWithUser = data.map(listing => ({
            ...listing,
            user_name: userMap[listing.user_id]?.name || listing.user_id,
            user_image: userMap[listing.user_id]?.image || null,
          }));

          setListings(listingsWithUser);
        } else {
          setListings([]);
        }
      } catch (error) {
        dbLogger.error('Error fetching recent listings', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, []);



  return (
    <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
        <Link href="/browse" className="text-orange-600 hover:text-orange-700 font-medium">
          View All
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No recent listings found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} onClick={() => window.location.href = `/listing/${listing.id}`} className="cursor-pointer">
              <ListingCard
                title={listing.title}
                price={listing.price}
                location={listing.location}
                category={listing.category}
                timePosted={timeago.format(listing.created_at)}
                images={listing.images}
                user={{ 
                  name: listing.user_name, 
                  user_id: listing.user_id, 
                  image: listing.user_image 
                }}
                condition={listing.condition}
                userRating={null} // UserRatingDisplay component will fetch the rating
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default RecentListings