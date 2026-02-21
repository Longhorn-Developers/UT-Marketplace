import { supabase } from '../supabaseClient';
import { Listing, ListingCardProps, ListingPageProps } from '../../props/listing';
import { dbLogger } from './utils';
import { determineListingStatus, processListingsWithStatus } from '../utils/statusUtils';
import * as timeago from 'timeago.js';

// Helper function to convert UI values to database enum values (same as mobile app)
const convertToDbFormat = (value: string, type: 'category' | 'condition') => {
  if (type === 'category') {
    // Convert UI category names to database enum values
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
    // Convert UI condition names to database enum values
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

const categoryLabelMap: Record<string, string> = {
  'furniture': 'Furniture',
  'subleases': 'Subleases',
  'tech': 'Tech',
  'vehicles': 'Vehicles',
  'textbooks': 'Textbooks',
  'clothing': 'Clothing',
  'kitchen': 'Kitchen',
  'other': 'Other',
};

const getCategoryMatches = (term: string) => {
  const normalized = term.toLowerCase();
  return Object.entries(categoryLabelMap)
    .filter(([, label]) => label.toLowerCase().includes(normalized))
    .map(([dbValue]) => dbValue);
};

const buildSearchOrClause = (term: string) => {
  const normalized = term.trim().replace(/,+/g, ' ');
  if (!normalized) return '';
  const likeValue = `%${normalized}%`;
  const parts = [
    `title.ilike.${likeValue}`,
    `description.ilike.${likeValue}`,
    `location.ilike.${likeValue}`,
  ];
  const categoryMatches = getCategoryMatches(normalized);
  categoryMatches.forEach((value) => parts.push(`category.eq.${value}`));
  return parts.join(',');
};

export interface CreateListingParams {
  title: string;
  price: number;
  location: string;
  category: string;
  condition: string;
  description: string;
  images: string[];
  tags?: string[];
  userId: string;
  isDraft?: boolean;
  locationLat?: number;
  locationLng?: number;
  status?: 'pending' | 'approved' | 'denied';
}

export interface UpdateListingParams {
  id: string;
  title?: string;
  price?: number;
  location?: string;
  category?: string;
  condition?: string;
  description?: string;
  images?: string[];
  tags?: string[];
  is_sold?: boolean;
  is_draft?: boolean;
  locationLat?: number;
  locationLng?: number;
  status?: 'pending' | 'approved' | 'denied';
}

export interface GetListingsParams {
  limit?: number;
  offset?: number;
  category?: string;
  searchTerm?: string;
  userId?: string;
  excludeSold?: boolean;
  excludeDrafts?: boolean;
  status?: 'pending' | 'approved' | 'denied' | 'all';
  includeOwnListings?: boolean;
  currentUserId?: string;
}

export interface FavoriteListingParams {
  userId: string;
  listingId: string;
  type?: 'favorite' | 'watchlist';
}

/**
 * ListingService class following mobile app service layer pattern
 * Provides consistent database operations for listing functionality
 */
export class ListingService {
  /**
   * Create a new listing
   */
  static async createListing(params: CreateListingParams): Promise<Listing | null> {
    const {
      title,
      price,
      location,
      category,
      condition,
      description,
      images,
      tags = [],
      userId,
      isDraft = false,
      locationLat,
      locationLng,
      status = 'pending'
    } = params;

    try {
      dbLogger.info('Creating listing', { title, userId });

      const { data, error } = await supabase
        .from('listings')
        .insert({
          title,
          price,
          location,
          category: convertToDbFormat(category, 'category'),
          condition: convertToDbFormat(condition, 'condition'),
          description,
          images,
          tags,
          user_id: userId,
          is_draft: isDraft,
          is_sold: false,
          location_lat: locationLat || null,
          location_lng: locationLng || null,
          status: status,
        })
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to create listing', error);
        return null;
      }

      dbLogger.success('Listing created successfully', { listingId: data.id });
      return data as Listing;
    } catch (error) {
      dbLogger.error('Error in createListing', error);
      return null;
    }
  }

  /**
   * Update an existing listing
   */
  static async updateListing(params: UpdateListingParams): Promise<Listing | null> {
    const { id, ...updateData } = params;

    try {
      dbLogger.info('Updating listing', { listingId: id });

      const updatePayload: any = {
        ...updateData,
        location_lat: updateData.locationLat || null,
        location_lng: updateData.locationLng || null,
      };

      // Convert category and condition if provided
      if (updateData.category) {
        updatePayload.category = convertToDbFormat(updateData.category, 'category');
      }
      if (updateData.condition) {
        updatePayload.condition = convertToDbFormat(updateData.condition, 'condition');
      }
      if (updateData.tags) {
        updatePayload.tags = updateData.tags;
      }

      const { data, error } = await supabase
        .from('listings')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        dbLogger.error('Failed to update listing', error);
        return null;
      }

      dbLogger.success('Listing updated successfully', { listingId: data.id });
      return data as Listing;
    } catch (error) {
      dbLogger.error('Error in updateListing', error);
      return null;
    }
  }

  /**
   * Get listings with optional filtering
   */
  static async getListings(params: GetListingsParams = {}): Promise<Listing[]> {
    const {
      limit = 20,
      offset = 0,
      category,
      searchTerm,
      userId,
      excludeSold = true,
      excludeDrafts = true,
      status = 'approved',
      includeOwnListings = false,
      currentUserId
    } = params;

    try {
      dbLogger.info('Fetching listings', params);

      const buildBaseQuery = () => {
        let query = supabase
          .from('listings')
          .select(`*`)
          .order('created_at', { ascending: false });

        if (excludeSold) {
          query = query.eq('is_sold', false);
        }

        if (excludeDrafts) {
          query = query.eq('is_draft', false);
        }

        // Note: Status filtering is now done after data processing to handle missing columns

        if (category && category !== 'All') {
          query = query.eq('category', convertToDbFormat(category, 'category'));
        }

        if (userId) {
          query = query.eq('user_id', userId);
        }

        return query;
      };

      let listingsData: any[] = [];
      if (searchTerm && searchTerm.trim()) {
        const fetchLimit = offset + limit;
        const searchOr = buildSearchOrClause(searchTerm);

        const [textResult, ilikeResult] = await Promise.all([
          buildBaseQuery()
            .textSearch('search_vector', searchTerm, { type: 'websearch' })
            .limit(fetchLimit),
          buildBaseQuery()
            .or(searchOr)
            .limit(fetchLimit),
        ]);

        if (textResult.error) {
          dbLogger.error('Failed to fetch listings (text search)', textResult.error);
        }

        if (ilikeResult.error) {
          dbLogger.error('Failed to fetch listings (partial search)', ilikeResult.error);
        }

        const combined = [...(textResult.data || []), ...(ilikeResult.data || [])];
        const uniqueMap = new Map<string, any>();
        combined.forEach((listing) => {
          uniqueMap.set(listing.id, listing);
        });

        listingsData = Array.from(uniqueMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(offset, offset + limit);
      } else {
        const { data, error } = await buildBaseQuery()
          .range(offset, offset + limit - 1);

        if (error) {
          dbLogger.error('Failed to fetch listings', error);
          return [];
        }

        listingsData = data || [];
      }

      if (!listingsData || listingsData.length === 0) {
        return [];
      }

      // Get unique user IDs from listings
      const userIds = Array.from(new Set(listingsData.map(listing => listing.user_id)));
      
      // Fetch user data using the same pattern as mobile app
      let userSettings: any[] = [];
      if (userIds.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, display_name, profile_image_url')
          .in('id', userIds);
        
        userSettings = userData || [];
      }

      // Create user lookup map (same as mobile app)
      const userMap: any = {};
      userSettings.forEach(u => {
        userMap[u.id] = {
          name: u.display_name || (u.email ? u.email.split('@')[0] : 'User'),
          image: u.profile_image_url || null,
        };
      });

      // Join user data with listings and add status information
      const enrichedListings = listingsData.map(listing => ({
        ...listing,
        category: convertFromDbFormat(listing.category, 'category'),
        condition: convertFromDbFormat(listing.condition, 'condition'),
        user_name: userMap[listing.user_id]?.name || listing.user_id,
        user_image: userMap[listing.user_id]?.image || null,
      }));

      // Add status information to all listings
      const listingsWithStatus = processListingsWithStatus(enrichedListings);

      // Filter by status - only show approved listings by default, unless specifically requested
      let filteredListings = listingsWithStatus;
      if (status !== 'all') {
        if (includeOwnListings && currentUserId) {
          // Show all listings by current user regardless of status, but filter others by status
          filteredListings = listingsWithStatus.filter(listing => 
            listing.status === status || listing.user_id === currentUserId
          );
        } else {
          filteredListings = listingsWithStatus.filter(listing => listing.status === status);
        }
      }

      dbLogger.success('Listings fetched successfully', { count: filteredListings.length });
      return filteredListings as Listing[];
    } catch (error) {
      dbLogger.error('Error in getListings', error);
      return [];
    }
  }

  /**
   * Get all listings for admin purposes (includes all statuses)
   */
  static async getAllListings(): Promise<{ success: boolean; listings?: Listing[]; error?: string }> {
    try {
      dbLogger.info('Fetching all listings for admin');

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            display_name,
            email,
            profile_image_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        dbLogger.error('Failed to fetch all listings', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, listings: [] };
      }

      // Process listings with status information
      const processedListings = processListingsWithStatus(data);

      dbLogger.success('All listings fetched successfully', { count: processedListings.length });
      return { success: true, listings: processedListings as Listing[] };
    } catch (error: any) {
      dbLogger.error('Error in getAllListings', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get a single listing by ID with full details
   */
  static async getListingById(listingId: string, currentUserId?: string): Promise<ListingPageProps | null> {
    try {
      dbLogger.info('Fetching listing by ID', { listingId });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            display_name,
            profile_image_url
          ),
          favorites:user_favorites(user_id),
          favorite_count:user_favorites(count)
        `)
        .eq('id', listingId)
        .single();

      if (error) {
        dbLogger.error('Failed to fetch listing', error);
        return null;
      }

      if (!data) return null;

      // Determine status using centralized utility
      const { status, denial_reason: denialReason } = determineListingStatus(data);

      // Check if user has permission to view this listing
      // Only show pending/denied listings to the owner or admin
      if (status !== 'approved' && currentUserId !== data.user_id) {
        // TODO: Add admin check here when admin context is available
        dbLogger.warn('Unauthorized access to non-approved listing', { listingId, currentUserId, status });
        return null;
      }

      // Get user's other listings count
      const { data: userListings } = await supabase
        .from('listings')
        .select('id')
        .eq('user_id', data.user_id)
        .eq('is_sold', false)
        .eq('is_draft', false);

      // Get user's average rating
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_id', data.user_id);

      const averageRating = ratings && ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      const listing: ListingPageProps = {
        id: data.id,
        title: data.title,
        price: data.price,
        location: data.location,
        category: convertFromDbFormat(data.category, 'category'),
        timePosted: timeago.format(data.created_at),
        images: data.images || [],
        condition: convertFromDbFormat(data.condition, 'condition'),
        description: data.description,
        user: {
          name: data.user?.display_name || 'Unknown User',
          image: data.user?.profile_image_url,
          rating: averageRating,
        },
        listingCount: userListings?.length || 0,
        listingUserName: data.user?.display_name || 'Unknown User',
        listingUserEmail: data.user_id, // This will be the user ID, not email
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        status: status,
        denial_reason: denialReason,
      };

      dbLogger.success('Listing fetched successfully', { listingId });
      return listing;
    } catch (error) {
      dbLogger.error('Error in getListingById', error);
      return null;
    }
  }

  /**
   * Delete a listing
   */
  static async deleteListing(listingId: string, userId: string): Promise<boolean> {
    try {
      dbLogger.info('Deleting listing', { listingId, userId });

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('user_id', userId); // Ensure user owns the listing

      if (error) {
        dbLogger.error('Failed to delete listing', error);
        return false;
      }

      dbLogger.success('Listing deleted successfully', { listingId });
      return true;
    } catch (error) {
      dbLogger.error('Error in deleteListing', error);
      return false;
    }
  }

  /**
   * Mark listing as sold/unsold
   */
  static async markListingAsSold(listingId: string, userId: string, isSold: boolean): Promise<boolean> {
    try {
      dbLogger.info('Updating listing sold status', { listingId, userId, isSold });

      const { error } = await supabase
        .from('listings')
        .update({ is_sold: isSold })
        .eq('id', listingId)
        .eq('user_id', userId);

      if (error) {
        dbLogger.error('Failed to update listing sold status', error);
        return false;
      }

      dbLogger.success('Listing sold status updated successfully', { listingId, isSold });
      return true;
    } catch (error) {
      dbLogger.error('Error in markListingAsSold', error);
      return false;
    }
  }

  /**
   * Add/remove favorite/watchlist listing
   */
  static async toggleFavorite(params: FavoriteListingParams): Promise<{ success: boolean; isFavorited: boolean }> {
    const { userId, listingId, type = 'favorite' } = params;

    try {
      dbLogger.info('Toggling favorite/watchlist', { userId, listingId, type });

      // Check if already favorited/watchlisted
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .eq('type', type)
        .single();

      if (existing) {
        // Remove favorite/watchlist
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', listingId)
          .eq('type', type);

        if (error) {
          dbLogger.error(`Failed to remove ${type}`, error);
          return { success: false, isFavorited: true };
        }

        dbLogger.success(`${type} removed successfully`);
        return { success: true, isFavorited: false };
      } else {
        // Add favorite/watchlist
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            listing_id: listingId,
            type: type,
          });

        if (error) {
          dbLogger.error(`Failed to add ${type}`, error);
          return { success: false, isFavorited: false };
        }

        dbLogger.success(`${type} added successfully`);
        return { success: true, isFavorited: true };
      }
    } catch (error) {
      dbLogger.error(`Error in toggle${type}`, error);
      return { success: false, isFavorited: false };
    }
  }

  /**
   * Get user's favorite/watchlist listings
   */
  static async getFavoriteListings(userId: string, type: 'favorite' | 'watchlist' = 'favorite'): Promise<Listing[]> {
    try {
      dbLogger.info('Fetching favorite/watchlist listings', { userId, type });

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          listing:listings(
            *,
            user:users!user_id(
              id,
              display_name,
              profile_image_url
            )
          )
        `)
        .eq('user_id', userId)
        .eq('type', type);

      if (error) {
        dbLogger.error(`Failed to fetch ${type} listings`, error);
        return [];
      }

      const listings = (data?.map(fav => {
        const listing = Array.isArray(fav.listing) ? fav.listing[0] : fav.listing;
        if (!listing) return null;
        return {
          ...listing,
          category: convertFromDbFormat(listing.category, 'category'),
          condition: convertFromDbFormat(listing.condition, 'condition'),
        };
      }).filter(Boolean) || []) as any[];
      
      dbLogger.success(`${type} listings fetched successfully`, { count: listings.length });
      return listings;
    } catch (error) {
      dbLogger.error(`Error in get${type}Listings`, error);
      return [];
    }
  }

  /**
   * Get user's favorite/watchlist status for a specific listing
   */
  static async getFavoriteStatus(userId: string, listingId: string): Promise<{ isFavorited: boolean; isWatchlisted: boolean }> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('type')
        .eq('user_id', userId)
        .eq('listing_id', listingId);

      if (error) {
        dbLogger.error('Failed to fetch favorite status', error);
        return { isFavorited: false, isWatchlisted: false };
      }

      const types = data?.map(item => item.type) || [];
      return {
        isFavorited: types.includes('favorite'),
        isWatchlisted: types.includes('watchlist')
      };
    } catch (error) {
      dbLogger.error('Error in getFavoriteStatus', error);
      return { isFavorited: false, isWatchlisted: false };
    }
  }

  /**
   * Upload images to storage
   */
  static async uploadImages(images: File[], userId: string): Promise<string[]> {
    const uploadedUrls: string[] = [];

    try {
      dbLogger.info('Uploading images', { count: images.length, userId });

      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(filePath, image);

        if (error) {
          dbLogger.error('Failed to upload image', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      dbLogger.success('Images uploaded successfully', { count: uploadedUrls.length });
      return uploadedUrls;
    } catch (error) {
      dbLogger.error('Error in uploadImages', error);
      return uploadedUrls; // Return what we managed to upload
    }
  }

  /**
   * Search listings with advanced filters
   */
  static async searchListings(searchTerm: string, filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    location?: string;
  } = {}): Promise<Listing[]> {
    try {
      dbLogger.info('Searching listings', { searchTerm, filters });

      const baseQuery = () => {
        let base = supabase
          .from('listings')
          .select(`
            *,
            user:users!user_id(
              id,
              display_name,
              profile_image_url
            )
          `)
          .eq('is_sold', false)
          .eq('is_draft', false)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (filters.category && filters.category !== 'All') {
          base = base.eq('category', convertToDbFormat(filters.category, 'category'));
        }

        if (filters.minPrice !== undefined) {
          base = base.gte('price', filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
          base = base.lte('price', filters.maxPrice);
        }

        if (filters.condition) {
          base = base.eq('condition', convertToDbFormat(filters.condition, 'condition'));
        }

        if (filters.location) {
          base = base.ilike('location', `%${filters.location}%`);
        }

        return base;
      };

      let data: any[] = [];
      if (searchTerm && searchTerm.trim()) {
        const searchOr = buildSearchOrClause(searchTerm);

        const [textResult, ilikeResult] = await Promise.all([
          baseQuery().textSearch('search_vector', searchTerm, { type: 'websearch' }),
          baseQuery().or(searchOr),
        ]);

        if (textResult.error) {
          dbLogger.error('Failed to search listings (text search)', textResult.error);
        }

        if (ilikeResult.error) {
          dbLogger.error('Failed to search listings (partial search)', ilikeResult.error);
        }

        const combined = [...(textResult.data || []), ...(ilikeResult.data || [])];
        const uniqueMap = new Map<string, any>();
        combined.forEach((listing) => {
          uniqueMap.set(listing.id, listing);
        });
        data = Array.from(uniqueMap.values());
      } else {
        const { data: queryData, error } = await baseQuery();

        if (error) {
          dbLogger.error('Failed to search listings', error);
          return [];
        }

        data = queryData || [];
      }

      const convertedData = data?.map(listing => ({
        ...listing,
        category: convertFromDbFormat(listing.category, 'category'),
        condition: convertFromDbFormat(listing.condition, 'condition'),
      })) || [];

      // Add status information and filter to only approved listings
      const listingsWithStatus = processListingsWithStatus(convertedData);
      const approvedListings = listingsWithStatus.filter(listing => listing.status === 'approved');

      dbLogger.success('Search completed successfully', { count: approvedListings.length });
      return approvedListings as Listing[];
    } catch (error) {
      dbLogger.error('Error in searchListings', error);
      return [];
    }
  }

  /**
   * Get user's denied listings that need to be edited and resubmitted
   */
  static async getDeniedListings(userId: string): Promise<Listing[]> {
    try {
      dbLogger.info('Fetching denied listings for user', { userId });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          user:users!user_id(
            id,
            display_name,
            profile_image_url
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'denied')
        .order('updated_at', { ascending: false });

      if (error) {
        dbLogger.error('Failed to fetch denied listings', error);
        return [];
      }

      const convertedData = data?.map(listing => ({
        ...listing,
        category: convertFromDbFormat(listing.category, 'category'),
        condition: convertFromDbFormat(listing.condition, 'condition'),
      })) || [];

      dbLogger.success('Denied listings fetched successfully', { count: convertedData.length });
      return convertedData as Listing[];
    } catch (error) {
      dbLogger.error('Error in getDeniedListings', error);
      return [];
    }
  }

  /**
   * Resubmit a denied listing for approval (sets status back to pending)
   */
  static async resubmitListing(listingId: string, userId: string): Promise<boolean> {
    try {
      dbLogger.info('Resubmitting listing for approval', { listingId, userId });

      const { error } = await supabase
        .from('listings')
        .update({ status: 'pending' })
        .eq('id', listingId)
        .eq('user_id', userId) // Ensure user owns the listing
        .eq('status', 'denied'); // Only allow resubmission of denied listings

      if (error) {
        dbLogger.error('Failed to resubmit listing', error);
        return false;
      }

      dbLogger.success('Listing resubmitted successfully', { listingId });
      return true;
    } catch (error) {
      dbLogger.error('Error in resubmitListing', error);
      return false;
    }
  }
}
