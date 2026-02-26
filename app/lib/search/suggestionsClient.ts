export type SearchSuggestion = {
  value: string;
  label: string;
  type?: string;
};

const suggestionCache = new Map<string, SearchSuggestion[]>();
const inflight = new Map<string, Promise<SearchSuggestion[]>>();
const MAX_CACHE = 50;

const normalizeKey = (term: string) => term.trim().toLowerCase();

const storeInCache = (key: string, value: SearchSuggestion[]) => {
  suggestionCache.set(key, value);
  if (suggestionCache.size > MAX_CACHE) {
    const firstKey = suggestionCache.keys().next().value;
    if (firstKey) suggestionCache.delete(firstKey);
  }
};

export const fetchSearchSuggestions = async (term: string) => {
  const key = normalizeKey(term);
  if (key.length < 2) return [];

  const cached = suggestionCache.get(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = fetch(`/api/search/suggestions?term=${encodeURIComponent(key)}`)
    .then(async (res) => {
      if (!res.ok) return [];
      const payload = await res.json();
      const suggestions = Array.isArray(payload?.suggestions)
        ? (payload.suggestions as SearchSuggestion[])
        : [];
      storeInCache(key, suggestions);
      return suggestions;
    })
    .catch(() => []);

  inflight.set(key, request);
  const result = await request;
  inflight.delete(key);
  return result;
};

export const clearSuggestionCache = () => {
  suggestionCache.clear();
  inflight.clear();
};
