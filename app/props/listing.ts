export interface ListingCardProps {
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
  images?: string[];
  user: {
    name: string;
    user_id: string;
    image?: string;
  };
  condition: string;
  searchTerm?: string;
  userRating?: number;
}

export interface ListingPageProps {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
  images?: string[];
  condition: string;
  description: string;
  user: {
    name: string;
    image?: string;
    rating?: number;
  };
  listingCount: number;
  listingUserName: string;
  listingUserEmail: string;
  location_lat?: number;
  location_lng?: number;
}

export interface OwnerPageProps {
  title: string;
  price: number;
  location: string;
  category: string;
  timePosted: string;
  images?: string[];
  condition: string;
  description: string;
  id?: string;
  is_sold?: boolean;
  is_draft?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  category: string;
  created_at: string;
  images: string[];
  condition: string;
  description: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  is_sold: boolean;
} 

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  listing_id?: string;
}

export interface Conversation {
  user_id: string;
  user_name: string;
  user_image?: string;
  listing_id: string;
  listing_title: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface Notification {
  id: string;
  sender_name: string;
  content: string;
  created_at: string;
  read: boolean;
}