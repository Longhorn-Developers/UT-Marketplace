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
import { supabase } from "../../lib/supabaseClient";
import { categoryLabels, formatCategory, derivePopularSearches } from "../../lib/search/searchUtils";

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
  const recentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
          return;
        }

        const popular = derivePopularSearches(data || [], 8);
        setPopularSearches(popular);
      } catch (err) {
        console.error("Popular searches error:", err);
      }
    };

    loadPopularSearches();
  }, []);

  useEffect(() => {
    const term = searchValue.trim();
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

    const handle = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("title, category, location")
          .eq("is_draft", false)
          .neq("is_sold", true)
          .or(`title.ilike.%${term}%,location.ilike.%${term}%`)
          .limit(8);

        if (error) {
          console.error("Search suggestions error:", error);
          return;
        }

        const titleMatches = new Set<string>();
        const categoryMatches = new Set<string>();
        const locationMatches = new Set<string>();

        (data || []).forEach((item) => {
          if (item.title && item.title.toLowerCase().includes(term)) {
            titleMatches.add(item.title);
          }
          const categoryLabel = formatCategory(item.category);
          if (categoryLabel && categoryLabel.toLowerCase().includes(term)) {
            categoryMatches.add(categoryLabel);
          }
          if (item.location && item.location.toLowerCase().includes(term)) {
            locationMatches.add(item.location);
          }
        });

        const categoryFromInput = Object.values(categoryLabels).filter((label) =>
          label.toLowerCase().includes(term)
        );

        categoryFromInput.forEach((label) => categoryMatches.add(label));

        const combined = [
          ...Array.from(titleMatches).map((value) => ({
            value,
            label: value,
            type: 'Title',
          })),
          ...Array.from(categoryMatches).map((value) => ({
            value,
            label: value,
            type: 'Category',
          })),
          ...Array.from(locationMatches).map((value) => ({
            value,
            label: value,
            type: 'Location',
          })),
          ...recentSearches
            .filter((value) => value.toLowerCase().includes(term))
            .map((value) => ({
              value,
              label: value,
              type: "Recent",
            })),
          ...popularSearches
            .filter((value) => value.toLowerCase().includes(term))
            .map((value) => ({
              value,
              label: value,
              type: "Trending",
            })),
        ].slice(0, 8);

        setSuggestions(combined);
      } catch (err) {
        console.error("Search suggestions error:", err);
      }
    }, 220);

    return () => window.clearTimeout(handle);
  }, [searchValue, recentSearches]);

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
      search: searchValue,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const applySearchValue = (value: string) => {
    if (setLoading) setLoading(true);
    setSearchValue(value);
    const params = buildQueryParams({
      category: query,
      search: value,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applySearchValue(e.target.value);
  };

  const handleSuggestionSelect = (value: string) => {
    setSuggestions([]);
    saveRecentSearch(value);
    applySearchValue(value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setLoading) setLoading(true);
    setSortValue(e.target.value);
    const params = buildQueryParams({
      category: query,
      search: searchValue,
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
      search: searchValue,
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
    setSearchValue("");
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
    applySearchValue("");
    setSuggestions([]);
  };

  useEffect(() => {
    if (recentTimerRef.current) clearTimeout(recentTimerRef.current);
    recentTimerRef.current = setTimeout(() => {
      saveRecentSearch(searchValue);
    }, 800);
    return () => {
      if (recentTimerRef.current) clearTimeout(recentTimerRef.current);
    };
  }, [searchValue]);

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
          <SearchInput
            value={searchValue}
            onChange={handleSearchChange}
            suggestions={suggestions}
            onSelectSuggestion={handleSuggestionSelect}
            onRemoveSuggestion={removeRecentSearch}
            onClear={handleClearSearch}
            onCommit={saveRecentSearch}
          />
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
