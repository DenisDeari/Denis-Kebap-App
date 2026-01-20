"use client";

import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface MenuItemProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export default function MenuItem({ product, onProductClick }: MenuItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer">
      <div className="flex flex-col h-full" onClick={() => onProductClick(product)}>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 active:scale-95 transition-all duration-150 font-medium shadow-sm hover:shadow-md"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

