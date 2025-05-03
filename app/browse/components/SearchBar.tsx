"use client";
import React from 'react';
import { Search, Filter } from 'lucide-react';
import {
  Sofa, Home, Laptop, Car, Book, Shirt, Utensils, ShoppingBag
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const categories = [
  { name: "Furniture", icon: Sofa },
  { name: "Subleases", icon: Home },
  { name: "Tech", icon: Laptop },
  { name: "Vehicles", icon: Car },
  { name: "Textbooks", icon: Book },
  { name: "Clothing", icon: Shirt },
  { name: "Kitchen", icon: Utensils },
  { name: "Other", icon: ShoppingBag },
];

const SearchBar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('category') || '';

  const handleCategoryClick = (name: string) => {
    const newQuery = name === "All Categories" ? "" : name;
    const encoded = encodeURIComponent(newQuery);
    router.push(`/browse${encoded ? `?category=${encoded}` : ''}`);
  };

  return (
    <div className=" w-full flex flex-col gap-4 px-4 ">
      {/* Search Row */}
      <div className="w-full flex justify-center">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-5xl">
          <div className="flex items-center w-full max-w-3xl border rounded-full px-4 py-2 bg-white border-gray-200 shadow-sm focus-within:ring-2 ring-ut-orange transition">
            <Search className="text-gray-400 mr-2" size={20} />
            <input
              type="text"
              placeholder="Search for anything..."
              className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>
          <button className="w-full sm:w-auto flex items-center gap-2 border rounded-md px-4 py-2 bg-white shadow-sm border-gray-200 hover:bg-gray-100 transition">
            <Filter size={16} />
            <span className="text-sm text-gray-700 font-semibold">Filters</span>
          </button>
          <select className="w-full sm:w-auto border border-gray-200 font-semibold rounded-md px-4 py-2 bg-white shadow-sm text-sm text-gray-700">
            <option>Sort: Newest first</option>
            <option>Sort: Oldest first</option>
          </select>
        </div>
      </div>

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
};

export default SearchBar;
