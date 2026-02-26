"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  Search,
  Filter,

} from "lucide-react";
import {
  Sofa,
  Home,
  Laptop,
  Car,
  Book,
  Shirt,
  Utensils,
  ShoppingBag,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchInput from "./SearchInput";
import SortDropdown from "./SortDropdown";
import FilterModal from "./FilterModal";
import CategoryButtons from "./CategoryButtons";
import { fetchPopularSearches } from "../../lib/search/popularSearches";
import { fetchSearchSuggestions } from "../../lib/search/suggestionsClient";

const categories = [
  { name: "All Categories", icon: Search },
  { name: "Furniture", icon: Sofa },
  { name: "Subleases", icon: Home },
  { name: "Tech", icon: Laptop },
  { name: "Vehicles", icon: Car },
  { name: "Textbooks", icon: Book },
  { name: "Clothing", icon: Shirt },
  { name: "Kitchen", icon: Utensils },
  { name: "Other", icon: ShoppingBag },
];

interface SearchBarProps {
  setLoading?: (loading: boolean) => void;
}

const SearchBar = forwardRef((props: SearchBarProps, ref) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "relevance";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const postedAfter = searchParams.get("postedAfter") || "";
  const postedBefore = searchParams.get("postedBefore") || "";
  const { setLoading } = props;

  const [searchValue, setSearchValue] = useState(search);
  const [sortValue, setSortValue] = useState(sort);
  const [showFilters, setShowFilters] = useState(false);
  const [minPriceValue, setMinPriceValue] = useState(minPrice);
  const [maxPriceValue, setMaxPriceValue] = useState(maxPrice);
  const [postedAfterValue, setPostedAfterValue] = useState(postedAfter);
  const [postedBeforeValue, setPostedBeforeValue] = useState(postedBefore);
  const [suggestions, setSuggestions] = useState<Array<{ value: string; label: string; type?: string }>>([]);
  const [showCustomRange, setShowCustomRange] = useState(Boolean(postedAfter) || Boolean(postedBefore));
  const filterSnapshotRef = useRef<{
    minPriceValue: string;
    maxPriceValue: string;
    postedAfterValue: string;
    postedBeforeValue: string;
    showCustomRange: boolean;
  } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Add default min/max for slider
  const minPriceLimit = 0;

  const recentKey = "utm_recent_searches";

  const loadRecentSearches = () => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(recentKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const saveRecentSearch = (value: string) => {
    if (typeof window === "undefined") return;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) return;
    const existing = loadRecentSearches();
    const updated = [trimmed, ...existing.filter((item) => item !== trimmed)].slice(0, 8);
    window.localStorage.setItem(recentKey, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const removeRecentSearch = (value: string) => {
    if (typeof window === "undefined") return;
    const existing = loadRecentSearches();
    const updated = existing.filter((item) => item !== value);
    window.localStorage.setItem(recentKey, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    const loadPopularSearches = async () => {
      const popular = await fetchPopularSearches(8);
      setPopularSearches(popular);
    };

    loadPopularSearches();
  }, []);

  useEffect(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      const recent = recentSearches.map((value) => ({
        value,
        label: value,
        type: "Recent",
      }));
      const trending = popularSearches.map((value) => ({
        value,
        label: value,
        type: "Trending",
      }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    if (term.length < 2) {
      const recent = recentSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({
          value,
          label: value,
          type: "Recent",
        }));
      const trending = popularSearches
        .filter((value) => value.toLowerCase().includes(term))
        .map((value) => ({
          value,
          label: value,
          type: "Trending",
        }));
      setSuggestions([...recent, ...trending].slice(0, 8));
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const apiSuggestions = await fetchSearchSuggestions(term);
        const recent = recentSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({
            value,
            label: value,
            type: "Recent",
          }));
        const trending = popularSearches
          .filter((value) => value.toLowerCase().includes(term))
          .map((value) => ({
            value,
            label: value,
            type: "Trending",
          }));

        const combined = [...apiSuggestions, ...recent, ...trending];
        const seen = new Set<string>();
        const deduped = combined.filter((item) => {
          const key = item.value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setSuggestions(deduped.slice(0, 8));
      } catch (err) {
        console.error("Search suggestions error:", err);
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [searchValue, recentSearches, popularSearches]);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    setSortValue(sort);
  }, [sort]);

  const buildQueryParams = (values: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params;
  };

  const handleCategoryClick = (name: string) => {
    if (setLoading) setLoading(true);
    const newQuery = name === "All Categories" ? "" : name;
    const params = buildQueryParams({
      category: newQuery,
      search,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      if (setLoading) setLoading(false);
      return;
    }
    router.push(`/browse${nextQuery ? `?${nextQuery}` : ""}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const commitSearchValue = (value: string) => {
    const trimmed = value.trim();
    setSearchValue(trimmed);
    if (setLoading) setLoading(true);
    const params = buildQueryParams({
      category: query,
      search: trimmed,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    saveRecentSearch(searchValue);
    commitSearchValue(searchValue);
  };

  const handleSuggestionSelect = (value: string) => {
    setSearchValue(value);
    setSuggestions([]);
    saveRecentSearch(value);
    commitSearchValue(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setLoading) setLoading(true);
    setSortValue(e.target.value);
    const params = buildQueryParams({
      category: query,
      search,
      sort: e.target.value,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleApplyFilters = () => {
    if (setLoading) setLoading(true);
    const params = buildQueryParams({
      category: query,
      search,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      if (setLoading) setLoading(false);
      setShowFilters(false);
      return;
    }
    router.push(`/browse${nextQuery ? `?${nextQuery}` : ""}`);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setMinPriceValue("");
    setMaxPriceValue("");
    setPostedAfterValue("");
    setPostedBeforeValue("");
    setShowCustomRange(false);
    setSortValue("relevance");
    setSuggestions([]);
    router.push(`/browse`);
    setShowFilters(false);
  };

  const handleCancelFilters = () => {
    if (filterSnapshotRef.current) {
      setMinPriceValue(filterSnapshotRef.current.minPriceValue);
      setMaxPriceValue(filterSnapshotRef.current.maxPriceValue);
      setPostedAfterValue(filterSnapshotRef.current.postedAfterValue);
      setPostedBeforeValue(filterSnapshotRef.current.postedBeforeValue);
      setShowCustomRange(filterSnapshotRef.current.showCustomRange);
    }
    setShowFilters(false);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setSuggestions([]);
    commitSearchValue("");
  };

  useImperativeHandle(ref, () => ({
    handleClearFilters,
  }));

  useEffect(() => {
    if (!showFilters) return;
    filterSnapshotRef.current = {
      minPriceValue,
      maxPriceValue,
      postedAfterValue,
      postedBeforeValue,
      showCustomRange,
    };
  }, [showFilters]);

  return (
    <div className="w-full flex flex-col gap-4 px-4">
      {/* Search Row */}
      <div className="w-full flex justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-5xl">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <SearchInput
              value={searchValue}
              onChange={handleSearchChange}
              suggestions={suggestions}
              onSelectSuggestion={handleSuggestionSelect}
              onRemoveSuggestion={removeRecentSearch}
              onClear={handleClearSearch}
              onCommit={saveRecentSearch}
            />
          </form>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="flex items-center gap-2 border rounded-md px-4 py-2 bg-white shadow-sm border-gray-200 hover:bg-gray-100 transition w-full sm:w-auto justify-center"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter size={16} />
              <span className="text-sm text-gray-700 font-semibold">Filters</span>
            </button>
            <SortDropdown value={sortValue} onChange={handleSortChange} />
          </div>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="w-full flex justify-center">
          <div className="max-w-5xl w-full">
              <FilterModal
                minPriceValue={minPriceValue}
                maxPriceValue={maxPriceValue}
                postedAfterValue={postedAfterValue}
                postedBeforeValue={postedBeforeValue}
                minPriceLimit={minPriceLimit}
                setMinPriceValue={setMinPriceValue}
                setMaxPriceValue={setMaxPriceValue}
                setPostedAfterValue={setPostedAfterValue}
                setPostedBeforeValue={setPostedBeforeValue}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                onCancel={handleCancelFilters}
                showCustomRange={showCustomRange}
                setShowCustomRange={setShowCustomRange}
              />
          </div>
        </div>
      )}

      {/* Categories Row */}
      <div className="w-full flex justify-center">
        <CategoryButtons
          categories={categories}
          selectedCategory={query}
          onCategoryClick={handleCategoryClick}
        />
      </div>
    </div>
  );
});

SearchBar.displayName = "SearchBar";
export default SearchBar;
