import React from 'react';

interface SortDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => (
  <select
    className="border border-gray-200 font-semibold rounded-md px-4 py-2 bg-white shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ut-orange"
    value={value}
    onChange={onChange}
  >
    <option value="newest">Sort: Newest first</option>
    <option value="oldest">Sort: Oldest first</option>
  </select>
);

export default SortDropdown; 