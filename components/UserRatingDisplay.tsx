import React, { useEffect, useState } from "react";
import { supabase } from "../app/lib/supabaseClient";

interface UserRatingDisplayProps {
  userId: string;
  rating?: number | null;
  className?: string;
}

const UserRatingDisplay: React.FC<UserRatingDisplayProps> = ({ userId, rating, className }) => {
  const [fetchedRating, setFetchedRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof rating === 'number') return;
    if (!userId) return;
    setLoading(true);
    supabase
      .from('ratings')
      .select('rating')
      .eq('rated_id', userId)
      .then(({ data, error }) => {
        if (error || !data) {
          setFetchedRating(null);
        } else if (data.length > 0) {
          const avg = data.reduce((acc, curr) => acc + curr.rating, 0) / data.length;
          setFetchedRating(avg);
        } else {
          setFetchedRating(null);
        }
        setLoading(false);
      });
  }, [userId, rating]);

  const displayRating = typeof rating === 'number' ? rating : fetchedRating;

  return (
    <span className={className}>
      {loading ? (
        <span className="text-gray-400">Loading...</span>
      ) : displayRating !== null && displayRating > 0 ? (
        <span className="inline-flex items-center gap-0.5 text-yellow-500">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="inline-block"><path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"/></svg>
          <span className="text-xs font-semibold">{displayRating.toFixed(1)}</span>
        </span>
      ) : (
        <span className="text-gray-400">No ratings</span>
      )}
    </span>
  );
};

export default UserRatingDisplay; 