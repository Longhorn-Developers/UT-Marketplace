"use client"

import React, { useState } from 'react'
import { FaSearch } from "react-icons/fa";

const suggestions = [
  "Couch",
  "Textbooks",
  "Mini Fridge",
  "Bike",
  "Laptop",
  "Phone",
  "Headphones",
  "Charger",
];

const NavSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = suggestions.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="flex items-center bg-white text-gray-500 rounded-full px-4 py-1.5 gap-2 w-64">
        <FaSearch className="text-lg text-ut-orange" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          className="bg-transparent outline-none text-sm placeholder-gray-500 w-full"
        />
      </div>
      {showSuggestions && (
        <div className="absolute left-0 mt-2 bg-white text-gray-500 rounded shadow-md z-50 w-full">
          {filtered.length > 0 && filtered.map((item, index) => {
            const regex = new RegExp(`(${searchTerm})`, 'i');
            const parts = item.split(regex);

            return (
              <div
                key={index}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm gap-3"
                onClick={() => {
                  setSearchTerm(item);
                  setShowSuggestions(false);
                }}
              >
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <FaSearch className="text-xs" />
                </div>
                <div className="flex-1">
                  {parts.map((part, i) =>
                    regex.test(part) ? (
                      <span key={i} className="font-semibold">{part}</span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-400">
              No listings found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NavSearch
