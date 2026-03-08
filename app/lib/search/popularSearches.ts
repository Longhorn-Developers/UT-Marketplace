import { supabase } from "../supabaseClient";
import { derivePopularSearches } from "./searchUtils";

type ListingRow = {
  title?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

let cachedPopular: string[] | null = null;
let inflight: Promise<string[]> | null = null;

export const fetchPopularSearches = async (limit = 8): Promise<string[]> => {
  if (cachedPopular) return cachedPopular;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      let query = supabase
        .from("listings")
        .select("title, category, tags")
        .eq("is_draft", false)
        .neq("is_sold", true)
        .order("created_at", { ascending: false })
        .limit(200);

      let { data, error } = await query.eq("status", "approved");
      if (error) {
        const retry = await supabase
          .from("listings")
          .select("title, category, tags")
          .eq("is_draft", false)
          .neq("is_sold", true)
          .order("created_at", { ascending: false })
          .limit(200);
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error("Popular searches error:", error);
        cachedPopular = [];
        return cachedPopular;
      }

      cachedPopular = derivePopularSearches((data || []) as ListingRow[], limit);
      return cachedPopular;
    } catch (err) {
      console.error("Popular searches error:", err);
      cachedPopular = [];
      return cachedPopular;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const clearPopularSearchesCache = () => {
  cachedPopular = null;
  inflight = null;
};
