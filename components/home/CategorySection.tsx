"use client";
import { Sofa, Home, ShoppingBag, Laptop, Car, Book, Shirt, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";

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

const CategorySection = () => {
  const router = useRouter();

  const handleCategoryClick = (categoryName) => {
    const encoded = encodeURIComponent(categoryName);
    router.push(`/browse${encoded ? `?category=${encoded}` : ""}`);
  };

  return (
    <section className="py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out border border-gray-100"
          >
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full mb-3">
              <category.icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;