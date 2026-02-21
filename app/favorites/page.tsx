"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ListingService } from '../lib/database/ListingService';
import { Listing } from '../props/listing';
import Link from 'next/link';
import { Heart, Eye, MapPin, Calendar, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorite' | 'watchlist'>('favorite');
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [watchlist, setWatchlist] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await ListingService.getFavoriteListings(user.id, 'favorite');
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchWatchlist = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await ListingService.getFavoriteListings(user.id, 'watchlist');
      setWatchlist(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
      fetchWatchlist();
    }
  }, [user?.id, fetchFavorites, fetchWatchlist]);

  const handleRemoveItem = async (listingId: string, type: 'favorite' | 'watchlist') => {
    if (!user?.id) return;
    
    try {
      await ListingService.toggleFavorite({
        userId: user.id,
        listingId: listingId,
        type: type
      });
      
      // Refresh the appropriate list
      if (type === 'favorite') {
        fetchFavorites();
      } else {
        fetchWatchlist();
      }
    } catch (error) {
      console.error(`Error removing from ${type}:`, error);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your favorites and watchlist.</p>
          <Link
            href="/auth/signin"
            className="bg-[#bf5700] text-white px-6 py-2 rounded-lg hover:bg-[#a54700] transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const currentData = activeTab === 'favorite' ? favorites : watchlist;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Saved Items</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('favorite')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'favorite'
                  ? 'bg-[#bf5700] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Heart size={16} className="mr-2" />
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition ${
                activeTab === 'watchlist'
                  ? 'bg-[#bf5700] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye size={16} className="mr-2" />
              Watchlist ({watchlist.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#bf5700]" />
            <span className="ml-2 text-gray-600">Loading {activeTab}...</span>
          </div>
        ) : currentData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <Link href={`/listing/${listing.id}`}>
                    <div className="aspect-[4/3] bg-gray-100">
                      {listing.images && listing.images[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveItem(listing.id, activeTab)}
                    className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white transition"
                  >
                    {activeTab === 'favorite' ? (
                      <Heart size={16} className="text-red-500" fill="currentColor" />
                    ) : (
                      <Eye size={16} className="text-blue-500" />
                    )}
                  </button>
                  {listing.is_sold && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      SOLD
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <Link href={`/listing/${listing.id}`} className="block hover:text-[#bf5700] transition">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
                    <p className="text-2xl font-bold text-[#bf5700] mb-3">${listing.price}</p>
                  </Link>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin size={14} className="mr-1" />
                    <span>{listing.location}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      {listing.condition}
                    </span>
                    <span className="bg-[#bf5700]/10 text-[#bf5700] px-2 py-1 rounded-full text-xs font-medium">
                      {listing.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              {activeTab === 'favorite' ? (
                <Heart size={48} className="text-gray-400" />
              ) : (
                <Eye size={48} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {activeTab === 'favorite' ? 'favorites' : 'watchlist items'} yet
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'favorite' 
                ? 'Items you favorite will appear here' 
                : 'Items you\'re watching will appear here'
              }
            </p>
            <Link
              href="/browse"
              className="bg-[#bf5700] text-white px-6 py-2 rounded-lg hover:bg-[#a54700] transition"
            >
              Browse Listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
