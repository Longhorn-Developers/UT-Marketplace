/**
 * Utility functions for handling listing status detection
 * Provides consistent status logic across all components
 */

export type ListingStatus = 'pending' | 'approved' | 'denied';

export interface ListingWithStatus {
  status: ListingStatus;
  denial_reason?: string | null;
}

/**
 * Determines the status of a listing, handling cases where status column doesn't exist
 */
export function determineListingStatus(listing: any): ListingWithStatus {
  let status: ListingStatus = 'pending'; // Default to pending
  let denialReason: string | null = null;
  
  if (listing.status !== undefined && listing.status !== null) {
    // Status column exists, use actual value
    status = listing.status as ListingStatus;
    denialReason = listing.denial_reason || null;
  }
  // If status column doesn't exist, keep default 'pending'
  
  return { status, denial_reason: denialReason };
}

/**
 * Processes an array of listings to add consistent status information
 */
export function processListingsWithStatus<T extends any>(listings: T[]): (T & ListingWithStatus)[] {
  return listings.map(listing => ({
    ...listing,
    ...determineListingStatus(listing)
  }));
}