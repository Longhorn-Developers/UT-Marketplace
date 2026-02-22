import React from 'react';

interface SortDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => (
  <select
    className="border border-gray-200 font-semibold rounded-md px-3 sm:px-4 py-2 bg-white shadow-sm text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ut-orange w-full sm:w-auto"
    value={value}
    onChange={onChange}
  >
    <option value="relevance">Sort: Relevance</option>
    <option value="price-asc">Price: Low to High</option>
    <option value="price-desc">Price: High to Low</option>
    <option value="newest">Date: Newest to Oldest</option>
    <option value="oldest">Date: Oldest to Newest</option>
  </select>
);

export default SortDropdown; 
