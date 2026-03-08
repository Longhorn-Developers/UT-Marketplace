import React from 'react';
import { CalendarDays, DollarSign, XCircle } from 'lucide-react';

interface FilterModalProps {
  minPriceValue: string;
  maxPriceValue: string;
  postedAfterValue: string;
  postedBeforeValue: string;
  minPriceLimit: number;
  setMinPriceValue: (v: string) => void;
  setMaxPriceValue: (v: string) => void;
  setPostedAfterValue: (v: string) => void;
  setPostedBeforeValue: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onCancel: () => void;
  showCustomRange: boolean;
  setShowCustomRange: (value: boolean) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  minPriceValue,
  maxPriceValue,
  postedAfterValue,
  postedBeforeValue,
  minPriceLimit,
  setMinPriceValue,
  setMaxPriceValue,
  setPostedAfterValue,
  setPostedBeforeValue,
  onApply,
  onClear,
  onCancel,
  showCustomRange,
  setShowCustomRange,
}) => {
  const datePresets = [
    { label: 'Any time', days: null },
    { label: '24h', days: 1 },
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
  ];

  const setDatePreset = (days: number | null) => {
    if (!days) {
      setPostedAfterValue('');
      setPostedBeforeValue('');
      return;
    }
    const after = new Date();
    after.setDate(after.getDate() - days);
    setPostedAfterValue(after.toISOString().slice(0, 10));
    setPostedBeforeValue('');
  };

  const isDatePresetActive = (days: number | null) => {
    if (!days) {
      return !postedAfterValue && !postedBeforeValue;
    }
    const expected = new Date();
    expected.setDate(expected.getDate() - days);
    return postedAfterValue === expected.toISOString().slice(0, 10) && !postedBeforeValue;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 w-full">
    <div className="flex items-center justify-between mb-3">
      <div className="text-xs font-semibold text-gray-700">Filters</div>
      <button
        className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1"
        onClick={onClear}
      >
        <XCircle size={14}/> Reset
      </button>
    </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr] items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <DollarSign size={14}/> Price
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={minPriceLimit}
              className="w-full border border-gray-200 rounded-full px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-ut-orange outline-none"
              value={minPriceValue}
              onChange={e => setMinPriceValue(e.target.value)}
              placeholder={`Min $${minPriceLimit}`}
            />
            <input
              type="number"
              min={minPriceLimit}
              className="w-full border border-gray-200 rounded-full px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-ut-orange outline-none"
              value={maxPriceValue}
              onChange={e => setMaxPriceValue(e.target.value)}
              placeholder="Max"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <CalendarDays size={14}/> Date posted
          </div>
          <div className="flex flex-wrap gap-2">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDatePreset(preset.days)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  isDatePresetActive(preset.days)
                    ? 'bg-ut-orange text-white border-ut-orange'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomRange(!showCustomRange)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                showCustomRange
                  ? 'bg-ut-orange text-white border-ut-orange'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              Custom range
            </button>
          </div>
          {showCustomRange && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="w-full border border-gray-200 rounded-full px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-ut-orange outline-none"
                value={postedAfterValue}
                onChange={e => setPostedAfterValue(e.target.value)}
              />
              <input
                type="date"
                className="w-full border border-gray-200 rounded-full px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-ut-orange outline-none"
                value={postedBeforeValue}
                onChange={e => setPostedBeforeValue(e.target.value)}
              />
            </div>
          )}
        </div>
    </div>

    <div className="flex justify-end gap-2 mt-4">
      <button
        className="px-3 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1 text-xs font-semibold"
        onClick={onCancel}
      >
        Cancel
      </button>
      <button
        className="px-4 py-2 rounded-full bg-[#bf5700] text-white hover:bg-[#a54700] text-xs font-semibold"
        onClick={onApply}
      >
        Apply
      </button>
    </div>
  </div>
);
};

export default FilterModal; 
