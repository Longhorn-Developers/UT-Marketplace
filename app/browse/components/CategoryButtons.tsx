import React from 'react';

interface Category {
  name: string;
  icon: React.ElementType;
}

interface CategoryButtonsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryClick: (name: string) => void;
}

const CategoryButtons: React.FC<CategoryButtonsProps> = ({ categories, selectedCategory, onCategoryClick }) => (
  <div className="flex flex-wrap gap-2 max-w-7xl justify-center">
    {categories.map(({ name, icon: Icon }) => (
      <button
        key={name}
        onClick={() => onCategoryClick(name)}
        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md border transition-colors duration-200 ease-in-out ${
          selectedCategory === name
            ? 'bg-[#bf5700] text-white font-semibold border-[#bf5700]'
            : 'bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:shadow-sm border-gray-200'
        }`}
      >
        <div className={`w-5 h-5 flex items-center justify-center ${
          selectedCategory === name ? 'text-white' : 'text-[#bf5700]'
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="whitespace-nowrap">{name}</span>
      </button>
    ))}
  </div>
);

export default CategoryButtons; 