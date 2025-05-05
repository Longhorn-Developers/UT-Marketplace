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
}

export interface ListingPageProps {
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
  };
  listingCount: number;
  listingUserName: string;
  listingUserEmail: string;
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
  user_name: string;
  user_id: string;
  is_sold: boolean;
} 