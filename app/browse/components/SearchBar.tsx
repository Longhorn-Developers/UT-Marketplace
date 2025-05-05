"use client";
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, Filter, CalendarDays, DollarSign, XCircle } from 'lucide-react';
import {
  Sofa, Home, Laptop, Car, Book, Shirt, Utensils, ShoppingBag
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const query = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const postedAfter = searchParams.get('postedAfter') || '';
  const postedBefore = searchParams.get('postedBefore') || '';

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

  const handleCategoryClick = (name: string) => {
    const newQuery = name === "All Categories" ? "" : name;
    const params = new URLSearchParams();
    if (newQuery) params.set('category', newQuery);
    if (searchValue) params.set('search', searchValue);
    if (sortValue) params.set('sort', sortValue);
    if (minPriceValue) params.set('minPrice', minPriceValue);
    if (maxPriceValue) params.set('maxPrice', maxPriceValue);
    if (postedAfterValue) params.set('postedAfter', postedAfterValue);
    if (postedBeforeValue) params.set('postedBefore', postedBeforeValue);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    const params = new URLSearchParams();
    if (query) params.set('category', query);
    if (e.target.value) params.set('search', e.target.value);
    if (sortValue) params.set('sort', sortValue);
    if (minPriceValue) params.set('minPrice', minPriceValue);
    if (maxPriceValue) params.set('maxPrice', maxPriceValue);
    if (postedAfterValue) params.set('postedAfter', postedAfterValue);
    if (postedBeforeValue) params.set('postedBefore', postedBeforeValue);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortValue(e.target.value);
    const params = new URLSearchParams();
    if (query) params.set('category', query);
    if (searchValue) params.set('search', searchValue);
    if (e.target.value) params.set('sort', e.target.value);
    if (minPriceValue) params.set('minPrice', minPriceValue);
    if (maxPriceValue) params.set('maxPrice', maxPriceValue);
    if (postedAfterValue) params.set('postedAfter', postedAfterValue);
    if (postedBeforeValue) params.set('postedBefore', postedBeforeValue);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set('category', query);
    if (searchValue) params.set('search', searchValue);
    if (sortValue) params.set('sort', sortValue);
    if (minPriceValue) params.set('minPrice', minPriceValue);
    if (maxPriceValue) params.set('maxPrice', maxPriceValue);
    if (postedAfterValue) params.set('postedAfter', postedAfterValue);
    if (postedBeforeValue) params.set('postedBefore', postedBeforeValue);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setMinPriceValue('');
    setMaxPriceValue('');
    setPostedAfterValue('');
    setPostedBeforeValue('');
    setSearchValue('');
    setSortValue('newest');
    const params = new URLSearchParams();
    if (query) params.set('category', query);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
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
          <div className="flex items-center w-full max-w-3xl border rounded-full px-4 py-2 bg-white border-gray-200 shadow-sm focus-within:ring-2 ring-ut-orange transition">
            <Search className="text-gray-400 mr-2" size={20} />
            <input
              type="text"
              placeholder="Search for anything..."
              className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
          <button
            className="flex items-center gap-2 border rounded-md px-4 py-2 bg-white shadow-sm border-gray-200 hover:bg-gray-100 transition "
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter size={16} />
            <span className="text-sm text-gray-700 font-semibold">Filters</span>
          </button>
          <select
            className="border border-gray-200 font-semibold rounded-md px-4 py-2 bg-white shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ut-orange"
            value={sortValue}
            onChange={handleSortChange}
          >
            <option value="newest">Sort: Newest first</option>
            <option value="oldest">Sort: Oldest first</option>
          </select>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="w-full flex justify-center">
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6 flex flex-col gap-4 max-w-3xl w-full z-50">
            <div className="flex gap-4 items-center">
              <div className="flex-1 flex flex-col items-center">
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><DollarSign size={16}/>Min Price</label>
                <input
                  type="range"
                  min={minPriceLimit}
                  max={maxPriceLimit}
                  value={minPriceValue || minPriceLimit}
                  onChange={e => setMinPriceValue(e.target.value)}
                  className="w-full accent-[#bf5700]"
                />
                <span className="text-xs mt-1">${minPriceValue || minPriceLimit}</span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><DollarSign size={16}/>Max Price</label>
                <input
                  type="range"
                  min={minPriceLimit}
                  max={maxPriceLimit}
                  value={maxPriceValue || maxPriceLimit}
                  onChange={e => setMaxPriceValue(e.target.value)}
                  className="w-full accent-[#bf5700]"
                />
                <span className="text-xs mt-1">${maxPriceValue || maxPriceLimit}</span>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex-1 flex flex-col items-center">
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><CalendarDays size={16}/>Posted After</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1"
                  value={postedAfterValue}
                  onChange={e => setPostedAfterValue(e.target.value)}
                />
              </div>
              <div className="flex-1 flex flex-col items-center">
                <label className="block text-xs font-semibold mb-1 flex items-center gap-1"><CalendarDays size={16}/>Posted Before</label>
                <input
                  type="date"
                  className="w-full border rounded-md px-2 py-1"
                  value={postedBeforeValue}
                  onChange={e => setPostedBeforeValue(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center gap-1"
                onClick={handleClearFilters}
              >
                <XCircle size={16}/> Clear Filters
              </button>
              <button
                className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700]"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Row */}
      <div className="w-full flex justify-center">
        <div className="flex flex-wrap gap-2 max-w-7xl justify-center">
          {categories.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => handleCategoryClick(name)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md border transition-colors duration-200 ease-in-out ${
                query === name
                  ? 'bg-[#bf5700] text-white font-semibold border-[#bf5700]'
                  : 'bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:shadow-sm border-gray-200'
              }`}
            >
              <div className={`w-5 h-5 flex items-center justify-center ${
                query === name ? 'text-white' : 'text-[#bf5700]'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="whitespace-nowrap">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default SearchBar;
