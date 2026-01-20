"use client";

import { Product } from "@/types";
import MenuItem from "./MenuItem";

interface MenuListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export default function MenuList({ products, onProductClick }: MenuListProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Keine Produkte in dieser Kategorie.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {products.map((product) => (
        <MenuItem key={product.id} product={product} onProductClick={onProductClick} />
      ))}
    </div>
  );
}

