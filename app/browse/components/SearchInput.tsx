import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions?: Array<{ value: string; label: string; type?: string }>;
  onSelectSuggestion?: (value: string) => void;
  onRemoveSuggestion?: (value: string) => void;
  onClear?: () => void;
  onCommit?: (value: string) => void;
  compact?: boolean;
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
  onRemoveSuggestion,
  onClear,
  onCommit,
  compact = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center w-full border rounded-full bg-white border-gray-200 shadow-sm focus-within:ring-2 ring-ut-orange transition ${
          compact ? "px-3 py-1.5" : "px-3 sm:px-4 py-2"
        }`}
      >
        <Search className="text-gray-400 mr-2" size={compact ? 16 : 18} />
        <input
          type="text"
          placeholder="Search for anything..."
          className={`flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400 ${
            compact ? "text-sm" : "text-sm sm:text-base"
          }`}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (onCommit) onCommit(value);
          }}
        />
        {value && onClear && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onClear()}
            aria-label="Clear search"
            className={`ml-2 text-gray-400 hover:text-gray-600 transition ${
              compact ? "p-0.5" : ""
            }`}
          >
            <X size={compact ? 14 : 16} />
          </button>
        )}
      </div>
      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden z-20">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              role="button"
              tabIndex={0}
              onMouseDown={(event) => {
                const target = event.target as HTMLElement | null;
                if (target?.closest("button")) return;
                onSelectSuggestion?.(suggestion.value);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {highlightMatch(suggestion.label, value)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {suggestion.type && (
                  <span className="shrink-0 text-[11px] font-semibold text-ut-orange bg-ut-orange/10 px-2 py-1 rounded-full">
                    {suggestion.type}
                  </span>
                )}
                {suggestion.type === "Recent" && onRemoveSuggestion && (
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveSuggestion(suggestion.value);
                    }}
                    aria-label={`Remove ${suggestion.label} from recent searches`}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput; 
