"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sofa, Home, ShoppingBag, Laptop, Car, Book, Shirt, Utensils } from "lucide-react";

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

const Footer = () => {
    const router = useRouter();
    
      const handleCategoryClick = (categoryName) => {
        const encoded = encodeURIComponent(categoryName);
        router.push(`/browse${encoded ? `?category=${encoded}` : ""}`);
      };

  return (
    <footer className="bg-gray-100 text-black mt-auto w-full">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-extrabold text-ut-orange ">UT Marketplace</span>
            </Link>
            <p className="mt-4 text-sm max-w-md">
              UT Marketplace is the premier platform for University of Texas students to buy, sell, and connect with
              fellow Longhorns.
            </p>
          </div>
          <div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase">Categories</h3>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <li key={category.name}>
                    <button
                      onClick={() => handleCategoryClick(category.name)}
                      className="flex items-center gap-2 text-sm hover:text-ut-orange transition cursor-pointer"
                    >
                      <div className="w-5 h-5 flex items-center justify-center text-ut-orange">
                        <category.icon className="h-4 w-4" />
                      </div>
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/help" className="text-sm hover:text-ut-orange">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm hover:text-ut-orange">
                    About UTMP
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-sm hover:text-ut-orange">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="text-sm hover:text-ut-orange">
                    Safety Tips
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm hover:text-ut-orange">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm hover:text-ut-orange">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-center">
            &copy; {new Date().getFullYear()} UT Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


export default Footer;
