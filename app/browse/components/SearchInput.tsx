import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions?: Array<{ value: string; label: string; type?: string }>;
  onSelectSuggestion?: (value: string) => void;
  onClear?: () => void;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'ig');
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span
        key={`${part}-${index}`}
        className="text-ut-orange font-semibold"
      >
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  suggestions = [],
  onSelectSuggestion,
  onClear,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className="relative w-full">
      <div className="flex items-center w-full border rounded-full px-3 sm:px-4 py-2 bg-white border-gray-200 shadow-sm focus-within:ring-2 ring-ut-orange transition">
        <Search className="text-gray-400 mr-2" size={18} />
        <input
          type="text"
          placeholder="Search for anything..."
          className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value && onClear && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onClear()}
            aria-label="Clear search"
            className="ml-2 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden z-20">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              onMouseDown={() => onSelectSuggestion?.(suggestion.value)}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {highlightMatch(suggestion.label, value)}
                </p>
              </div>
              {suggestion.type && (
                <span className="shrink-0 text-[11px] font-semibold text-ut-orange bg-ut-orange/10 px-2 py-1 rounded-full">
                  {suggestion.type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput; 
