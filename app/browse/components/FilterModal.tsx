import React from 'react';
import { CalendarDays, DollarSign, XCircle } from 'lucide-react';

interface FilterModalProps {
  minPriceValue: string;
  maxPriceValue: string;
  postedAfterValue: string;
  postedBeforeValue: string;
  minPriceLimit: number;
  maxPriceLimit: number;
  setMinPriceValue: (v: string) => void;
  setMaxPriceValue: (v: string) => void;
  setPostedAfterValue: (v: string) => void;
  setPostedBeforeValue: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  minPriceValue,
  maxPriceValue,
  postedAfterValue,
  postedBeforeValue,
  minPriceLimit,
  maxPriceLimit,
  setMinPriceValue,
  setMaxPriceValue,
  setPostedAfterValue,
  setPostedBeforeValue,
  onApply,
  onClear,
}) => (
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
        onClick={onClear}
      >
        <XCircle size={16}/> Clear Filters
      </button>
      <button
        className="px-4 py-2 rounded bg-[#bf5700] text-white hover:bg-[#a54700]"
        onClick={onApply}
      >
        Apply Filters
      </button>
    </div>
  </div>
);

export default FilterModal; 