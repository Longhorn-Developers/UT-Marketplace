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

const categoryLabels: Record<string, string> = {
  furniture: 'Furniture',
  subleases: 'Subleases',
  tech: 'Tech',
  vehicles: 'Vehicles',
  textbooks: 'Textbooks',
  clothing: 'Clothing',
  kitchen: 'Kitchen',
  other: 'Other',
};

const formatCategory = (value?: string | null) => {
  if (!value) return '';
  const key = value.toLowerCase();
  return categoryLabels[key] || value;
};

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

  // Add default min/max for slider
  const minPriceLimit = 0;

  useEffect(() => {
    const term = searchValue.trim();
    if (!term) {
      setSuggestions([]);
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
        ].slice(0, 6);

        setSuggestions(combined);
      } catch (err) {
        console.error("Search suggestions error:", err);
      }
    }, 220);

    return () => window.clearTimeout(handle);
  }, [searchValue]);

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
            onClear={handleClearSearch}
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
