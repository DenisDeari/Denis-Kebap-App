"use client";

import { Category } from "@/types";

interface NavigationProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: Category[];
}

export default function Navigation({
  selectedCategory,
  onCategoryChange,
  categories,
}: NavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`px-6 py-3 whitespace-nowrap font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
