"use client";
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Search,
  Filter,
  CalendarDays,
  DollarSign,
  XCircle,
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

const SearchBar = forwardRef((props, ref) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const postedAfter = searchParams.get("postedAfter") || "";
  const postedBefore = searchParams.get("postedBefore") || "";

  const [searchValue, setSearchValue] = useState(search);
  const [sortValue, setSortValue] = useState(sort);
  const [showFilters, setShowFilters] = useState(false);
  const [minPriceValue, setMinPriceValue] = useState(minPrice);
  const [maxPriceValue, setMaxPriceValue] = useState(maxPrice);
  const [postedAfterValue, setPostedAfterValue] = useState(postedAfter);
  const [postedBeforeValue, setPostedBeforeValue] = useState(postedBefore);

  // Add default min/max for slider
  const minPriceLimit = 0;
  const maxPriceLimit = 5000;

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    const params = buildQueryParams({
      category: query,
      search: e.target.value,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
    const params = buildQueryParams({
      category: query,
      search: searchValue,
      sort: sortValue,
      minPrice: minPriceValue,
      maxPrice: maxPriceValue,
      postedAfter: postedAfterValue,
      postedBefore: postedBeforeValue,
    });
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setMinPriceValue("");
    setMaxPriceValue("");
    setPostedAfterValue("");
    setPostedBeforeValue("");
    setSearchValue("");
    setSortValue("newest");
    router.push(`/browse`);
    setShowFilters(false);
  };

  useImperativeHandle(ref, () => ({
    handleClearFilters,
  }));

  return (
    <div className=" w-full flex flex-col gap-4 px-4 ">
      {/* Search Row */}
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 w-full max-w-5xl">
          <SearchInput value={searchValue} onChange={handleSearchChange} />
          <button
            className="flex items-center gap-2 border rounded-md px-4 py-2 bg-white shadow-sm border-gray-200 hover:bg-gray-100 transition "
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter size={16} />
            <span className="text-sm text-gray-700 font-semibold">Filters</span>
          </button>
          <SortDropdown value={sortValue} onChange={handleSortChange} />
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="w-full flex justify-center">
          <FilterModal
            minPriceValue={minPriceValue}
            maxPriceValue={maxPriceValue}
            postedAfterValue={postedAfterValue}
            postedBeforeValue={postedBeforeValue}
            minPriceLimit={minPriceLimit}
            maxPriceLimit={maxPriceLimit}
            setMinPriceValue={setMinPriceValue}
            setMaxPriceValue={setMaxPriceValue}
            setPostedAfterValue={setPostedAfterValue}
            setPostedBeforeValue={setPostedBeforeValue}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
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
