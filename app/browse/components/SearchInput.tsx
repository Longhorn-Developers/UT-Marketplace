import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange }) => (
  <div className="flex items-center w-full border rounded-full px-3 sm:px-4 py-2 bg-white border-gray-200 shadow-sm focus-within:ring-2 ring-ut-orange transition">
    <Search className="text-gray-400 mr-2" size={18} />
    <input
      type="text"
      placeholder="Search for anything..."
      className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm sm:text-base"
      value={value}
      onChange={onChange}
    />
  </div>
);

export default SearchInput; 